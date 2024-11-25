import { getSeverityFilterValue, getSourceTypesFilterValue } from '../utils/setupConfiguration';
import { getAvailableSeverities, getAvailableSourceTypeCategories } from './flare.fixture';

/** Severity filters */
test('Select one severity', () => {
    const availableSeverities = getAvailableSeverities();
    const selectedSeverities = [availableSeverities[0]];
    const severityFilter = getSeverityFilterValue(selectedSeverities, availableSeverities);
    expect(severityFilter).toBe(availableSeverities[0].value);
});

test('Select no severity', () => {
    const availableSeverities = getAvailableSeverities();
    const selectedSeverities = [];
    expect(() => getSeverityFilterValue(selectedSeverities, availableSeverities)).toThrow(Error);
});

test('Select all severities', () => {
    const availableSeverities = getAvailableSeverities();
    const selectedSeverities = [...availableSeverities];
    const severityFilter = getSeverityFilterValue(selectedSeverities, availableSeverities);
    expect(severityFilter).toBe('');
});

/** Source types filters */
test('Select one source type', () => {
    const availableSourceTypeCategory = getAvailableSourceTypeCategories();
    const selectedSourceTypes = [availableSourceTypeCategory[0].types[0]];
    const sourceTypeFilter = getSourceTypesFilterValue(
        selectedSourceTypes,
        availableSourceTypeCategory
    );
    expect(sourceTypeFilter).toBe(availableSourceTypeCategory[0].types[0].value);
});

test('Select one source type', () => {
    const availableSourceTypeCategory = getAvailableSourceTypeCategories();
    const selectedSourceTypes = [];
    expect(() =>
        getSourceTypesFilterValue(selectedSourceTypes, availableSourceTypeCategory)
    ).toThrow(Error);
});

test('Select a full source type category', () => {
    const availableSourceTypeCategory = getAvailableSourceTypeCategories();
    const selectedSourceTypes = [...availableSourceTypeCategory[0].types];
    const sourceTypeFilter = getSourceTypesFilterValue(
        selectedSourceTypes,
        availableSourceTypeCategory
    );
    expect(sourceTypeFilter).toBe(availableSourceTypeCategory[0].value);
});

test('Select every source types', () => {
    const availableSourceTypeCategory = getAvailableSourceTypeCategories();
    const selectedSourceTypes = [
        ...availableSourceTypeCategory.flatMap((sourceTypeCategory) => sourceTypeCategory.types),
    ];
    const sourceTypeFilter = getSourceTypesFilterValue(
        selectedSourceTypes,
        availableSourceTypeCategory
    );
    expect(sourceTypeFilter).toBe('');
});

test('Select all source types from a category and a single one from another', () => {
    const availableSourceTypeCategory = getAvailableSourceTypeCategories();
    const selectedSourceTypes = [
        ...availableSourceTypeCategory[0].types,
        availableSourceTypeCategory[1].types[0],
    ];
    const sourceTypeFilter = getSourceTypesFilterValue(
        selectedSourceTypes,
        availableSourceTypeCategory
    );
    expect(sourceTypeFilter).toBe(
        `${availableSourceTypeCategory[1].types[0].value},${availableSourceTypeCategory[0].value}`
    );
});
