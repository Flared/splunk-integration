import { updateConfigurationFile } from './configurationFileHelper';
import { Tenant } from './models/flare';
import {
    SplunkApplicationNamespace,
    SplunkService,
    SplunkStoragePasswordAccessors,
} from './models/splunk';
import { promisify } from './util';

const appName: string = 'flare';
const storageRealm: string = 'flare_integration_realm';
const applicationNameSpace: SplunkApplicationNamespace = {
    owner: 'nobody',
    app: appName,
    sharing: 'app',
};

async function completeSetup(splunkService: SplunkService): Promise<void> {
    const configurationFileName = 'app';
    const stanzaName = 'install';
    const propertiesToUpdate = {
        is_configured: 'true',
    };

    await updateConfigurationFile(
        splunkService,
        configurationFileName,
        stanzaName,
        propertiesToUpdate
    );
}

async function reloadApp(splunkService: SplunkService): Promise<void> {
    const splunkApps = splunkService.apps();
    await promisify(splunkApps.fetch)();

    const currentApp = splunkApps.item(appName);
    await promisify(currentApp.reload)();
}

function redirectToHomepage(): void {
    const redirectUrl = `/app/${appName}`;
    window.location.href = redirectUrl;
}

function createService(applicationNamespace: SplunkApplicationNamespace): SplunkService {
    // The splunkjs is injected by Splunk
    // eslint-disable-next-line no-undef
    const http = new splunkjs.SplunkWebHttp();
    // eslint-disable-next-line no-undef
    const service = new splunkjs.Service(http, applicationNamespace);

    return service;
}

function retrieveUserTenants(
    apiKey: string,
    successCallback: (userTenants: Array<Tenant>) => void,
    errorCallback: (errorMessage: string) => void
): void {
    const service = createService(applicationNameSpace);
    const data = { apiKey };
    service.post('/services/retrieve_user_tenants', data, (err, response) => {
        if (err) {
            errorCallback(err.data);
        } else if (response.status === 200) {
            successCallback(response.data.tenants);
        }
    });
}

function doesPasswordExist(storage: SplunkStoragePasswordAccessors, key: string) {
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

async function saveConfiguration(apiKey: string, tenantId: number) {
    const service = createService(applicationNameSpace);

    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    await savePassword(storagePasswords, 'api_key', apiKey);
    await savePassword(storagePasswords, 'tenant_id', `${tenantId}`);

    await completeSetup(service);
    await reloadApp(service);

    redirectToHomepage();
}

async function retrievePassword(passwordKey: string): Promise<string> {
    const service = createService(applicationNameSpace);
    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    const passwordId = `${storageRealm}:${passwordKey}:`;

    for (const password of storagePasswords.list()) {
        if (password.name === passwordId) {
            return password._properties.clear_password;
        }
    }
    return '';
}

async function retrieveApiKey(): Promise<string> {
    return retrievePassword('api_key');
}

async function retrieveTenantId(): Promise<number> {
    return retrievePassword('tenant_id').then((tenantId) => {
        if (tenantId !== '') {
            return parseInt(tenantId, 10);
        }

        return -1;
    });
}

export { saveConfiguration, retrieveUserTenants, retrieveApiKey, retrieveTenantId };
