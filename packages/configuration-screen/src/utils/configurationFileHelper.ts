import {
    ConfigurationFileAccessor,
    ConfigurationsAccessor,
    ConfigurationStanzaAccessor,
    SplunkService,
} from '../models/splunk';
import { promisify } from './util';

// ----------------------------------
// Splunk JS SDK Helpers
// ----------------------------------
// ---------------------
// Existence Functions
// ---------------------
function doesConfigurationExist(
    configurationsAccessor: ConfigurationsAccessor,
    configurationFilename: string
): boolean {
    for (const stanza of configurationsAccessor.list()) {
        if (stanza.name === configurationFilename) {
            return true;
        }
    }

    return false;
}

function doesStanzaExist(
    configurationFileAccessor: ConfigurationFileAccessor,
    stanzaName: string
): boolean {
    for (const stanza of configurationFileAccessor.list()) {
        if (stanza.name === stanzaName) {
            return true;
        }
    }

    return false;
}

// ---------------------
// Retrieval Functions
// ---------------------
function getConfigurationFile(
    configurationsAccessor: ConfigurationsAccessor,
    configurationFilename: string
): ConfigurationFileAccessor {
    const configurationFileAccessor = configurationsAccessor.item(configurationFilename, {
        // Name space information not provided
    });

    return configurationFileAccessor;
}

function getConfigurationFileStanza(
    configurationFileAccessor: ConfigurationFileAccessor,
    configurationStanzaName: string
): ConfigurationStanzaAccessor {
    const configurationStanzaAccessor = configurationFileAccessor.item(configurationStanzaName, {
        // Name space information not provided
    });

    return configurationStanzaAccessor;
}

function createStanza(
    configurationFileAccessor: ConfigurationFileAccessor,
    newStanzaName: string
): Promise<void> {
    return promisify(configurationFileAccessor.create)(newStanzaName);
}

function updateStanzaProperties(
    configurationStanzaAccessor: ConfigurationStanzaAccessor,
    newStanzaProperties: Record<string, string>
): Promise<void> {
    return promisify(configurationStanzaAccessor.update)(newStanzaProperties);
}

// ---------------------
// Process Helpers
// ---------------------

function createConfigurationFile(
    configurationsAccessor: ConfigurationsAccessor,
    configurationFilename: string
): Promise<void> {
    return promisify(configurationsAccessor.create)(configurationFilename);
}

export async function updateConfigurationFile(
    service: SplunkService,
    configurationFilename: string,
    stanzaName: string,
    properties: Record<string, string>
): Promise<void> {
    // Retrieve the accessor used to get a configuration file
    let configurations = service.configurations({
        // Name space information not provided
    });
    configurations = await promisify(configurations.fetch)();

    // Check for the existence of the configuration file
    const doesExist = doesConfigurationExist(configurations, configurationFilename);

    // If the configuration file doesn't exist, create it
    if (!doesExist) {
        await createConfigurationFile(configurations, configurationFilename);

        configurations = await promisify(configurations.fetch)();
    }

    // Retrieves the configuration file accessor
    let configurationFileAccessor = getConfigurationFile(configurations, configurationFilename);
    configurationFileAccessor = await promisify(configurationFileAccessor.fetch)();

    // Checks to see if the stanza where the inputs will be
    // stored exist
    const stanzaExist = doesStanzaExist(configurationFileAccessor, stanzaName);

    // If the configuration stanza doesn't exist, create it
    if (!stanzaExist) {
        await createStanza(configurationFileAccessor, stanzaName);
    }
    // Need to update the information after the creation of the stanza
    configurationFileAccessor = await promisify(configurationFileAccessor.fetch)();

    // Retrieves the configuration stanza accessor
    let configurationStanzaAccessor = getConfigurationFileStanza(
        configurationFileAccessor,
        stanzaName
    );
    configurationStanzaAccessor = await promisify(configurationStanzaAccessor.fetch)();

    // We don't care if the stanza property does or doesn't exist
    // This is because we can use the
    // configurationStanza.update() function to create and
    // change the information of a property
    await updateStanzaProperties(configurationStanzaAccessor, properties);
}

export async function getConfigurationStanzaValue(
    service: SplunkService,
    configurationFilename: string,
    stanzaName: string,
    propertyName: string,
    defaultValue: string
): Promise<string> {
    // Retrieve the accessor used to get a configuration file
    let configurations = service.configurations({
        // Name space information not provided
    });
    configurations = await promisify(configurations.fetch)();

    // Retrieves the configuration file accessor
    let configurationFileAccessor = getConfigurationFile(configurations, configurationFilename);
    configurationFileAccessor = await promisify(configurationFileAccessor.fetch)();

    // Retrieves the configuration stanza accessor
    let configurationStanzaAccessor = getConfigurationFileStanza(
        configurationFileAccessor,
        stanzaName
    );
    configurationStanzaAccessor = await promisify(configurationStanzaAccessor.fetch)();

    let propertyValue = defaultValue;
    if (propertyName in configurationStanzaAccessor._properties) {
        propertyValue = configurationStanzaAccessor._properties[propertyName];
    }

    return propertyValue;
}
