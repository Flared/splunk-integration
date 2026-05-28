import { ApplicationNamespace } from './splunk';

export const APP_NAME = 'flare';
export const STORAGE_REALM = 'flare_v2_integration_realm';
export const APPLICATION_NAMESPACE: ApplicationNamespace = {
    owner: 'nobody',
    app: APP_NAME,
    sharing: 'app',
};
export const FLARE_SAVED_SEARCH_NAME = 'Flare Search';
export const SEVERITY_SAVED_SEARCH_NAME = 'Severity';

export enum PasswordKeys {
    API_KEY = 'api_key',
    TENANT_IDS = 'tenant_ids',
    INGEST_FULL_EVENT_DATA = 'ingest_full_event_data',
    SEVERITIES_FILTER = 'severities_filter',
    SOURCE_TYPES_FILTER = 'source_types_filter',
    NUMBER_OF_DAYS_TO_BACKFILL = 'number_of_days_to_backfill',
    INGESTION_INTERVAL = 'ingestion_interval',
    LOG_LEVEL = 'log_level',
    PROXY_ENABLED = 'proxy_enabled',
    PROXY_HOST = 'proxy_host',
    PROXY_PORT = 'proxy_port',
    PROXY_TYPE = 'proxy_type',
    PROXY_USERNAME = 'proxy_username',
    PROXY_PASSWORD = 'proxy_password',
    INDEX_NAME = 'index_name',
    SSL_VERIFY = 'ssl_verify',
    TENANT_NAMES = 'tenant_names',
}

// UI select options for the log level dropdown
export const LOG_LEVEL_OPTIONS = [
    { label: 'DEBUG', value: 'DEBUG' },
    { label: 'INFO', value: 'INFO' },
    { label: 'WARNING', value: 'WARNING' },
    { label: 'ERROR', value: 'ERROR' },
    { label: 'CRITICAL', value: 'CRITICAL' },
];
