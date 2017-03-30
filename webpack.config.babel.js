import webpack from "webpack";

// Type: "development", "production", "production-min", "test", "test-single"
export default function(type) {
  const development = type == "development"
  const production = type == "production"
  const productionMin = type == "production-min"
  const test = type == "test"
  const testSingle = type == "test-single"

  const config = {
    entry: ["./src/script/main.js"],
    output: {
      path: __dirname + "/build/asset/",
      publicPath: "/asset/",
      filename: "main.js"
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
      alias: {
        "circular-rhythm": __dirname + "/src/script/"
      },
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

  if(test) {
    config.devtool = 'inline-source-map'
    config.entry = ["stack-source-map/register", "./test/test_index.js", "webpack/hot/dev-server"]
    config.output = {
      path: __dirname + "/build/",
      publicPath: "/",
      filename: "test.js",
    }
    config.module.loaders[0].loaders.unshift("mocha")

    config.debug = true
    config.plugins.push(new webpack.HotModuleReplacementPlugin())

    // Ignore weird warning
    config.module.exprContextCritical = false
    config.module.noParse = /node_modules\/acorn/
  }

  if(testSingle) {
    config.entry = {}
    config.devtool = 'inline-source-map'
    config.module.preLoaders = [
      {
        test: /\.js$/,
        exclude: /(test|node_modules|bower_components)\//,
        loader: 'isparta-instrumenter'
      }
    ]

    // Ignore weird warning
    config.module.exprContextCritical = false
    config.module.noParse = /node_modules\/acorn/
  }

  return config
}
