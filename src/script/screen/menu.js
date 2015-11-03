import template from "../template/menu.jade"
import style from "../template/menu.sass"

import { Screen } from "./screen"
import $ from "jquery"
import { LocalBmsonLoader } from "../local-bmson-loader"

import musicEntryTemplate from "../template/menu-musicentry.jade"
import musicDetailTemplate from "../template/menu-music-detail.jade"
import chartDetailTemplate from "../template/menu-chart-detail.jade"

export default class ScreenMenu extends Screen {
  constructor(manager, app) {
    super(manager, app)
  }
  use() {
    style.use()
    $("body").html(template())
    this.app.musicList.forEach((music) => this.addMusicEntry(music))
    this.app.localMusicList.forEach((music) => this.addMusicEntryLocal(music))
    $("#drop").click(() => $("#drop").hide())
    $("body").on({
      "dragenter": (e) => {
        e.stopPropagation()
        e.preventDefault()
        if(e.originalEvent.dataTransfer.types.indexOf("Files") == -1) return
        $("#drop").show()
        $("#drop").off("dragleave dragover drop")
        $("#drop").on({
          "dragenter": (e) => {
            e.stopPropagation()
            e.preventDefault()
          },
          "dragleave": (e) => {
            e.stopPropagation()
            e.preventDefault()
            $("#drop").hide()
          },
          "dragover": (e) => {
            e.stopPropagation()
            e.preventDefault()
          },
          "drop": (e) => {
            e.stopPropagation()
            e.preventDefault()
            $("#drop").hide()
            this.onDropFiles(e.originalEvent.dataTransfer)
          }
        })
      }
    })
  }

  onDropFiles(dataTransfer) {
    const length = dataTransfer.items.length
    for(let i = 0; i < length; i++) {
      const entry = dataTransfer.items[i].webkitGetAsEntry()
      if(entry.isDirectory) {
        const loader = new LocalBmsonLoader(this.app.localFileList)
        loader.load(entry).then((music) => {
          this.app.localMusicList.push(music)
          this.addMusicEntryLocal(music)
        })
      }
    }
  }

  registerDifficultyButtonEvent(music, i, elem, type) {
    const e = $(elem)
    e.click(() => {
      if(e.hasClass("button-active")) {
        e.removeClass("button-active")
        $("#chart-detail").html("")
        $("#chart-detail").slideUp(300)
      } else {
        $("#detail-difficulty-single .button").removeClass("button-active")
        $("#detail-difficulty-double .button").removeClass("button-active")
        e.addClass("button-active")
        $("#chart-detail").html(chartDetailTemplate({type: type, chart: music.charts[type][i]}))
        $("#chart-detail").slideDown(300)
        $("#play-button").click(() => this.decideMusic(music, music.charts[type][i]))
      }
    })
  }

  decideMusic(music, chart) {
    const bmsonSetConfig = {}
    if(music.local) {
      bmsonSetConfig.path = music.basedir + "/" + chart.file
      bmsonSetConfig.local = true
    } else {
      bmsonSetConfig.path = this.app.serverUrl + "/" + music.basedir + "/" + chart.file
      bmsonSetConfig.local = false
      if(music.packed_assets) {
        bmsonSetConfig.packedAssets = true
        bmsonSetConfig.assetPath = this.app.serverUrl + "/" + music.basedir + "/assets.json"
      } else {
        bmsonSetConfig.packedAssets = false
      }
    }

    this.manager.changeScreen("game", bmsonSetConfig)
  }

  addMusicEntry(music) {
    $("#music-list").append(musicEntryTemplate({music: music}))
    $("#music-list .music-container:last").click(() => {
      $("#chart-detail").html("")
      $("#chart-detail").slideUp(300)
      $("#music-detail").html(musicDetailTemplate({music: music}))
      $("#detail-difficulty-single .button").each((i, elem) => this.registerDifficultyButtonEvent(music, i, elem, "single"))
      $("#detail-difficulty-double .button").each((i, elem) => this.registerDifficultyButtonEvent(music, i, elem, "double"))
    })
  }

  addMusicEntryLocal(music) {
    $("#local-music-list").append(musicEntryTemplate({music: music}))
    $("#local-music-list .music-container:last").click(() => {
      $("#chart-detail").html("")
      $("#chart-detail").slideUp(300)
      $("#music-detail").html(musicDetailTemplate({music: music}))
      $("#detail-difficulty-single .button").each((i, elem) => this.registerDifficultyButtonEvent(music, i, elem, "single"))
      $("#detail-difficulty-double .button").each((i, elem) => this.registerDifficultyButtonEvent(music, i, elem, "double"))
    })
  }

  unuse() {
    style.unuse()
    $("body").html("")
    $("body").off("dragenter")
  }
}
