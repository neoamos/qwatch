const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = (env, options) => ({
  optimization: {
    minimizer: [
      new TerserPlugin({ cache: true, parallel: true, sourceMap: false }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  entry: {
    './js/app.js': glob.sync('./vendor/**/*.js').concat(['./js/app.js'])
  },
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, '../priv/static/js')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.s?css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      { test: /\.(ttf|eot|otf|svg|woff)(\?v=[0-9]\.[0-9]\.[0-9])?$/, 
        loader: "file-loader",
        options : {
          outputPath: '../css',
        }
      },
      // janus.js does not use 'export' to provide its functionality to others, instead
      // it creates a global variable called 'Janus' and expects consumers to use it.
      // Let's use 'exports-loader' to simulate it uses 'export'.
      {
        test: require.resolve('janus-gateway'),
        use: 'exports-loader?Janus=Janus'
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({ filename: '../css/app.css' }),
    new CopyWebpackPlugin([{ from: 'static/', to: '../' }]),
    // janus.js does not use 'import' to access to the functionality of webrtc-adapter,
    // instead it expects a global object called 'adapter' for that.
    // Let's make that object available.
    new webpack.ProvidePlugin({ adapter: 'webrtc-adapter' })
  ]
});
