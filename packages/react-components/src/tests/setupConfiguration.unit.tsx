import {
    convertSeverityFilterToArray,
    getRedirectUrl,
    getSeverityFilterValue,
} from '../utils/setupConfiguration';
import { getAllSeverities } from './flare.fixture';

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
