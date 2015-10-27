import template from "../template/result.jade"
import style from "../template/result.sass"

import { Screen } from "./screen"
import $ from "jquery"

export default class ScreenMenu extends Screen {
  constructor(manager, app, resultData) {
    super(manager, app)
    this.resultData = resultData
  }
  use() {
    style.use()
    $("body").html(template(this.resultData))
    $("#return_menu").click(() => {
      this.manager.changeScreen("menu")
    })
  }

  unuse() {
    style.unuse()
    $("body").html("")
  }
}
