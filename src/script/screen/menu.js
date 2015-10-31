import template from "../template/menu.jade"
import style from "../template/menu.sass"

import { Screen } from "./screen"
import $ from "jquery"

import musicEntryTemplate from "../template/menu-musicentry.jade"

export default class ScreenMenu extends Screen {
  constructor(manager, app) {
    super(manager, app)
  }
  use() {
    style.use()
    $("body").html(template())
    this.app.musicList.forEach((music) => this.addMusicEntry(music))
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
    const that = this
    // readEntries can list only 100 files
    function readDirectory(reader, entries) {
      if(entries.length > 0) {
        reader.readEntries((entries) => readDirectory(reader, entries))
      }

      entries.forEach((e, i) => traverse(e))
    }
    function traverse(entry) {
      if(entry.isDirectory) {
        const reader = entry.createReader()
        reader.readEntries((entries) => readDirectory(reader, entries))
      } else {
        const path = entry.filesystem.name + entry.fullPath
        that.app.localFileList.set(path, entry)
        if(entry.name.search(/\.bmson$/) >= 0) {
          that.addLocalBmson(entry)
        }
      }
    }

    const length = dataTransfer.items.length
    for(let i = 0; i < length; i++) {
      traverse(dataTransfer.items[i].webkitGetAsEntry())
    }
  }

  addLocalBmson(entry) {
    const path = entry.filesystem.name + entry.fullPath
    const parentPath = path.replace(/\/[^\/]*$/, "")
    entry.file((file) => {
      const reader = new FileReader()
      reader.onloadend = (event) => {
        const bmson = JSON.parse(event.target.result)
        const music = {
          name: bmson.info.title,
          basedir: parentPath,
          local: true
        }
        this.app.localMusicList.push(music)
        //$("body").html(template({music_list: this.app.musicList, local_music_list: this.app.localMusicList}))
        this.addMusicEntryLocal(music)
      }
      reader.readAsText(file)
    })
  }

  addMusicEntry(music) {
    $("#music_list").append(musicEntryTemplate({music: music}))
    $("#music_list .music_container:last").click(() => {
      const bmsonSetConfig = {}
      bmsonSetConfig.path = this.app.serverUrl + "/" + music.basedir + "/" + music.charts[0].file
      bmsonSetConfig.local = false
      if(music.packed_assets) {
        bmsonSetConfig.packedAssets = true
        bmsonSetConfig.assetPath = this.app.serverUrl + "/" + music.basedir + "/assets.json"
      } else {
        bmsonSetConfig.packedAssets = false
      }

      this.manager.changeScreen("game", bmsonSetConfig)
    })
  }

  addMusicEntryLocal(music) {
    $("#local_music_list").append(musicEntryTemplate({music: music}))
    $("#local_music_list .music_container:last").click(() => {
      const bmsonSetConfig = {}
      bmsonSetConfig.path = music.basedir
      bmsonSetConfig.local = true
      bmsonSetConfig.packedAssets = false

      this.manager.changeScreen("game", bmsonSetConfig)
    })
  }

  unuse() {
    style.unuse()
    $("body").html("")
    $("body").off("dragenter")
  }
}
