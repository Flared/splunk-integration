import React, { FC } from 'react';

import './FlareLogoLoading.css';
import FlareLogo from './icons/FlareLogo';

const FlareLogoLoading: FC<{ hidden?: boolean }> = ({ hidden }) => {
    return (
        <div className="flare-logo-loading-container" hidden={hidden}>
            <div className="flare-logo-loading-svg">
                <FlareLogo remSize={5} />
            </div>
        </div>
    );
};

export default FlareLogoLoading;
