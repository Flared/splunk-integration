import React, { FC, useEffect, useState } from 'react';
import './ConfigurationScreen.css';
import ConfigurationCompletedStep from './components/ConfigurationCompletedStep';
import ConfigurationInitialStep from './components/ConfigurationInitialStep';
import ConfigurationUserPreferencesStep from './components/ConfigurationUserPreferencesStep';
import LoadingBar from './components/LoadingBar';
import { toastManager } from './components/ToastManager';
import DoneIcon from './components/icons/DoneIcon';
import ExternalLinkIcon from './components/icons/ExternalLinkIcon';
import ToolIcon from './components/icons/ToolIcon';
import './global.css';
import { ConfigurationStep } from './models/flare';
import { createFlareIndex, fetchApiKey, redirectToHomepage } from './utils/setupConfiguration';

const ConfigurationScreen: FC<{ theme: string }> = ({ theme }) => {
    const [configurationStep, setConfigurationStep] = useState(ConfigurationStep.Initial);
    const [apiKey, setApiKey] = useState('');

    toastManager.setTheme(theme);

    const handleBackButton = (): void => {
        if (configurationStep === ConfigurationStep.Initial) {
            redirectToHomepage();
        } else if (configurationStep === ConfigurationStep.UserPreferences) {
            setConfigurationStep(ConfigurationStep.Initial);
        } else if (configurationStep === ConfigurationStep.Completed) {
            setConfigurationStep(ConfigurationStep.Initial);
        }
    };

    useEffect(() => {
        if (configurationStep === ConfigurationStep.Initial) {
            Promise.all([fetchApiKey(), createFlareIndex()]).then(([key]) => {
                setApiKey(key);
            });
        }
    }, [configurationStep]);

    useEffect(() => {
        const container = document.getElementById('container') as HTMLDivElement;
        const parentContainer = container.parentElement?.parentElement ?? undefined;
        if (parentContainer) {
            parentContainer.className = `parent-container ${theme === 'dark' ? 'dark' : ''}`;
        }
    }, [theme]);

    return (
        <div id="container" className={theme === 'dark' ? 'dark' : ''}>
            <LoadingBar max={Object.keys(ConfigurationStep).length / 2} value={configurationStep} />
            <div className="content">
                <ToolIcon remSize={6} hidden={configurationStep === ConfigurationStep.Completed} />
                <DoneIcon remSize={6} hidden={configurationStep !== ConfigurationStep.Completed} />
                <div className="content-step">
                    <h2>Configure your Flare Account</h2>
                    <ConfigurationInitialStep
                        show={configurationStep === ConfigurationStep.Initial}
                        configurationStep={configurationStep}
                        apiKey={apiKey}
                        onCancelConfigurationClick={handleBackButton}
                        onApiKeyValidated={(): void =>
                            setConfigurationStep(ConfigurationStep.UserPreferences)
                        }
                        setApiKey={setApiKey}
                    />
                    <ConfigurationUserPreferencesStep
                        show={configurationStep === ConfigurationStep.UserPreferences}
                        configurationStep={configurationStep}
                        apiKey={apiKey}
                        onNavigateBackClick={handleBackButton}
                        onUserPreferencesSaved={(): void =>
                            setConfigurationStep(ConfigurationStep.Completed)
                        }
                    />
                    <ConfigurationCompletedStep
                        show={configurationStep === ConfigurationStep.Completed}
                        apiKey={apiKey}
                        configurationStep={configurationStep}
                        onEditConfigurationClick={handleBackButton}
                    />
                </div>
                <div id="learn-more" className="link">
                    <a target="_blank" href="https://docs.flare.io/splunk-app-integration">
                        Learn More
                    </a>
                    <ExternalLinkIcon remSize={1} />
                </div>
            </div>
        </div>
    );
};

export default ConfigurationScreen;
