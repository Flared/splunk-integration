import React from 'react';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import Text from '@splunk/react-ui/Text';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';

interface ApiKeyFieldProps {
    apiKey: string;
    apiKeyError: string;
    isValidatingApiKey: boolean;
    onChange: (_e: unknown, { value }: { value: string }) => void;
}

/**
 * Flare API Key input field with inline red error and validation spinner.
 */
export function ApiKeyField({ apiKey, apiKeyError, isValidatingApiKey, onChange }: ApiKeyFieldProps) {
    return (
        <ControlGroup
            label="Flare API Key"
            required
            labelPosition="top"
            help="Enter your Flare API Key"
            error={apiKeyError.length > 0}
            tooltip={apiKeyError || undefined}
        >
            <div>
                <Text
                    type="password"
                    value={apiKey}
                    onChange={onChange}
                    placeholder=""
                    error={apiKeyError.length > 0}
                />
                {isValidatingApiKey && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
                        <WaitSpinner size="small" />
                        <span>Validating API key…</span>
                    </div>
                )}
                {apiKeyError && !isValidatingApiKey && (
                    <div style={{ color: '#d93f3c', marginTop: '8px', fontSize: '12px' }}>
                        {apiKeyError}
                    </div>
                )}
            </div>
        </ControlGroup>
    );
}
