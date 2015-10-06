import $ from "jquery"
import ControllerState from "./controller"
import Renderer from "./renderer"
import { Player } from "./player"

export class Game {
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

    this.state = States.LOADING

    // TODO: Make it async
    const bmsonPath = "bmson/flicknote_onlylove_remix/onlylove_remix.bmson"
    const parentPath = bmsonPath.replace(/\/[^\/]*$/, "")
    new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.open("GET", bmsonPath)
      request.responseType = "json"
      request.onload = () => {
        if(request.status == 200) {
          resolve(request.response)
        } else {
          console.error(request.statusText)
        }
      }
      request.onerror = () => reject(console.error("Network Error"))
      request.send()
    }).then((bmson) => {
      this.player = new Player(this, bmson, parentPath)
      this.renderer = new Renderer(this)

      this.player.loadAudio().then(() => {
        this.state = States.IN_GAME
        this.player.start()
      })
    })
  }

  start() {
    this.onResize();
    console.log("Game started.")
    this.frame = 0
    this.startTime = Date.now()
    this.update()
  }

  update() {
    // TODO: Accurate FPS counter
    this.frame ++
    const frameStartTime = Date.now()
    const fps = this.frame / (frameStartTime - this.startTime) * 1000

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

    if(this.state == States.LOADING) {
      g.fillStyle = "#000000"
      g.fillText("LOADING", 32, 64)
    } else {
      g.save()
      g.translate((this.width - 800) / 2, (this.height - 600) / 2)

      this.player.update(this.controller)
      this.renderer.render(g, this.controller)

      g.restore()
    }


    g.fillStyle = "#000000"
    g.fillText(fps, 32, 32)

    setTimeout(() => this.update(), 10)
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

export class States {
  static get LOADING() { return 0 }
  static get IN_GAME() { return 1 }
}
