export class LocalFileLoader {
  static get(path, type, localFileList, onprogress = null) {
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
          if(onprogress) reader.onprogress = onprogress
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
