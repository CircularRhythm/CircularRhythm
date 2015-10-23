import template from "../template/menu.jade"
import style from "../template/menu.sass"

import { Screen } from "./screen"
import $ from "jquery"

export default class ScreenMenu extends Screen {
  constructor(manager, cr) {
    super(manager, cr)
  }
  use() {
    style.use()
    $("body").html(template({music_list: this.cr.musicList}))
    $("#music_list .music_container").each((i, element) => {
      const e = $(element)
      e.click(() => {
        const music = this.cr.musicList[i]
        const bmsonPath = this.cr.serverUrl + "/" + music.basedir + "/" + music.charts[0].file
        const assetPath = this.cr.serverUrl + "/" + music.basedir + "/assets.json"
        const packedAssets = music.packed_assets
        this.cr.bmsonData = {path: bmsonPath, packedAssets: packedAssets, assetPath: assetPath}
        this.manager.changeScreen("game")
      })
    })
  }

  unuse() {
    style.unuse()
    $("body").html("")
  }
}
