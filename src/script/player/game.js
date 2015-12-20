import XHRPromise from "../xhr-promise"
import { LocalFileLoader } from "../local-file-loader"
import { AssetLoader, AssetLoaderArchive, AssetLoaderLocal } from "./asset-loader"
import { Player } from "./player"
import { Renderer } from "./renderer/renderer"

export class Game {
  constructor(bmsonSetConfig, preference, endCallback) {
    this.bmsonSetConfig = bmsonSetConfig
    this.preference = preference
    this.endCallback = endCallback

    this.fieldWidth = 800
    this.fieldHeight = 600
    this.belowHeight = null
  }

  start(framework) {
    this.player = new Player(this, this.bmsonSetConfig)
    this.renderer = new Renderer(this, framework, this.preference)
  }

  update(framework) {
    const g = framework.g
    const scale = Math.min(framework.width / this.fieldWidth, framework.height / this.fieldHeight)
    const translateX = (framework.width - this.fieldWidth * scale) / 2 / scale
    this.belowHeight = (framework.height - this.fieldHeight * scale) / scale

    g.fillStyle = this.preference.renderer.colorScheme.background
    g.beginPath()
    g.rect(0, 0, framework.width, framework.height)
    g.fill()

    g.save()
    g.scale(scale, scale)
    g.translate(translateX, 0)

    this.player.update(framework.input)
    this.renderer.render(g, this.controller)

    g.restore()
  }
}
