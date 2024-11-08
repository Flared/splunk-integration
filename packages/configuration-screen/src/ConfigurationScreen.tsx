import React, { useEffect, useState, FC } from 'react';
import {
    redirectToHomepage,
    retrieveApiKey,
    retrieveIngestMetadataOnly,
    retrieveTenantId,
    retrieveUserTenants,
    saveConfiguration,
} from './utils/setupConfiguration';
import { ConfigurationSteps, Tenant } from './models/flare';
import './global.css';
import './ConfigurationScreen.css';
import LoadingBar from './components/LoadingBar';
import DoneIcon from './components/icons/DoneIcon';
import ExternalLinkIcon from './components/icons/ExternalLinkIcon';
import { toastManager } from './components/ToastManager';
import ToolIcon from './components/icons/ToolIcon';
import ConfigurationInitialStep from './components/ConfigurationInitialStep';
import ConfigurationUserPreferencesStep from './components/ConfigurationUserPreferencesStep';
import ConfigurationCompletedStep from './components/ConfigurationCompletedStep';

const TOAST_API_KEY_ERROR = 'api_key_error';
const TOAST_TENANT_SUCCESS = 'tenant_success';

const ConfigurationScreen: FC<{ theme: string }> = ({ theme }) => {
    const [apiKey, setApiKey] = useState('');
    const [tenantId, setTenantId] = useState(-1);
    const [errorMessage, setErrorMessage] = useState('');
    const [tenants, setUserTenants] = useState<Tenant[]>([]);
    const [isIngestingMetadataOnly, setIsIngestingMetadataOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    toastManager.setTheme(theme);

    function reset() {
        setApiKey('');
        setTenantId(-1);
        setUserTenants([]);
        setIsLoading(false);
        setIsCompleted(false);
    }

    function getCurrentConfigurationStep() {
        if (tenants.length === 0) {
            return ConfigurationSteps.Initial;
        }
        if (!isCompleted) {
            return ConfigurationSteps.UserPreferences;
        }

        return ConfigurationSteps.Completed;
    }

    const handleApiKeyChange = (e) => setApiKey(e.target.value);
    const handleTenantIdChange = (e) => setTenantId(parseInt(e.target.value, 10));
    const handleIsIngestingMetadataChange = (e) => {
        setIsIngestingMetadataOnly(e.target.checked);
    };

    const handleBackButton = () => {
        const currentConfigurationStep = getCurrentConfigurationStep();
        if (currentConfigurationStep === ConfigurationSteps.Initial) {
            redirectToHomepage();
        } else if (currentConfigurationStep === ConfigurationSteps.UserPreferences) {
            setUserTenants([]);
        } else if (currentConfigurationStep === ConfigurationSteps.Completed) {
            reset();
        }
    };

    const handleSubmitApiKey = () => {
        setIsLoading(true);
        retrieveUserTenants(
            apiKey,
            (userTenants) => {
                if (tenantId === -1 && userTenants.length > 0) {
                    setTenantId(userTenants[0].id);
                }
                setErrorMessage('');
                setUserTenants(userTenants);
                setIsLoading(false);
            },
            (error) => {
                setErrorMessage(error);
                setIsLoading(false);
                toastManager.show({
                    id: TOAST_API_KEY_ERROR,
                    isError: true,
                    content: 'Something went wrong. Please review your form.',
                });
            }
        );
    };

    const handleSubmitTenant = () => {
        setIsLoading(true);
        saveConfiguration(apiKey, tenantId, isIngestingMetadataOnly)
            .then(() => {
                setIsLoading(false);
                setIsCompleted(true);
                toastManager.destroy(TOAST_API_KEY_ERROR);
                toastManager.show({
                    id: TOAST_TENANT_SUCCESS,
                    content: 'Configured Flare Account',
                });
            })
            .catch((e) => {
                setIsLoading(false);
                toastManager.show({
                    id: TOAST_API_KEY_ERROR,
                    isError: true,
                    content: `Something went wrong. ${e.responseText}`,
                });
            });
    };

    function getSelectedTenantName() {
        const filteredTenants = tenants.filter((p) => p.id === tenantId);
        if (filteredTenants.length > 0) {
            return filteredTenants[0].name;
        }

        return 'unknown';
    }

    useEffect(() => {
        if (isCompleted) {
            return;
        }
        retrieveApiKey().then((key) => setApiKey(key));
        retrieveTenantId().then((id) => setTenantId(id));
        retrieveIngestMetadataOnly().then((ingestMetadataOnly) =>
            setIsIngestingMetadataOnly(ingestMetadataOnly)
        );
    }, [isCompleted]);

    useEffect(() => {
        const container = document.getElementById('container') as HTMLDivElement;
        const parentContainer = container.parentElement?.parentElement ?? undefined;
        if (parentContainer) {
            parentContainer.className = `parent-container ${theme === 'dark' ? 'dark' : ''}`;
        }
    }, [theme]);

    const currentConfigurationStep = getCurrentConfigurationStep();

    return (
        <div id="container" className={theme === 'dark' ? 'dark' : ''}>
            <LoadingBar
                max={Object.keys(ConfigurationSteps).length / 2}
                value={currentConfigurationStep}
            />
            <div className="content">
                <ToolIcon
                    remSize={6}
                    hidden={currentConfigurationStep === ConfigurationSteps.Completed}
                />
                <DoneIcon
                    remSize={6}
                    hidden={currentConfigurationStep !== ConfigurationSteps.Completed}
                />
                <div className="content-step">
                    <h2>Configure your Flare Account</h2>
                    <ConfigurationInitialStep
                        show={currentConfigurationStep === ConfigurationSteps.Initial}
                        apiKey={apiKey}
                        errorMessage={errorMessage}
                        isLoading={isLoading}
                        onBackClicked={handleBackButton}
                        onNextClicked={handleSubmitApiKey}
                        onApiKeyChanged={handleApiKeyChange}
                    />
                    <ConfigurationUserPreferencesStep
                        show={currentConfigurationStep === ConfigurationSteps.UserPreferences}
                        selectedTenantId={tenantId}
                        tenants={tenants}
                        isLoading={isLoading}
                        isIngestingMetadataOnly={isIngestingMetadataOnly}
                        onBackClicked={handleBackButton}
                        onNextClicked={handleSubmitTenant}
                        onTenantIdChanged={handleTenantIdChange}
                        onIngestingMetadataChanged={handleIsIngestingMetadataChange}
                    />
                    <ConfigurationCompletedStep
                        show={currentConfigurationStep === ConfigurationSteps.Completed}
                        tenantName={getSelectedTenantName()}
                        onBackClicked={handleBackButton}
                    />
                </div>
                <div id="learn-more" className="link">
                    <a target="_blank" href="https://docs.flare.io/splunk-cloud-integration">
                        Learn More
                    </a>
                    <ExternalLinkIcon remSize={1} />
                </div>
            </div>
        </div>
    );
};

export default ConfigurationScreen;
