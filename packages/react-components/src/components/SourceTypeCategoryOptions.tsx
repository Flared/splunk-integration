import React, { FC } from 'react';

import { SourceType, SourceTypeCategory } from '../models/flare';
import SourceTypeCategoryOption from './SourceTypeCategoryOption';
import './SourceTypeCategoryOptions.css';

const SourceTypeCategoryOptions: FC<{
    sourceTypeCategories: SourceTypeCategory[];
    selectedSourceTypes: SourceType[];
    setSelectedSourceTypes: (selectedSourceTypes: SourceType[]) => void;
}> = ({ sourceTypeCategories, selectedSourceTypes, setSelectedSourceTypes }) => {
    const isSourceTypeChecked = (sourceType: SourceType): boolean => {
        return (
            selectedSourceTypes.findIndex(
                (selectedSourceType) => selectedSourceType.value === sourceType.value
            ) >= 0
        );
    };

    const isSourceTypeCategoryChecked = (sourceTypeCategory: SourceTypeCategory): boolean => {
        return (
            sourceTypeCategory.types.filter((sourceType) => {
                return isSourceTypeChecked(sourceType);
            }).length === sourceTypeCategory.types.length
        );
    };

    const handleOnSourceTypeChange = (sourceType: SourceType, isChecked: boolean): void => {
        if (isChecked) {
            const newSourceTypes = new Array(...selectedSourceTypes);
            newSourceTypes.push(sourceType);
            setSelectedSourceTypes(newSourceTypes);
        } else {
            const newSourceTypes = selectedSourceTypes.filter(
                (selectedSourceType) => selectedSourceType.value !== sourceType.value
            );
            setSelectedSourceTypes(newSourceTypes);
        }
    };

    const handleOnSourceTypeCategoryChange = (
        sourceTypeCategory: SourceTypeCategory,
        isChecked: boolean
    ): void => {
        if (isChecked) {
            const newSourceTypes = new Set(selectedSourceTypes);
            sourceTypeCategory.types.forEach((sourceType) => newSourceTypes.add(sourceType));
            setSelectedSourceTypes(new Array(...newSourceTypes));
        } else {
            const newSourceTypes = selectedSourceTypes.filter(
                (selectedSourceType) => sourceTypeCategory.types.indexOf(selectedSourceType) === -1
            );
            setSelectedSourceTypes(newSourceTypes);
        }
    };

    return (
        <div id="source-types-categories-container">
            {sourceTypeCategories.map((sourceTypeCategory) => {
                return (
                    <SourceTypeCategoryOption
                        key={sourceTypeCategories.indexOf(sourceTypeCategory)}
                        sourceTypeCategory={sourceTypeCategory}
                        isChecked={isSourceTypeCategoryChecked(sourceTypeCategory)}
                        isSourceTypeChecked={isSourceTypeChecked}
                        onCategoryCheckChange={(checked): void =>
                            handleOnSourceTypeCategoryChange(sourceTypeCategory, checked)
                        }
                        onSourceTypeCheckChange={(sourceType, checked): void =>
                            handleOnSourceTypeChange(sourceType, checked)
                        }
                    />
                );
            })}
        </div>
    );
};

export default SourceTypeCategoryOptions;
