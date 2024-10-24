import { promisify } from './util.js'
import * as SplunkHelpers from './configurationFileHelper.js'

const appName = "flare_splunk_integration";
const storageRealm = "flare_integration_realm";
const applicationNameSpace = {
    owner: "nobody",
    app: appName,
    sharing: "app",
};

async function completeSetup(splunkService) {
    var configurationFileName = "app";
    var stanzaName = "install";
    var propertiesToUpdate = {
        is_configured: "true",
    };

    await SplunkHelpers.updateConfigurationFile(splunkService, configurationFileName, stanzaName, propertiesToUpdate);
};

async function reloadApp(splunkService, appName) {
    var splunkApps = splunkService.apps();
    await promisify(splunkApps.fetch)();

    var currentApp = splunkApps.item(appName);
    await promisify(currentApp.reload)();
};

function redirectToHomepage(appName) {
    var redirectUrl = "/app/" + appName;
    window.location.href = redirectUrl;
};

function createService(splunkSdk, applicationNamespace) {
    var http = new splunkSdk.SplunkWebHttp();
    var service = new splunkSdk.Service(http, applicationNamespace);

    return service;
};

async function retrieveUserTenants(splunkSdk, serverKey, successCallback, errorCallback) {
    const service = createService(splunkSdk, applicationNameSpace);
    const data = { "serverKey": serverKey };
    service.post('/services/retrieve_user_tenants', data, function (err, response) {
        if (err) {
            errorCallback(err.data);
        } else if (response.status === 200) {
            successCallback(response.data);
        }
    });
}

async function saveConfiguration(splunkSdk, serverKey, tenantId) {
    try {
        const service = createService(splunkSdk, applicationNameSpace);

        const storagePasswords = await promisify(service.storagePasswords().fetch)();
        await savePassword(storagePasswords, storageRealm, "serverkey", serverKey);
        await savePassword(storagePasswords, storageRealm, "tenantid", tenantId);

        await completeSetup(service);
        await reloadApp(service, appName);

        redirectToHomepage(appName);
    } catch (error) {
        console.log('Error:', error);
    }
}

async function retrieveServerKey(splunkSdk) {
    return retrievePassword(splunkSdk, "serverkey");
};

async function retrieveTenantId(splunkSdk) {
    return retrievePassword(splunkSdk, "tenantid");
};

async function retrievePassword(
    splunkSdk, passwordKey
) {
    const service = createService(splunkSdk, applicationNameSpace);
    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    var passwordList = storagePasswords.list();
    const passwordId = storageRealm + ":" + passwordKey + ":";

    for (var index = 0; index < passwordList.length; index++) {
        if (passwordList[index].name === passwordId) {
            return passwordList[index]._properties.clear_password
        }
    }
    return ''
};

function doesPasswordExist(
    storage,
    storageRealm,
    key,
) {
    var passwordList = storage.list();
    const passwordId = storageRealm + ":" + key + ":";

    for (var index = 0; index < passwordList.length; index++) {
        if (passwordList[index].name === passwordId) {
            return true
        }
    }
    return false
};

async function savePassword(storage, storageRealm, key, value) {
    var passwordExists = doesPasswordExist(storage, storageRealm, key);
    if (passwordExists) {
        const passwordId = storageRealm + ":" + key + ":";
        await storage.del(passwordId);
    }

    storage.create({
        name: key,
        realm: storageRealm,
        password: value
    },
        function (err, storage) {
            if (err) {
                console.warn(err);
            }
        });
}

export {
    saveConfiguration,
    retrieveUserTenants,
    retrieveServerKey,
    retrieveTenantId,
}
