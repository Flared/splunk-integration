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

import { appName, DEFAULT_FILTER_VALUE } from '../models/constants';
import {
    fetchAvailableIndexNames,
    fetchCurrentIndexName,
    fetchFiltersSeverities,
    fetchFiltersSourceTypes,
    fetchIngestMetadataOnly,
    fetchSeveritiesFilter,
    fetchSourceTypesFilter,
    fetchTenantId,
    fetchUserTenants,
    getSeverityFilterValue,
    getSourceTypesFilterValue,
    saveConfiguration,
} from '../utils/setupConfiguration';
import './ConfigurationGlobalStep.css';
import './ConfigurationUserPreferencesStep.css';
import SeverityOptions from './SeverityOptions';
import SourceTypeCategoryOptions from './SourceTypeCategoryOptions';
import Switch from './Switch';
import { ToastKeys, toastManager } from './ToastManager';
import Tooltip from './Tooltip';

const ConfigurationUserPreferencesStep: FC<{
    show: boolean;
    configurationStep: ConfigurationStep;
    apiKey: string;
    onNavigateBackClick: () => void;
    onUserPreferencesSaved: () => void;
}> = ({ show, configurationStep, apiKey, onNavigateBackClick, onUserPreferencesSaved }) => {
    const [tenantId, setTenantId] = useState<number | undefined>(undefined);
    const [tenants, setUserTenants] = useState<Tenant[]>([]);
    const [selectedSeverities, setSelectedSeverities] = useState<Severity[]>([]);
    const [severities, setSeverities] = useState<Severity[]>([]);
    const [sourceTypeCategories, setSourceTypeCategories] = useState<SourceTypeCategory[]>([]);
    const [selectedSourceTypes, setSelectedSourceTypes] = useState<SourceType[]>([]);
    const [indexName, setIndexName] = useState('');
    const [indexNames, setIndexNames] = useState<string[]>([]);
    const [isIngestingMetadataOnly, setIsIngestingMetadataOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleTenantIdChange = (e): void => setTenantId(parseInt(e.target.value, 10));
    const handleIndexNameChange = (e): void => setIndexName(e.target.value);
    const handleIsIngestingMetadataChange = (e): void =>
        setIsIngestingMetadataOnly(e.target.checked);

    const handleSubmitUserPreferences = (): void => {
        setIsLoading(true);

        saveConfiguration(
            apiKey,
            Number(tenantId),
            indexName,
            isIngestingMetadataOnly,
            getSeverityFilterValue(selectedSeverities, severities),
            getSourceTypesFilterValue(selectedSourceTypes, sourceTypeCategories)
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
                fetchTenantId(),
                fetchIngestMetadataOnly(),
                fetchCurrentIndexName(),
                fetchUserTenants(apiKey),
                fetchFiltersSeverities(apiKey),
                fetchFiltersSourceTypes(apiKey),
                fetchAvailableIndexNames(),
                fetchSeveritiesFilter(),
                fetchSourceTypesFilter(),
            ])
                .then(
                    ([
                        id,
                        ingestMetadataOnly,
                        index,
                        userTenants,
                        availableSeverities,
                        availableSourceTypeCategories,
                        availableIndexNames,
                        severitiesFilter,
                        sourceTypesFilter,
                    ]) => {
                        setTenantId(id);
                        setIsIngestingMetadataOnly(ingestMetadataOnly);
                        setIndexName(index);
                        if (id === -1 && userTenants.length > 0) {
                            setTenantId(userTenants[0].id);
                        }
                        setUserTenants(userTenants);
                        setSeverities(availableSeverities);
                        setSourceTypeCategories(availableSourceTypeCategories);
                        setIndexNames(availableIndexNames);

                        const currentSeverities: Severity[] = [];
                        severitiesFilter.forEach((severityValue) => {
                            if (severityValue === DEFAULT_FILTER_VALUE) {
                                currentSeverities.push(...availableSeverities);
                            } else {
                                const foundSeverityMatch = availableSeverities.find(
                                    (severity) => severity.value === severityValue
                                );
                                if (foundSeverityMatch) {
                                    currentSeverities.push(foundSeverityMatch);
                                }
                            }
                        });
                        setSelectedSeverities(currentSeverities);

                        const currentSourceTypes: SourceType[] = [];
                        sourceTypesFilter.forEach((sourceTypeValue) => {
                            if (sourceTypeValue === DEFAULT_FILTER_VALUE) {
                                currentSourceTypes.push(
                                    ...availableSourceTypeCategories.flatMap(
                                        (category) => category.types
                                    )
                                );
                            } else {
                                const foundSourceTypeCategoryMatch =
                                    availableSourceTypeCategories.find(
                                        (sourceTypeCategory) =>
                                            sourceTypeCategory.value === sourceTypeValue
                                    );
                                if (foundSourceTypeCategoryMatch) {
                                    currentSourceTypes.push(...foundSourceTypeCategoryMatch.types);
                                } else {
                                    const foundSourceTypeMatch = availableSourceTypeCategories
                                        .flatMap((category) => category.types)
                                        .find((sourceType) => sourceType.value === sourceTypeValue);
                                    if (foundSourceTypeMatch) {
                                        currentSourceTypes.push(foundSourceTypeMatch);
                                    }
                                }
                            }
                        });
                        setSelectedSourceTypes(currentSourceTypes);
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
            setTenantId(undefined);
            setIndexName(appName);
            setUserTenants([]);
            setSeverities([]);
            setSourceTypeCategories([]);
            setIsLoading(false);
        }
    }, [configurationStep, apiKey]);

    const isFormValid = (): boolean => {
        return selectedSeverities.length > 0 && selectedSourceTypes.length > 0;
    };

    return (
        <div hidden={!show}>
            <h5>Please select the Tenant you want to ingest events from</h5>
            <div className="form-group">
                <div className="form-item">
                    <Label>Tenant</Label>
                    <Select id="tenants" onChange={handleTenantIdChange} value={tenantId}>
                        {tenants.map((tenant) => {
                            return (
                                <option key={tenants.indexOf(tenant)} value={tenant.id}>
                                    {tenant.name}
                                </option>
                            );
                        })}
                    </Select>
                    <small className="note">You can only monitor one tenant at a time.</small>
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
                        <Label>Basic event ingestion</Label>
                        <Tooltip>
                            <div>
                                Select this option if you want to ingest only the metadata of the
                                events instead of the full data to it.
                            </div>
                        </Tooltip>
                    </div>
                    <span className="switch-container">
                        <Switch
                            value={isIngestingMetadataOnly}
                            onChange={handleIsIngestingMetadataChange}
                        />
                    </span>
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
