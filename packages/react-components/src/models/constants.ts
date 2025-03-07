import { ApplicationNamespace } from './splunk';

export const APP_NAME = 'flare';
export const STORAGE_REALM = 'flare_integration_realm';
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
}
