import React, { FC, useEffect, useState } from 'react';
import {
    fetchTenantId,
    fetchUserTenants,
    getFlareSearchDataUrl,
} from '../utils/setupConfiguration';
import Button from './Button';
import ArrowRightIcon from './icons/ArrowRightIcon';

import { ConfigurationStep, Tenant } from '../models/flare';
import './ConfigurationGlobalStep.css';

const ConfigurationCompletedStep: FC<{
    show: boolean;
    apiKey: string;
    configurationStep: ConfigurationStep;
    onEditConfigurationClick: () => void;
}> = ({ show, apiKey, configurationStep, onEditConfigurationClick }) => {
    const [flareSearchUrl, setFlareSearchUrl] = useState('');
    const [tenantName, setTenantName] = useState('');

    useEffect(() => {
        if (configurationStep === ConfigurationStep.Completed) {
            Promise.all([getFlareSearchDataUrl(), fetchTenantId(), fetchUserTenants(apiKey)]).then(
                ([url, tenantId, userTenants]) => {
                    setFlareSearchUrl(url);
                    setTenantName(
                        userTenants.find((tenant: Tenant) => tenant.id === tenantId)?.name ||
                            'unknown'
                    );
                }
            );
        }
    }, [configurationStep, apiKey]);

    return (
        <div hidden={!show}>
            <h5>
                {`You can now access `}
                <b>{tenantName}</b>
                {`'s Flare Data in Splunk.`}
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
