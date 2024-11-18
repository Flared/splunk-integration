module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: '@splunk/eslint-config/browser-prettier',
    rules:  {
        'react/jsx-filename-extension': [2, { 'extensions': ['.js', '.jsx', '.ts', '.tsx'] }],
        'no-restricted-syntax': 'off',
        'no-use-before-define': 'off',
        "@typescript-eslint/explicit-function-return-type": [
            "error",
            {
                "allowExpressions": false,
                "allowTypedFunctionExpressions": true,
                "allowHigherOrderFunctions": false,
                "allowDirectConstAssertionInArrowFunctions": true,
                "allowConciseArrowFunctionExpressionsStartingWithVoid": true,
            }
        ],
        '@typescript-eslint/no-unused-vars': ['warn'],
        'no-unused-vars': ['warn'],
        'camelcase': 'off',
        'no-underscore-dangle': 'off',
        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',
        'react/jsx-no-target-blank': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
    },
};
