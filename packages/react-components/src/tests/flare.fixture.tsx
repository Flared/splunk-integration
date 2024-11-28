import { Severity } from '../models/flare';

export function getAllSeverities(): Severity[] {
    return [
        {
            value: 'info',
            label: 'Info',
            color: '#A7C4FF',
        },
        {
            value: 'low',
            label: 'Low',
            color: '#FFE030',
        },
        {
            value: 'medium',
            label: 'Medium',
            color: '#F8C100',
        },
        {
            value: 'high',
            label: 'High',
            color: '#FF842A',
        },
        {
            value: 'critical',
            label: 'Critical',
            color: '#FF0C47',
        },
    ];
}
