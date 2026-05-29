/**
 * Pure validation functions for the Configuration form.
 * No React dependencies — these can be unit-tested in isolation.
 */

export function validateInterval(value: string): boolean {
    const n = parseInt(value, 10);
    return value !== '' && !isNaN(n) && n >= 1 && n <= 2880;
}

export function validateBackfill(value: string): boolean {
    const n = parseInt(value, 10);
    return value !== '' && !isNaN(n) && n >= 0 && n <= 180;
}

export function isProxyHostMissing(enabled: boolean, host: string): boolean {
    return enabled && host.trim() === '';
}

export function isProxyPortInvalid(enabled: boolean, port: string): boolean {
    const n = parseInt(port, 10);
    return enabled && (port.trim() === '' || isNaN(n) || n < 1 || n > 65535);
}

export function isProxyValid(enabled: boolean, host: string, port: string): boolean {
    return !enabled || (!isProxyHostMissing(enabled, host) && !isProxyPortInvalid(enabled, port));
}

export function isFormValid(params: {
    apiKey: string;
    isApiKeyValidated: boolean;
    selectedTenantIds: number[];
    selectedSeveritiesCount: number;
    selectedSourceTypesCount: number;
    interval: string;
    backfill: string;
    proxyEnabled: boolean;
    proxyHost: string;
    proxyPort: string;
}): boolean {
    return (
        params.apiKey.length > 0 &&
        params.isApiKeyValidated &&
        params.selectedTenantIds.length > 0 &&
        params.selectedSeveritiesCount > 0 &&
        params.selectedSourceTypesCount > 0 &&
        validateInterval(params.interval) &&
        validateBackfill(params.backfill) &&
        isProxyValid(params.proxyEnabled, params.proxyHost, params.proxyPort)
    );
}
