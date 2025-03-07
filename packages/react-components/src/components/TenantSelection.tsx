import React, { FC, useState } from 'react';

import { Tenant } from '../models/flare';
import './TenantSelection.css';

const TenantSelection: FC<{
    isChecked?: boolean;
    tenants: Tenant[];
    selectedTenantIds: Set<number>;
    onTenantCheckChange: (tenant: Tenant, isChecked: boolean) => void;
}> = ({ isChecked = false, tenants, selectedTenantIds, onTenantCheckChange }) => {
    const [isExpanded, setExpanded] = useState(true);

    const selectedTenantCount = selectedTenantIds.size;

    return (
        <div className="tenant-container" id="tenant-container">
            <div className="tenant-header">
                <label className="tenant-option-container" htmlFor="all-tenants">
                    <input
                        className="tenant-option-option-input"
                        type="checkbox"
                        checked={isChecked}
                        id="all-tenants"
                        onChange={(e): void => {
                            tenants.forEach((tenant) => {
                                onTenantCheckChange(tenant, e.target.checked);
                            });
                        }}
                    />
                    <div
                        className={
                            selectedTenantCount > 0 && !isChecked
                                ? 'tenant-option-checkbox-partial'
                                : 'tenant-option-checkbox'
                        }
                    />
                    All tenants
                </label>

                <div hidden={tenants.length <= 1} className="tenant-filler" />

                <div
                    className="tenant-count-container"
                    onClick={(): void => setExpanded(!isExpanded)}
                >
                    <div hidden={tenants.length <= 1} className="tenant-count">
                        {selectedTenantCount}
                    </div>
                    <div
                        hidden={tenants.length <= 1}
                        className={`tenant ${isExpanded ? 'tenant-collapse' : 'tenant-expand'}`}
                    >
                        <span />
                    </div>
                </div>
            </div>
            <div className="tenant-options-children-container" hidden={!isExpanded}>
                {tenants.length > 1 &&
                    tenants.map((tenant) => {
                        return (
                            <label
                                className="tenant-option-container"
                                key={tenant.id}
                                htmlFor={String(tenant.id)}
                            >
                                <input
                                    className="tenant-option-option-input"
                                    type="checkbox"
                                    checked={selectedTenantIds.has(tenant.id)}
                                    id={String(tenant.id)}
                                    onChange={(e): void =>
                                        onTenantCheckChange(tenant, e.target.checked)
                                    }
                                />
                                <div className="tenant-option-checkbox" />
                                {tenant.name}
                            </label>
                        );
                    })}
            </div>
        </div>
    );
};

export default TenantSelection;
