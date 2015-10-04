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
        test: /\.bmson$/,
        loader: 'json-loader'
      }
    ]
  },
  resolve: {
  }
}
