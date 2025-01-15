export interface KVCollectionItem {
    key: string;
    value: string;
    user: string;
}

export interface ApplicationNamespace {
    app?: string;
    owner?: string;
    sharing?: string;
}

export interface HTTPResponse {
    status: number;
    data: any;
}

export interface Endpoint {
    fetch: () => this;
    del: (relativePath: string) => HTTPResponse;
    qualifiedPath: string;
}

export interface Resource extends Endpoint {
    properties: () => Record<string, string>;
}

export interface Entity extends Resource {
    reload: () => void;
    update: (properties: Record<string, string>) => HTTPResponse;
    name: string;
}

export interface Collection<T extends Entity | Collection<Entity>> extends Resource {
    item: (itemName: string, namespace: ApplicationNamespace) => T;
    list: () => Array<T>;
}

export interface ConfigurationFile extends Collection<Entity> {
    create: (stanzaName: string) => HTTPResponse;
    name: string;
}

export interface Configurations extends Collection<ConfigurationFile> {
    create: (configurationFilename: string) => HTTPResponse;
}

export interface Indexes extends Collection<Entity> {
    create: (indexName: string, data: any) => HTTPResponse;
}

export interface StoragePasswords extends Collection<Entity> {
    create: (params: { name: string; realm: string; password: string }) => HTTPResponse;
}

export interface Service {
    configurations: (params: ApplicationNamespace) => Configurations;
    apps: () => Collection<Entity>;
    storagePasswords: () => StoragePasswords;
    indexes: () => Indexes;
    savedSearches: () => Collection<Entity>;
    serverInfo: () => any;
    get: (splunkUrlPath: string, data: any) => HTTPResponse;
    post: (splunkUrlPath: string, data: any) => HTTPResponse;
}
