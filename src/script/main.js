//import fontParser from "parse-bmfont-ascii"
import $ from "jquery"
import getParameter from "get-parameter"
import Bowser from "bowser"
import XHRPromise from "./xhr-promise"

import React from "react"
import ReactDOM from "react-dom"

import ScreenManager from "./screen-manager"
import ScreenLoading from "./screen/loading"
import ScreenMenu from "./screen/menu"
import ScreenGame from "./screen/game"
import ScreenResult from "./screen/result"
import { AssetLoaderLocal } from "./player/asset-loader"
import { ColorScheme } from "./player/renderer/color-scheme"

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
    this.preference = {
      renderer: {
        colorScheme: null,
        ccwSingle: false,
        ccwDouble1: false,
        ccwDouble2: true
      }
    }

    this.compatibilityWarning = []
    if(!Bowser.chrome) this.compatibilityWarning.push("Incompatible browser is detected. Currently only Google Chrome is supported. The game may not work correctly in other browsers.")
    if(Bowser.mobile && !Bowser.tablet) this.compatibilityWarning.push("Smartphone is detected. Playing this game with smartphones is discouraged.")

    this.screenManager = new ScreenManager(this)
    if(this.debug) {
      switch(screenParam) {
        case "game":
          this.load().then(() => {
            this.screenManager.transit(ScreenGame, {
              bmsonSetConfig: {
                path: this.serverUrl + "/test/test-double.bmson",
                assetPath: this.serverUrl + "/test/assets.json",
                packedAssets: false,
                local: false
              }
            })
          })
          break
        case "result":
          this.load().then(() => {
            this.screenManager.transit(ScreenResult, {
              result: {
                title: "TEST",
                subtitle: "sub",
                mode: 1,
                chartName: "Test",
                level: 0,
                notes: 100,
                judge: [1, 2, 3, 4, 5, 6, 7],
                score: 1000000,
                maxCombo: 100
              },
              bmsonSetConfig: {
                path: this.serverUrl + "/test/test-double.bmson",
                assetPath: this.serverUrl + "/test/assets.json",
                packedAssets: false,
                local: false
              }
            })
          })
          break
        case "loading":
        case "menu":
        default:
          this.screenManager.transit(ScreenLoading, {})
          break
      }
    } else {
      this.screenManager.transit(ScreenLoading, {})
    }
  }

  static load() {
    const promises = []
    promises[0] = new Promise((resolve, reject) => {
      XHRPromise.send({
        url: this.serverUrl + "/index.json",
        responseType: "json"
      }).then((json) => {
        return XHRPromise.send({
          url: this.serverUrl + "/" + json.music_data,
          responseType: "json"
        })
      }).then((json) => {
        this.musicList = json
        resolve()
      }).catch((e) => {
        reject({message: "Cannot connect to server: " + this.app.serverUrl})
      })
    })
    promises[1] = new Promise((resolve, reject) => {
      XHRPromise.send({
        url: "asset/colorscheme/default.json",
        responseType: "json"
      }).then((json) => {
        this.preference.renderer.colorScheme = new ColorScheme(json)
        resolve()
      }).catch((e) => {
        reject({message: "Cannot load color scheme"})
      })
    })

    return Promise.all(promises)
  }
}

$(() => {
  CircularRhythm.main()
})
