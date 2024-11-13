import React, { FC, useEffect, useState } from 'react';
import Button from './Button';
import { getFlareDataUrl } from '../utils/setupConfiguration';
import ArrowRightIcon from './icons/ArrowRightIcon';

import './ConfigurationGlobalStep.css';

const ConfigurationCompletedStep: FC<{
    show: boolean;
    tenantName: string;
    onBackClicked: () => void;
}> = ({ show, tenantName, onBackClicked }) => {
    const [indexName, setIndexName] = useState<string>();

    useEffect(() => {
        getFlareDataUrl().then((name) => setIndexName(name));
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
                    <Button onClick={() => onBackClicked()} isSecondary>
                        Edit Configuration
                    </Button>
                    <div className="link">
                        <a href={indexName}>View Flare Data</a>
                        <ArrowRightIcon remSize={1} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigurationCompletedStep;
