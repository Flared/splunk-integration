import React, { ChangeEvent, FC } from 'react';
import Label from './Label';
import Button from './Button';
import { Tenant } from '../models/flare';
import Select from './Select';

import './ConfigurationGlobalStep.css';
import './ConfigurationUserPreferencesStep.css';
import Switch from './Switch';

const ConfigurationUserPreferencesStep: FC<{
    show: boolean;
    tenants: Tenant[];
    selectedTenantId: number;
    indexNames: string[];
    selectedIndexName: string;
    isLoading: boolean;
    isIngestingMetadataOnly: boolean;
    onNavigateBackClick: () => void;
    onSubmitUserPreferencesClick: () => void;
    onTenantIdChange: (e: ChangeEvent) => void;
    onIndexNameChange: (e: ChangeEvent) => void;
    onIngestingMetadataChange: (e: ChangeEvent) => void;
}> = ({
    show,
    tenants,
    selectedTenantId,
    indexNames,
    selectedIndexName,
    isLoading,
    isIngestingMetadataOnly,
    onNavigateBackClick,
    onSubmitUserPreferencesClick,
    onTenantIdChange,
    onIndexNameChange,
    onIngestingMetadataChange,
}) => {
    return (
        <div hidden={!show}>
            <h5>Please select the Tenant you want to ingest events from</h5>
            <div className="form-group">
                <div className="form-item">
                    <Label>Tenant</Label>
                    <Select id="tenants" onChange={onTenantIdChange} value={selectedTenantId}>
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
                    <Select id="indexes" onChange={onIndexNameChange} value={selectedIndexName}>
                        {indexNames.map((indexName) => {
                            return (
                                <option key={indexNames.indexOf(indexName)} value={indexName}>
                                    {indexName}
                                </option>
                            );
                        })}
                    </Select>
                </div>
                <div className="form-item">
                    <div className="switch-layout">
                        <span>Only ingest the metadata of events</span>
                        <Switch
                            value={isIngestingMetadataOnly}
                            onChange={onIngestingMetadataChange}
                        />
                    </div>
                </div>
                <div className="button-group">
                    <Button onClick={(): void => onNavigateBackClick()} isSecondary>
                        Back
                    </Button>
                    <Button
                        onClick={(): void => onSubmitUserPreferencesClick()}
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
