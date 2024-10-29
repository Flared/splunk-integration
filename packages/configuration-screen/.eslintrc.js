module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: '@splunk/eslint-config/browser-prettier',
    rules:  {
        'react/jsx-filename-extension': [2, { 'extensions': ['.js', '.jsx', '.ts', '.tsx'] }],
        'no-restricted-syntax': 'off',
        "no-use-before-define": "off",
        "@typescript-eslint/no-use-before-define": ["error"],
        "@typescript-eslint/no-unused-vars": ["warn"],
        'no-unused-vars': ["warn"],
        'camelcase': 'off',
        'no-underscore-dangle': 'off',
    },
};
