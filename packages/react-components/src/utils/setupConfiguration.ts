import {
    APPLICATION_NAMESPACE,
    APP_NAME,
    FLARE_SAVED_SEARCH_NAME,
    KV_COLLECTION_KEY,
    KV_COLLECTION_NAME,
    KV_COLLECTION_VALUE,
    PasswordKeys,
    STORAGE_REALM,
} from '../models/constants';
import { Tenant } from '../models/flare';
import {
    SplunkCollectionItem,
    SplunkRequestResponse,
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

    const currentApp = splunkApps.item(APP_NAME);
    await promisify(currentApp.reload)();
}

function getRedirectUrl(): string {
    return `/app/${APP_NAME}`;
}

async function getFlareSearchDataUrl(): Promise<string> {
    const service = createService();
    const savedSearches = await promisify(service.savedSearches().fetch)();
    const savedSearch = savedSearches.item(FLARE_SAVED_SEARCH_NAME);
    return `/app/${APP_NAME}/@go?s=${savedSearch.qualifiedPath}`;
}

function redirectToHomepage(): void {
    window.location.href = getRedirectUrl();
}

function createService(): SplunkService {
    // The splunkjs is injected by Splunk
    // eslint-disable-next-line no-undef
    const http = new splunkjs.SplunkWebHttp();
    // eslint-disable-next-line no-undef
    const service = new splunkjs.Service(http, APPLICATION_NAMESPACE);

    return service;
}

function fetchApiKeyValidation(apiKey: string): Promise<boolean> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_api_key_validation', data).then(
        (response: SplunkRequestResponse) => {
            return response.status === 200;
        }
    );
}

function fetchUserTenants(apiKey: string): Promise<Array<Tenant>> {
    const service = createService();
    const data = { apiKey };
    return promisify(service.post)('/services/fetch_user_tenants', data).then(
        (response: SplunkRequestResponse) => {
            return response.data.tenants;
        }
    );
}

function doesPasswordExist(storage: SplunkStoragePasswordAccessors, key: string): boolean {
    const passwordId = `${STORAGE_REALM}:${key}:`;

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
    tenantId: number,
    indexName: string,
    isIngestingMetadataOnly: boolean
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
    await saveIndexForIngestion(service, indexName);
    const isFirstConfiguration = await fetchIsFirstConfiguration();
    if (isFirstConfiguration) {
        await updateEventIngestionCronJobInterval(service, '1');
    }
    await updateSavedSearchQuery(
        service,
        FLARE_SAVED_SEARCH_NAME,
        `source=${APP_NAME} index=${indexName}`
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
        .then((response: SplunkRequestResponse) => {
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
    const passwordId = `${STORAGE_REALM}:${passwordKey}:`;

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

export {
    createFlareIndex,
    fetchApiKey,
    fetchApiKeyValidation,
    fetchAvailableIndexNames,
    fetchCollectionItems,
    fetchCurrentIndexName,
    fetchIngestMetadataOnly,
    fetchTenantId,
    fetchUserTenants,
    fetchVersionName,
    getFlareSearchDataUrl,
    getRedirectUrl,
    redirectToHomepage,
    saveConfiguration,
};
