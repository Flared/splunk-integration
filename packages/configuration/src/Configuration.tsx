import React, { useCallback, useEffect, useState, useRef } from 'react';

import Button from '@splunk/react-ui/Button';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Heading from '@splunk/react-ui/Heading';
import Message from '@splunk/react-ui/Message';
import Select from '@splunk/react-ui/Select';
import Switch from '@splunk/react-ui/Switch';
import Text from '@splunk/react-ui/Text';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import { SplunkThemeProvider } from '@splunk/themes';

import { Severity, SourceType, SourceTypeCategory, Tenant } from './models/flare';
import { LOG_LEVEL_OPTIONS } from './models/constants';
import {
    fetchApiKey, fetchIngestionInterval, fetchLogLevel, fetchTenantIds,
    saveConfiguration, fetchAvailableIndexNames, fetchCurrentIndexName,
    fetchIngestFullEventData, fetchNumberOfDaysToBackfill,
    fetchSeveritiesFilter, fetchSourceTypesFilter,
    createFlareIndex, getSeverityFilterValue, getSourceTypesFilterValue,
    fetchProxyEnabled, fetchProxyHost, fetchProxyPort, fetchProxyType,
    fetchProxyUsername, fetchProxyPassword, fetchSslVerify, disableIngestion,
} from './utils/setupConfiguration';

import { useMessages } from './hooks/useMessages';
import { useApiKeyValidation } from './hooks/useApiKeyValidation';
import { useFormHandlers } from './hooks/useFormHandlers';
import {
    validateInterval, validateBackfill, isProxyHostMissing,
    isProxyPortInvalid, isProxyValid, isFormValid as checkFormValid,
} from './validation/formValidation';
import { ApiKeyField } from './components/ApiKeyField';
import { TenantSelect } from './components/TenantSelect';
import { SeverityFilter } from './components/SeverityFilter';
import { CategoriesFilter } from './components/CategoriesFilter';
import { ProxySettings } from './components/ProxySettings';
import { SaveConfirmModal } from './components/SaveConfirmModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';

const Configuration = () => {
    // ── UI status state ───────────────────────────────────────────────
    const [isInitializing, setIsInitializing] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [showMacroWarningModal, setShowMacroWarningModal] = useState(false);
    const saveBtnRef = useRef<any>(null);
    const resetBtnRef = useRef<any>(null);
    const prevApiKeyRef = useRef<string | null>(null);
    const proxyEnabledRef = useRef(false);
    const savedSeveritiesFilterRef = useRef<string[] | undefined>(undefined);
    const savedSourceTypesFilterRef = useRef<string[] | undefined>(undefined);

    // ── Form field state ──────────────────────────────────────────────
    const [apiKey, setApiKey] = useState('');
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenantIds, setSelectedTenantIds] = useState<number[]>([]);
    const [logLevel, setLogLevel] = useState('INFO');
    const [ingestionInterval, setIngestionInterval] = useState('1440');
    const [indexName, setIndexName] = useState('');
    const [initialIndexName, setInitialIndexName] = useState('');
    const [indexNames, setIndexNames] = useState<string[]>([]);
    const [isIngestingFullEventData, setIsIngestingFullEventData] = useState(false);
    const [numberOfDaysToBackfill, setNumberOfDaysToBackfill] = useState('5');
    const [isFirstSetup, setIsFirstSetup] = useState(false);

    // ── Proxy state ───────────────────────────────────────────────────
    const [proxyEnabled, setProxyEnabled] = useState(false);
    const [proxyType, setProxyType] = useState('http');
    const [proxyHost, setProxyHost] = useState('');
    const [proxyPort, setProxyPort] = useState('');
    const [proxyUsername, setProxyUsername] = useState('');
    const [proxyPassword, setProxyPassword] = useState('');
    const [sslVerify, setSslVerify] = useState(true);

    // ── Filter state ──────────────────────────────────────────────────
    const [severities, setSeverities] = useState<Severity[]>([]);
    const [sourceTypeCategories, setSourceTypeCategories] = useState<SourceTypeCategory[]>([]);
    const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
    const [selectedSourceTypes, setSelectedSourceTypes] = useState<SourceType[]>([]);

    // ── Hooks ─────────────────────────────────────────────────────────
    const { successMessage, setSuccessMessage, errorMessage, setErrorMessage, showSuccess, showError, clearMessages } = useMessages();

    const {
        isValidatingApiKey, isApiKeyValidated, setIsApiKeyValidated,
        apiKeyError, setApiKeyError, validateApiKeyOnly, loadApiKeyDependentData,
    } = useApiKeyValidation(
        prevApiKeyRef,
        proxyEnabledRef,
        clearMessages,
        showError,
        { setTenants, setSeverities, setSourceTypeCategories, setSelectedSeverities, setSelectedSourceTypes, setSelectedTenantIds }
    );

    const handlers = useFormHandlers(
        proxyEnabledRef,
        selectedSeverities,
        selectedSourceTypes,
        {
            setApiKey, setApiKeyError, setSelectedTenantIds, setLogLevel,
            setIngestionInterval, setIndexName, setNumberOfDaysToBackfill,
            setIsIngestingFullEventData, setSelectedSeverities, setSelectedSourceTypes,
            setSourceTypeCategories, setProxyEnabled, setProxyType, setProxyHost,
            setProxyPort, setProxyUsername, setProxyPassword, setSslVerify,
            setIsDirty, clearMessages,
        }
    );

    // ── Derived validation ────────────────────────────────────────────
    const isIntervalValid = validateInterval(ingestionInterval);
    const isBackfillValid = validateBackfill(numberOfDaysToBackfill);
    const proxyValid = isProxyValid(proxyEnabled, proxyHost, proxyPort);
    const formValid = checkFormValid({
        apiKey, isApiKeyValidated,
        selectedTenantIds, selectedSeveritiesCount: selectedSeverities.length,
        selectedSourceTypesCount: selectedSourceTypes.length,
        interval: ingestionInterval, backfill: numberOfDaysToBackfill,
        proxyEnabled, proxyHost, proxyPort,
    });

    // ── Initialization: load saved configuration ──────────────────────
    useEffect(() => {
        Promise.all([
            fetchApiKey(), createFlareIndex(), fetchAvailableIndexNames(),
            fetchCurrentIndexName(), fetchTenantIds(), fetchIngestFullEventData(),
            fetchNumberOfDaysToBackfill(), fetchIngestionInterval(), fetchLogLevel(),
            fetchSeveritiesFilter(), fetchSourceTypesFilter(),
            fetchProxyEnabled(), fetchProxyType(), fetchProxyHost(), fetchProxyPort(),
            fetchProxyUsername(), fetchProxyPassword(), fetchSslVerify(),
        ])
            .then(([
                savedApiKey, , availableIndexNames, currentIndex, savedTenantIds,
                ingestFullEvent, backfillDays, interval, savedLogLevel,
                savedSeveritiesFilter, savedSourceTypesFilter,
                savedProxyEnabled, savedProxyType, savedProxyHost, savedProxyPort,
                savedProxyUsername, savedProxyPassword, savedSslVerify,
            ]) => {
                setIsSaveModalOpen(false);
                setIsResetModalOpen(false);
                setSuccessMessage('');
                setErrorMessage('');

                setApiKey(savedApiKey);
                prevApiKeyRef.current = savedApiKey;
                setIndexNames(availableIndexNames);
                setIndexName(currentIndex || 'flare');
                setInitialIndexName(currentIndex || 'flare');
                setSelectedTenantIds(savedTenantIds);
                setIsIngestingFullEventData(ingestFullEvent);
                setNumberOfDaysToBackfill(backfillDays || '5');
                setIngestionInterval(interval ? String(Math.max(1, Math.floor(parseInt(interval, 10) / 60))) : '1440');
                setLogLevel(savedLogLevel);
                setProxyEnabled(savedProxyEnabled);
                proxyEnabledRef.current = savedProxyEnabled;
                setProxyType(savedProxyType);
                setProxyHost(savedProxyHost);
                setProxyPort(savedProxyPort);
                setProxyUsername(savedProxyUsername);
                setProxyPassword(savedProxyPassword);
                setSslVerify(savedSslVerify);

                savedSeveritiesFilterRef.current = savedSeveritiesFilter;
                savedSourceTypesFilterRef.current = savedSourceTypesFilter;

                if (!savedTenantIds.length) setIsFirstSetup(true);

                if (savedApiKey && savedApiKey.length > 0) {
                    const proxyConfig = {
                        proxyEnabled: savedProxyEnabled, proxyType: savedProxyType,
                        proxyHost: savedProxyHost, proxyPort: savedProxyPort,
                        proxyUsername: savedProxyUsername, proxyPassword: savedProxyPassword,
                    };
                    loadApiKeyDependentData(savedApiKey, savedSeveritiesFilter, savedSourceTypesFilter, proxyConfig);
                }

                setIsInitializing(false);
            })
            .catch(() => {
                setIsInitializing(false);
                showError('Failed to load configuration. Please refresh the page.');
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Debounced API key auto-validation ─────────────────────────────
    useEffect(() => {
        if (isInitializing) return;
        if (!apiKey || apiKey.length === 0) {
            setIsApiKeyValidated(false);
            setTenants([]);
            setSelectedTenantIds([]);
            setApiKeyError('');
            prevApiKeyRef.current = apiKey;
            return;
        }

        const timerId = setTimeout(() => {
            const isNewApiKey = apiKey !== prevApiKeyRef.current;
            prevApiKeyRef.current = apiKey;

            const currentProxyConfig = { proxyEnabled, proxyType, proxyHost, proxyPort, proxyUsername, proxyPassword };

            const parsedPort = parseInt(proxyPort, 10);
            const proxyIsInvalid = proxyEnabled && (proxyHost.trim() === '' || isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535);
            if (proxyIsInvalid) return;

            validateApiKeyOnly(apiKey, currentProxyConfig).then((isValid) => {
                if (isValid && (isNewApiKey || tenants.length === 0)) {
                    loadApiKeyDependentData(
                        apiKey,
                        isNewApiKey ? undefined : savedSeveritiesFilterRef.current,
                        isNewApiKey ? undefined : savedSourceTypesFilterRef.current,
                        currentProxyConfig
                    );
                }
            });
        }, 800);

        return () => clearTimeout(timerId);
    }, [
        apiKey, validateApiKeyOnly, loadApiKeyDependentData, isInitializing,
        proxyEnabled, proxyType, proxyHost, proxyPort, proxyUsername, proxyPassword,
    ]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Save handler ──────────────────────────────────────────────────
    const handleSave = useCallback((): void => {
        clearMessages();
        setIsSaving(true);

        const proceedWithSave = () => {
            if (!isApiKeyValidated || !proxyValid || selectedTenantIds.length === 0 ||
                selectedSeverities.length === 0 || selectedSourceTypes.length === 0 ||
                !isIntervalValid || !isBackfillValid) {
                setIsSaving(false);
                return;
            }
            const hasIndexChanged = indexName !== initialIndexName;
            const tenantNamesMap: Record<string, string> = {};
            tenants.forEach((t) => { if (selectedTenantIds.includes(t.id)) tenantNamesMap[String(t.id)] = t.name; });

            saveConfiguration(
                apiKey, selectedTenantIds, tenantNamesMap, indexName,
                isIngestingFullEventData,
                getSeverityFilterValue(selectedSeverities, severities),
                getSourceTypesFilterValue(selectedSourceTypes, sourceTypeCategories),
                ingestionInterval ? String(parseInt(ingestionInterval, 10) * 60) : '60',
                numberOfDaysToBackfill, logLevel,
                proxyEnabled, proxyHost, proxyPort, proxyType,
                proxyUsername, proxyPassword, sslVerify
            )
                .then(() => {
                    setIsSaving(false);
                    setIsDirty(false);
                    setShowMacroWarningModal(hasIndexChanged);
                    if (hasIndexChanged) setInitialIndexName(indexName);
                    setIsSaveModalOpen(true);
                })
                .catch((e: any) => {
                    setIsSaving(false);
                    showError(`Failed to save configuration. ${e?.responseText || ''}`);
                });
        };

        if (proxyEnabled) {
            const proxyConfig = { proxyEnabled, proxyType, proxyHost, proxyPort, proxyUsername, proxyPassword };
            validateApiKeyOnly(apiKey, proxyConfig).then((isValid) => {
                if (isValid) proceedWithSave();
                else setIsSaving(false);
            });
        } else {
            proceedWithSave();
        }
    }, [
        apiKey, selectedTenantIds, tenants, indexName, initialIndexName, isIngestingFullEventData,
        selectedSeverities, severities, selectedSourceTypes, sourceTypeCategories,
        ingestionInterval, numberOfDaysToBackfill, logLevel,
        proxyEnabled, proxyHost, proxyPort, proxyType, proxyUsername, proxyPassword, sslVerify,
        isApiKeyValidated, proxyValid, isIntervalValid, isBackfillValid,
        clearMessages, showError, validateApiKeyOnly,
    ]);

    // ── Remove configuration handler ──────────────────────────────────
    const handleRemoveConfiguration = useCallback((): void => {
        setIsRemoving(true);
        clearMessages();

        saveConfiguration('', [], {}, indexName, false, '', '', '60', '', 'INFO', false, '', '', 'http', '', '', true)
            .then(() => disableIngestion())
            .then(() => {
                setApiKey(''); setSelectedTenantIds([]); setTenants([]); setLogLevel('INFO');
                setIngestionInterval(''); setNumberOfDaysToBackfill(''); setIsIngestingFullEventData(false);
                setIsApiKeyValidated(false); setSelectedSeverities([]); setSelectedSourceTypes([]);
                setSeverities([]); setSourceTypeCategories([]); setApiKeyError('');
                setProxyEnabled(false); setProxyType('http'); setProxyHost(''); setProxyPort('');
                setProxyUsername(''); setProxyPassword('');
                setIsRemoving(false); setIsResetModalOpen(false); setIsDirty(false);
                showSuccess('Configuration removed successfully. Data ingestion has been stopped.');
            })
            .catch((e: any) => {
                setIsRemoving(false);
                setIsResetModalOpen(false);
                showError(`Failed to remove configuration. ${e?.responseText || ''}`);
            });
    }, [indexName, clearMessages, showSuccess, showError, setIsApiKeyValidated, setApiKeyError]);

    // ── Loading screen ────────────────────────────────────────────────
    if (isInitializing) {
        return (
            <SplunkThemeProvider family="enterprise" colorScheme="light" density="comfortable">
                <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                    <WaitSpinner size="large" />
                </div>
            </SplunkThemeProvider>
        );
    }

    // ── Render ────────────────────────────────────────────────────────
    return (
        <SplunkThemeProvider family="enterprise" colorScheme="light" density="comfortable">
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>

                <div style={{ position: 'relative', marginBottom: 24 }}>
                    <Heading level={2} style={{ margin: 0 }}>Configure Flare Account</Heading>
                    {/* Scoped style: keeps the link identical across :link/:visited/:active states */}
                    <style>{`
                        #flare-learn-more-link,
                        #flare-learn-more-link:link,
                        #flare-learn-more-link:visited,
                        #flare-learn-more-link:active {
                            color: #0073e6;
                            text-decoration: none;
                        }
                        #flare-learn-more-link:hover {
                            text-decoration: underline;
                        }
                    `}</style>
                    <a
                        id="flare-learn-more-link"
                        href="https://docs.flare.io/splunk-app"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: '0.9em' }}
                    >
                        Learn More
                    </a>
                </div>

                {/* Index for Ingestion */}
                <ControlGroup
                    label="Index for Ingestion"
                    labelPosition="top"
                    help="Select the Splunk index where Flare data will be ingested."
                    tooltip="When you change this index, you must also manually update the 'flare_index' Macro in Splunk Settings so dashboards work properly!"
                >
                    <Select value={indexName} onChange={handlers.handleIndexChange} disabled={!isApiKeyValidated || isSaving}>
                        {indexNames.map((name) => (
                            <Select.Option key={name} label={name} value={name} />
                        ))}
                    </Select>
                </ControlGroup>

                {/* API Key */}
                <ApiKeyField
                    apiKey={apiKey}
                    apiKeyError={apiKeyError}
                    isValidatingApiKey={isValidatingApiKey}
                    onChange={handlers.handleApiKeyChange}
                />

                {/* Tenants */}
                <TenantSelect
                    tenants={tenants}
                    selectedTenantIds={selectedTenantIds}
                    isApiKeyValidated={isApiKeyValidated}
                    isValidatingApiKey={isValidatingApiKey}
                    isSaving={isSaving}
                    onChange={handlers.handleTenantChange}
                />

                {/* Remaining fields — disabled until API key is validated */}
                <div style={{
                    opacity: (isApiKeyValidated && !isSaving) ? 1 : 0.6,
                    pointerEvents: (isApiKeyValidated && !isSaving) ? 'auto' : 'none',
                    marginTop: 32,
                }}>
                    {/* Severity & Categories */}
                    <SeverityFilter
                        severities={severities}
                        selectedSeverities={selectedSeverities}
                        isApiKeyValidated={isApiKeyValidated}
                        isValidatingApiKey={isValidatingApiKey}
                        isSaving={isSaving}
                        isSeveritySelected={handlers.isSeveritySelected}
                        onToggle={handlers.handleSeverityToggleWithDirty}
                    />

                    <CategoriesFilter
                        sourceTypeCategories={sourceTypeCategories}
                        selectedSourceTypes={selectedSourceTypes}
                        isValidatingApiKey={isValidatingApiKey}
                        isCategoryFullySelected={handlers.isCategoryFullySelected}
                        isSourceTypeSelected={handlers.isSourceTypeSelected}
                        onCategoryToggle={handlers.handleCategoryToggle}
                        onSourceTypeToggle={handlers.handleSourceTypeToggle}
                    />

                    {/* Initial Backfill Range */}
                    <ControlGroup
                        style={{ marginTop: 24 }}
                        label="Initial Backfill Range (Days)"
                        required
                        error={!isBackfillValid}
                        labelPosition="top"
                        help="Number of days to backfill events (maximum 180 days)."
                    >
                        <div>
                            <Text
                                type="number"
                                value={numberOfDaysToBackfill}
                                onChange={handlers.handleBackfillChange}
                                placeholder="30"
                                error={!isBackfillValid}
                            />
                            {!isBackfillValid && (
                                <div style={{ color: '#d93f3c', marginTop: '8px', fontSize: '12px' }}>
                                    Invalid backfill range. Must be between 0 and 180 days.
                                </div>
                            )}
                        </div>
                    </ControlGroup>

                    {/* Ingestion Interval */}
                    <ControlGroup
                        label="Ingestion Interval (Minutes)"
                        required
                        error={!isIntervalValid}
                        labelPosition="top"
                        help="Must be between 1 and 2880 minutes (2 days)."
                    >
                        <div>
                            <Text
                                type="number"
                                value={ingestionInterval}
                                onChange={handlers.handleIngestionIntervalChange}
                                placeholder="60"
                                error={!isIntervalValid}
                            />
                            {!isIntervalValid && (
                                <div style={{ color: '#d93f3c', marginTop: '8px', fontSize: '12px' }}>
                                    Invalid ingestion interval. Must be between 1 and 2880 minutes.
                                </div>
                            )}
                        </div>
                    </ControlGroup>

                    {/* Ingest Full Event Data */}
                    <ControlGroup label="Ingest Full Event Data" hideLabel labelPosition="top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Switch
                                selected={isIngestingFullEventData}
                                onClick={handlers.handleIngestFullEventToggle}
                                appearance="checkbox"
                            />
                            <span style={{ fontWeight: 500, color: '#141414', marginTop: 1 }}>Ingest Full Event Data</span>
                        </div>
                    </ControlGroup>

                    {/* Log Level */}
                    <ControlGroup label="Log Level" labelPosition="top" help="Application logging verbosity.">
                        <Select value={logLevel} onChange={handlers.handleLogLevelChange}>
                            {LOG_LEVEL_OPTIONS.map((opt) => (
                                <Select.Option key={opt.value} label={opt.label} value={opt.value} />
                            ))}
                        </Select>
                    </ControlGroup>
                </div>

                {/* Proxy Settings */}
                <ProxySettings
                    proxyEnabled={proxyEnabled}
                    proxyType={proxyType}
                    proxyHost={proxyHost}
                    proxyPort={proxyPort}
                    proxyUsername={proxyUsername}
                    proxyPassword={proxyPassword}
                    sslVerify={sslVerify}
                    onProxyEnabledChange={handlers.handleProxyEnabledChange}
                    onProxyTypeChange={handlers.handleProxyTypeChange}
                    onProxyHostChange={handlers.handleProxyHostChange}
                    onProxyPortChange={handlers.handleProxyPortChange}
                    onProxyUsernameChange={handlers.handleProxyUsernameChange}
                    onProxyPasswordChange={handlers.handleProxyPasswordChange}
                    onSslVerifyChange={handlers.handleSslVerifyChange}
                />

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 24, borderTop: '1px solid #ccc' }}>
                    <Button
                        ref={saveBtnRef}
                        label={isSaving ? 'Saving...' : 'Save Configuration'}
                        appearance="primary"
                        onClick={handleSave}
                        disabled={isSaving || !isDirty || !formValid}
                    />
                    <Button
                        ref={resetBtnRef}
                        label="Remove Configuration Values"
                        appearance="secondary"
                        onClick={() => setIsResetModalOpen(true)}
                        disabled={!apiKey || apiKey.trim() === '' || isSaving}
                    />
                </div>

                {/* Error message */}
                {errorMessage && (
                    <div style={{ marginTop: 12 }}>
                        <Message type="error" onRequestRemove={() => setErrorMessage('')}>
                            {errorMessage}
                        </Message>
                    </div>
                )}

                {/* Modals */}
                <SaveConfirmModal
                    open={isSaveModalOpen}
                    indexName={indexName}
                    showMacroWarning={showMacroWarningModal}
                    saveBtnRef={saveBtnRef}
                    onClose={() => setIsSaveModalOpen(false)}
                />
                <ResetConfirmModal
                    open={isResetModalOpen}
                    isRemoving={isRemoving}
                    resetBtnRef={resetBtnRef}
                    onCancel={() => setIsResetModalOpen(false)}
                    onConfirm={handleRemoveConfiguration}
                />

            </div>
        </SplunkThemeProvider>
    );
};

export default Configuration;
