import { useCallback, useState, MutableRefObject } from 'react';

import { Severity, SourceType, SourceTypeCategory, Tenant } from '../models/flare';
import {
    fetchUserTenants,
    fetchSeverityFilters,
    fetchSourceTypeFilters,
    validateApiKey,
    convertSeverityFilterToArray,
    convertSourceTypeFilterToArray,
    ProxyValidationConfig,
} from '../utils/setupConfiguration';

interface ApiKeyValidationSetters {
    setTenants: (v: Tenant[]) => void;
    setSeverities: (v: Severity[]) => void;
    setSourceTypeCategories: (v: SourceTypeCategory[]) => void;
    setSelectedSeverities: (v: Severity[]) => void;
    setSelectedSourceTypes: (v: SourceType[]) => void;
    setSelectedTenantIds: (v: number[]) => void;
}

/**
 * Owns the API key validation state and exposes `validateApiKeyOnly` and
 * `loadApiKeyDependentData`.  The debounced useEffect that triggers these
 * remains in Configuration.tsx because it depends on too many cross-cutting
 * concerns (apiKey, all proxy fields, isInitializing).
 */
export function useApiKeyValidation(
    prevApiKeyRef: MutableRefObject<string | null>,
    proxyEnabledRef: MutableRefObject<boolean>,
    clearMessages: () => void,
    showError: (msg: string) => void,
    setters: ApiKeyValidationSetters
) {
    const [isValidatingApiKey, setIsValidatingApiKey] = useState(false);
    const [isApiKeyValidated, setIsApiKeyValidated] = useState(false);
    const [apiKeyError, setApiKeyError] = useState('');

    const {
        setTenants,
        setSeverities,
        setSourceTypeCategories,
        setSelectedSeverities,
        setSelectedSourceTypes,
        setSelectedTenantIds,
    } = setters;

    const loadApiKeyDependentData = useCallback(
        (key: string, savedSevsFilter?: string[], savedTypesFilter?: string[], proxyConfig?: ProxyValidationConfig): void => {
            setIsValidatingApiKey(true);
            setApiKeyError('');
            clearMessages();

            Promise.all([
                fetchUserTenants(key, proxyConfig),
                fetchSeverityFilters(key, proxyConfig),
                fetchSourceTypeFilters(key, proxyConfig),
            ])
                .then(([userTenants, fetchedSeverities, fetchedSourceTypes]) => {
                    if (key !== prevApiKeyRef.current) return;
                    if (proxyConfig && proxyConfig.proxyEnabled !== proxyEnabledRef.current) return;
                    setApiKeyError('');
                    clearMessages();
                    setTenants(userTenants);
                    setSeverities(fetchedSeverities);
                    setSourceTypeCategories(fetchedSourceTypes);
                    setIsApiKeyValidated(true);
                    setIsValidatingApiKey(false);

                    if (savedSevsFilter !== undefined) {
                        setSelectedSeverities(convertSeverityFilterToArray(savedSevsFilter, fetchedSeverities));
                    } else {
                        setSelectedSeverities(fetchedSeverities);
                    }

                    if (savedTypesFilter !== undefined) {
                        setSelectedSourceTypes(convertSourceTypeFilterToArray(savedTypesFilter, fetchedSourceTypes));
                    } else {
                        const allTypes: SourceType[] = [];
                        fetchedSourceTypes.forEach((category) => {
                            category.types.forEach((t) => allTypes.push(t));
                        });
                        setSelectedSourceTypes(allTypes);
                    }
                })
                .catch(() => {
                    if (key !== prevApiKeyRef.current) return;
                    if (proxyConfig && proxyConfig.proxyEnabled !== proxyEnabledRef.current) return;
                    setApiKeyError('Invalid API key or network error');
                    setIsApiKeyValidated(false);
                    setIsValidatingApiKey(false);
                    setTenants([]);
                    setSeverities([]);
                    setSourceTypeCategories([]);
                    setSelectedTenantIds([]);
                    showError('Invalid API key.');
                });
        },
        [clearMessages, showError, prevApiKeyRef, proxyEnabledRef, setTenants, setSeverities, setSourceTypeCategories, setSelectedSeverities, setSelectedSourceTypes, setSelectedTenantIds]
    );

    const validateApiKeyOnly = useCallback(
        (key: string, proxyConfig?: ProxyValidationConfig): Promise<boolean> => {
            setIsValidatingApiKey(true);
            setApiKeyError('');
            clearMessages();

            return validateApiKey(key, proxyConfig)
                .then((result) => {
                    if (key !== prevApiKeyRef.current) return false;
                    if (proxyConfig && proxyConfig.proxyEnabled !== proxyEnabledRef.current) return false;

                    setIsValidatingApiKey(false);

                    if (result.valid) {
                        setApiKeyError('');
                        setIsApiKeyValidated(true);
                        return true;
                    }

                    if (result.error_type === 'proxy_error') {
                        setApiKeyError('Proxy connection failed');
                        showError('Failed to connect through the configured proxy. Please verify your proxy host, port, and credentials.');
                        // Deliberately NOT setting setIsApiKeyValidated(false) — a proxy/network
                        // error shouldn't discard the user's previously loaded tenants/filters.
                    } else if (result.error_type === 'connection_error') {
                        setApiKeyError('Connection error');
                        showError('Unable to reach the Flare API. Please check your network connection.');
                    } else if (result.error_type === 'auth_error') {
                        setApiKeyError('Invalid API key');
                        showError('Invalid API key. Please check and re-enter your Flare API key.');
                        setIsApiKeyValidated(false);
                    } else {
                        setApiKeyError('Validation failed');
                        showError(result.error || 'API key validation failed. Please try again.');
                        setIsApiKeyValidated(false);
                    }
                    return false;
                })
                .catch(() => {
                    if (key !== prevApiKeyRef.current) return false;
                    if (proxyConfig && proxyConfig.proxyEnabled !== proxyEnabledRef.current) return false;
                    setIsValidatingApiKey(false);
                    setApiKeyError('Validation failed');
                    showError('API key validation failed. Please try again.');
                    return false;
                });
        },
        [clearMessages, showError, prevApiKeyRef, proxyEnabledRef]
    );

    return {
        isValidatingApiKey,
        isApiKeyValidated,
        setIsApiKeyValidated,
        apiKeyError,
        setApiKeyError,
        validateApiKeyOnly,
        loadApiKeyDependentData,
    };
}
