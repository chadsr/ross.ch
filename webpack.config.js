// webpack v4
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const WriteFilePlugin = require('write-file-webpack-plugin');

const srcDir = path.resolve(__dirname, 'src');
const publicDir = path.join(__dirname, 'public');
const jsDir = path.join(publicDir, 'js');
const imagesDir = path.join(publicDir, 'images');
const viewsDir = path.join(srcDir, 'views');
const partialsDir = path.join(viewsDir, 'partials');
const helpersDir = path.join(viewsDir, 'helpers');

const nodeEnv = process.env.NODE_ENV || 'development';

module.exports = {
  mode: nodeEnv,
  entry: [path.join(jsDir, 'main.js')],
  output: {
    path: publicDir,
    filename: '[name].[hash].js',
    publicPath: 'dist/'
  },
  devServer: {
    port: 3000,
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
      filename: path.join(partialsDir, 'webpack.hbs') // Write the handlebars to the partials dir instead of public
    }),
    new ImageminPlugin({
      test: /\.(jpe?g|png|gif|svg)$/i,
      pngquant: {
        quality: '95-100'
      }
    }),
    /*new FaviconsWebpackPlugin({
    logo: path.join(imagesDir, 'favicon.png'),
    inject: true
    }),*/
],
optimization: {
  minimizer: [new UglifyJsPlugin()]
}
};
