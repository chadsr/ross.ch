// webpack v4
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import * as CopyPlugin from 'copy-webpack-plugin';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as ImageMinimizerPlugin from 'image-minimizer-webpack-plugin';
import { join, resolve } from 'path';
import WebpackDeepScopeAnalysisPlugin from 'webpack-deep-scope-plugin';
import * as WriteFilePlugin from 'write-file-webpack-plugin';
import FaviconsWebpackPlugin = require('favicons-webpack-plugin');
import { Config } from './src/config';

const srcDir = resolve(__dirname, 'src');
const publicDir = resolve(__dirname, 'public');
const jsDir = join(srcDir, 'scripts');
const assetsDir = join(srcDir, 'assets');
const imagesDir = join(assetsDir, 'images');
const filesDir = join(assetsDir, 'files');
const stylesDir = join(srcDir, 'stylesheets');
const viewsDir = join(srcDir, 'views');
const partialsDir = join(viewsDir, 'partials');
const helpersDir = join(viewsDir, 'helpers');

const nodeEnv = process.env.NODE_ENV || 'development';

module.exports = {
    mode: nodeEnv,
    node: {
        fs: 'empty',
    },
    entry: [join(jsDir, 'main')],
    output: { path: publicDir, filename: '[name].[hash].js', publicPath: '/' },
    resolve: { extensions: ['.ts', '.tsx', '.js'] },
    devServer: { port: process.env.PORT, open: true },
    module: {
        rules: [
            {
                test: /\.hbs$/,
                loader: 'handlebars-loader',
                query: { partialDirs: [partialsDir], helperDirs: [helpersDir] },
            },
            { test: /\.js$/, exclude: /node_modules/, use: { loader: 'babel-loader' } },
            { test: /\.tsx?$/, loader: 'ts-loader' },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [['postcss-preset-env', {}]],
                            },
                        },
                    },
                    'sass-loader',
                ],
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
            },
            {
                test: /\.(woff(2)?|ttf|eot|otf)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: { name: '[name].[ext]', outputPath: 'fonts/' },
                    },
                ],
            },
        ],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new WebpackDeepScopeAnalysisPlugin(),
        new WriteFilePlugin({
            // We need the files in dev mode due to handlebars partial...
            test: /\.hbs$/,
        }),
        new HtmlWebpackPlugin({
            template: join(partialsDir, 'head.hbs'),
            title: Config.title,
            meta: {
                description: Config.description,
            },
            inject: 'head',
            filename: join(partialsDir, 'webpack.hbs'), // Write the handlebars to the
            // partials dir instead of public
        }),
        new FaviconsWebpackPlugin({
            logo: join(imagesDir, 'favicon.png'),
            inject: true,
            favicons: {
                icons: {
                    android: false,
                    appleIcon: false,
                    appleStartup: false,
                    coast: false,
                    favicons: true,
                    firefox: false,
                    windows: false,
                    yandex: false,
                },
            },
        }),
        new CopyPlugin({
            patterns: [
                { from: filesDir, to: join(publicDir, 'files') },
                { from: join(stylesDir, 'nojs.css'), to: publicDir },
            ],
        }),
        new ImageMinimizerPlugin({
            minimizerOptions: {
                plugins: [
                    ['gifsicle', { interlaced: true }],
                    ['mozjpeg', { quality: 70 }],
                    ['optipng', { optimizationLevel: 5 }],
                    [
                        'svgo',
                        {
                            plugins: [
                                {
                                    removeViewBox: false,
                                },
                            ],
                        },
                    ],
                ],
            },
        }),
    ],
};
