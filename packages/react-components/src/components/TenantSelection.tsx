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

    const deletedTenants = Array.from(selectedTenantIds)
        .filter((selectedTenantId) => !tenants.find(({ id }) => id === selectedTenantId))
        .map((tenantId) => ({ name: 'Unknown', id: tenantId } as Tenant));

    const allTenants = [...tenants, ...deletedTenants];

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
                            allTenants.forEach((tenant) => {
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

                <div hidden={allTenants.length <= 1} className="tenant-filler" />

                <div
                    className="tenant-count-container"
                    onClick={(): void => setExpanded(!isExpanded)}
                >
                    <div hidden={allTenants.length <= 1} className="tenant-count">
                        {selectedTenantCount}
                    </div>
                    <div
                        hidden={allTenants.length <= 1}
                        className={`tenant ${isExpanded ? 'tenant-collapse' : 'tenant-expand'}`}
                    >
                        <span />
                    </div>
                </div>
            </div>
            <div className="tenant-options-children-container" hidden={!isExpanded}>
                {allTenants.length > 1 &&
                    allTenants.map((tenant) => {
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
                                {tenant.name} ({tenant.id})
                            </label>
                        );
                    })}
            </div>
        </div>
    );
};

export default TenantSelection;
