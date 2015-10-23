import template from "../template/loading.jade"
import style from "../template/loading.sass"

import { Screen } from "./screen"
import $ from "jquery"
import XHRPromise from "../xhr-promise"

export default class ScreenLoading extends Screen {
  constructor(manager, cr) {
    super(manager, cr)
    console.log(this.cr)
  }
  use() {
    style.use()
    $("body").html(template())

    new Promise((resolve, reject) => {
      XHRPromise.send({
        url: this.cr.serverUrl + "/index.json",
        responseType: "json"
      }).then((json) => {
        return XHRPromise.send({
          url: this.cr.serverUrl + "/" + json.music_data,
          responseType: "json"
        })
      }).then((json) => {
        console.log(json)
        resolve(json)
      }).catch((e) => {
        console.error("Error connecting to server: " + serverUrl)
        $("#loading").text("An error occured while loading")
        $("#error").text("Cannot connect to server: " + serverUrl)
      })
    }).then((musicList) => {
      this.cr.musicList = musicList
      this.manager.changeScreen("menu")
    })
  }

  unuse() {
    style.unuse()
    $("body").html("")
  }
}
