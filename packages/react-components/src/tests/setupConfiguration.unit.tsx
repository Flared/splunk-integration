import {
    convertSeverityFilterToArray,
    convertSourceTypeFilterToArray,
    getRedirectUrl,
    getSeverityFilterValue,
    getSourceTypesFilterValue,
} from '../utils/setupConfiguration';
import { getAllSeverities, getAllSourceTypeCategories } from './flare.fixture';

test('Flare Redirect URL', () => {
    expect(getRedirectUrl()).toBe('/app/flare');
});

/** Severity filters */
test('Select one severity', () => {
    const allSeverities = getAllSeverities();
    const selectedSeverities = [allSeverities[0]];
    const severityFilter = getSeverityFilterValue(selectedSeverities, allSeverities);
    expect(severityFilter).toBe(allSeverities[0].value);
});

test('Select no severity', () => {
    const allSeverities = getAllSeverities();
    const selectedSeverities = [];
    expect(() => getSeverityFilterValue(selectedSeverities, allSeverities)).toThrow(Error);
});

test('Select all severities', () => {
    const allSeverities = getAllSeverities();
    const selectedSeverities = [...allSeverities];
    const severityFilter = getSeverityFilterValue(selectedSeverities, allSeverities);
    expect(severityFilter).toBe('');
});

test('Convert severity filter (all severities)', () => {
    const allSeverities = getAllSeverities();
    const severityFilter = [];
    const severities = convertSeverityFilterToArray(severityFilter, allSeverities);
    expect(severities).toStrictEqual(allSeverities);
});

test('Convert severity filter (part of them)', () => {
    const allSeverities = getAllSeverities();
    const severityFilter = [allSeverities[0].value];
    const severities = convertSeverityFilterToArray(severityFilter, allSeverities);
    expect(severities).toStrictEqual([allSeverities[0]]);
});

/** Source types filters */
test('Select one source type', () => {
    const allSourceTypeCategories = getAllSourceTypeCategories();
    const selectedSourceTypes = [allSourceTypeCategories[0].types[0]];
    const sourceTypeFilter = getSourceTypesFilterValue(
        selectedSourceTypes,
        allSourceTypeCategories
    );
    expect(sourceTypeFilter).toBe(allSourceTypeCategories[0].types[0].value);
});

test('Select all source types', () => {
    const allSourceTypeCategories = getAllSourceTypeCategories();
    const selectedSourceTypes = [];
    expect(() => getSourceTypesFilterValue(selectedSourceTypes, allSourceTypeCategories)).toThrow(
        Error
    );
});

test('Select a full source type category', () => {
    const allSourceTypeCategories = getAllSourceTypeCategories();
    const selectedSourceTypes = [...allSourceTypeCategories[0].types];
    const sourceTypeFilter = getSourceTypesFilterValue(
        selectedSourceTypes,
        allSourceTypeCategories
    );
    expect(sourceTypeFilter).toBe(allSourceTypeCategories[0].value);
});

test('Select every source types', () => {
    const allSourceTypeCategories = getAllSourceTypeCategories();
    const selectedSourceTypes = [
        ...allSourceTypeCategories.flatMap((sourceTypeCategory) => sourceTypeCategory.types),
    ];
    const sourceTypeFilter = getSourceTypesFilterValue(
        selectedSourceTypes,
        allSourceTypeCategories
    );
    expect(sourceTypeFilter).toBe('');
});

test('Select all source types from a category and a single one from another', () => {
    const allSourceTypeCategories = getAllSourceTypeCategories();
    const selectedSourceTypes = [
        ...allSourceTypeCategories[0].types,
        allSourceTypeCategories[1].types[0],
    ];
    const sourceTypeFilter = getSourceTypesFilterValue(
        selectedSourceTypes,
        allSourceTypeCategories
    );
    expect(sourceTypeFilter).toBe(
        `${allSourceTypeCategories[1].types[0].value},${allSourceTypeCategories[0].value}`
    );
});

test('Convert source type filter (all source types)', () => {
    const allSourceTypeCategories = getAllSourceTypeCategories();
    const sourceTypeFilter = [];
    const sourceTypes = convertSourceTypeFilterToArray(sourceTypeFilter, allSourceTypeCategories);
    expect(sourceTypes).toStrictEqual(
        allSourceTypeCategories.flatMap((category) => category.types)
    );
});

test('Convert source type filter (part of a category)', () => {
    const allSourceTypeCategories = getAllSourceTypeCategories();
    const sourceTypeFilter = [allSourceTypeCategories[0].types[0].value];
    const sourceTypes = convertSourceTypeFilterToArray(sourceTypeFilter, allSourceTypeCategories);
    expect(sourceTypes).toStrictEqual([allSourceTypeCategories[0].types[0]]);
});

test('Convert source type filter (a whole category)', () => {
    const allSourceTypeCategories = getAllSourceTypeCategories();
    const sourceTypeFilter = [allSourceTypeCategories[0].value];
    const sourceTypes = convertSourceTypeFilterToArray(sourceTypeFilter, allSourceTypeCategories);
    expect(sourceTypes).toStrictEqual(allSourceTypeCategories[0].types);
});
