import template from "../template/loading.jade"
import style from "../template/loading.sass"

import { Screen } from "./screen"
import $ from "jquery"
import XHRPromise from "../xhr-promise"

export default class ScreenLoading extends Screen {
  constructor(manager, app) {
    super(manager, app)
  }
  use() {
    style.use()
    $("body").html(template())

    this.app.load().then(() => {
      this.manager.changeScreen("menu")
    }).catch((e) => {
      console.error(e.message)
      $("#loading").text("An error occured while loading")
      $("#error").text(e.message)
    })
  }

  unuse() {
    style.unuse()
    $("body").html("")
  }
}
