import { merge } from 'webpack-merge';

import commonConfig from './webpack.common';

const devConfig = merge(commonConfig, {
    // Set the mode to development or production
    mode: 'development',

    // Control how source maps are generated
    devtool: 'inline-source-map',

    // Spin up a server for quick development
    devServer: {
        historyApiFallback: true,
        open: true,
        compress: true,
        hot: true,
    },

    module: {
        rules: [
            // Styles: Inject CSS into the head with source maps
            {
                test: /\.(sass|scss|css)$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: { sourceMap: true, importLoaders: 1, modules: false },
                    },
                    { loader: 'postcss-loader', options: { sourceMap: true } },
                    { loader: 'sass-loader', options: { sourceMap: true } },
                ],
            },
        ],
    },
});

export { devConfig as default };
