import g from 'gulp';
import jade from 'gulp-jade';
import sass from 'gulp-sass';
import webpack from 'webpack-stream';
import webpackConfig from "./webpack.config.js";
import del from "del"
import runSequence from "run-sequence"
import liveReload from "gulp-livereload"

g.task("html", () => g.src("src/index.jade").pipe(jade({ pretty: true })).pipe(g.dest("build/")).pipe(liveReload()));
g.task("css", () => g.src("src/style.sass").pipe(sass({ indentedSyntax: true, onError: (err) => console.log(err)})).pipe(g.dest("build/")).pipe(liveReload()));
g.task("js", () => g.src("src/script/main.js").pipe(webpack(webpackConfig)).pipe(g.dest("build/script/")).pipe(liveReload()));
g.task("bmson", () => g.src("bmson/**/*").pipe(g.dest("build/bmson/")))

g.task("all", ["clean"], (cb) => runSequence(["html", "css", "js", "bmson"], cb));
g.task("clean", (cb) => del("build/", cb));

g.task("watch", () => {
    liveReload.listen();
    g.watch("src/index.jade", ["html"]);
    g.watch("src/style.sass", ["css"]);
    g.watch("src/script/template/**/*.jade", ["js"]);
    g.watch("src/script/template/**/*.sass", ["js"]);
    g.watch("src/script/**/*.js", ["js"]);
    g.watch("bmson/**/*", ["bmson"]);
  }
);
