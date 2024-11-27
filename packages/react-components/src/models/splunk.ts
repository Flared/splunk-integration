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

export interface SplunkSavedSearch {
    name: string;
    qualifiedPath: string;
    update: (properties: Record<string, string>) => SplunkRequestResponse;
}

export interface SplunkAppAccessor {
    reload: () => void;
}

export interface Stanza {
    name: string;
}

export interface SplunkRequestResponse {
    status: number;
    data: any;
}

export interface SplunkAppsAccessor {
    fetch: () => SplunkAppsAccessor;
    item: (applicationName: string) => SplunkAppAccessor;
}

export interface ConfigurationStanzaAccessor {
    fetch: () => ConfigurationStanzaAccessor;
    update: (properties: Record<string, string>) => SplunkRequestResponse;
    list: () => Array<{ name: string }>;
    properties: () => Record<string, string>;
    _properties: Record<string, string>;
}

export interface ConfigurationFileAccessor {
    create: (stanzaName: string) => SplunkRequestResponse;
    fetch: () => ConfigurationFileAccessor;
    item: (
        stanzaName: string,
        properties: SplunkApplicationNamespace
    ) => ConfigurationStanzaAccessor;
    list: () => Array<{ name: string }>;
}

export interface ConfigurationsAccessor {
    fetch: () => ConfigurationsAccessor;
    create: (configurationFilename: string) => SplunkRequestResponse;
    item: (stanzaName: string, properties: SplunkApplicationNamespace) => ConfigurationFileAccessor;
    list: () => Array<{ name: string }>;
}

export interface SplunkIndexesAccessor {
    fetch: () => SplunkIndexesAccessor;
    create: (indexName: string, data: any) => SplunkRequestResponse;
    item: (indexName: string) => SplunkIndex;
    list: () => Array<SplunkIndex>;
}

export interface SplunkSavedSearchAccessor {
    fetch: () => SplunkSavedSearchAccessor;
    create: (indexName: string, data: any) => SplunkRequestResponse;
    item: (indexName: string) => SplunkSavedSearch;
    list: () => Array<SplunkSavedSearch>;
}

export interface SplunkStoragePasswordAccessors {
    fetch: () => SplunkStoragePasswordAccessors;
    item: (applicationName: string) => SplunkAppAccessor;
    list: () => Array<SplunkPassword>;
    del: (passwordId: string) => SplunkRequestResponse;
    create: (params: { name: string; realm: string; password: string }) => SplunkRequestResponse;
}

export interface SplunkService {
    configurations: (params: SplunkApplicationNamespace) => ConfigurationsAccessor;
    apps: () => SplunkAppsAccessor;
    storagePasswords: () => SplunkStoragePasswordAccessors;
    indexes: () => SplunkIndexesAccessor;
    savedSearches: () => SplunkSavedSearchAccessor;
    get: (splunkUrlPath: string, data: any) => SplunkRequestResponse;
    post: (splunkUrlPath: string, data: any) => SplunkRequestResponse;
}
