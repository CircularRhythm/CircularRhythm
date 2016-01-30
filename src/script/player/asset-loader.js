import XHRPromise from "../xhr-promise"
import { LocalFileLoader } from "../local-file-loader"

export class AssetLoader {
  constructor(parentPath) {
    this.parentPath = parentPath
    this.files = new Map()
    this.progress = new Map()
  }

  load(path) {
    return new Promise((resolve, reject) => {
      const normalizedPath = path.trim().replace(/^\/*/, "")
      if(this.files.has(normalizedPath)) {
        const file = this.files.get(normalizedPath)
        if(file.currentPromise != null) {
          file.currentPromise.then((data) => resolve(data)).catch((e) => reject(e))
        } else {
          resolve(file)
        }
      } else {
        const promise = this.get(normalizedPath)
        this.files.set(normalizedPath, {data: null, currentPromise: promise})
        promise.then((data) => {
          this.files.set(normalizedPath, {data: data, currentPromise: null})
          resolve(data)
        }).catch((e) => reject(e))
      }
    })
  }

  getProgress(path) {
    return this.progress.get(path) || 0
  }

  get(path) {
    if(!this.progress.has(path)) this.progress.set(path, 0)
    return this.xhr(path, (e) => this.progress.set(path, e.loaded / e.total))
  }

  xhr(path, onprogress) {
    return new Promise((resolve, reject) => {
      XHRPromise.send({
        url: this.parentPath + "/" + path,
        responseType: "arraybuffer",
        onprogress: onprogress
      }).then((data) => {
        resolve(data)
      }).catch((e) => {
        if(!e) reject(FileErrorStatus.UNKNOWN)
        else if(e.status == -1) reject(FileErrorStatus.NETWORK_ERROR)
        else if(e.status == 404) reject(FileErrorStatus.NOT_FOUND)
        else reject(FileErrorStatus.UNKNOWN)
      })
    })
  }
}

export class AssetLoaderPacked extends AssetLoader {
  constructor(parentPath, definition) {
    super(parentPath)
    this.assetFiles = []
    this.definition = definition

    // id => [filename]
    this.idFileList = []
    // filename => (id => {received, total})
    this.fileOccupation = new Map()

    Object.keys(this.definition).forEach((key) => {
      const value = this.definition[key]
      const idProgressMap = new Map()
      value.forEach((e) => {
        const id = e[0]
        const size = e[2] - e[1]
        if(!this.idFileList[id]) this.idFileList[id] = []
        this.idFileList[id].push(key)
        idProgressMap.set(id, {loaded: 0, total: size})
      })
      this.fileOccupation.set(key, idProgressMap)
    })
  }

  get(path) {
    return new Promise((resolve, reject) => {
      const normalizedPath = path.trim().replace(/^\/*/, "")
      const definition = this.definition[normalizedPath]
      if(!definition) {
        reject(FileErrorStatus.NOT_FOUND)
        return
      }
      const promises = definition.map((e) => {
        return new Promise((resolve, reject) => {
          const assetId = e[0]
          const assetPath = assetId + ".crasset"
          if(this.assetFiles[assetId]) {
            const assetFile = this.assetFiles[assetId]
            if(assetFile.currentPromise != null) {
              assetFile.currentPromise.then((data) => resolve(data)).catch((e) => reject(e))
            } else {
              resolve(assetFile.data)
            }
          } else {
            const promise = this.xhr(assetPath, (event) => {
              this.idFileList[assetId].forEach((filename) => {
                const fileOccupationInfo = this.fileOccupation.get(filename).get(assetId)
                fileOccupationInfo.loaded = event.loaded * fileOccupationInfo.total / event.total
                let sumProgress = 0
                let fileTotal = 0
                this.fileOccupation.get(filename).forEach((e) => fileTotal += e.total)
                this.fileOccupation.get(filename).forEach((e) => sumProgress += e.loaded / fileTotal)
                this.progress.set(filename, sumProgress)
              })
            })
            this.assetFiles[assetId] = {data: null, currentPromise: promise}
            promise.then((data) => {
              this.assetFiles[assetId] = {data: data, currentPromise: null}
              resolve(data)
            }).catch((e) => reject(e))
          }
        })
      })

      Promise.all(promises).then((array) => {
        let length = 1
        definition.forEach((e) => {
          length += e[2] - e[1]
        })
        //const buffer = new ArrayBuffer(length)
        const combinedData = new Uint8Array(length)
        let currentPosition = 0
        definition.forEach((e, i) => {
          combinedData.set(new Uint8Array(array[i], e[1], e[2] - e[1]), currentPosition)
          currentPosition += e[2] - e[1]
        })
        resolve(combinedData.buffer)
      }).catch((e) => reject(e))
    })
  }
}

export class AssetLoaderLocal extends AssetLoader {
  constructor(parentPath, localFileList) {
    super(parentPath)
    this.localFileList = localFileList
  }

  get(path) {
    return new Promise((resolve, reject) => {
      LocalFileLoader.get(this.parentPath + "/" + path, "arraybuffer", this.localFileList).then((data) => resolve(data)).catch((e) => {
        if(e == "Not found") reject(FileErrorStatus.NOT_FOUND)
        else reject(FileErrorStatus.UNKNOWN)
      })
    })
  }
}

export class FileErrorStatus {
  static get UNKNOWN() { return -1 }
  static get NOT_FOUND() { return 1 }
  static get NETWORK_ERROR() { return 2 }
}
