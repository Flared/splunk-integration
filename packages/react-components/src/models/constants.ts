import { SplunkApplicationNamespace } from './splunk';

export const APP_NAME = 'flare';
export const STORAGE_REALM = 'flare_integration_realm';
export const APPLICATION_NAMESPACE: SplunkApplicationNamespace = {
    owner: 'nobody',
    app: APP_NAME,
    sharing: 'app',
};
export const FLARE_SAVED_SEARCH_NAME = 'Flare Search';
export const SEVERITY_SAVED_SEARCH_NAME = 'Severity';
export const KV_COLLECTION_NAME = 'event_ingestion_collection';
export const KV_COLLECTION_KEY = '_key';
export const KV_COLLECTION_VALUE = 'value';

export enum PasswordKeys {
    API_KEY = 'api_key',
    TENANT_ID = 'tenant_id',
    INGEST_FULL_EVENT_DATA = 'ingest_full_event_data',
    SEVERITIES_FILTER = 'severities_filter',
    SOURCE_TYPES_FILTER = 'source_types_filter',
}

export enum CollectionKeys {
    START_DATE = 'start_date',
    LAST_FETCHED = 'timestamp_last_fetch',
    NEXT_TOKEN = 'next_token',
    LAST_INGESTED_TENANT_ID = 'last_ingested_tenant_id',
    NEXT_PREFIX = 'next_',
}
