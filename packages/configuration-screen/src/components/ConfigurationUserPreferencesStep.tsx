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
    isLoading: boolean;
    isIngestingMetadataOnly: boolean;
    onNavigateBackClick: () => void;
    onSubmitUserPreferencesClick: () => void;
    onTenantIdChange: (e: ChangeEvent) => void;
    onIngestingMetadataChange: (e: ChangeEvent) => void;
}> = ({
    show,
    tenants,
    selectedTenantId,
    isLoading,
    isIngestingMetadataOnly,
    onNavigateBackClick,
    onSubmitUserPreferencesClick,
    onTenantIdChange,
    onIngestingMetadataChange,
}) => {
    return (
        <div hidden={!show}>
            <h5>Please select the Tenant you want to ingest events from</h5>
            <div className="form-group">
                <Label isRequired>Tenant</Label>
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
                <div className="switch-layout">
                    <span>Only ingest the metadata of events</span>
                    <Switch value={isIngestingMetadataOnly} onChange={onIngestingMetadataChange} />
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
