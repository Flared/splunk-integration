import React, { FC, useEffect, useState } from 'react';
import Button from './Button';
import { getFlareSearchDataUrl } from '../utils/setupConfiguration';
import ArrowRightIcon from './icons/ArrowRightIcon';

import './ConfigurationGlobalStep.css';

const ConfigurationCompletedStep: FC<{
    show: boolean;
    tenantName: string;
    onEditConfigurationClick: () => void;
}> = ({ show, tenantName, onEditConfigurationClick }) => {
    const [flareSearchUrl, setFlareSearchUrl] = useState('');

    useEffect(() => {
        getFlareSearchDataUrl().then((url) => setFlareSearchUrl(url));
    }, []);

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
