import React, { FC } from 'react';

import './ProgressBar.css';

const ProgressBar: FC<{ hidden?: boolean }> = ({ hidden }) => {
    return (
        <div className="progress-bar-container" hidden={hidden}>
            <svg className="progress-bar-svg" width="1rem" height="1rem" viewBox="0 0 100 100">
                <circle className="progress-bar-circle" cx="50" cy="50" r="45" />
            </svg>
        </div>
    );
};

export default ProgressBar;
