import { promisify } from './util.js'

// ----------------------------------
// Splunk JS SDK Helpers
// ----------------------------------
// ---------------------
// Process Helpers
// ---------------------
async function updateConfigurationFile(
    service,
    configurationFilename,
    stanzaName,
    properties,
) {
    // Retrieve the accessor used to get a configuration file
    var configurations = service.configurations(
        {
            // Name space information not provided
        },
    );
    configurations = await promisify(configurations.fetch)();

    // Check for the existence of the configuration file
    var doesExist = doesConfigurationExist(
        configurations,
        configurationFilename,
    );

    // If the configuration file doesn't exist, create it
    if (!doesExist) {
        await createConfigurationFile(
            configurations,
            configurationFilename,
        );

        // BUG WORKAROUND: re-fetch because the client doesn't do so
        configurations = await promisify(configurations.fetch)();
    }

    // Retrieves the configuration file accessor
    var configurationFileAccessor = getConfigurationFile(
        configurations,
        configurationFilename,
    );
    configurationFileAccessor = await promisify(configurationFileAccessor.fetch)();

    // Checks to see if the stanza where the inputs will be
    // stored exist
    var stanzaExist = doesStanzaExist(
        configurationFileAccessor,
        stanzaName,
    );

    // If the configuration stanza doesn't exist, create it
    if (!stanzaExist) {
        await createStanza(configurationFileAccessor, stanzaName);
    }
    // Need to update the information after the creation of the stanza
    configurationFileAccessor = await promisify(configurationFileAccessor.fetch)();

    // Retrieves the configuration stanza accessor
    var configurationStanzaAccessor = getConfigurationFileStanza(
        configurationFileAccessor,
        stanzaName,
    );
    configurationStanzaAccessor = await promisify(configurationStanzaAccessor.fetch)();

    // We don't care if the stanza property does or doesn't exist
    // This is because we can use the
    // configurationStanza.update() function to create and
    // change the information of a property
    await updateStanzaProperties(
        configurationStanzaAccessor,
        properties,
    );
};

function createConfigurationFile(
    configurationsAccessor,
    configurationFilename,
) {
    return promisify(configurationsAccessor.create)(configurationFilename);
};

// ---------------------
// Existence Functions
// ---------------------
function doesConfigurationExist(
    configurationsAccessor,
    configurationFilename,
) {
    var wasConfigurationFileFound = false;

    var configurationFilesFound = configurationsAccessor.list();
    for (var index = 0; index < configurationFilesFound.length; index++) {
        var configurationFilenameFound =
            configurationFilesFound[index].name;
        if (configurationFilenameFound === configurationFilename) {
            wasConfigurationFileFound = true;
            break;
        }
    }

    return wasConfigurationFileFound;
};

function doesStanzaExist(
    configurationFileAccessor,
    stanzaName,
) {
    var wasStanzaFound = false;

    var stanzasFound = configurationFileAccessor.list();
    for (var index = 0; index < stanzasFound.length; index++) {
        var stanzaFound = stanzasFound[index].name;
        if (stanzaFound === stanzaName) {
            wasStanzaFound = true;
            break;
        }
    }

    return wasStanzaFound;
};

function doesStanzaPropertyExist(
    configurationStanzaAccessor,
    propertyName,
) {
    var wasPropertyFound = false;

    for (const [key, value] of Object.entries(
        configurationStanzaAccessor.properties(),
    )) {
        if (key === propertyName) {
            wasPropertyFound = true;
            break;
        }
    }

    return wasPropertyFound;
};

// ---------------------
// Retrieval Functions
// ---------------------
function getConfigurationFile(
    configurationsAccessor,
    configurationFilename,
) {
    var configurationFileAccessor = configurationsAccessor.item(
        configurationFilename,
        {
            // Name space information not provided
        },
    );

    return configurationFileAccessor;
};

function getConfigurationFileStanza(
    configurationFileAccessor,
    configurationStanzaName,
) {
    var configurationStanzaAccessor = configurationFileAccessor.item(
        configurationStanzaName,
        {
            // Name space information not provided
        },
    );

    return configurationStanzaAccessor;
};

function getConfigurationFileStanzaProperty(
    configurationFileAccessor,
    configurationFilename,
) {
    return null;
};

function createStanza(
    configurationFileAccessor,
    newStanzaName,
) {
    return promisify(configurationFileAccessor.create)(newStanzaName);
};

function updateStanzaProperties(
    configurationStanzaAccessor,
    newStanzaProperties,
) {
    return promisify(configurationStanzaAccessor.update)(newStanzaProperties);
};

export {
    updateConfigurationFile,
}
