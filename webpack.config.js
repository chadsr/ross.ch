// webpack v4
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;

const srcDir = path.resolve(__dirname, 'src');
const publicDir = path.join(srcDir, 'public');
const jsDir = path.join(srcDir, 'js');
const imagesDir = path.join(srcDir, 'images');
const viewsDir = path.join(srcDir, 'views');

module.exports = {
  entry: {
    main: path.join(jsDir, 'main.js'),
  },
  output: {
    path: publicDir,
    filename: '[name].[hash].js',
    publicPath: '/'
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
            path.join(viewsDir, '/partials')
          ],
          helperDirs: [
            path.join(viewsDir, '/helpers')
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
    new WebpackMd5Hash(),
    /*new FaviconsWebpackPlugin({
      logo: path.join(imagesDir, 'favicon.png'),
      inject: true
    }),*/
    new HtmlWebpackPlugin({
      templateContent: '',
      filename: 'webpack.hbs'
    }),
    new ImageminPlugin({
      test: /\.(jpe?g|png|gif|svg)$/i,
      pngquant: {
        quality: '95-100'
      }
    })
],
optimization: {
  minimizer: [new UglifyJsPlugin()]
}
};
