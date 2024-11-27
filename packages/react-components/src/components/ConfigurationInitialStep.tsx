import React, { FC, useEffect, useState } from 'react';
import Button from './Button';
import Label from './Label';
import Tooltip from './Tooltip';
import ErrorIcon from './icons/ErrorIcon';

import { ConfigurationStep } from '../models/flare';
import { fetchApiKeyValidation } from '../utils/setupConfiguration';
import './ConfigurationGlobalStep.css';
import './ConfigurationInitialStep.css';
import { ToastKeys, toastManager } from './ToastManager';

const ConfigurationInitialStep: FC<{
    show?: boolean;
    configurationStep: ConfigurationStep;
    apiKey?: string;
    setApiKey: (apiKey: string) => void;
    onCancelConfigurationClick: () => void;
    onApiKeyValidated: () => void;
}> = ({
    show = false,
    configurationStep,
    apiKey = '',
    setApiKey,
    onCancelConfigurationClick,
    onApiKeyValidated,
}) => {
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleApiKeyChange = (e): void => setApiKey(e.target.value);

    const handleSubmitApiKey = (): void => {
        setIsLoading(true);
        fetchApiKeyValidation(apiKey)
            .then(() => {
                setErrorMessage('');
                setIsLoading(false);
                onApiKeyValidated();
            })
            .catch((error: any) => {
                setErrorMessage(error.data);
                setIsLoading(false);
                toastManager.show({
                    id: ToastKeys.ERROR,
                    isError: true,
                    content: 'Something went wrong. Please review your form.',
                });
            });
    };

    const isFormValid = (): boolean => {
        return apiKey.length > 0;
    };

    useEffect(() => {
        if (configurationStep !== ConfigurationStep.Initial) {
            setIsLoading(false);
        }
    }, [configurationStep]);

    return (
        <div hidden={!show}>
            <h5>Enter your API key</h5>
            <div className="form-group">
                <div className="form-item">
                    <div className="label-tooltip">
                        <Label isRequired>API Key</Label>
                        <Tooltip>
                            <div>
                                {'You can find your API Keys in your '}
                                <a target="_blank" href="https://app.flare.io/#/profile">
                                    Flare Profile
                                </a>
                            </div>
                        </Tooltip>
                    </div>
                    <input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={handleApiKeyChange}
                        className={`input ${errorMessage.length > 0 ? 'border-error' : ''}`}
                        placeholder="Your API Key"
                    />
                    <div className="error-container" hidden={errorMessage.length === 0}>
                        <ErrorIcon remSize={1} />
                        <small>Error. {errorMessage}</small>
                    </div>
                </div>
                <div className="button-group">
                    <Button onClick={(): void => onCancelConfigurationClick()} isSecondary>
                        Cancel
                    </Button>
                    <Button
                        onClick={(): void => handleSubmitApiKey()}
                        isLoading={isLoading}
                        isDisabled={!isFormValid()}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationInitialStep;
