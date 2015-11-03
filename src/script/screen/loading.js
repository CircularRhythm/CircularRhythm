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

    new Promise((resolve, reject) => {
      XHRPromise.send({
        url: this.app.serverUrl + "/index.json",
        responseType: "json"
      }).then((json) => {
        return XHRPromise.send({
          url: this.app.serverUrl + "/" + json.music_data,
          responseType: "json"
        })
      }).then((json) => {
        console.log(json)
        resolve(json)
      }).catch((e) => {
        console.error("Error connecting to server: " + this.app.serverUrl)
        $("#loading").text("An error occured while loading")
        $("#error").text("Cannot connect to server: " + this.app.serverUrl)
      })
    }).then((musicList) => {
      this.app.musicList = musicList
      this.manager.changeScreen("menu")
    })
  }

  unuse() {
    style.unuse()
    $("body").html("")
  }
}
