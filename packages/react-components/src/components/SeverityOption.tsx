import React, { FC, useState } from 'react';

import { Severity } from '../models/flare';
import './SeverityOption.css';
import './Tooltip.css';

const SeverityOption: FC<{
    isChecked?: boolean;
    severity: Severity;
    onCheckChange: (isChecked: boolean) => void;
}> = ({ isChecked = false, severity, onCheckChange }) => {
    const [isShowingTooltip, setShowingTooltip] = useState(false);

    return (
        <div className="tooltip-container">
            <label
                className="toggle"
                onMouseEnter={(): void => setShowingTooltip(true)}
                onMouseLeave={(): void => setShowingTooltip(false)}
            >
                <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e): void => onCheckChange(e.target.checked)}
                />
                <span
                    className="dot"
                    style={{
                        borderColor: severity.color,
                        backgroundColor: isChecked ? severity.color : '',
                    }}
                />
            </label>
            <div
                hidden={!isShowingTooltip}
                className="tooltip"
                style={{
                    zIndex: 1,
                }}
            >
                {severity.label}
            </div>
        </div>
    );
};

export default SeverityOption;
