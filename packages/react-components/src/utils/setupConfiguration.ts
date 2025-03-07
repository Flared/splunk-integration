import {
    APPLICATION_NAMESPACE,
    APP_NAME,
    FLARE_SAVED_SEARCH_NAME,
    PasswordKeys,
    SEVERITY_SAVED_SEARCH_NAME,
    STORAGE_REALM,
} from '../models/constants';
import { IngestionStatus, Severity, SourceType, SourceTypeCategory, Tenant } from '../models/flare';
import { HTTPResponse, Service, StoragePasswords } from '../models/splunk';
import { getConfigurationStanzaValue, updateConfigurationFile } from './configurationFileHelper';
import { promisify } from './util';

async function completeSetup(splunkService: Service): Promise<void> {
    await updateConfigurationFile(splunkService, 'app', 'install', {
        is_configured: 'true',
    });
}

async function reloadApp(splunkService: Service): Promise<void> {
    const splunkApps = splunkService.apps();
    await promisify(splunkApps.fetch)();

    const currentApp = splunkApps.item(APP_NAME, APPLICATION_NAMESPACE);
    await promisify(currentApp.reload)();
}

function getRedirectUrl(): string {
    return `/app/${APP_NAME}`;
}

async function getFlareSearchDataUrl(): Promise<string> {
    const service = createService();
    const savedSearches = await promisify(service.savedSearches().fetch)();
    const savedSearch = savedSearches.item(FLARE_SAVED_SEARCH_NAME, APPLICATION_NAMESPACE);
    return `/app/${APP_NAME}/@go?s=${savedSearch.qualifiedPath}`;
}

function redirectToHomepage(): void {
    window.location.href = getRedirectUrl();
}

function createService(): Service {
    // The splunkjs is injected by Splunk
    // eslint-disable-next-line no-undef
    const http = new splunkjs.SplunkWebHttp();
    // eslint-disable-next-line no-undef
    const service: Service = new splunkjs.Service(http, APPLICATION_NAMESPACE);
    return service;
}

function fetchApiKeyValidation(apiKey: string): Promise<boolean> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_api_key_validation', data).then(
        (response: HTTPResponse) => {
            return response.status === 200;
        }
    );
}

function fetchUserTenants(apiKey: string): Promise<Array<Tenant>> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_user_tenants', data).then(
        (response: HTTPResponse) => {
            return response.data.tenants;
        }
    );
}

function fetchSeverityFilters(apiKey: string): Promise<Array<Severity>> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_severity_filters', data).then(
        (response: HTTPResponse) => {
            return response.data.severities;
        }
    );
}

function fetchSourceTypeFilters(apiKey: string): Promise<Array<SourceTypeCategory>> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_source_type_filters', data).then(
        (response: HTTPResponse) => {
            return response.data.categories;
        }
    );
}

function doesPasswordExist(storage: StoragePasswords, key: string): boolean {
    const passwordId = `${STORAGE_REALM}:${key}:`;

    for (const password of storage.list()) {
        if (password.name === passwordId) {
            return true;
        }
    }
    return false;
}

async function savePassword(storage: StoragePasswords, key: string, value: string): Promise<void> {
    const passwordExists = doesPasswordExist(storage, key);
    if (passwordExists) {
        const passwordId = `${STORAGE_REALM}:${key}:`;
        await storage.del(passwordId);
    }
    if (value.length > 0) {
        await promisify(storage.create)({
            name: key,
            realm: STORAGE_REALM,
            password: value,
        });
    }
}

async function saveConfiguration(
    apiKey: string,
    tenantIds: number[],
    indexName: string,
    isIngestingFullEventData: boolean,
    severitiesFilter: string,
    sourceTypesFilter: string
): Promise<void> {
    const service = createService();
    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    await savePassword(storagePasswords, PasswordKeys.API_KEY, apiKey);
    await savePassword(storagePasswords, PasswordKeys.TENANT_IDS, JSON.stringify(tenantIds));
    await savePassword(
        storagePasswords,
        PasswordKeys.INGEST_FULL_EVENT_DATA,
        `${isIngestingFullEventData}`
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
        FLARE_SAVED_SEARCH_NAME,
        `source=${APP_NAME} index=${indexName} earliest=-24h latest=now`
    );
    await updateSavedSearchQuery(
        service,
        SEVERITY_SAVED_SEARCH_NAME,
        `source=${APP_NAME} index=${indexName} earliest=-24h latest=now | spath path=header.risk.score output=risk_score_str | eval risk_score = coalesce(tonumber(risk_score_str), 0)  | eval risk_label = case(risk_score == 1, "Info", risk_score == 2, "Low", risk_score == 3, "Medium", risk_score == 4, "High", risk_score == 5, "Critical")  | stats count by risk_label, risk_score | sort risk_score | fields - risk_score`
    );
    await updatePassAuthUsername(service);
    await completeSetup(service);
    await reloadApp(service);
    if (isFirstConfiguration) {
        await updateEventIngestionCronJobInterval(service, '* * * * *');
        await reloadApp(service);
    }
}

async function updateEventIngestionCronJobInterval(
    service: Service,
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

async function updatePassAuthUsername(service: Service): Promise<void> {
    const username = await fetchCurrentUsername();
    await updateConfigurationFile(
        service,
        'inputs',
        'script://$SPLUNK_HOME/etc/apps/flare/bin/cron_job_ingest_events.py',
        {
            passAuth: username,
        }
    );
}

async function updateSavedSearchQuery(
    service: Service,
    savedSearchName: string,
    query: string
): Promise<void> {
    const savedSearches = await promisify(service.savedSearches().fetch)();
    const savedSearch = savedSearches.item(savedSearchName, APPLICATION_NAMESPACE);
    if (savedSearch) {
        await savedSearch.update({
            search: query,
        });
    }
}

async function fetchIngestionStatus(): Promise<IngestionStatus> {
    const service = createService();

    const data = await promisify(service.get)('/services/fetch_ingestion_status', {}).then(
        (r: HTTPResponse) => {
            return r.data;
        }
    );

    return (
        data || {
            last_fetched_at: '',
            last_tenant_id: '',
        }
    );
}

async function fetchPassword(passwordKey: string): Promise<string | undefined> {
    const service = createService();
    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    const passwordId = `${STORAGE_REALM}:${passwordKey}:`;

    for (const password of storagePasswords.list()) {
        if (password.name === passwordId) {
            return password.properties().clear_password;
        }
    }
    return undefined;
}

async function fetchApiKey(): Promise<string> {
    return (await fetchPassword(PasswordKeys.API_KEY)) || '';
}

async function fetchTenantId(): Promise<number | undefined> {
    return fetchPassword(PasswordKeys.TENANT_ID).then((tenantId) => {
        if (tenantId) {
            return parseInt(tenantId, 10);
        }

        return undefined;
    });
}

async function fetchTenantIds(): Promise<number[]> {
    return fetchPassword(PasswordKeys.TENANT_IDS).then((tenantIds) => {
        if (!tenantIds) {
            return [];
        }
        try {
            return JSON.parse(tenantIds);
        } catch {
            return [];
        }
    });
}

async function fetchIngestFullEventData(): Promise<boolean> {
    return fetchPassword(PasswordKeys.INGEST_FULL_EVENT_DATA).then((isIngestingFullEventData) => {
        return isIngestingFullEventData === 'true';
    });
}

async function fetchSeveritiesFilter(): Promise<Array<string>> {
    const savedSeverities = await fetchPassword(PasswordKeys.SEVERITIES_FILTER);
    if (savedSeverities) {
        return savedSeverities.split(',');
    }

    return [];
}

async function fetchSourceTypesFilter(): Promise<Array<string>> {
    const savedSourceTypes = await fetchPassword(PasswordKeys.SOURCE_TYPES_FILTER);
    if (savedSourceTypes) {
        return savedSourceTypes.split(',');
    }

    return [];
}

async function createFlareIndex(): Promise<void> {
    const service = createService();
    const isFirstConfiguration = await fetchIsFirstConfiguration();
    if (isFirstConfiguration) {
        const currentIndexNames = await fetchAvailableIndexNames();
        if (!currentIndexNames.find((indexName) => indexName === APP_NAME)) {
            await service.indexes().create(APP_NAME, {});
        }
    }
}

async function saveIndexForIngestion(service: Service, indexName: string): Promise<void> {
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

function convertSeverityFilterToArray(
    severitiesFilter: string[],
    allSeverities: Severity[]
): Severity[] {
    // If no filter is specified, add every severities
    if (severitiesFilter.length === 0) {
        return [...allSeverities];
    }

    // Otherwise, find the matching severities from the filter
    const severities: Severity[] = [];
    severitiesFilter.forEach((severityValue) => {
        const severityMatch = allSeverities.find((severity) => severity.value === severityValue);
        if (severityMatch) {
            severities.push(severityMatch);
        }
    });
    return severities;
}

function getSeverityFilterValue(selectedSeverities: Severity[], allSeverities: Severity[]): string {
    let severitiesFilter = '';

    if (selectedSeverities.length === 0) {
        throw new Error('At least one severity must be selected');
    }

    // Only set a filter if the user did not select everything
    if (selectedSeverities.length !== allSeverities.length) {
        severitiesFilter = selectedSeverities.map((severity) => severity.value).join(',');
    }
    return severitiesFilter;
}

function convertSourceTypeFilterToArray(
    sourceTypesFilter: string[],
    allSourceTypeCategories: SourceTypeCategory[]
): SourceType[] {
    // If no filter is specified, add every sub source types
    if (sourceTypesFilter.length === 0) {
        return [...allSourceTypeCategories.flatMap((category) => category.types)];
    }

    // Otherwise, try to match the filter with the source type categories and subtypes
    const sourceTypes: SourceType[] = [];
    sourceTypesFilter.forEach((sourceTypeValue) => {
        // Check if the source type is actually a category and if so, add all of their subtypes
        const sourceTypeCategoryMatch = allSourceTypeCategories.find(
            (sourceTypeCategory) => sourceTypeCategory.value === sourceTypeValue
        );
        if (sourceTypeCategoryMatch) {
            sourceTypes.push(...sourceTypeCategoryMatch.types);
        }

        // Check if the source type is a sub type of a category and add it to the list if found
        const sourceTypeMatch = allSourceTypeCategories
            .flatMap((category) => category.types)
            .find((sourceType) => sourceType.value === sourceTypeValue);
        if (sourceTypeMatch) {
            sourceTypes.push(sourceTypeMatch);
        }
    });
    return sourceTypes;
}

function getSourceTypesFilterValue(
    selectedSourceTypes: SourceType[],
    allSourceTypeCategories: SourceTypeCategory[]
): string {
    let sourceTypesFilter = '';

    if (selectedSourceTypes.length === 0) {
        throw new Error('At least one source type must be selected');
    }

    // Only set a filter if the user did not select everything
    if (
        selectedSourceTypes.length !==
        allSourceTypeCategories.flatMap((category) => category.types).length
    ) {
        let remainingSourceTypes = [...selectedSourceTypes];
        allSourceTypeCategories.forEach((sourceTypeCategory) => {
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

function fetchCurrentUsername(): Promise<string> {
    const service = createService();
    return promisify(service.currentUser)().then((user) => {
        return user.name;
    });
}

export {
    createFlareIndex,
    fetchApiKey,
    fetchApiKeyValidation,
    fetchAvailableIndexNames,
    fetchSeverityFilters,
    fetchIngestionStatus,
    fetchCurrentIndexName,
    fetchIngestFullEventData,
    fetchSeveritiesFilter,
    fetchSourceTypeFilters,
    fetchSourceTypesFilter,
    fetchTenantId,
    fetchTenantIds,
    fetchUserTenants,
    fetchVersionName,
    getFlareSearchDataUrl,
    getRedirectUrl,
    redirectToHomepage,
    saveConfiguration,
    getSeverityFilterValue,
    convertSeverityFilterToArray,
    getSourceTypesFilterValue,
    convertSourceTypeFilterToArray,
};
