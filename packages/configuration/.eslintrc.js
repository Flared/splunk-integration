module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: ['@splunk/eslint-config/base', '@splunk/eslint-config/browser-prettier'],
    rules: {
        'react/jsx-filename-extension': ['error', { extensions: ['.tsx', '.jsx'] }],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': [
            'error',
            { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
        ],
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        'no-param-reassign': ['error', { props: false }],
        'no-use-before-define': ['error', { functions: false, variables: false }],
        'react-hooks/exhaustive-deps': 'warn',
        'jsx-a11y/click-events-have-key-events': 'warn',
        'jsx-a11y/no-static-element-interactions': 'warn',
        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: ['src/**/tests/*.unit*'],
            },
        ],
    },
    overrides: [
        {
            files: ['src/**/tests/*.unit*'],
            env: {
                jest: true,
            },
        },
    ],
};
