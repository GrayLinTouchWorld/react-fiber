const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
module.exports = {
  mode: "development",
  devtool: 'source-map',
  entry: {
    app: './src/index.js'
  },
  output:{
    path: path.join(__dirname, 'dist'),
    filename: '[name].boundle.js'
  },
  module:{
    rules:[
      {
        test: /\.js$/,
        use: 'babel-loader'
      }
    ]
  },
  devServer: {
    port:3001
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    })
  ]
}