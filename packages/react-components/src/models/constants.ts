import { SplunkApplicationNamespace } from './splunk';

export const appName: string = 'flare';
export const storageRealm: string = 'flare_integration_realm';
export const applicationNameSpace: SplunkApplicationNamespace = {
    owner: 'nobody',
    app: appName,
    sharing: 'app',
};
export const flareSavedSearchName = 'Flare Search';
export const DEFAULT_FILTER_VALUE = '*';
export const KV_COLLECTION_NAME = 'event_ingestion_collection';
export const KV_COLLECTION_KEY = '_key';
export const KV_COLLECTION_VALUE = 'value';

export enum PasswordKeys {
    API_KEY = 'api_key',
    TENANT_ID = 'tenant_id',
    INGEST_METADATA_ONLY = 'ingest_metadata_only',
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
