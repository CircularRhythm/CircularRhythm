import { AssetLoader, AssetLoaderArchive, AssetLoaderLocal, FileErrorStatus } from "../asset-loader"

export default class LoaderAsset {
  constructor(fileList, assetLoader) {
    this.assetProgress = 0
    this.audioProgress = 0
    this.fileList = fileList
    this.actualFileList = fileList.map((e) => e)
    this.assetLoader = assetLoader
    this.extensions = ["wav", "ogg"]
  }

  load() {
    return new Promise((resolve, reject) => {
      //const promises = []

      const intervalId = setInterval(() => {
        this.assetProgress = 0
        this.actualFileList.forEach((e) => {
          this.assetProgress += this.assetLoader.getProgress(e) / this.fileList.length
        })
      }, 100)

      const promises = this.fileList.map((file, id) => {
        return this.getExtensionModifiedPromise(id, -1)
      })

      promises.forEach((e) => {
        e.then((result) => console.log(result))
      })

      Promise.all(promises).then(() => {
        clearInterval(intervalId)
        this.assetProgress = 1
        resolve()
      })
    })
  }

  // phase=-1: not modify
  // phase>=0: modify extension
  getExtensionModifiedPromise(id, phase) {
    return new Promise((resolve, reject) => {
      const file = this.fileList[id]
      let fileName
      if(phase == -1) {
        fileName = file
      } else {
        fileName = file.replace(/\.[^/.]+$/, "") + "." + this.extensions[phase]
      }
      this.actualFileList[id] = fileName
      this.assetLoader.load(fileName)
      .then((data) => {
        resolve(data)
      }).catch((e) => {
        if(e == FileErrorStatus.NOT_FOUND) {
          if(phase < this.extensions.length - 1) {
            return this.getExtensionModifiedPromise(id, phase + 1)
          } else {
            reject(FileErrorStatus.NOT_FOUND)
          }
        } else {
          reject(e)
        }
      }).then((data) => resolve(data))//.catch((e) => reject(e))
    })
  }
    // TODO: EACH SLICE has a polyphony of 1
}
