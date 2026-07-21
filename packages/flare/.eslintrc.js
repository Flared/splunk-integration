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
    },
};
