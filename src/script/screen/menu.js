import template from "../template/menu.jade"
import style from "../template/menu.sass"

import { Screen } from "./screen"
import $ from "jquery"

export default class ScreenMenu extends Screen {
  constructor(manager, app) {
    super(manager, app)
  }
  use() {
    style.use()
    $("body").html(template({music_list: this.app.musicList, local_music_list: this.app.localMusicList}))
    $("#music_list .music_container").each((i, element) => {
      const e = $(element)
      e.click(() => {
        const music = this.app.musicList[i]
        const bmsonPath = this.app.serverUrl + "/" + music.basedir + "/" + music.charts[0].file
        const assetPath = this.app.serverUrl + "/" + music.basedir + "/assets.json"
        const packedAssets = music.packed_assets
        const bmsonSetConfig = {path: bmsonPath, packedAssets: packedAssets, assetPath: assetPath}
        this.manager.changeScreen("game", bmsonSetConfig)
      })
    })
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
        $("body").html(template({music_list: this.app.musicList, local_music_list: this.app.localMusicList}))
      }
      reader.readAsText(file)
    })
  }

  unuse() {
    style.unuse()
    $("body").html("")
    $("body").off("dragenter")
  }
}
