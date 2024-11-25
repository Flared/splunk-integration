import { Severity, SourceTypeCategory } from '../models/flare';

export function getAvailableSeverities(): Severity[] {
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

export function getAvailableSourceTypeCategories(): SourceTypeCategory[] {
    return [
        {
            value: 'illicit_networks',
            label: 'Illicit Networks',
            types: [
                {
                    value: 'listing',
                    label: 'Market',
                },
                {
                    value: 'forum_content',
                    label: 'Forum Posts',
                },
                {
                    value: 'blog_content',
                    label: 'Blog Posts',
                },
                {
                    value: 'profile',
                    label: 'Profiles',
                },
                {
                    value: 'chat_message',
                    label: 'Chats',
                },
                {
                    value: 'ransomleak',
                    label: 'Ransom Leaks',
                },
                {
                    value: 'infected_devices',
                    label: 'Infected Devices',
                },
                {
                    value: 'financial_data',
                    label: 'Financial Data',
                },
            ],
        },
        {
            value: 'open_web',
            label: 'Open Web',
            types: [
                {
                    value: 'paste',
                    label: 'Pastes',
                },
                {
                    value: 'social_media',
                    label: 'Web Accounts',
                },
                {
                    value: 'source_code',
                    label: 'Source Code',
                },
                {
                    value: 'google',
                    label: 'Google',
                },
                {
                    value: 'service',
                    label: 'Hosts',
                },
                {
                    value: 'buckets',
                    label: 'Buckets',
                },
            ],
        },
        {
            value: 'leaks',
            label: 'Leaked Credentials',
            types: [
                {
                    value: 'leak',
                    label: 'Leaked Credentials',
                },
            ],
        },
        {
            value: 'domains',
            label: 'Look-alike Domains',
            types: [
                {
                    value: 'domain',
                    label: 'Look-alike Domains',
                },
            ],
        },
    ];
}
