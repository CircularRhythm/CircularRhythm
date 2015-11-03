import XHRPromise from "../xhr-promise"
import { LocalFileLoader } from "../local-file-loader"
import { AssetLoader, AssetLoaderArchive, AssetLoaderLocal } from "./asset-loader"
import { Player } from "./player"
import { Renderer } from "./renderer/renderer"
export class Game {
  constructor(bmsonSetConfig, localFileList, endCallback) {
    this.bmsonSetConfig = bmsonSetConfig
    this.bmsonPath = bmsonSetConfig.path
    this.assetPath = bmsonSetConfig.assetPath
    this.packedAssets = bmsonSetConfig.packedAssets
    this.local = bmsonSetConfig.local
    this.localFileList = localFileList
    this.endCallback = endCallback
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
      this.renderer = new Renderer(this, framework)

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
