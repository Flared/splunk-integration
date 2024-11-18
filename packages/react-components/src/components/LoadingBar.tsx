import React, { FC } from 'react';

import './LoadingBar.css';

const LoadingBar: FC<{ max: number; value: number }> = ({ max, value }) => {
    return (
        <div className="loading-bar">
            <div
                className="value-loading-bar"
                style={{
                    width: `${(value / max) * 100}%`,
                }}
            />
        </div>
    );
};

export default LoadingBar;
