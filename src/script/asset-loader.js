import XHRPromise from "./xhr-promise"

export class AssetLoader {
  constructor(parentPath) {
    this.parentPath = parentPath
    this.files = new Map()
  }

  load(path, type) {
    return new Promise((resolve, reject) => {
      const normalizedPath = path.trim().replace(/^\/*/, "")
      if(this.files.has(normalizedPath) && this.files.get(normalizedPath).type == type) {
        const file = this.files.get(normalizedPath)
        if(file.currentPromise != null) {
          file.currentPromise.then((data) => {
            resolve(data)
          })
        } else {
          resolve(this.files.get(normalizedPath))
        }
      } else {
        const promise = this._load(normalizedPath, type)
        this.files.set(normalizedPath, {type: type, data: null, currentPromise: promise})
        promise.then((data) => {
          this.files.set(normalizedPath, {type: type, data: data, currentPromise: null})
          resolve(data)
        })
      }
    })
  }

  _load(path, type) {
    /*return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest()
      request.open("GET", this.parentPath + "/" + path)
      request.responseType = type
      request.onload = () => {
        if(request.status == 200) {
          resolve(request.response)
        } else if(request.status == 404){
          console.error(request.statusText)
          reject(FileErrorStatus.NOT_FOUND)
        } else {
          console.error(request.statusText)
          reject(FileErrorStatus.UNKNOWN)
        }
      }
      request.onerror = () => reject(FileErrorStatus.NETWORK_ERROR)
      request.send()
    })
  }*/
    return XHRPromise.send({
      url: this.parentPath + "/" + path
    })
  }
}

export class AssetLoaderArchive extends AssetLoader {
  constructor(parentPath, definition) {
    super(parentPath)
    this.assetFiles = []
    this.definition = definition
  }

  _load(path, type) {

  }
}

export class FileErrorStatus {
  static get UNKNOWN() { return -1 }
  static get NOT_FOUND() { return 1 }
  static get NETWORK_ERROR() { return 2 }
}
