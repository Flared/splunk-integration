import React from 'react';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Multiselect from '@splunk/react-ui/Multiselect';
import { Tenant } from '../models/flare';

interface TenantSelectProps {
    tenants: Tenant[];
    selectedTenantIds: number[];
    isApiKeyValidated: boolean;
    isValidatingApiKey: boolean;
    isSaving: boolean;
    onChange: (_e: unknown, { values }: { values: Array<string | number | boolean> }) => void;
}

/**
 * Flare Tenants multi-select with inline error when no tenant is selected.
 */
export function TenantSelect({
    tenants,
    selectedTenantIds,
    isApiKeyValidated,
    isValidatingApiKey,
    isSaving,
    onChange,
}: TenantSelectProps) {
    const hasError = !isValidatingApiKey && isApiKeyValidated && selectedTenantIds.length === 0;

    return (
        <ControlGroup
            label="Flare Tenants"
            required
            labelPosition="top"
            error={hasError}
            help="Select the tenants whose feeds you would like to ingest."
        >
            <div>
                <Multiselect
                    values={selectedTenantIds.map(String)}
                    onChange={onChange}
                    disabled={!isApiKeyValidated || tenants.length === 0 || isSaving}
                    placeholder="Select tenants..."
                >
                    {tenants.map((tenant) => (
                        <Multiselect.Option
                            key={tenant.id}
                            label={tenant.name}
                            value={String(tenant.id)}
                        />
                    ))}
                </Multiselect>
                {hasError && (
                    <div style={{ color: '#d93f3c', marginTop: '8px', fontSize: '12px' }}>
                        At least one tenant must be selected.
                    </div>
                )}
            </div>
        </ControlGroup>
    );
}
