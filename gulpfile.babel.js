import g from 'gulp'
import jade from 'gulp-jade'
import sass from 'gulp-sass'
import ghPages from 'gulp-gh-pages'
import webpackStream from 'webpack-stream'
import svgMin from "gulp-svgmin"
import webpackConfig from "./webpack.config.babel.js"
import del from "del"
import runSequence from "run-sequence"
import liveReload from "gulp-livereload"
import webpack from "webpack"
import webpackDevServer from "webpack-dev-server"

g.task("html", () => g.src("src/index.jade").pipe(jade({ pretty: true })).pipe(g.dest("build/")).pipe(liveReload()))
g.task("html_minify", () => g.src("src/index.jade").pipe(jade({ pretty: false })).pipe(g.dest("build/")).pipe(liveReload()))
g.task("css", () => g.src("src/style.sass").pipe(sass({ indentedSyntax: true, onError: (err) => console.log(err)})).pipe(g.dest("build/asset/")).pipe(liveReload()))
g.task("css_minify", () => g.src("src/style.sass").pipe(sass({ indentedSyntax: true, outputStyle: "compressed", onError: (err) => console.log(err)})).pipe(g.dest("build/asset/")).pipe(liveReload()))
g.task("js", () => g.src("src/script/main.js").pipe(webpackStream(webpackConfig("production"))).pipe(g.dest("build/asset/")).pipe(liveReload()))
g.task("js_minify", () => g.src("src/script/main.js").pipe(webpackStream(webpackConfig("production-min"))).pipe(g.dest("build/asset/")).pipe(liveReload()))
g.task("asset", () => g.src("asset/**/*").pipe(g.dest("build/asset/")).pipe(liveReload()))
g.task("svg_minify", () => g.src("asset/**/*.svg").pipe(svgMin()).pipe(g.dest("build/asset/")).pipe(liveReload()))

g.task("clean", (cb) => del("build/", cb))
g.task("all", ["clean"], (cb) => runSequence(["html", "css", "js", "asset"], cb))
g.task("all_minify", ["clean"], (cb) => runSequence(["html_minify", "css_minify", "js_minify", "asset"], cb))

g.task("watch", (cb) => {
  liveReload.listen()
  const config = webpackConfig("development")
  new webpackDevServer(webpack(config), {
    contentBase: __dirname + "/build/",
    publicPath: "/asset/",
    hot: true,
    stats: { colors: true }
  }).listen(8080, "localhost", cb)
  g.watch("src/index.jade", ["html"])
  g.watch("src/style.sass", ["css"])
  g.watch("asset/**/*", ["asset", "svg_minify"])
  //g.watch("src/script/**/*.sass", ["js"])
  //g.watch("src/script/**/*.js", ["js"])
  //g.watch("src/script/**/*.jsx", ["js"])
})

// Travis CI
g.task("deploy", ["all_minify"], () => g.src("build/**/*").pipe(ghPages({remoteUrl: `https://${process.env.GH_TOKEN}@github.com/CircularRhythm/circularrhythm.github.io.git`, branch: "master"})))
