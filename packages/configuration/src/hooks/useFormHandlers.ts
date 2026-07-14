import { useCallback, MutableRefObject } from 'react';

import { Severity, SourceType, SourceTypeCategory } from '../models/flare';

interface FormSetters {
    setApiKey: (v: string) => void;
    setApiKeyError: (v: string) => void;
    setSelectedTenantIds: (v: number[]) => void;
    setLogLevel: (v: string) => void;
    setIngestionInterval: (v: string) => void;
    setIndexName: (v: string) => void;
    setNumberOfDaysToBackfill: (v: string) => void;
    setIsIngestingFullEventData: (v: boolean) => void;
    setSelectedSeverities: (v: Severity[]) => void;
    setSelectedSourceTypes: (v: SourceType[]) => void;
    setSourceTypeCategories: (v: SourceTypeCategory[]) => void;
    setProxyEnabled: (v: boolean) => void;
    setProxyType: (v: string) => void;
    setProxyHost: (v: string) => void;
    setProxyPort: (v: string) => void;
    setProxyUsername: (v: string) => void;
    setProxyPassword: (v: string) => void;
    setSslVerify: (v: boolean) => void;
    setIsDirty: (v: boolean) => void;
    clearMessages: () => void;
}

/**
 * All onChange / onClick form event handlers for the Configuration page.
 * Receives state setters from the parent component — no state is owned here.
 */
export function useFormHandlers(
    proxyEnabledRef: MutableRefObject<boolean>,
    selectedSeverities: Severity[],
    selectedSourceTypes: SourceType[],
    setters: FormSetters
) {
    const {
        setApiKey, setApiKeyError, setSelectedTenantIds, setLogLevel,
        setIngestionInterval, setIndexName, setNumberOfDaysToBackfill,
        setIsIngestingFullEventData, setSelectedSeverities, setSelectedSourceTypes,
        setProxyEnabled, setProxyType, setProxyHost, setProxyPort,
        setProxyUsername, setProxyPassword, setSslVerify, setIsDirty, clearMessages,
    } = setters;

    // ── Basic field handlers ────────────────────────────────────────────

    const handleApiKeyChange = useCallback(
        (_e: unknown, { value }: { value: string }): void => {
            setApiKeyError('');
            clearMessages();
            setApiKey(value);
            setIsDirty(true);
        },
        [setApiKeyError, clearMessages, setApiKey, setIsDirty]
    );

    const handleTenantChange = useCallback(
        (_e: unknown, { values }: { values: Array<string | number | boolean> }): void => {
            setSelectedTenantIds(values.map((v) => Number(v)));
            setIsDirty(true);
        },
        [setSelectedTenantIds, setIsDirty]
    );

    const handleLogLevelChange = useCallback(
        (_e: unknown, { value }: { value: string | number | boolean }): void => {
            setLogLevel(String(value));
            setIsDirty(true);
        },
        [setLogLevel, setIsDirty]
    );

    const handleIngestionIntervalChange = useCallback(
        (_e: unknown, { value }: { value: string }): void => {
            const digits = value.replace(/\D/g, '');
            if (digits === '' || digits === '0') {
                setIngestionInterval(digits);
            } else {
                setIngestionInterval(String(Math.max(1, parseInt(digits, 10))));
            }
            setIsDirty(true);
        },
        [setIngestionInterval, setIsDirty]
    );

    const handleIndexChange = useCallback(
        (_e: unknown, { value }: { value: string | number | boolean }): void => {
            setIndexName(String(value));
            setIsDirty(true);
        },
        [setIndexName, setIsDirty]
    );

    const handleBackfillChange = useCallback(
        (_e: unknown, { value }: { value: string }): void => {
            const safeValue = value.replace(/\D/g, '');
            if (safeValue === '') {
                setNumberOfDaysToBackfill(safeValue);
            } else {
                setNumberOfDaysToBackfill(String(parseInt(safeValue, 10)));
            }
            setIsDirty(true);
        },
        [setNumberOfDaysToBackfill, setIsDirty]
    );

    const handleIngestFullEventToggle = useCallback(
        (_e: unknown, { selected }: { selected: boolean }): void => {
            setIsIngestingFullEventData(!selected);
            setIsDirty(true);
        },
        [setIsIngestingFullEventData, setIsDirty]
    );

    // ── Severity filter handlers ────────────────────────────────────────

    const isSeveritySelected = useCallback(
        (severity: Severity): boolean => selectedSeverities.some((s) => s.value === severity.value),
        [selectedSeverities]
    );

    const handleSeverityToggle = useCallback(
        (severity: Severity): void => {
            if (isSeveritySelected(severity)) {
                setSelectedSeverities(selectedSeverities.filter((s) => s.value !== severity.value));
            } else {
                setSelectedSeverities([...selectedSeverities, severity]);
            }
        },
        [selectedSeverities, isSeveritySelected, setSelectedSeverities]
    );

    const handleSeverityToggleWithDirty = useCallback(
        (severity: Severity): void => {
            handleSeverityToggle(severity);
            setIsDirty(true);
        },
        [handleSeverityToggle, setIsDirty]
    );

    // ── Source type / category handlers ────────────────────────────────

    const isSourceTypeSelected = useCallback(
        (sourceType: SourceType): boolean => selectedSourceTypes.some((s) => s.value === sourceType.value),
        [selectedSourceTypes]
    );

    const isCategoryFullySelected = useCallback(
        (category: SourceTypeCategory): boolean => {
            if (category.types.length === 0) {
                return isSourceTypeSelected({ label: category.label, value: category.value });
            }
            return category.types.every((t) => isSourceTypeSelected(t));
        },
        [isSourceTypeSelected]
    );

    const handleSourceTypeToggle = useCallback(
        (sourceType: SourceType): void => {
            if (isSourceTypeSelected(sourceType)) {
                setSelectedSourceTypes(selectedSourceTypes.filter((s) => s.value !== sourceType.value));
            } else {
                setSelectedSourceTypes([...selectedSourceTypes, sourceType]);
            }
            setIsDirty(true);
        },
        [selectedSourceTypes, isSourceTypeSelected, setSelectedSourceTypes, setIsDirty]
    );

    const handleCategoryToggle = useCallback(
        (category: SourceTypeCategory): void => {
            if (category.types.length === 0) {
                handleSourceTypeToggle({ label: category.label, value: category.value });
                return;
            }
            if (isCategoryFullySelected(category)) {
                setSelectedSourceTypes(
                    selectedSourceTypes.filter((s) => !category.types.some((t) => t.value === s.value))
                );
            } else {
                const allTypes = [...selectedSourceTypes];
                category.types.forEach((t) => {
                    if (!selectedSourceTypes.some((s) => s.value === t.value)) {
                        allTypes.push(t);
                    }
                });
                setSelectedSourceTypes(allTypes);
            }
            setIsDirty(true);
        },
        [selectedSourceTypes, isCategoryFullySelected, handleSourceTypeToggle, setSelectedSourceTypes, setIsDirty]
    );

    // ── Proxy handlers ─────────────────────────────────────────────────

    const handleProxyEnabledChange = useCallback(
        (_e: unknown, { selected }: { selected: boolean }) => {
            const newValue = !selected;
            proxyEnabledRef.current = newValue;
            setProxyEnabled(newValue);
            setIsDirty(true);
        },
        [proxyEnabledRef, setProxyEnabled, setIsDirty]
    );

    const handleProxyTypeChange = useCallback(
        (_e: unknown, { value }: { value: string | number | boolean }) => { setProxyType(String(value)); setIsDirty(true); },
        [setProxyType, setIsDirty]
    );

    const handleProxyHostChange = useCallback(
        (_e: unknown, { value }: { value: string }) => { setProxyHost(value); setIsDirty(true); },
        [setProxyHost, setIsDirty]
    );

    const handleProxyPortChange = useCallback(
        (_e: unknown, { value }: { value: string }) => { setProxyPort(value); setIsDirty(true); },
        [setProxyPort, setIsDirty]
    );

    const handleProxyUsernameChange = useCallback(
        (_e: unknown, { value }: { value: string }) => { setProxyUsername(value); setIsDirty(true); },
        [setProxyUsername, setIsDirty]
    );

    const handleProxyPasswordChange = useCallback(
        (_e: unknown, { value }: { value: string }) => { setProxyPassword(value); setIsDirty(true); },
        [setProxyPassword, setIsDirty]
    );

    const handleSslVerifyChange = useCallback(
        (_e: unknown, { selected }: { selected: boolean }) => { setSslVerify(!selected); setIsDirty(true); },
        [setSslVerify, setIsDirty]
    );

    return {
        // Basic
        handleApiKeyChange,
        handleTenantChange,
        handleLogLevelChange,
        handleIngestionIntervalChange,
        handleIndexChange,
        handleBackfillChange,
        handleIngestFullEventToggle,
        // Severity
        isSeveritySelected,
        handleSeverityToggle,
        handleSeverityToggleWithDirty,
        // Source types
        isSourceTypeSelected,
        isCategoryFullySelected,
        handleSourceTypeToggle,
        handleCategoryToggle,
        // Proxy
        handleProxyEnabledChange,
        handleProxyTypeChange,
        handleProxyHostChange,
        handleProxyPortChange,
        handleProxyUsernameChange,
        handleProxyPasswordChange,
        handleSslVerifyChange,
    };
}
