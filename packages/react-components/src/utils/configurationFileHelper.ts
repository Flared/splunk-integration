import { APPLICATION_NAMESPACE } from '../models/constants';
import { ConfigurationFile, Configurations, Entity, HTTPResponse, Service } from '../models/splunk';
import { promisify } from './util';

// ----------------------------------
// Splunk JS SDK Helpers
// ----------------------------------
// ---------------------
// Existence Functions
// ---------------------
function doesConfigurationExist(
    configurations: Configurations,
    configurationFilename: string
): boolean {
    for (const stanza of configurations.list()) {
        if (stanza.name === configurationFilename) {
            return true;
        }
    }

    return false;
}

function doesStanzaExist(
    configurationFileAccessor: ConfigurationFile,
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
    configurations: Configurations,
    configurationFilename: string
): Promise<ConfigurationFile> {
    return promisify(configurations.item(configurationFilename, APPLICATION_NAMESPACE).fetch)();
}

function getConfigurationFileStanza(
    configurationFile: ConfigurationFile,
    configurationStanzaName: string
): Promise<Entity> {
    return promisify(
        configurationFile.item(configurationStanzaName, APPLICATION_NAMESPACE).fetch
    )();
}

function createStanza(
    configurationFile: ConfigurationFile,
    newStanzaName: string
): Promise<HTTPResponse> {
    return promisify(configurationFile.create)(newStanzaName);
}

function updateStanzaProperties(
    configurationStanza: Entity,
    newStanzaProperties: Record<string, string>
): Promise<HTTPResponse> {
    return promisify(configurationStanza.update)(newStanzaProperties);
}

// ---------------------
// Process Helpers
// ---------------------

function createConfigurationFile(
    configurations: Configurations,
    configurationFilename: string
): Promise<HTTPResponse> {
    return promisify(configurations.create)(configurationFilename);
}

export async function updateConfigurationFile(
    service: Service,
    configurationFilename: string,
    stanzaName: string,
    properties: Record<string, string>
): Promise<void> {
    // Fetch the accessor used to get a configuration file
    let configurations = service.configurations(APPLICATION_NAMESPACE);
    configurations = await promisify(configurations.fetch)();

    // Check for the existence of the configuration file
    const doesExist = doesConfigurationExist(configurations, configurationFilename);

    // If the configuration file doesn't exist, create it
    if (!doesExist) {
        await createConfigurationFile(configurations, configurationFilename);

        configurations = await promisify(configurations.fetch)();
    }

    // Fetchs the configuration file accessor
    let configurationFile = await getConfigurationFile(configurations, configurationFilename);

    // Checks to see if the stanza where the inputs will be
    // stored exist
    const stanzaExist = doesStanzaExist(configurationFile, stanzaName);

    // If the configuration stanza doesn't exist, create it
    if (!stanzaExist) {
        await createStanza(configurationFile, stanzaName);

        // Need to update the information after the creation of the stanza
        configurationFile = await promisify(configurationFile.fetch)();
    }

    // Fetchs the configuration stanza accessor
    const configurationStanza = await getConfigurationFileStanza(configurationFile, stanzaName);

    // We don't care if the stanza property does or doesn't exist
    // This is because we can use the
    // configurationStanza.update() function to create and
    // change the information of a property
    await updateStanzaProperties(configurationStanza, properties);
}

export async function getConfigurationStanzaValue(
    service: Service,
    configurationFilename: string,
    stanzaName: string,
    propertyName: string,
    defaultValue: string
): Promise<string> {
    // Fetch the accessor used to get a configuration file
    let configurations = service.configurations(APPLICATION_NAMESPACE);
    configurations = await promisify(configurations.fetch)();

    // Fetchs the configuration file accessor
    const configurationFile = await getConfigurationFile(configurations, configurationFilename);

    // Fetchs the configuration stanza accessor
    const configurationStanzaAccessor = await getConfigurationFileStanza(
        configurationFile,
        stanzaName
    );

    let propertyValue = defaultValue;
    if (propertyName in configurationStanzaAccessor.properties()) {
        propertyValue = configurationStanzaAccessor.properties()[propertyName];
    }

    return propertyValue;
}
