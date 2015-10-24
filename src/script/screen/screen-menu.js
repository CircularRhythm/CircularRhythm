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
    $("body").html(template({music_list: this.app.musicList}))
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
  }

  unuse() {
    style.unuse()
    $("body").html("")
  }
}
