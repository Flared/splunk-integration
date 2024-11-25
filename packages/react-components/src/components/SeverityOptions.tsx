import React, { FC } from 'react';

import { Severity } from '../models/flare';
import SeverityOption from './SeverityOption';
import './SeverityOptions.css';

const SeverityOptions: FC<{
    severities: Severity[];
    selectedSeverities: Severity[];
    setSelectedSeverities: (selectedSeverities: Severity[]) => void;
}> = ({ severities, selectedSeverities, setSelectedSeverities }) => {
    const isSeverityChecked = (severity: Severity): boolean => {
        return (
            selectedSeverities.findIndex(
                (selectedSeverity) => selectedSeverity.value === severity.value
            ) >= 0
        );
    };

    const handleOnSeverityChange = (severity: Severity, isChecked: boolean): void => {
        if (isChecked) {
            const newSeverities = new Array(...selectedSeverities);
            newSeverities.push(severity);
            setSelectedSeverities(newSeverities);
        } else {
            const newSeverities = selectedSeverities.filter(
                (selectedSeverity) => selectedSeverity.value !== severity.value
            );
            setSelectedSeverities(newSeverities);
        }
    };

    return (
        <div id="severities-container">
            {severities.map((severity) => {
                return (
                    <SeverityOption
                        key={severities.indexOf(severity)}
                        isChecked={isSeverityChecked(severity)}
                        severity={severity}
                        onCheckChange={(isChecked): void =>
                            handleOnSeverityChange(severity, isChecked)
                        }
                    />
                );
            })}
        </div>
    );
};

export default SeverityOptions;
