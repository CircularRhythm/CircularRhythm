import fontParser from "parse-bmfont-ascii"
import $ from "jquery"
import { Game } from "./game"
import XHRPromise from "./xhr-promise"

import templateLoading from "./template/loading.jade"
import styleLoading from "./template/loading.sass"
import templateMenu from "./template/menu.jade"
import styleMenu from "./template/menu.sass"

function endGame() {
  $("body").html('')
  $(window).unbind("resize keydown keyup")
}

function startGame(bmsonPath) {
  const game = new Game(bmsonPath, endGame)
  game.start()
  $(window).bind({
    "resize": () => game.onResize(),
    "keydown": (e) => game.onKeyDown(e),
    "keyup": (e) => game.onKeyUp(e)
  })
}
$(() => {
  styleLoading.use()
  $("body").html(templateLoading())

  const serverUrl = "http://circularrhythm.github.io/OfficialMusicServer"

  new Promise((resolve, reject) => {
    XHRPromise.send({
      url: serverUrl + "/index.json",
      responseType: "json"
    }).then((json) => {
      return XHRPromise.send({
        url: serverUrl + "/" + json.music_data,
        responseType: "json"
      })
    }).then((json) => {
      console.log(json)
      resolve(json)
    }).catch((e) => {
      console.error("Error connecting to server")
    })
  }).then((musicData) => {
    styleLoading.unuse()
    styleMenu.use()
    $("body").html(templateMenu({music_list: musicData}))
    $("#music_list").each((i, element) => {
      const e = $(element)
      e.click(() => {
        const music = musicData[i]
        const bmsonPath = serverUrl + "/" + music.basedir + "/" + music.charts[0].file
        const assetPath = serverUrl + "/" + music.basedir + "/assets.json"
        styleMenu.unuse()
        $("body").html('<canvas id="gameScreen"></canvas>')
        startGame({path: bmsonPath, assetPath: assetPath})
      })
    })
  })
});
