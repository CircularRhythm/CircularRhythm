//import fontParser from "parse-bmfont-ascii"
import $ from "jquery"
import getParameter from "get-parameter"
import XHRPromise from "./xhr-promise"

import { Screen, ScreenManager } from "./screen/screen"
import ScreenLoading from "./screen/screen-loading"
import ScreenMenu from "./screen/screen-menu"
import ScreenGame from "./screen/screen-game"

class CircularRhythm {
  static main() {
    const serverUrlParam = getParameter("server")
    this.serverUrl = serverUrlParam ? serverUrlParam : "http://circularrhythm.github.io/OfficialMusicServer"

    this.musicList = null
    this.game = null
    this.bmsonData = null

    const screens = new Map()
    this.screenManager = new ScreenManager(screens)
    screens.set("loading", new ScreenLoading(this.screenManager, this))
    screens.set("menu", new ScreenMenu(this.screenManager, this))
    screens.set("game", new ScreenGame(this.screenManager, this))
    this.screenManager.changeScreen("loading")
  }
}

$(() => {
  CircularRhythm.main()
})
