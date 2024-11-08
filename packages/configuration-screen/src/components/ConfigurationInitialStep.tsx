import React, { ChangeEvent, FC } from 'react';
import Label from './Label';
import Tooltip from './Tooltip';
import ErrorIcon from './icons/ErrorIcon';
import Button from './Button';

import './ConfigurationGlobalStep.css';
import './ConfigurationInitialStep.css';

const ConfigurationInitialStep: FC<{
    show?: boolean;
    apiKey?: string;
    errorMessage?: string;
    isLoading?: boolean;
    onBackClicked: () => void;
    onNextClicked: () => void;
    onApiKeyChanged: (e: ChangeEvent) => void;
}> = ({
    show = false,
    apiKey = '',
    errorMessage = '',
    isLoading = false,
    onBackClicked,
    onNextClicked,
    onApiKeyChanged,
}) => {
    return (
        <div hidden={!show}>
            <h5>Enter your API key</h5>
            <div className="form-group">
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
                    onChange={onApiKeyChanged}
                    className={`input ${errorMessage.length > 0 ? 'border-error' : ''}`}
                    placeholder="Your API Key"
                />
                <div className="error-container" hidden={errorMessage.length === 0}>
                    <ErrorIcon remSize={1} />
                    <small>Error. {errorMessage}</small>
                </div>
                <div className="button-group">
                    <Button onClick={() => onBackClicked()} isSecondary>
                        Cancel
                    </Button>
                    <Button onClick={() => onNextClicked()} isLoading={isLoading}>
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationInitialStep;
