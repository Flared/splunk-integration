import React, { FC, useEffect, useState } from 'react';
import {
    fetchTenantIds,
    fetchUserTenants,
    getFlareSearchDataUrl,
} from '../utils/setupConfiguration';
import Button from './Button';
import ArrowRightIcon from './icons/ArrowRightIcon';

import { ConfigurationStep, Tenant } from '../models/flare';
import './ConfigurationGlobalStep.css';
import FlareLogoLoading from './FlareLogoLoading';

const ConfigurationCompletedStep: FC<{
    apiKey: string;
    configurationStep: ConfigurationStep;
    onEditConfigurationClick: () => void;
}> = ({ apiKey, configurationStep, onEditConfigurationClick }) => {
    const [isInitializingData, setIsInitializingData] = useState(true);
    const [flareSearchUrl, setFlareSearchUrl] = useState('');
    const [tenantNames, setTenantNames] = useState('');

    useEffect(() => {
        if (configurationStep === ConfigurationStep.Completed) {
            Promise.all([getFlareSearchDataUrl(), fetchTenantIds(), fetchUserTenants(apiKey)]).then(
                ([url, tenantIds, userTenants]) => {
                    setFlareSearchUrl(url);
                    const tenantNameStrings = tenantIds
                        .map(
                            (tenantId) =>
                                userTenants.find((tenant: Tenant) => tenant.id === tenantId)?.name
                        )
                        .filter(Boolean)
                        .join(', ');
                    setTenantNames(tenantNameStrings || 'Unknown');
                    setIsInitializingData(false);
                }
            );
        } else {
            setIsInitializingData(true);
            setFlareSearchUrl('');
            setTenantNames('');
        }
    }, [configurationStep, apiKey]);

    if (configurationStep !== ConfigurationStep.Completed) {
        return null;
    }

    if (isInitializingData) {
        return <FlareLogoLoading />;
    }

    return (
        <div>
            <h5>
                {`You can now access `}
                <b>{tenantNames}</b>
                {` Flare Data in Splunk.`}
            </h5>
            <div className="form-group">
                <div className="button-group">
                    <Button onClick={(): void => onEditConfigurationClick()} isSecondary>
                        Edit Configuration
                    </Button>
                    <div className="link">
                        <a href={flareSearchUrl}>View Flare Data</a>
                        <ArrowRightIcon remSize={1} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationCompletedStep;
