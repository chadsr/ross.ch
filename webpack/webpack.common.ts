import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import * as CopyWebpackPlugin from 'copy-webpack-plugin';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as ImageMinimizerPlugin from 'image-minimizer-webpack-plugin';
import FaviconsWebpackPlugin = require('favicons-webpack-plugin');
import { join } from 'path';

import Paths from './paths';

module.exports = {
    // Where webpack looks to start building the bundle
    entry: [join(Paths.scripts, 'main.ts')],

    // Where webpack outputs the assets and bundles
    output: {
        path: Paths.buildPublic,
        filename: 'js/[name].[contenthash].bundle.js',
        publicPath: '/',
    },

    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        fallback: {
            fs: false,
            os: false,
            path: false,
        },
    },

    // Customize the webpack build process
    plugins: [
        // Removes/cleans build folders and unused assets when rebuilding
        new CleanWebpackPlugin(),
        new ImageMinimizerPlugin({
            minimizerOptions: {
                plugins: [
                    ['gifsicle', { interlaced: true }],
                    ['mozjpeg', { quality: 70 }],
                    ['optipng', { optimizationLevel: 5 }],
                ],
            },
        }),
        new FaviconsWebpackPlugin({
            logo: join(Paths.images, 'favicon.png'),
            inject: true,
            favicons: {
                icons: {
                    android: true,
                    appleIcon: true,
                    appleStartup: true,
                    coast: false,
                    favicons: true,
                    firefox: false,
                    windows: false,
                    yandex: false,
                },
            },
        }),
        new HtmlWebpackPlugin({
            template: join(Paths.partials, 'head.hbs'),
            inject: 'head',
            filename: join(Paths.partials, 'webpack.hbs'), // Write the handlebars to the partials dir instead of dist
        }),
        // Copies files from target to destination folder
        new CopyWebpackPlugin({
            patterns: [
                { from: Paths.public, to: Paths.buildPublic },
                { from: Paths.views, to: join(Paths.buildSrc, 'views') },
            ],
        }),
    ],

    // Determine how modules within the project are treated
    module: {
        rules: [
            // Typescript: Use ts-loader and babel-loader
            { test: /\.ts(x?)$/, exclude: /node_modules/, use: ['babel-loader', 'ts-loader'] },

            // JavaScript: Use Babel to transpile JavaScript files
            { test: /\.js$/, exclude: /node_modules/, use: ['babel-loader'] },

            // Images: Copy image files to build folder
            { test: /\.(?:ico|gif|png|jpg|jpeg)$/i, type: 'asset/resource' },

            // Fonts and SVGs: Inline files
            { test: /\.(woff(2)?|eot|ttf|otf|svg|)$/, type: 'asset/inline' },
        ],
    },
};
