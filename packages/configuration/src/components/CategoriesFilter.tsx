import React from 'react';
import CollapsiblePanel, { SingleOpenPanelGroup } from '@splunk/react-ui/CollapsiblePanel';
import ControlGroup from '@splunk/react-ui/ControlGroup';
import { SourceType, SourceTypeCategory } from '../models/flare';

interface CategoriesFilterProps {
    sourceTypeCategories: SourceTypeCategory[];
    selectedSourceTypes: SourceType[];
    isValidatingApiKey: boolean;
    isCategoryFullySelected: (c: SourceTypeCategory) => boolean;
    isSourceTypeSelected: (s: SourceType) => boolean;
    onCategoryToggle: (c: SourceTypeCategory) => void;
    onSourceTypeToggle: (s: SourceType) => void;
}

/**
 * Collapsible category / source-type filter tree with inline empty-selection error.
 */
export function CategoriesFilter({
    sourceTypeCategories,
    selectedSourceTypes,
    isValidatingApiKey,
    isCategoryFullySelected,
    isSourceTypeSelected,
    onCategoryToggle,
    onSourceTypeToggle,
}: CategoriesFilterProps) {
    const hasError = !isValidatingApiKey && selectedSourceTypes.length === 0;

    return (
        <ControlGroup
            label="Categories Filter"
            required
            error={hasError}
            labelPosition="top"
            help="Select the specific event categories to ingest."
        >
            <div style={{ border: '1px solid #d3d3d3', borderRadius: '4px', background: '#fff', overflow: 'hidden' }}>
                <SingleOpenPanelGroup>
                    {sourceTypeCategories.map((category) => {
                        if (category.types.length === 0) {
                            return (
                                <div key={category.value} style={{ marginBottom: 8, marginTop: 8, paddingLeft: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input
                                            type="checkbox"
                                            checked={isCategoryFullySelected(category)}
                                            onChange={() => onCategoryToggle(category)}
                                            style={{ accentColor: '#5b9cf4', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontWeight: 600, fontSize: '0.85em', color: '#141414ff', cursor: 'default' }}>
                                            {category.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <CollapsiblePanel
                                key={category.value}
                                panelId={category.value}
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input
                                            type="checkbox"
                                            checked={isCategoryFullySelected(category)}
                                            onChange={(e) => { e.stopPropagation(); onCategoryToggle(category); }}
                                            onClick={(e) => e.stopPropagation()}
                                            style={{ accentColor: '#5b9cf4', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontWeight: 600, fontSize: '0.85em', cursor: 'pointer' }}>
                                            {category.label}
                                        </span>
                                    </div>
                                }
                            >
                                <div style={{ marginLeft: 8, marginTop: -8 }}>
                                    {category.types.map((sourceType) => (
                                        <div
                                            key={sourceType.value}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginBottom: 4,
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => onSourceTypeToggle(sourceType)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isSourceTypeSelected(sourceType)}
                                                onChange={() => {}} // Handled by onClick
                                                style={{ accentColor: '#5b9cf4' }}
                                            />
                                            <span style={{ fontSize: '0.83em' }}>{sourceType.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </CollapsiblePanel>
                        );
                    })}
                </SingleOpenPanelGroup>
                {hasError && (
                    <div style={{ color: '#d93f3c', marginTop: '8px', fontSize: '12px', padding: '8px' }}>
                        At least one event category must be selected.
                    </div>
                )}
            </div>
        </ControlGroup>
    );
}
