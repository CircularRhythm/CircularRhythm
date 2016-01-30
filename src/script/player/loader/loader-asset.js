import { AssetLoader, AssetLoaderArchive, AssetLoaderLocal, FileErrorStatus } from "../asset-loader"

export default class LoaderAsset {
  constructor(audioContext, fileList, assetLoader) {
    this.audioContext = audioContext
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

      const assetPromises = this.fileList.map((file, id) => {
        return this.getExtensionModifiedPromise(id, -1)
      })

      const audioPromises = []

      assetPromises.forEach((e, i) => {
        e.then((result) => {
          audioPromises[i] = this.decodeAudio(result)
          audioPromises[i].then((audioBuffer) => {
            this.audioProgress += 1 / this.fileList.length
          })
        })
      })

      Promise.all(assetPromises).then(() => {
        clearInterval(intervalId)
        this.assetProgress = 1
        return Promise.all(audioPromises)
      }).then((result) => {
        this.audioProgress = 1
        resolve(result)
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
  decodeAudio(arraybuffer) {
    return new Promise((resolve, reject) => {
      this.audioContext.decodeAudioData(arraybuffer, (audioBuffer) => resolve(audioBuffer), (e) => reject(e))
    })
  }
}
