import React, { FC, useEffect, useState } from 'react';
import {
    ConfigurationStep,
    Severity,
    SourceType,
    SourceTypeCategory,
    Tenant,
} from '../models/flare';
import Button from './Button';
import Label from './Label';
import Select from './Select';

import { APP_NAME } from '../models/constants';
import {
    convertSeverityFilterToArray,
    fetchAvailableIndexNames,
    fetchCurrentIndexName,
    fetchSeverityFilters,
    fetchSourceTypeFilters,
    fetchIngestFullEventData,
    fetchSeveritiesFilter,
    fetchUserTenants,
    fetchSourceTypesFilter,
    getSeverityFilterValue,
    getSourceTypesFilterValue,
    saveConfiguration,
    convertSourceTypeFilterToArray,
    fetchTenantIds,
    fetchNumberOfDaysToBackfill,
} from '../utils/setupConfiguration';
import './ConfigurationGlobalStep.css';
import './ConfigurationUserPreferencesStep.css';
import SeverityOptions from './SeverityOptions';
import SourceTypeCategoryOptions from './SourceTypeCategoryOptions';
import Switch from './Switch';
import { ToastKeys, toastManager } from './ToastManager';
import Tooltip from './Tooltip';
import FlareLogoLoading from './FlareLogoLoading';
import TenantSelection from './TenantSelection';
import Input from './Input';

const ConfigurationUserPreferencesStep: FC<{
    configurationStep: ConfigurationStep;
    apiKey: string;
    onNavigateBackClick: () => void;
    onUserPreferencesSaved: () => void;
}> = ({ configurationStep, apiKey, onNavigateBackClick, onUserPreferencesSaved }) => {
    const [isInitializingData, setIsInitializingData] = useState(true);
    const [selectedTenantIds, setSelectedTenantIds] = useState<Set<number>>(new Set());
    const [tenants, setUserTenants] = useState<Tenant[]>([]);
    const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
    const [severities, setSeverities] = useState<Severity[]>([]);
    const [sourceTypeCategories, setSourceTypeCategories] = useState<SourceTypeCategory[]>([]);
    const [selectedSourceTypes, setSelectedSourceTypes] = useState<SourceType[]>([]);
    const [indexName, setIndexName] = useState('');
    const [indexNames, setIndexNames] = useState<string[]>([]);
    const [isIngestingFullEventData, setIsIngestingFullEventData] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [numberOfDaysToBackfill, setNumberOfDaysToBackfill] = useState<string>();
    const [isFirstSetup, setIsFirstSetup] = useState(false);

    const handleIndexNameChange = (e): void => setIndexName(e.target.value);
    const handleIsIngestingFullEventDataChange = (e): void =>
        setIsIngestingFullEventData(e.target.checked);

    const handleSubmitUserPreferences = (): void => {
        setIsLoading(true);

        saveConfiguration(
            apiKey,
            Array.from(selectedTenantIds),
            indexName,
            isIngestingFullEventData,
            getSeverityFilterValue(selectedSeverities, severities),
            getSourceTypesFilterValue(selectedSourceTypes, sourceTypeCategories),
            numberOfDaysToBackfill
        )
            .then(() => {
                setIsLoading(false);
                toastManager.destroy(ToastKeys.ERROR);
                toastManager.show({
                    id: ToastKeys.SUCCESS,
                    content: 'Configured Flare Account',
                });
                onUserPreferencesSaved();
            })
            .catch((e: any) => {
                setIsLoading(false);
                toastManager.show({
                    id: ToastKeys.ERROR,
                    isError: true,
                    content: `Something went wrong. ${e.responseText}`,
                });
            });
    };

    useEffect(() => {
        if (configurationStep === ConfigurationStep.UserPreferences) {
            Promise.all([
                fetchTenantIds(),
                fetchIngestFullEventData(),
                fetchCurrentIndexName(),
                fetchUserTenants(apiKey),
                fetchAvailableIndexNames(),
                fetchSeverityFilters(apiKey),
                fetchSeveritiesFilter(),
                fetchSourceTypeFilters(apiKey),
                fetchSourceTypesFilter(),
                fetchNumberOfDaysToBackfill(),
            ])
                .then(
                    ([
                        tenantIds,
                        ingestFullEventData,
                        index,
                        userTenants,
                        availableIndexNames,
                        allSeverities,
                        severitiesFilter,
                        allSourceTypeCategories,
                        sourceTypeFilter,
                        numberOfDaysToBackfillSaved,
                    ]) => {
                        // The form can't be submitted without any tenant ids
                        // so the absence of tenant ids indicates that it is the first setup.
                        if (!tenantIds.length) {
                            setIsFirstSetup(true);
                        }
                        setNumberOfDaysToBackfill(numberOfDaysToBackfillSaved ?? '');
                        setSelectedTenantIds(new Set(tenantIds));
                        setIsIngestingFullEventData(ingestFullEventData);
                        setIndexName(index);
                        setUserTenants(userTenants);
                        setIndexNames(availableIndexNames);
                        setSeverities(allSeverities);
                        setSelectedSeverities(
                            convertSeverityFilterToArray(severitiesFilter, allSeverities)
                        );
                        setSourceTypeCategories(allSourceTypeCategories);
                        setSelectedSourceTypes(
                            convertSourceTypeFilterToArray(
                                sourceTypeFilter,
                                allSourceTypeCategories
                            )
                        );
                        setIsInitializingData(false);
                    }
                )
                .catch(() => {
                    toastManager.show({
                        id: ToastKeys.ERROR,
                        isError: true,
                        content: 'Something went wrong.',
                    });
                });
        } else {
            setSelectedTenantIds(new Set([]));
            setIndexName(APP_NAME);
            setIndexNames([]);
            setUserTenants([]);
            setIsLoading(false);
            setSeverities([]);
            setSelectedSeverities([]);
            setSourceTypeCategories([]);
            setSelectedSourceTypes([]);
            setIsInitializingData(true);
        }
    }, [configurationStep, apiKey]);

    const isFormValid = (): boolean => {
        return (
            selectedTenantIds.size > 0 &&
            selectedSeverities.length > 0 &&
            selectedSourceTypes.length > 0
        );
    };

    if (configurationStep !== ConfigurationStep.UserPreferences) {
        return null;
    }

    if (isInitializingData) {
        return <FlareLogoLoading />;
    }

    return (
        <div>
            <h5>Please select the Tenant you want to ingest events from</h5>
            <div className="form-group">
                <div className="form-item">
                    <Label>Tenants</Label>
                    <TenantSelection
                        tenants={tenants}
                        isChecked={selectedTenantIds.size === tenants.length}
                        selectedTenantIds={selectedTenantIds}
                        onTenantCheckChange={(tenant: Tenant, isChecked: boolean): void => {
                            if (isChecked) {
                                selectedTenantIds.add(tenant.id);
                            } else {
                                selectedTenantIds.delete(tenant.id);
                            }
                            setSelectedTenantIds(new Set([...selectedTenantIds]));
                        }}
                    />
                </div>
                <div className="form-item">
                    <Label>Splunk Index for event ingestion</Label>
                    <Select id="indexes" onChange={handleIndexNameChange} value={indexName}>
                        {indexNames.map((name) => {
                            return (
                                <option key={indexNames.indexOf(name)} value={name}>
                                    {name}
                                </option>
                            );
                        })}
                    </Select>
                </div>
                <div className="form-item">
                    <div className="label-tooltip">
                        <Label>Severity filter</Label>
                        <Tooltip>
                            <div>
                                Select the minimal alert severity to ignore less critical events
                                associated with this identifier.
                                <br />
                                <br />
                                {'To learn more about severities see '}
                                <a
                                    target="_blank"
                                    href="https://docs.flare.io/understand-event-severity"
                                >
                                    Understand Severity Scoring.
                                </a>
                            </div>
                        </Tooltip>
                    </div>
                    <SeverityOptions
                        setSelectedSeverities={setSelectedSeverities}
                        severities={severities}
                        selectedSeverities={selectedSeverities}
                    />
                </div>
                <div className="form-item">
                    <div className="label-tooltip">
                        <Label>Categories filter</Label>
                        <Tooltip>
                            <div>
                                {'For more details on Identifier Categories, please visit our '}
                                <a
                                    target="_blank"
                                    href="https://docs.flare.io/configure-identifiers"
                                >
                                    Documentation.
                                </a>
                            </div>
                        </Tooltip>
                    </div>
                    <SourceTypeCategoryOptions
                        setSelectedSourceTypes={setSelectedSourceTypes}
                        sourceTypeCategories={sourceTypeCategories}
                        selectedSourceTypes={selectedSourceTypes}
                    />
                </div>
                <div className="form-item">
                    <div className="label-tooltip">
                        <Label>Full event data ingestion</Label>
                        <Tooltip>
                            <div>
                                Select this option if you want to ingest the full data of the events
                                instead of the metadata of them.
                            </div>
                        </Tooltip>
                    </div>
                    <span className="switch-container">
                        <Switch
                            value={isIngestingFullEventData}
                            onChange={handleIsIngestingFullEventDataChange}
                        />
                    </span>
                </div>
                <div className="form-item">
                    <div className="label-tooltip">
                        <Label>Number of days to backfill events</Label>
                        <Tooltip>
                            <div>
                                This field can only be set when setting up the app for the first
                                time.
                            </div>
                        </Tooltip>
                    </div>
                    <Input
                        onChange={(e): void => setNumberOfDaysToBackfill(e.target.value)}
                        value={numberOfDaysToBackfill}
                        min="0"
                        type="number"
                        placeholder="30"
                        disabled={!isFirstSetup}
                    />
                </div>
                <div className="button-group">
                    <Button onClick={(): void => onNavigateBackClick()} isSecondary>
                        Back
                    </Button>
                    <Button
                        onClick={(): void => handleSubmitUserPreferences()}
                        isDisabled={!isFormValid()}
                        isLoading={isLoading}
                    >
                        Submit
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationUserPreferencesStep;
