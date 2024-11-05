import React, { FC } from 'react';
import Button from './Button';
import { getRedirectUrl } from '../utils/setupConfiguration';
import ArrowRightIcon from './icons/ArrowRightIcon';

import './ConfigurationGlobalStep.css';

const ConfigurationCompletedStep: FC<{
    show: boolean;
    tenantName: string;
    onBackClicked: () => void;
}> = ({ show, tenantName, onBackClicked }) => {
    return (
        <div hidden={!show}>
            <h5>
                {`You can now access `}
                <b>{tenantName}</b>
                {`'s Flare Data in Splunk.`}
            </h5>
            <div className="form-group">
                <div className="button-group">
                    <Button onClick={() => onBackClicked()} isSecondary>
                        Edit Configuration
                    </Button>
                    <div className="link">
                        <a href={getRedirectUrl()}>View Flare Data</a>
                        <ArrowRightIcon remSize={1} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationCompletedStep;
