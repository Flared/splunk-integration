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

/**
 * The SDK doesn't offer a method to update an existing password. Because of this, we need to delete
 * the current password before saving the new one. The SDK also does the deletion asynchronously, so we need
 * to loop the fetching of the current passwords after the deletion until we get the confirmation the password was deleted
 * to finally be able to save the new one.
 * SDK Reference: https://docs.splunk.com/DocumentationStatic/JavaScriptSDK/2.0.0/splunkjs.Service.StoragePasswords.html
 * Code based on: https://github.com/splunk/splunk-app-examples/blob/master/setup_pages/weather_app_example/appserver/static/javascript/views/storage_passwords.js
 */
async function savePassword(storage, storageRealm, key, value) {
    var passwordExists = doesPasswordExist(storage, storageRealm, key);
    if (passwordExists) {
        const passwordId = storageRealm + ":" + key + ":";
        storage.del(passwordId);
    }

    while (passwordExists) {
        storage = await promisify(storage.fetch)();
        passwordExists = doesPasswordExist(storage, storageRealm, key);
    }

    storage.create({
        name: key,
        realm: storageRealm,
        password: value
    },
        function (err, storage) {
            if (err) { console.warn(err); }
            else {
                console.log(storage.properties());
            }
        });
}

export {
    saveConfiguration,
    retrieveUserTenants,
}
