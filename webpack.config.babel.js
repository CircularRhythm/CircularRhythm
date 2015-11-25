import webpack from "webpack";

export default {
  output: {
    filename: 'main.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel'
      },
      {
        test: /\.(json|bmson)$/,
        loader: 'json-loader'
      },
      {
        test: /\.jade$/,
        loader: 'jade-loader'
      },
      {
        test: /\.sass$/,
        loaders: ['style-loader/useable', 'css-loader', 'sass-loader?indentedSyntax']
      }
    ]
  },
  resolve: {
  },
  plugins: [
  ]
}
