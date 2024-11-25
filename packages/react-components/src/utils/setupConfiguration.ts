import {
    applicationNameSpace,
    appName,
    DEFAULT_FILTER_VALUE,
    flareSavedSearchName,
    KV_COLLECTION_KEY,
    KV_COLLECTION_NAME,
    KV_COLLECTION_VALUE,
    PasswordKeys,
    storageRealm,
} from '../models/constants';
import { Severity, SourceType, SourceTypeCategory, Tenant } from '../models/flare';
import {
    SplunkCollectionItem,
    SplunkService,
    SplunkStoragePasswordAccessors,
} from '../models/splunk';
import { getConfigurationStanzaValue, updateConfigurationFile } from './configurationFileHelper';
import { promisify } from './util';

async function completeSetup(splunkService: SplunkService): Promise<void> {
    await updateConfigurationFile(splunkService, 'app', 'install', {
        is_configured: 'true',
    });
}

async function reloadApp(splunkService: SplunkService): Promise<void> {
    const splunkApps = splunkService.apps();
    await promisify(splunkApps.fetch)();

    const currentApp = splunkApps.item(appName);
    await promisify(currentApp.reload)();
}

function getRedirectUrl(): string {
    return `/app/${appName}`;
}

async function getFlareSearchDataUrl(): Promise<string> {
    const service = createService();
    const savedSearches = await promisify(service.savedSearches().fetch)();
    const savedSearch = savedSearches.item(flareSavedSearchName);
    return `/app/${appName}/@go?s=${savedSearch.qualifiedPath}`;
}

function redirectToHomepage(): void {
    window.location.href = getRedirectUrl();
}

function createService(): SplunkService {
    // The splunkjs is injected by Splunk
    // eslint-disable-next-line no-undef
    const http = new splunkjs.SplunkWebHttp();
    // eslint-disable-next-line no-undef
    const service = new splunkjs.Service(http, applicationNameSpace);

    return service;
}

function fetchApiKeyValidation(apiKey: string): Promise<boolean> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_api_key_validation', data).then(
        (response: any) => {
            return response.status === 200;
        }
    );
}

function fetchUserTenants(apiKey: string): Promise<Array<Tenant>> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_user_tenants', data).then((response: any) => {
        return response.data.tenants;
    });
}

function fetchFiltersSeverities(apiKey: string): Promise<Array<Severity>> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_filters_severities', data).then(
        (response: any) => {
            return response.data.severities;
        }
    );
}

function fetchFiltersSourceTypes(apiKey: string): Promise<Array<SourceTypeCategory>> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_filters_source_types', data).then(
        (response: any) => {
            return response.data.categories;
        }
    );
}

function doesPasswordExist(storage: SplunkStoragePasswordAccessors, key: string): boolean {
    const passwordId = `${storageRealm}:${key}:`;

    for (const password of storage.list()) {
        if (password.name === passwordId) {
            return true;
        }
    }
    return false;
}

async function savePassword(
    storage: SplunkStoragePasswordAccessors,
    key: string,
    value: string
): Promise<void> {
    const passwordExists = doesPasswordExist(storage, key);
    if (passwordExists) {
        const passwordId = `${storageRealm}:${key}:`;
        await storage.del(passwordId);
    }
    if (value.length > 0) {
        await promisify(storage.create)({
            name: key,
            realm: storageRealm,
            password: value,
        });
    }
}

async function saveConfiguration(
    apiKey: string,
    tenantId: number,
    indexName: string,
    isIngestingMetadataOnly: boolean,
    severitiesFilter: string,
    sourceTypesFilter: string
): Promise<void> {
    const service = createService();
    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    await savePassword(storagePasswords, PasswordKeys.API_KEY, apiKey);
    await savePassword(storagePasswords, PasswordKeys.TENANT_ID, `${tenantId}`);
    await savePassword(
        storagePasswords,
        PasswordKeys.INGEST_METADATA_ONLY,
        `${isIngestingMetadataOnly}`
    );
    await savePassword(storagePasswords, PasswordKeys.SEVERITIES_FILTER, `${severitiesFilter}`);
    await savePassword(storagePasswords, PasswordKeys.SOURCE_TYPES_FILTER, `${sourceTypesFilter}`);
    await saveIndexForIngestion(service, indexName);
    const isFirstConfiguration = await fetchIsFirstConfiguration();
    if (isFirstConfiguration) {
        await updateEventIngestionCronJobInterval(service, '1');
    }
    await updateSavedSearchQuery(
        service,
        flareSavedSearchName,
        `source=${appName} index=${indexName}`
    );
    await completeSetup(service);
    await reloadApp(service);
    if (isFirstConfiguration) {
        await updateEventIngestionCronJobInterval(service, '* * * * *');
        await reloadApp(service);
    }
}

async function updateEventIngestionCronJobInterval(
    service: SplunkService,
    interval: string
): Promise<void> {
    await updateConfigurationFile(
        service,
        'inputs',
        'script://$SPLUNK_HOME/etc/apps/flare/bin/cron_job_ingest_events.py',
        {
            interval: `${interval}`,
        }
    );
}

async function updateSavedSearchQuery(
    service: SplunkService,
    savedSearchName: string,
    query: string
): Promise<void> {
    const savedSearches = await promisify(service.savedSearches().fetch)();
    const savedSearch = savedSearches.item(savedSearchName);
    if (savedSearch) {
        await savedSearch.update({
            search: query,
        });
    }
}

async function fetchCollectionItems(): Promise<SplunkCollectionItem[]> {
    const service = createService();
    return promisify(service.get)(
        `storage/collections/data/event_ingestion_collection/${KV_COLLECTION_NAME}`,
        {}
    )
        .then((response: any) => {
            const items: SplunkCollectionItem[] = [];
            if (response.data) {
                response.data.forEach((element) => {
                    items.push({
                        key: element[KV_COLLECTION_KEY],
                        value: element[KV_COLLECTION_VALUE],
                        user: element._user,
                    });
                });
            }
            return items;
        })
        .catch(() => {
            return [];
        });
}

async function fetchPassword(passwordKey: string): Promise<string | undefined> {
    const service = createService();
    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    const passwordId = `${storageRealm}:${passwordKey}:`;

    for (const password of storagePasswords.list()) {
        if (password.name === passwordId) {
            return password._properties.clear_password;
        }
    }
    return undefined;
}

async function fetchApiKey(): Promise<string> {
    return (await fetchPassword(PasswordKeys.API_KEY)) || '';
}

async function fetchTenantId(): Promise<number> {
    return fetchPassword(PasswordKeys.TENANT_ID).then((tenantId) => {
        if (tenantId) {
            return parseInt(tenantId, 10);
        }

        return -1;
    });
}

async function fetchIngestMetadataOnly(): Promise<boolean> {
    return fetchPassword(PasswordKeys.INGEST_METADATA_ONLY).then((isIngestingMetadataOnly) => {
        return isIngestingMetadataOnly === 'true';
    });
}

async function fetchSeveritiesFilter(): Promise<Array<string>> {
    const savedSeverities = await fetchPassword(PasswordKeys.SEVERITIES_FILTER);
    if (savedSeverities) {
        return savedSeverities.split(',');
    }

    return [DEFAULT_FILTER_VALUE];
}

async function fetchSourceTypesFilter(): Promise<Array<string>> {
    const savedSourceTypes = await fetchPassword(PasswordKeys.SOURCE_TYPES_FILTER);
    if (savedSourceTypes) {
        return savedSourceTypes.split(',');
    }

    return [DEFAULT_FILTER_VALUE];
}

async function createFlareIndex(): Promise<void> {
    const service = createService();
    const isFirstConfiguration = await fetchIsFirstConfiguration();
    if (isFirstConfiguration) {
        const currentIndexNames = await fetchAvailableIndexNames();
        if (!currentIndexNames.find((indexName) => indexName === appName)) {
            await service.indexes().create(appName, {});
        }
    }
}

async function saveIndexForIngestion(service: SplunkService, indexName: string): Promise<void> {
    await updateConfigurationFile(
        service,
        'inputs',
        'script://$SPLUNK_HOME/etc/apps/flare/bin/cron_job_ingest_events.py',
        {
            index: indexName,
        }
    );
}

async function fetchAvailableIndexNames(): Promise<Array<string>> {
    const service = createService();
    const indexes = await promisify(service.indexes().fetch)();
    const indexNames: string[] = [];
    const ignoredIndexNames = ['history', 'summary', 'splunklogger'];
    for (const { name: indexName } of indexes.list()) {
        if (!indexName.startsWith('_') && !ignoredIndexNames.includes(indexName)) {
            indexNames.push(indexName);
        }
    }
    return indexNames;
}

async function fetchIsFirstConfiguration(): Promise<boolean> {
    const service = createService();
    return (
        (await getConfigurationStanzaValue(
            service,
            'app',
            'install',
            'is_configured',
            'unknown'
        )) !== '1'
    );
}

async function fetchCurrentIndexName(): Promise<string> {
    const service = createService();
    return getConfigurationStanzaValue(
        service,
        'inputs',
        'script://$SPLUNK_HOME/etc/apps/flare/bin/cron_job_ingest_events.py',
        'index',
        'main'
    );
}

async function fetchVersionName(defaultValue: string): Promise<string> {
    const service = createService();
    return getConfigurationStanzaValue(service, 'app', 'launcher', 'version', defaultValue);
}

function getSeverityFilterValue(
    selectedSeverities: Severity[],
    availableSeverities: Severity[]
): string {
    let severitiesFilter = '';

    if (selectedSeverities.length === 0) {
        throw new Error('At least one severity must be selected');
    }

    // Only set a filter if the user did not select everything
    if (selectedSeverities.length !== availableSeverities.length) {
        severitiesFilter = selectedSeverities.map((severity) => severity.value).join(',');
    }
    return severitiesFilter;
}

function getSourceTypesFilterValue(
    selectedSourceTypes: SourceType[],
    availableSourceTypeCategories: SourceTypeCategory[]
): string {
    let sourceTypesFilter = '';

    if (selectedSourceTypes.length === 0) {
        throw new Error('At least one source type must be selected');
    }

    // Only set a filter if the user did not select everything
    if (
        selectedSourceTypes.length !==
        availableSourceTypeCategories.flatMap((category) => category.types).length
    ) {
        let remainingSourceTypes = [...selectedSourceTypes];
        availableSourceTypeCategories.forEach((sourceTypeCategory) => {
            // If the user has selected every sub option, replace them by the parent
            if (sourceTypeCategory.types.every((type) => remainingSourceTypes.includes(type))) {
                remainingSourceTypes = remainingSourceTypes.filter(
                    (type) => !sourceTypeCategory.types.includes(type)
                );
                remainingSourceTypes.push(sourceTypeCategory);
            }
        });
        sourceTypesFilter = remainingSourceTypes.map((sourceType) => sourceType.value).join(',');
    }
    return sourceTypesFilter;
}

export {
    createFlareIndex,
    fetchApiKey,
    fetchApiKeyValidation,
    fetchAvailableIndexNames,
    fetchCollectionItems,
    fetchCurrentIndexName,
    fetchFiltersSeverities,
    fetchFiltersSourceTypes,
    fetchIngestMetadataOnly,
    fetchSeveritiesFilter,
    fetchSourceTypesFilter,
    fetchTenantId,
    fetchUserTenants,
    fetchVersionName,
    getFlareSearchDataUrl,
    getRedirectUrl,
    redirectToHomepage,
    saveConfiguration,
    getSeverityFilterValue,
    getSourceTypesFilterValue,
};
