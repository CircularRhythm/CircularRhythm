import $ from "jquery"
import { Timer, TimerDate, TimerPerformance } from "./timer"
import { Input } from "./input"

export class GameFramework {
  constructor(game, canvasSelector) {
    this.game = game

    this.canvasSelector = "canvas#gameScreen"
    this.canvas = $(canvasSelector)[0]
    this.g = this.canvas.getContext("2d")

    this.timer = new TimerPerformance()

    this.input = new Input()

    this.frame = 0
    // Update every second
    this.currentFps = 0
    // Update every frame, reset to 0 every second
    this.accumulateFps = 0
    // Update every second
    this.accumulateStartTime = 0

    this.stop = false
  }

  start() {
    this.onResize()
    this.startTime = this.timer.now()

    this.game.start(this)

    console.log("Game started.")

    window.requestAnimationFrame(() => this.update())
    setInterval(() => this.calculateFps(), 1000)
  }

  end() {
    this.stop = true
  }

  update() {
    this.frame ++
    this.accumulateFps ++

    this.input.update()

    this.g.clearRect(0, 0, this.width, this.height)

    this.game.update(this)

    if(!this.stop) window.requestAnimationFrame(() => this.update())
  }

  calculateFps() {
    const now = this.timer.now()
    this.currentFps = this.accumulateFps / (now - this.accumulateStartTime) * 1000
    this.accumulateFps = 0
    this.accumulateStartTime = now
  }

  createCanvasBuffer(width, height, id) {
    $("body").append(`<canvas id="${id}" width="${width}" height="${height}"/>`)
    $("#" + id).hide()
    return $("#" + id)[0].getContext("2d")
  }

  onResize() {
    const body = $("body")
    const width = body.width()
    const height = body.height()

    const canvas = $(this.canvasSelector)
    canvas.attr("width", width)
    canvas.attr("height", height)

    this.width = width
    this.height = height

    console.log(`Resized: (${width}, ${height})`)
  }

  onKeyDown(e) {
    this.input.keys[e.keyCode] = true
  }

  onKeyUp(e) {
    this.input.keys[e.keyCode] = false
  }
}
