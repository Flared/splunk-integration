const path = require('path');
const { merge: webpackMerge } = require('webpack-merge');
const baseComponentConfig = require('@splunk/webpack-configs/component.config').default;

module.exports = webpackMerge(baseComponentConfig, {
    entry: {
        StatusScreen: path.join(__dirname, 'src/StatusScreen.tsx'),
    },
    output: {
        path: path.join(__dirname),
    },
    module: {
        rules: [
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
          },
          {
            test: /\.(png|jpe?g|gif)$/i,
            type: 'asset/resource',
          },
          {
            test: /\.(woff(2)?)$/i,
            type: 'asset/inline',
          },
        ],
    },
});
