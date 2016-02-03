import g from 'gulp'

import webpackConfig from "./webpack.config.babel.js"
import webpackStream from 'webpack-stream'
import webpack from "webpack"
import webpackDevServer from "webpack-dev-server"

import jade from 'gulp-jade'
import sass from 'gulp-sass'
import svgMin from "gulp-svgmin"
import jsonMinify from "gulp-jsonminify"

import karma from "karma"

import ghPages from 'gulp-gh-pages'
import liveReload from "gulp-livereload"
import del from "del"
import runSequence from "run-sequence"

g.task("html", () =>
  g.src("src/index.jade")
    .pipe(jade({ pretty: true }))
    .pipe(g.dest("build/"))
    .pipe(liveReload())
)

g.task("html_minify", () =>
  g.src("src/index.jade")
    .pipe(jade({ pretty: false }))
    .pipe(g.dest("build/"))
)

g.task("css", () =>
  g.src("src/style.sass")
    .pipe(sass({ indentedSyntax: true, onError: (err) => console.log(err)}))
    .pipe(g.dest("build/asset/"))
    .pipe(liveReload())
)

g.task("css_minify", () =>
  g.src("src/style.sass")
    .pipe(sass({ indentedSyntax: true, outputStyle: "compressed", onError: (err) => console.log(err)}))
    .pipe(g.dest("build/asset/"))
)

g.task("js", () =>
  g.src("src/script/main.js")
    .pipe(webpackStream(webpackConfig("production")))
    .pipe(g.dest("build/asset/"))
    .pipe(liveReload())
)

g.task("js_minify", () =>
  g.src("src/script/main.js")
    .pipe(webpackStream(webpackConfig("production-min")))
    .pipe(g.dest("build/asset/"))
)

g.task("asset", () =>
  g.src(["asset/**/*", "!asset/**/*.{svg,json}"])
    .pipe(g.dest("build/asset/"))
    .pipe(liveReload())
)

g.task("json_minify", () =>
  g.src("asset/**/*.json")
    .pipe(jsonMinify())
    .pipe(g.dest("build/asset/"))
    .pipe(liveReload())
)

g.task("svg_minify", () =>
  g.src("asset/**/*.svg")
    .pipe(svgMin())
    .pipe(g.dest("build/asset/"))
    .pipe(liveReload())
)

g.task("clean", (cb) => del("build/", cb))
g.task("all", ["clean"], (cb) => runSequence(["html", "css", "js", "asset", "svg_minify", "json_minify"], cb))
g.task("all_minify", ["clean"], (cb) => runSequence(["html_minify", "css_minify", "js_minify", "asset", "svg_minify", "json_minify"], cb))

g.task("watch", (cb) => {
  liveReload.listen()
  const config = webpackConfig("development")
  config.entry.unshift("webpack-dev-server/client?http://localhost:8080")
  new webpackDevServer(webpack(config), {
    contentBase: __dirname + "/build/",
    publicPath: "/asset/",
    hot: true,
    stats: { colors: true }
  }).listen(8080, "localhost", cb)
  g.watch("src/index.jade", ["html"])
  g.watch("src/style.sass", ["css"])
  g.watch(["asset/**/*", "!asset/**/*.{svg,json}"], ["asset"])
  g.watch("asset/**/*.svg", ["svg_minify"])
  g.watch("asset/**/*.json", ["json_minify"])
})

g.task("test", (cb) => {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: false
  }, cb).start()
})

g.task("test_single", (cb) => {
  new karma.Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, cb).start()
})

// Travis CI
g.task("deploy", ["all_minify"], () =>
  g.src("build/**/*")
    .pipe(ghPages({remoteUrl: `https://${process.env.GH_TOKEN}@github.com/CircularRhythm/circularrhythm.github.io.git`, branch: "master"}))
)
