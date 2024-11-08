import React, { FC } from 'react';

import './Label.css';

const Label: FC<{ isRequired?: boolean }> = ({ isRequired = false, children }) => {
    return (
        <div className="label">
            <span>{children}</span>
            <span className="error-message" hidden={!isRequired}>
                *
            </span>
        </div>
    );
};

export default Label;
