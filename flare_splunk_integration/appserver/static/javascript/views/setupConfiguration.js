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

async function saveConfiguration(splunkSdk, serverKey, tenantId) {
    try {
        const service = createService(splunkSdk, applicationNameSpace);

        const storagePasswords = service.storagePasswords();
        savePassword(storagePasswords, storageRealm, "serverkey", serverKey);
        savePassword(storagePasswords, storageRealm, "tenantid", tenantId);

        await completeSetup(service);
        await reloadApp(service, appName);

        redirectToHomepage(appName);
    } catch (error) {
        console.log('Error:', error);
    }
}

function savePassword(storage, storageRealm, key, value) {
    storage.create({
        name: key,
        realm: storageRealm,
        password: value},
        function(err, storage) {
            if (err)
                {console.warn(err);}
            else {
             console.log(storage.properties());
             }
       });
}

export {
  saveConfiguration,
}
