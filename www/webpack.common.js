const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    app: './bootstrap.js'
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin(['index.html', 'favicon.ico'])
  ],
  output: {
    filename: 'bootstrap.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      // https://getbootstrap.com/docs/4.0/getting-started/webpack/#importing-compiled-css
      { test: /\.css$/, use: [{ loader: 'style-loader' }, { loader: 'css-loader' }] },
      { test: /\.(ttf|eot|svg|otf|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/i, loader: 'file-loader' }
    ]
  }
}
