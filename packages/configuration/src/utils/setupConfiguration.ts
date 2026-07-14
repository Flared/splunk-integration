import {
    APPLICATION_NAMESPACE,
    APP_NAME,
    FLARE_SAVED_SEARCH_NAME,
    PasswordKeys,
    STORAGE_REALM,
} from '../models/constants';
import { IngestionStatus, Severity, SourceType, SourceTypeCategory, Tenant } from '../models/flare';
import { HTTPResponse, Service, StoragePasswords } from '../models/splunk';
import { getConfigurationStanzaValue, updateConfigurationFile } from './configurationFileHelper';
import { promisify } from './util';

// eslint-disable-next-line no-undef
declare const splunkjs: any;

async function completeSetup(splunkService: Service): Promise<void> {
    await updateConfigurationFile(splunkService, 'app', 'install', {
        is_configured: 'true',
    });
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
    const http = new splunkjs.SplunkWebHttp();
    const service: Service = new splunkjs.Service(http, APPLICATION_NAMESPACE);
    return service;
}

export interface ProxyValidationConfig {
    proxyEnabled?: boolean;
    proxyType?: string;
    proxyHost?: string;
    proxyPort?: string;
    proxyUsername?: string;
    proxyPassword?: string;
}

function appendProxyToData(data: any, proxyConfig?: ProxyValidationConfig) {
    if (proxyConfig && proxyConfig.proxyEnabled !== undefined) {
        data.proxy_enabled = proxyConfig.proxyEnabled ? 'true' : 'false';
        data.proxy_type = proxyConfig.proxyType || '';
        data.proxy_host = proxyConfig.proxyHost || '';
        data.proxy_port = proxyConfig.proxyPort || '';
        data.proxy_username = proxyConfig.proxyUsername || '';
        data.proxy_password = proxyConfig.proxyPassword || '';
    }
    return data;
}

function fetchUserTenants(apiKey: string, proxyConfig?: ProxyValidationConfig): Promise<Array<Tenant>> {
    const service = createService();
    const data = appendProxyToData({ apiKey }, proxyConfig);
    return promisify(service.post)('/services/fetch_user_tenants', data).then(
        (response: HTTPResponse) => {
            return response.data.tenants;
        }
    );
}

function fetchSeverityFilters(apiKey: string, proxyConfig?: ProxyValidationConfig): Promise<Array<Severity>> {
    const service = createService();
    const data = appendProxyToData({ apiKey }, proxyConfig);
    return promisify(service.post)('/services/fetch_severity_filters', data).then(
        (response: HTTPResponse) => {
            return response.data.severities;
        }
    );
}

function fetchSourceTypeFilters(apiKey: string, proxyConfig?: ProxyValidationConfig): Promise<Array<SourceTypeCategory>> {
    const service = createService();
    const data = appendProxyToData({ apiKey }, proxyConfig);
    return promisify(service.post)('/services/fetch_source_type_filters', data).then(
        (response: HTTPResponse) => {
            return response.data.categories;
        }
    );
}

export interface ApiKeyValidationResult {
    valid: boolean;
    error?: string;
    error_type?: 'proxy_error' | 'connection_error' | 'auth_error' | 'unknown';
}

function validateApiKey(apiKey: string, proxyConfig?: ProxyValidationConfig): Promise<ApiKeyValidationResult> {
    const service = createService();
    const data = appendProxyToData({ apiKey }, proxyConfig);
    
    return promisify(service.post)('/services/validate_api_key', data)
        .then((response: HTTPResponse) => {
            return response.data as ApiKeyValidationResult;
        })
        .catch((err: any) => {
            console.error('[Flare Setup] API Key validation error:', err);
            let errorData: ApiKeyValidationResult = { valid: false, error: 'Unknown error', error_type: 'unknown' };

            // Attempt to parse Splunk's error response
            let responseString = '';
            if (typeof err?.data === 'string') {
                responseString = err.data;
            } else if (typeof err?.error === 'string') {
                responseString = err.error;
            } else if (err?.responseText) {
                responseString = err.responseText;
            }

            try {
                if (responseString) {
                    const parsed = JSON.parse(responseString);
                    console.error('[Flare Setup] Parsed error JSON:', parsed);
                    errorData = {
                        valid: false,
                        error: parsed.error || 'Validation failed',
                        error_type: parsed.error_type || 'unknown',
                    };
                } else if (err?.data?.error) {
                    errorData = {
                        valid: false,
                        error: err.data.error,
                        error_type: err.data.error_type || 'unknown',
                    };
                }
            } catch (e) {
                console.error('[Flare Setup] Error parsing validation failure string:', e, responseString);
            }
            return errorData;
        });
}

async function savePassword(storage: StoragePasswords, key: string, value: string): Promise<void> {
    const passwordId = `${STORAGE_REALM}:${key}:`;

    // Check if the current value matches — skip the expensive
    // DELETE + CREATE cycle when nothing has changed.
    for (const password of storage.list()) {
        if (password.name === passwordId) {
            if (password.properties().clear_password === value) {
                return; // unchanged
            }
            // Value differs — delete the old entry before creating the new one
            await storage.del(passwordId);
            break;
        }
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
    tenantNamesMap: Record<string, string>,
    indexName: string,
    isIngestingFullEventData: boolean,
    severitiesFilter: string,
    sourceTypesFilter: string,
    ingestionInterval?: string,
    numberOfDaysToBackfill?: string,
    logLevel?: string,
    proxyEnabled?: boolean,
    proxyHost?: string,
    proxyPort?: string,
    proxyType?: string,
    proxyUsername?: string,
    proxyPassword?: string,
    sslVerify: boolean = true
): Promise<void> {
    const service = createService();
    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    await savePassword(storagePasswords, PasswordKeys.API_KEY, apiKey);
    await savePassword(storagePasswords, PasswordKeys.TENANT_IDS, JSON.stringify(tenantIds));
    await savePassword(storagePasswords, PasswordKeys.TENANT_NAMES, JSON.stringify(tenantNamesMap));
    await savePassword(
        storagePasswords,
        PasswordKeys.INGEST_FULL_EVENT_DATA,
        `${isIngestingFullEventData}`
    );
    await savePassword(
        storagePasswords,
        PasswordKeys.NUMBER_OF_DAYS_TO_BACKFILL,
        numberOfDaysToBackfill ?? ''
    );
    await savePassword(storagePasswords, PasswordKeys.SEVERITIES_FILTER, `${severitiesFilter}`);
    await savePassword(storagePasswords, PasswordKeys.SOURCE_TYPES_FILTER, `${sourceTypesFilter}`);
    await savePassword(
        storagePasswords,
        PasswordKeys.INGESTION_INTERVAL,
        ingestionInterval ?? ''
    );
    await savePassword(
        storagePasswords,
        PasswordKeys.LOG_LEVEL,
        logLevel ?? 'INFO'
    );
    await savePassword(storagePasswords, PasswordKeys.PROXY_ENABLED, `${proxyEnabled ?? false}`);
    await savePassword(storagePasswords, PasswordKeys.PROXY_HOST, proxyHost ?? '');
    await savePassword(storagePasswords, PasswordKeys.PROXY_PORT, proxyPort ?? '');
    await savePassword(storagePasswords, PasswordKeys.PROXY_TYPE, proxyType ?? 'http');
    await savePassword(storagePasswords, PasswordKeys.PROXY_USERNAME, proxyUsername ?? '');
    await savePassword(storagePasswords, PasswordKeys.PROXY_PASSWORD, proxyPassword ?? '');
    await savePassword(storagePasswords, PasswordKeys.SSL_VERIFY, `${sslVerify}`);
    await savePassword(storagePasswords, PasswordKeys.INDEX_NAME, indexName);



    const isFirstConfiguration = await fetchIsFirstConfiguration();
    const activeInterval = ingestionInterval && ingestionInterval.trim().length > 0 ? ingestionInterval : '60';

    // ── Batched inputs.conf update ──────────────────────────────
    // when something has actually changed.
    const inputsStanza = `script://$SPLUNK_HOME/etc/apps/${APP_NAME}/bin/cron_job_ingest_events.py`;
    const currentIndex = await getConfigurationStanzaValue(service, 'inputs', inputsStanza, 'index', '');
    const currentInterval = await getConfigurationStanzaValue(service, 'inputs', inputsStanza, 'interval', '');
    const currentDisabled = await getConfigurationStanzaValue(service, 'inputs', inputsStanza, 'disabled', 'true');

    const inputsNeedUpdate =
        currentIndex !== indexName ||
        currentInterval !== activeInterval ||
        currentDisabled !== 'false';

    if (inputsNeedUpdate) {
        // Single batched write to inputs.conf — one reload instead of four
        await updateConfigurationFile(service, 'inputs', inputsStanza, {
            index: indexName,
            interval: activeInterval,
            disabled: 'false',
        });
        
        try {
            await promisify(service.get)(`/services/apps/local/${APP_NAME}/_reload`, {});
        } catch (err) {
            console.warn("Could not actively reload Splunk App configuration engine", err);
        }
    }

    // Only configure the app if the required core variables are definitively present
    if (apiKey && apiKey.trim() !== '' && tenantIds && tenantIds.length > 0) {
        await completeSetup(service);
    } else {
        // If the user clears the configuration, forcefully flag the app as unconfigured 
        // safely dropping them back into the setup capture screen
        await updateConfigurationFile(service, 'app', 'install', {
            is_configured: 'false',
        });
    }
}

// updateEventIngestionCronJobInterval and updatePassAuthUsername
// have been consolidated into the batched inputs.conf update inside
// saveConfiguration() to prevent burst-spawning of script processes.


export async function fetchSslVerify(): Promise<boolean> {
    const service = createService();
    const storagePasswords = await promisify(service.storagePasswords().fetch)();
    
    // Default to true if not found for strict security posture natively
    let sslVerify = true;
    const passwordId = `${STORAGE_REALM}:${PasswordKeys.SSL_VERIFY}:`;
    
    for (const password of storagePasswords.list()) {
        if (password.name === passwordId) {
            sslVerify = password.properties().clear_password === 'true';
            break;
        }
    }
    return sslVerify;
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
        }
    );
}

async function fetchPassword(passwordKey: string): Promise<string | undefined> {
    try {
        const service = createService();
        const storagePasswords = await promisify(service.storagePasswords().fetch)();
        const passwordId = `${STORAGE_REALM}:${passwordKey}:`;

        for (const password of storagePasswords.list()) {
            if (password.name === passwordId) {
                return password.properties().clear_password;
            }
        }
    } catch (e) {
        console.warn(`[Mock Fetch] Could not fetch password for ${passwordKey}:`, e);
    }
    return undefined;
}

async function fetchApiKey(): Promise<string> {
    return (await fetchPassword(PasswordKeys.API_KEY)) || '';
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

async function fetchNumberOfDaysToBackfill(): Promise<string | undefined> {
    return fetchPassword(PasswordKeys.NUMBER_OF_DAYS_TO_BACKFILL).then((numberOfDaysToBackfill) => {
        return numberOfDaysToBackfill;
    });
}

async function fetchIngestionInterval(): Promise<string | undefined> {
    return fetchPassword(PasswordKeys.INGESTION_INTERVAL).then((interval) => {
        return interval;
    });
}

async function fetchLogLevel(): Promise<string> {
    return fetchPassword(PasswordKeys.LOG_LEVEL).then((logLevel) => {
        return logLevel || 'INFO';
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

async function fetchProxyEnabled(): Promise<boolean> {
    return fetchPassword(PasswordKeys.PROXY_ENABLED).then((val) => val === 'true');
}

async function fetchProxyHost(): Promise<string> {
    return (await fetchPassword(PasswordKeys.PROXY_HOST)) || '';
}

async function fetchProxyPort(): Promise<string> {
    return (await fetchPassword(PasswordKeys.PROXY_PORT)) || '';
}

async function fetchProxyType(): Promise<string> {
    return (await fetchPassword(PasswordKeys.PROXY_TYPE)) || 'http';
}

async function fetchProxyUsername(): Promise<string> {
    return (await fetchPassword(PasswordKeys.PROXY_USERNAME)) || '';
}

async function fetchProxyPassword(): Promise<string> {
    return (await fetchPassword(PasswordKeys.PROXY_PASSWORD)) || '';
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

// saveIndexForIngestion has been consolidated into the batched
// inputs.conf update inside saveConfiguration().

async function disableIngestion(): Promise<void> {
    const service = createService();
    try {
        await updateConfigurationFile(
            service,
            'inputs',
            `script://$SPLUNK_HOME/etc/apps/${APP_NAME}/bin/cron_job_ingest_events.py`,
            {
                disabled: 'true',
            }
        );
    } catch (e) {
        console.warn('Splunk inputs stanza may not exist yet to disable.', e);
    }
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
        `script://$SPLUNK_HOME/etc/apps/${APP_NAME}/bin/cron_job_ingest_events.py`,
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
        return '';
    }

    // Always explicitly set the filter, even if everything is selected
    severitiesFilter = selectedSeverities.map((severity) => severity.value).join(',');
    return severitiesFilter;
}

function convertSourceTypeFilterToArray(
    sourceTypesFilter: string[],
    allSourceTypeCategories: SourceTypeCategory[]
): SourceType[] {
    // If no filter is specified, add every sub source types
    if (sourceTypesFilter.length === 0) {
        return [
            ...allSourceTypeCategories.reduce(
                (acc, category) => acc.concat(category.types),
                [] as SourceType[]
            ),
        ];
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
            .reduce((acc, category) => acc.concat(category.types), [] as SourceType[])
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
        return '';
    }

    // Build the filter: include subtype values AND parent category values when all subtypes are selected
    const values = new Set(selectedSourceTypes.map((st) => st.value));

    // If all subtypes of a category are selected, also include the parent category value
    allSourceTypeCategories.forEach((category) => {
        if (category.types.length > 0 && category.types.every((t) => values.has(t.value))) {
            values.add(category.value);
        }
    });

    return Array.from(values).join(',');
}


export {
    createFlareIndex,
    disableIngestion,
    fetchApiKey,
    fetchAvailableIndexNames,
    fetchSeverityFilters,
    fetchIngestionStatus,
    fetchCurrentIndexName,
    fetchIngestFullEventData,
    fetchIngestionInterval,
    fetchLogLevel,
    fetchSeveritiesFilter,
    fetchSourceTypeFilters,
    fetchSourceTypesFilter,
    fetchNumberOfDaysToBackfill,
    fetchTenantIds,
    fetchUserTenants,
    fetchVersionName,
    fetchProxyEnabled,
    fetchProxyHost,
    fetchProxyPort,
    fetchProxyType,
    fetchProxyUsername,
    fetchProxyPassword,
    getFlareSearchDataUrl,
    getRedirectUrl,
    redirectToHomepage,
    saveConfiguration,
    validateApiKey,
    getSeverityFilterValue,
    convertSeverityFilterToArray,
    getSourceTypesFilterValue,
    convertSourceTypeFilterToArray,
};
