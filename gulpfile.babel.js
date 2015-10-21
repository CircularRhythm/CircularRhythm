import g from 'gulp'
import jade from 'gulp-jade'
import sass from 'gulp-sass'
import ghPages from 'gulp-gh-pages'
import webpack from 'webpack-stream'
import webpackConfig from "./webpack.config.babel.js"
import webpackConfigMin from "./webpack.config.min.babel.js"
import del from "del"
import runSequence from "run-sequence"
import liveReload from "gulp-livereload"

g.task("html", () => g.src("src/index.jade").pipe(jade({ pretty: true })).pipe(g.dest("build/")).pipe(liveReload()))
g.task("html_minify", () => g.src("src/index.jade").pipe(jade({ pretty: false })).pipe(g.dest("build/")).pipe(liveReload()))
g.task("css", () => g.src("src/style.sass").pipe(sass({ indentedSyntax: true, onError: (err) => console.log(err)})).pipe(g.dest("build/")).pipe(liveReload()))
g.task("css_minify", () => g.src("src/style.sass").pipe(sass({ indentedSyntax: true, outputStyle: "compressed", onError: (err) => console.log(err)})).pipe(g.dest("build/")).pipe(liveReload()))
g.task("js", () => g.src("src/script/main.js").pipe(webpack(webpackConfig)).pipe(g.dest("build/script/")).pipe(liveReload()))
g.task("js_minify", () => g.src("src/script/main.js").pipe(webpack(webpackConfigMin)).pipe(g.dest("build/script/")).pipe(liveReload()))
//g.task("bmson", () => g.src("bmson/**/*").pipe(g.dest("build/bmson/")))

g.task("clean", (cb) => del("build/", cb))
g.task("all", ["clean"], (cb) => runSequence(["html", "css", "js"], cb))
g.task("all_minify", ["clean"], (cb) => runSequence(["html_minify", "css_minify", "js_minify"], cb))

g.task("watch", () => {
    liveReload.listen()
    g.watch("src/index.jade", ["html"])
    g.watch("src/style.sass", ["css"])
    g.watch("src/script/template/**/*.jade", ["js"])
    g.watch("src/script/template/**/*.sass", ["js"])
    g.watch("src/script/**/*.js", ["js"])
    //g.watch("bmson/**/*", ["bmson"])
  }
)

// Travis CI
g.task("deploy", ["all_minify"], () => g.src("build/**/*").pipe(ghPages({remoteUrl: `https://${process.env.GH_TOKEN}@github.com/CircularRhythm/CircularRhythm.git`})))
