export interface Tenant {
    id: number;
    name: string;
}

export enum ConfigurationStep {
    Initial = 1,
    UserPreferences = 2,
    Completed = 3,
}

export interface Severity {
    value: string;
    label: string;
    color: string;
}

export interface SourceType {
    value: string;
    label: string;
}

export interface SourceTypeCategory extends SourceType {
    types: SourceType[];
}

export interface IngestionStatus {
    last_fetched_at: string;
}
