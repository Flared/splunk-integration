const path = require('path');
const { merge: webpackMerge } = require('webpack-merge');
const baseComponentConfig = require('@splunk/webpack-configs/component.config').default;

module.exports = webpackMerge(baseComponentConfig, {
    entry: {
        ConfigurationScreen: path.join(__dirname, 'src/ConfigurationScreen.tsx'),
    },
    output: {
        path: path.join(__dirname),
    },
});
