const path = require('path'),
  fs = require('fs'),
  MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  entry: [
    'core-js/stable',
    'regenerator-runtime/runtime',
    './js/css-color-variables-ui.js',
    './css/css-color-variables-ui.css',
    './node_modules/awesome-notifications/dist/style.css'
  ],
  output: {
    path: path.join(__dirname, '../build/'),
    filename: 'css-color-variables-ui.js'
  },
  plugins: [
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  ],
  module: {
    rules: [
      {
        exclude: [/(node_modules)/],
        use: [{
          loader: 'babel-loader',
          options: {
            ...JSON.parse(fs.readFileSync(path.resolve(__dirname, '.babelrc'))),
          }
        }]
      },
      {
        test: [/\.scss$/, /\.css$/],
        exclude: [/install\.scss/],
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false, sourceMap: true } },
          { loader: 'sass-loader', options: { sourceMap: true } }
        ],
      },
      {
        test: [/install\.scss$/],
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false, sourceMap: true } },
          { loader: 'sass-loader', options: { sourceMap: true } }
        ],
      }
    ]
  },
  devtool: 'source-map',
};
