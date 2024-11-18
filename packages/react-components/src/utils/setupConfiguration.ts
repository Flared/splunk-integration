import { updateConfigurationFile, getConfigurationStanzaValue } from './configurationFileHelper';
import { Tenant } from '../models/flare';
import {
    PasswordKeys,
    SplunkApplicationNamespace,
    SplunkCollectionItem,
    SplunkService,
    SplunkStoragePasswordAccessors,
} from '../models/splunk';
import { promisify } from './util';

export const appName: string = 'flare';
const storageRealm: string = 'flare_integration_realm';
const applicationNameSpace: SplunkApplicationNamespace = {
    owner: 'nobody',
    app: appName,
    sharing: 'app',
};

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

function getFlareDataUrl(): string {
    return `/app/${appName}/search?q=search%20source%3D"flare"`;
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

function fetchUserTenants(
    apiKey: string,
    successCallback: (userTenants: Array<Tenant>) => void,
    errorCallback: (errorMessage: string) => void
): void {
    const service = createService();
    const data = { apiKey };
    service.post('/services/fetch_user_tenants', data, (err, response) => {
        if (err) {
            errorCallback(err.data);
        } else if (response.status === 200) {
            successCallback(response.data.tenants);
        }
    });
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
    return promisify(storage.create)({
        name: key,
        realm: storageRealm,
        password: value,
    });
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
    await completeSetup(service);
    await reloadApp(service);
}

async function fetchCollectionItems(): Promise<SplunkCollectionItem[]> {
    const service = createService();
    return promisify(service.get)('storage/collections/data/event_ingestion_collection/', {})
        .then((data: any) => {
            const items: SplunkCollectionItem[] = [];
            if (data.data) {
                data.data.forEach((element) => {
                    items.push({
                        key: element._key,
                        value: element.value,
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

async function fetchPassword(passwordKey: string): Promise<string> {
    const service = createService();
    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    const passwordId = `${storageRealm}:${passwordKey}:`;

    for (const password of storagePasswords.list()) {
        if (password.name === passwordId) {
            return password._properties.clear_password;
        }
    }
    return '';
}

async function fetchApiKey(): Promise<string> {
    return fetchPassword(PasswordKeys.API_KEY);
}

async function fetchTenantId(): Promise<number> {
    return fetchPassword(PasswordKeys.TENANT_ID).then((tenantId) => {
        if (tenantId !== '') {
            return parseInt(tenantId, 10);
        }

        return -1;
    });
}

async function fetchIngestMetadataOnly(): Promise<boolean> {
    return fetchPassword(PasswordKeys.INGEST_METADATA_ONLY).then((isIngestingMetadataOnly) => {
        if (isIngestingMetadataOnly !== '') {
            return isIngestingMetadataOnly === 'true';
        }

        return false;
    });
}

async function createFlareIndex(): Promise<void> {
    const service = createService();
    const isConfigured =
        (await getConfigurationStanzaValue(
            service,
            'app',
            'install',
            'is_configured',
            'unknown'
        )) === '1';
    if (!isConfigured) {
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

async function fetchVersionName(): Promise<string> {
    const service = createService();
    return getConfigurationStanzaValue(service, 'app', 'launcher', 'version', 'unknown');
}

export {
    saveConfiguration,
    fetchUserTenants,
    fetchApiKey,
    fetchTenantId,
    fetchIngestMetadataOnly,
    redirectToHomepage,
    getRedirectUrl,
    getFlareDataUrl,
    createFlareIndex,
    fetchAvailableIndexNames,
    fetchCurrentIndexName,
    fetchVersionName,
    fetchCollectionItems,
};
