import XHRPromise from "../../xhr-promise"
import { LocalFileLoader } from "../../local-file-loader"

export default class LoaderBmson {
  constructor(bmsonSetConfig) {
    this.progress = 0
    this.progressChart = 0
    this.progressAsset = 0
    this.bmsonSetConfig = bmsonSetConfig
  }

  load() {
    const bmsonPath = this.bmsonSetConfig.path
    const assetPath = this.bmsonSetConfig.assetPath
    const local = this.bmsonSetConfig.local
    const packedAssets = this.bmsonSetConfig.packedAssets
    const localFileList = this.bmsonSetConfig.localFileList

    return new Promise((resolve, reject) => {
      const promises = []
      if(local) {
        promises.push(LocalFileLoader.get(bmsonPath, "json", localFileList, (e) => { this.progressChart = e.loaded / e.total; this.updateProgress() }))
      } else {
        promises.push(XHRPromise.send({
          url: bmsonPath,
          responseType: "json",
          onprogress: (e) => {
            this.promiseBmsonProgressChart = e.loaded / e.total
            this.updateProgress()
          }
        }))
        if(packedAssets) promises.push(XHRPromise.send({
          url: assetPath,
          responseType: "json",
          onprogress: (e) => {
            this.promiseBmsonProgressAsset = e.loaded / e.total
            this.updateProgress()
          }
        }))
      }

      Promise.all(promises).then((result) => {
        this.progressChart = 1
        this.progress = 1
        if(packedAssets) {
          this.progressAsset = 1
          resolve({ bmson: result[0], assetDefinition: result[1] })
        } else {
          resolve({ bmson: result[0] })
        }
      })
    })
  }

  updateProgress() {
    if(this.bmsonSetConfig.packedAssets) {
      this.progress = this.progressChart * 0.7 + this.progressAsset * 0.3
    } else {
      this.progress = this.progressChart
    }
  }
}
