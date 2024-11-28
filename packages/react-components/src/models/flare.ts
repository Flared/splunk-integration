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
