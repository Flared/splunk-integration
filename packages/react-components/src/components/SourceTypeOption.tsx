import React, { FC } from 'react';

import { SourceType } from '../models/flare';
import './SourceTypeOption.css';

const SourceTypeOption: FC<{
    isChecked?: boolean;
    isPartiallyChecked?: boolean;
    sourceType: SourceType;
    onCheckChange: (isChecked: boolean) => void;
}> = ({ isChecked = false, isPartiallyChecked = false, sourceType, onCheckChange }) => {
    return (
        <label className="source-type-container" htmlFor={sourceType.value}>
            <input
                className="source-type-option-input"
                type="checkbox"
                checked={isChecked}
                id={sourceType.value}
                onChange={(e): void => onCheckChange(e.target.checked)}
            />
            <div
                className={
                    isPartiallyChecked ? 'source-type-checkbox-partial' : 'source-type-checkbox'
                }
            />
            {sourceType.label}
        </label>
    );
};

export default SourceTypeOption;
