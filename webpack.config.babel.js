import webpack from "webpack";

export default {
  output: {
    filename: 'main.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel'
      },
      {
        test: /\.(json|bmson)$/,
        loader: 'json-loader'
      },
      {
        test: /\.sass$/,
        loaders: ['style-loader/useable', 'css-loader', 'sass-loader?indentedSyntax']
      }
    ]
  },
  resolve: {
    extensions: ["", ".js", ".jsx"]
  },
  plugins: [
  ]
}
