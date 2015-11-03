export class LocalFileLoader {
  static get(path, type, localFileList) {
    return new Promise((resolve, reject) => {
      const entry = localFileList.get(path)
      if(entry) {
        entry.file((file) => {
          const reader = new FileReader()
          reader.onloadend = (event) => {
            const result = event.target.result
            if(type == "json") {
              resolve(JSON.parse(result))
            } else {
              resolve(result)
            }
          }
          switch(type) {
            case "text":
            case "json":
              reader.readAsText(file)
            break
            case "arraybuffer":
              reader.readAsArrayBuffer(file)
            break
            default:
              reject("Invalid type")
            break
          }
        })
      } else {
        reject("Not found")
      }
    })
  }
}
