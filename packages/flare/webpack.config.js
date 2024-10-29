const fs = require('fs');
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge: webpackMerge } = require('webpack-merge');
const baseConfig = require('@splunk/webpack-configs/base.config').default;

// Set up an entry config by iterating over the files in the pages directory.
const entries = fs
    .readdirSync(path.join(__dirname, 'src/main/webapp/pages'))
    .filter((pageFile) => !/^\./.test(pageFile))
    .reduce((accum, page) => {
        accum[page] = path.join(__dirname, 'src/main/webapp/pages', page);
        return accum;
    }, {});

module.exports = webpackMerge(baseConfig, {
    entry: entries,
    output: {
        path: path.join(__dirname, 'flare/appserver/static/pages/'),
        filename: '[name].js',
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(__dirname, 'src/main/resources/splunk'),
                    to: path.join(__dirname, 'flare'),
                    filter: (filepath) => { return !filepath.endsWith("README/splunk_create.spec.conf"); },
                },
                {
                    from: path.join(__dirname, 'python'),
                    to: path.join(__dirname, 'flare/bin'),
                },
                {
                    from: path.join(__dirname, 'README'),
                    to: path.join(__dirname, 'flare/'),
                },
            ],
        }),
    ],
    devtool: 'eval-source-map',
});
