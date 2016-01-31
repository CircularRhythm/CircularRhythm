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

    g[0].fillStyle = this.preference.renderer.colorScheme.background
    g[0].beginPath()
    g[0].rect(0, 0, framework.width, framework.height)
    g[0].fill()

    g.forEach((e, i) => {
      e.save()
      e.scale(scale, scale)
      e.translate(translateX, 0)
    })

    this.player.update(framework.input)
    this.renderer.render(framework.g, this.controller)

    g.forEach((e) => {
      e.restore()
    })
  }
}
