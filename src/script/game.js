import XHRPromise from "./xhr-promise"
import { AssetLoader, AssetLoaderArchive } from "./asset-loader"
import { Player } from "./player"
import { Renderer } from "./renderer"
export class Game {
  constructor(bmsonSetConfig, endCallback) {
    this.bmsonSetConfig = bmsonSetConfig
    this.bmsonPath = bmsonSetConfig.path
    this.assetPath = bmsonSetConfig.assetPath
    this.packedAssets = bmsonSetConfig.packedAssets
    this.endCallback = endCallback

    const parentPath = this.bmsonPath.replace(/\/[^\/]*$/, "")
    const promises = []
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
    Promise.all(promises).then((result) => {
      let assetLoader
      if(this.packedAssets) assetLoader = new AssetLoaderArchive(parentPath, result[1])
      else assetLoader = new AssetLoader(parentPath)
      const bmsonSet = {
        bmson: result[0],
        assetLoader: assetLoader
      }
      this.player = new Player(this, bmsonSet, parentPath)
      this.renderer = new Renderer(this)

      this.player.init().then(() => {
        this.state = States.READY
      })
    })
    this.state = States.LOADING
  }

  update(framework) {
    const g = framework.g

    switch(this.state) {
      case States.LOADING:
        g.fillStyle = "#000000"
        g.fillText("LOADING", 32, 64)
        break
      case States.READY:
        g.fillStyle = "#000000"
        g.fillText("READY, Press Enter", 32, 64)
        if(framework.input.isJustPressed(13)) {
          // Enter
          this.player.start()
          this.state = States.IN_GAME
        }

        g.save()
        g.translate((framework.width - 800) / 2, (framework.height - 600) / 2)

        this.renderer.render(g, this.controller)

        g.restore()
        break
      case States.IN_GAME:
        g.save()
        g.translate((framework.width - 800) / 2, (framework.height - 600) / 2)

        this.player.update(framework.input)
        this.renderer.render(g)

        g.restore()
        break
    }

    g.fillStyle = "#000000"
    g.fillText(framework.currentFps.toFixed(2), 32, 32)
  }
}

export class States {
  static get LOADING() { return 0 }
  static get READY() { return 1 }
  static get IN_GAME() { return 2 }
}
