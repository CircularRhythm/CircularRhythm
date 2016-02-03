import webpack from "webpack";

// Type: "development", "production"
export default function(type) {
  const development = type == "development"
  const production = type == "production"
  const productionMin = type == "production-min"

  const config = {
    entry: ["./src/script/main.js"],
    output: {
      path: __dirname + "/build/asset/",
      publicPath: "/asset/",
      filename: "main.js",
    },
    module: {
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules|bower_components)/,
          loaders: ["babel"]
        },
        {
          test: /\.json$/,
          loader: "json-loader"
        },
        {
          test: /\.sass$/,
          loaders: ["style-loader/useable", "css-loader?-url", "sass-loader?indentedSyntax"]
        }
      ]
    },
    resolve: {
      extensions: ["", ".js", ".jsx"]
    },
    plugins: []
  }

  if(development) {
    config.devtool = "cheap-module-eval-source-map"
    config.debug = true
    config.entry.push("webpack/hot/dev-server")
    config.plugins.push(new webpack.HotModuleReplacementPlugin())
  }

  if(productionMin) {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin())
  }

  return config
}
