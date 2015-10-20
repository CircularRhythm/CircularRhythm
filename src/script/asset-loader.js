import XHRPromise from "./xhr-promise"

export class AssetLoader {
  constructor(parentPath) {
    this.parentPath = parentPath
    this.files = new Map()
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

  get(path) {
    return this.xhr(path)
  }

  xhr(path) {
    return new Promise((resolve, reject) => {
      XHRPromise.send({
        url: this.parentPath + "/" + path,
        responseType: "arraybuffer"
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

export class AssetLoaderArchive extends AssetLoader {
  constructor(parentPath, definition) {
    super(parentPath)
    this.assetFiles = []
    this.definition = definition
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
          const assetPath = e[0] + ".crasset"
          if(this.assetFiles[e[0]]) {
            const assetFile = this.assetFiles[e[0]]
            if(assetFile.currentPromise != null) {
              assetFile.currentPromise.then((data) => resolve(data)).catch((e) => reject(e))
            } else {
              resolve(assetFile.data)
            }
          } else {
            const promise = this.xhr(assetPath)
            this.assetFiles[e[0]] = {data: null, currentPromise: promise}
            promise.then((data) => {
              this.assetFiles[e[0]] = {data: data, currentPromise: null}
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

export class FileErrorStatus {
  static get UNKNOWN() { return -1 }
  static get NOT_FOUND() { return 1 }
  static get NETWORK_ERROR() { return 2 }
}
