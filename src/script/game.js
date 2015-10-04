import $ from "jquery"
import ControllerState from "./controller"
import Renderer from "./renderer"
import { Player } from "./player"

// TODO: Bmson loading method
import bmson from "../../bmson/flicknote_onlylove_remix/onlylove_remix.bmson"
//import bmson from "../../bmson/test/test.bmson"

export default class Game {
  constructor() {
    this.CANVAS_CLASS = "canvas#gameScreen"
    const canvas = document.getElementById("gameScreen")
    this.g = canvas.getContext("2d")

    this.keys = []
    for(let i = 0; i < 256; i++) {
      this.keys[i] = false
    }
    // H J K L
    this.keyConfig = [72, 74, 75, 76]
    this.controller = []
    for(let i = 0; i < 4; i++) {
      this.controller[i] = new ControllerState()
    }

    this.renderer = new Renderer(this)
    this.player = new Player(this, bmson)
  }

  start() {
    this.onResize();
    console.log("Game started.")
    this.player.start()
    this.frame = 0
    this.startTime = Date.now()
    setInterval(() => this.update(), 1000 / 60)
  }

  update() {
    // TODO: Accurate FPS counter
    this.frame ++
    const now = Date.now()
    const fps = this.frame / (now - this.startTime) * 1000

    const g = this.g

    for(let i = 0; i < 4; i++) {
      const keyCode = this.keyConfig[i]
      if(this.keys[keyCode]) {
        switch(this.controller[i].state) {
          case ControllerState.NONE:
          case ControllerState.JUST_RELEASED:
            this.controller[i].state = ControllerState.JUST_PRESSED
            break
          case ControllerState.JUST_PRESSED:
          case ControllerState.PRESSED:
            this.controller[i].state = ControllerState.PRESSED
            break
        }
      } else {
        switch(this.controller[i].state) {
          case ControllerState.NONE:
          case ControllerState.JUST_RELEASED:
            this.controller[i].state = ControllerState.NONE
            break
          case ControllerState.JUST_PRESSED:
          case ControllerState.PRESSED:
            this.controller[i].state = ControllerState.JUST_RELEASED
            break
        }
      }
    }

    g.fillStyle = "#FFFFFF"
    g.rect(0, 0, this.width, this.height)
    g.fill()

    g.save()
    g.translate((this.width - 800) / 2, (this.height - 600) / 2)

    this.player.update(this.controller)
    this.renderer.render(g, this.controller)

    g.restore()

    g.fillStyle = "#000000"
    g.fillText(fps, 32, 32)
  }

  onResize() {
    const body = $("body")
    const width = body.width()
    const height = body.height()

    const canvas = $(this.CANVAS_CLASS)
    canvas.attr("width", width)
    canvas.attr("height", height)

    this.width = width
    this.height = height

    console.log(`Resized: (${width}, ${height})`)
  }

  onKeyDown(e) {
    this.keys[e.keyCode] = true
  }

  onKeyUp(e) {
    this.keys[e.keyCode] = false
  }
}
