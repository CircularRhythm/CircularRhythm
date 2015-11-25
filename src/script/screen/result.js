import template from "../template/result.jade"
import style from "../template/result.sass"

import { Screen } from "./screen"
import $ from "jquery"

export default class ScreenMenu extends Screen {
  constructor(manager, app, resultData, bmsonSetConfig) {
    super(manager, app)
    this.resultData = resultData
    this.bmsonSetConfig = bmsonSetConfig
  }
  use() {
    style.use()
    $("body").html(template(this.resultData))
    $("#return_menu").click(() => {
      this.manager.changeScreen("menu")
    })
    $("#retry").click(() => {
      this.manager.changeScreen("game", this.bmsonSetConfig)
    })
    if(typeof twttr !== "undefined") twttr.widgets.load()
  }

  unuse() {
    style.unuse()
    $("body").html("")
  }
}
