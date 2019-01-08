// webpack v4
import { join, resolve } from 'path';
import * as CleanWebpackPlugin from 'clean-webpack-plugin';
import * as WebpackMd5Hash from 'webpack-md5-hash';
import * as HtmlWebpackPlugin from 'html-webpack-plugin';
import * as UglifyJsPlugin from 'uglifyjs-webpack-plugin';
import WebappWebpackPlugin from 'webapp-webpack-plugin';
import ImageminPlugin from 'imagemin-webpack-plugin';
import * as WriteFilePlugin from 'write-file-webpack-plugin';

const srcDir = resolve(__dirname, 'src');
const publicDir = resolve(__dirname, 'public');
const jsDir = join(srcDir, 'scripts');
const imagesDir = join(srcDir, 'images');
const viewsDir = join(srcDir, 'views');
const partialsDir = join(viewsDir, 'partials');
const helpersDir = join(viewsDir, 'helpers');

const nodeEnv = process.env.NODE_ENV || 'development';

module.exports = {
  mode: nodeEnv,
  devtool: 'inline-source-map',
  entry: [join(jsDir, 'main')],
  output: {
    path: publicDir,
    filename: '[name].[hash].js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  devServer: {
    port: process.env.PORT,
    open: true
  },
  module: {
    rules: [
      {
        test: /\.hbs$/,
        loader: 'handlebars-loader',
        query: {
          partialDirs: [
            partialsDir
          ],
          helperDirs: [
            helpersDir
          ]
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      },
      {
        test: /\.(sass|scss)$/,
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      },
      {
        test: /\.(gif|png|jpe?g|svg)$/i,
        use: [
          'file-loader',
          {
            loader: 'image-webpack-loader',
            options: {
              bypassOnDebug: true
            }
          }
        ]
      },
      {
        test: /\.(woff(2)?|ttf|eot|otf)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'fonts/'
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin([publicDir]),
    new WriteFilePlugin({ // We need the files in dev mode due to handlebars partial...
      test:  /\.hbs$/
    }),
    new WebpackMd5Hash(),
    new HtmlWebpackPlugin({
      templateContent: '',
      filename: join(partialsDir, 'webpack.hbs') // Write the handlebars to the partials dir instead of public
    }),
    new ImageminPlugin({
      test: /\.(jpe?g|png|gif|svg)$/i,
      pngquant: {
        quality: '95-100'
      }
    }),
    /*new WebappWebpackPlugin({
    logo: join(imagesDir, 'favicon.png'),
    inject: true
    }),*/
],
optimization: {
  minimizer: [new UglifyJsPlugin()]
}
};
