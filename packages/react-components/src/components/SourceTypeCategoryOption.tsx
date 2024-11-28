import React, { FC, useState } from 'react';

import { SourceType, SourceTypeCategory } from '../models/flare';
import './SourceTypeCategoryOption.css';
import SourceTypeOption from './SourceTypeOption';

const SourceTypeCategoryOption: FC<{
    isChecked?: boolean;
    sourceTypeCategory: SourceTypeCategory;
    isSourceTypeChecked: (sourceType: SourceType) => boolean;
    onCategoryCheckChange: (isChecked: boolean) => void;
    onSourceTypeCheckChange: (sourceType: SourceType, isChecked: boolean) => void;
}> = ({
    isChecked = false,
    sourceTypeCategory,
    isSourceTypeChecked,
    onCategoryCheckChange,
    onSourceTypeCheckChange,
}) => {
    const [isExpanded, setExpanded] = useState(true);

    const getSelectedCategoryCount = (): number => {
        return sourceTypeCategory.types.filter((sourceType) => isSourceTypeChecked(sourceType))
            .length;
    };

    const selectedCategoryCount = getSelectedCategoryCount();

    return (
        <div className="source-types-category-container">
            <div className="source-types-category-header">
                <SourceTypeOption
                    sourceType={sourceTypeCategory}
                    isChecked={isChecked}
                    isPartiallyChecked={selectedCategoryCount > 0 && !isChecked}
                    onCheckChange={(checked): void => onCategoryCheckChange(checked)}
                />

                <span
                    hidden={sourceTypeCategory.types.length <= 1}
                    className="source-types-category-count"
                >
                    {selectedCategoryCount}
                </span>
                <div
                    hidden={sourceTypeCategory.types.length <= 1}
                    className={`source-types-category ${
                        isExpanded
                            ? 'source-types-category-collapse'
                            : 'source-types-category-expand'
                    }`}
                    onClick={(): void => setExpanded(!isExpanded)}
                >
                    <span />
                </div>
            </div>
            <div className="source-types-children-container" hidden={!isExpanded}>
                {sourceTypeCategory.types.length > 1 &&
                    sourceTypeCategory.types.map((sourceType) => {
                        return (
                            <SourceTypeOption
                                key={sourceTypeCategory.types.indexOf(sourceType)}
                                sourceType={sourceType}
                                isChecked={isSourceTypeChecked(sourceType)}
                                onCheckChange={(checked): void =>
                                    onSourceTypeCheckChange(sourceType, checked)
                                }
                            />
                        );
                    })}
            </div>
        </div>
    );
};

export default SourceTypeCategoryOption;
