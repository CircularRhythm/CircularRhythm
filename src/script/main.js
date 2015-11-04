//import fontParser from "parse-bmfont-ascii"
import $ from "jquery"
import getParameter from "get-parameter"
import XHRPromise from "./xhr-promise"

import { Screen, ScreenManager } from "./screen/screen"
import ScreenLoading from "./screen/loading"
import ScreenMenu from "./screen/menu"
import ScreenGame from "./screen/game"
import ScreenResult from "./screen/result"
import { AssetLoaderLocal } from "./player/asset-loader"

class CircularRhythm {
  static main() {
    const serverUrlParam = getParameter("server")
    const debugParam = getParameter("debug")
    const screenParam = getParameter("screen")
    this.serverUrl = serverUrlParam ? serverUrlParam : "http://circularrhythm.github.io/OfficialMusicServer"
    this.debug = debugParam == "true"

    this.musicList = null
    this.localMusicList = []
    this.localFileList = new Map()

    const screens = new Map()
    this.screenManager = new ScreenManager(this, screens)
    screens.set("loading", ScreenLoading)
    screens.set("menu", ScreenMenu)
    screens.set("game", ScreenGame)
    screens.set("result", ScreenResult)
    if(this.debug) {
      switch(screenParam) {
        case "game":
          this.screenManager.changeScreen("game", {
            path: this.serverUrl + "/flicknote_onlylove_remix/onlylove_remix.bmson",
            assetPath: this.serverUrl + "/flicknote_onlylove_remix/assets.json",
            packedAssets: true,
            local: false
          })
          break
        case "result":
          this.screenManager.changeScreen("result", {
            musicName: "TEST",
            judge: [1, 2, 3, 4, 5, 6, 7],
            score: 1000000,
            maxCombo: 100
          })
          break
        case "loading":
        case "menu":
        default:
          this.screenManager.changeScreen("loading")
          break
      }
    } else {
      this.screenManager.changeScreen("loading")
    }
  }
}

$(() => {
  CircularRhythm.main()
})
