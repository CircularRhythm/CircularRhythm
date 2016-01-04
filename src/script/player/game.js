import XHRPromise from "../xhr-promise"
import { LocalFileLoader } from "../local-file-loader"
import { AssetLoader, AssetLoaderArchive, AssetLoaderLocal } from "./asset-loader"
import { Player } from "./player"
import { Renderer } from "./renderer/renderer"
export class Game {
  constructor(bmsonSetConfig, localFileList, preference, endCallback) {
    this.bmsonSetConfig = bmsonSetConfig
    this.bmsonPath = bmsonSetConfig.path
    this.assetPath = bmsonSetConfig.assetPath
    this.packedAssets = bmsonSetConfig.packedAssets
    this.local = bmsonSetConfig.local
    this.localFileList = localFileList
    this.preference = preference
    this.endCallback = endCallback

    this.fieldWidth = 800
    this.fieldHeight = 600
    this.belowHeight = null
  }

  start(framework) {
    const parentPath = this.bmsonPath.replace(/\/[^\/]*$/, "")
    const promises = []
    if(this.local) {
      promises.push(
        LocalFileLoader.get(this.bmsonPath, "json", this.localFileList)
      )
    } else {
      promises.push(
        XHRPromise.send({
          url: this.bmsonPath,
          responseType: "json"
        })
      )
      if(this.packedAssets) promises.push(
        XHRPromise.send({
          url: this.assetPath,
          responseType: "json"
        })
      )
    }
    Promise.all(promises).then((result) => {
      let assetLoader
      if(this.local) assetLoader = new AssetLoaderLocal(parentPath, this.localFileList)
      else if(this.packedAssets) assetLoader = new AssetLoaderArchive(parentPath, result[1])
      else assetLoader = new AssetLoader(parentPath)
      const bmsonSet = {
        bmson: result[0],
        assetLoader: assetLoader
      }
      this.player = new Player(this, bmsonSet, parentPath)
      this.renderer = new Renderer(this, framework, this.preference)

      this.player.init().then(() => {
        this.state = States.READY
      })
    })
    this.state = States.LOADING
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

    switch(this.state) {
      case States.LOADING:
        break
      case States.READY:
        if(framework.input.isJustPressed(13)) {
          // Enter
          this.player.start()
          this.state = States.IN_GAME
        }

        g.save()
        g.scale(scale, scale)
        g.translate(translateX, 0)

        this.renderer.render(g, this.controller)

        g.restore()
        break
      case States.IN_GAME:
        g.save()
        g.scale(scale, scale)
        g.translate(translateX, 0)

        this.player.update(framework.input)
        this.renderer.render(g)

        g.restore()
        break
    }
  }
}

export class States {
  static get LOADING() { return 0 }
  static get READY() { return 1 }
  static get IN_GAME() { return 2 }
}
