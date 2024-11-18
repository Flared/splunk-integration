export interface SplunkApplicationNamespace {
    app?: string;
    owner?: string;
    sharing?: string;
}

export interface SplunkPassword {
    name: string;
    _properties: {
        clear_password: string;
    };
}

export interface SplunkCollectionItem {
    key: string;
    value: string;
    user: string;
}

export interface SplunkIndex {
    name: string;
}

export interface SplunkAppAccessor {
    reload: () => void;
}

export interface Stanza {
    name: string;
}

export interface SplunkAppsAccessor {
    fetch: () => SplunkAppsAccessor;
    item: (applicationName: string) => SplunkAppAccessor;
}

export interface ConfigurationStanzaAccessor {
    fetch: () => ConfigurationStanzaAccessor;
    update: (properties: Record<string, string>) => void;
    list: () => Array<{ name: string }>;
    properties: () => Record<string, string>;
    _properties: Record<string, string>;
}

export interface ConfigurationFileAccessor {
    create: (stanzaName: string) => void;
    fetch: () => ConfigurationFileAccessor;
    item: (
        stanzaName: string,
        properties: SplunkApplicationNamespace
    ) => ConfigurationStanzaAccessor;
    list: () => Array<{ name: string }>;
}

export interface ConfigurationsAccessor {
    fetch: () => ConfigurationsAccessor;
    create: (configurationFilename: string) => void;
    item: (stanzaName: string, properties: SplunkApplicationNamespace) => ConfigurationFileAccessor;
    list: () => Array<{ name: string }>;
}

export interface SplunkIndexesAccessor {
    fetch: () => SplunkIndexesAccessor;
    create: (indexName: string, data: any) => void;
    item: (indexName: string) => SplunkIndex;
    list: () => Array<SplunkIndex>;
}

export interface SplunkStoragePasswordAccessors {
    fetch: () => SplunkStoragePasswordAccessors;
    item: (applicationName: string) => SplunkAppAccessor;
    list: () => Array<SplunkPassword>;
    del: (passwordId: string) => void;
    create: (params: { name: string; realm: string; password: string }) => void;
}

export interface SplunkService {
    configurations: (params: SplunkApplicationNamespace) => ConfigurationsAccessor;
    apps: () => SplunkAppsAccessor;
    storagePasswords: () => SplunkStoragePasswordAccessors;
    indexes: () => SplunkIndexesAccessor;
    get: (splunkUrlPath: string, data: any) => void;
    post: (
        splunkUrlPath: string,
        data: any,
        callback: (err: { data: string }, response: any) => void
    ) => void;
}

export enum PasswordKeys {
    API_KEY = 'api_key',
    TENANT_ID = 'tenant_id',
    INGEST_METADATA_ONLY = 'ingest_metadata_only',
}
