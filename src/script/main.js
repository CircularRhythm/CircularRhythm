//import fontParser from "parse-bmfont-ascii"
import $ from "jquery"
import getParameter from "get-parameter"
import XHRPromise from "./xhr-promise"

import { Screen, ScreenManager } from "./screen/screen"
import ScreenLoading from "./screen/loading"
import ScreenMenu from "./screen/menu"
import ScreenGame from "./screen/game"
import ScreenResult from "./screen/result"

class CircularRhythm {
  static main() {
    const serverUrlParam = getParameter("server")
    this.serverUrl = serverUrlParam ? serverUrlParam : "http://circularrhythm.github.io/OfficialMusicServer"

    this.musicList = null

    const screens = new Map()
    this.screenManager = new ScreenManager(this, screens)
    screens.set("loading", ScreenLoading)
    screens.set("menu", ScreenMenu)
    screens.set("game", ScreenGame)
    screens.set("result", ScreenResult)
    this.screenManager.changeScreen("loading")
    /*this.screenManager.changeScreen("result", {
      musicName: "TEST",
      judge: [1, 2, 3, 4, 5, 6, 7],
      score: 1000000,
      maxCombo: 100
    })*/
  }
}

$(() => {
  CircularRhythm.main()
})
