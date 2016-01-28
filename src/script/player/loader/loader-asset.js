import { AssetLoader, AssetLoaderArchive, AssetLoaderLocal, FileErrorStatus } from "../asset-loader"

export default class LoaderAsset {
  constructor(fileList, assetLoader) {
    this.progress = 0
    this.fileList = fileList
    this.assetLoader = assetLoader
    this.extensions = ["wav", "ogg"]
  }

  load() {
    return new Promise((resolve, reject) => {
      this.fileList.forEach((file) => {
        this.getExtensionModifiedPromise(file, (progress) => {console.log(file, progress)}, -1).then((data) => {
          console.log(file)
          console.log(data)
        })
      })
      resolve()
    })
  }

  // phase=-1: not modify
  // phase>=0: modify extension
  getExtensionModifiedPromise(file, onprogress, phase) {
    return new Promise((resolve, reject) => {
      let fileName
      if(phase == -1) {
        fileName = file
      } else {
        fileName = file.replace(/\.[^/.]+$/, "") + "." + this.extensions[phase]
      }
      this.assetLoader.load(fileName, onprogress).then((data) => resolve(data)).catch((e) => {
        if(e == FileErrorStatus.NOT_FOUND) {
          if(phase < this.extensions.length - 1) {
            return this.getExtensionModifiedPromise(file, onprogress, phase + 1)
          } else {
            reject(FileErrorStatus.NOT_FOUND)
          }
        } else {
          reject(e)
        }
      }).then((data) => resolve(data)).catch((e) => reject(e))
    })
  }
    // TODO: EACH SLICE has a polyphony of 1
}
