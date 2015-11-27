import React from "react"
import ReactDOM from "react-dom"

export default class ScreenManager {
  // String => Screen
  constructor(app, screens) {
    this.app = app
    this.screens = screens
    this.currentScreen = null
  }

  transit(reactClass, data) {
    const bindData = {}
    bindData.app = this.app
    bindData.manager = this
    for(let key in data) bindData[key] = data[key]
    ReactDOM.render(
      React.createElement(reactClass, bindData),
      document.getElementById("container")
    )
  }
}
