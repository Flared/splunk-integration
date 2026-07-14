import React from 'react';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import { Severity } from '../models/flare';

interface SeverityFilterProps {
    severities: Severity[];
    selectedSeverities: Severity[];
    isApiKeyValidated: boolean;
    isValidatingApiKey: boolean;
    isSaving: boolean;
    isSeveritySelected: (s: Severity) => boolean;
    onToggle: (s: Severity) => void;
}

/**
 * Severity filter row — circular colour-coded buttons with inline error.
 */
export function SeverityFilter({
    severities,
    selectedSeverities,
    isApiKeyValidated,
    isValidatingApiKey,
    isSaving,
    isSeveritySelected,
    onToggle,
}: SeverityFilterProps) {
    const hasError = !isValidatingApiKey && selectedSeverities.length === 0;

    return (
        <ControlGroup
            style={{ marginTop: 24 }}
            label="Severity Filter"
            required
            error={hasError}
            labelPosition="top"
            help="Select the severity levels to include."
        >
            <div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, marginBottom: 8 }}>
                    {severities.map((severity) => (
                        <button
                            type="button"
                            key={severity.value}
                            onClick={() => onToggle(severity)}
                            disabled={!isApiKeyValidated || isSaving}
                            title={severity.label}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: severity.color || '#666',
                                border: isSeveritySelected(severity) ? '2px solid #fff' : '2px solid transparent',
                                cursor: isApiKeyValidated ? 'pointer' : 'not-allowed',
                                outline: 'none',
                                opacity: isSeveritySelected(severity) ? 1 : 0.6,
                                transition: 'all 0.15s ease',
                                padding: 0,
                                boxShadow: isSeveritySelected(severity)
                                    ? '0 0 0 2px #0073e6'
                                    : '0 1px 3px rgba(0,0,0,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {isSeveritySelected(severity) && (
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
                {hasError && (
                    <div style={{ color: '#d93f3c', marginTop: '8px', fontSize: '12px' }}>
                        At least one severity level must be selected.
                    </div>
                )}
            </div>
        </ControlGroup>
    );
}
