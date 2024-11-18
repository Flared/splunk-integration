import React, { FC } from 'react';
import ProgressBar from './ProgressBar';

import './Button.css';

const Button: FC<{ onClick: () => void; isSecondary?: boolean; isLoading?: boolean }> = ({
    onClick,
    isSecondary = false,
    isLoading = false,
    children,
}) => {
    return (
        <button
            type="button"
            onClick={(): void => onClick()}
            className={isSecondary ? 'secondary-button' : 'primary-button'}
            disabled={isLoading}
        >
            <div className="button-content">
                <span>{children}</span>
                <ProgressBar hidden={isSecondary || !isLoading} />
            </div>
        </button>
    );
};

export default Button;
