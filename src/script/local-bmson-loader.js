export class LocalBmsonLoader {
  constructor(localFileList) {
    this.localFileList = localFileList
    this.music = {
      title: null,
      genre: null,
      artist: null,
      basedir: null,
      packed_assets: false,
      local: true,
      charts: {single: [], double: []}
    }
  }

  // readEntries can list only 100 files at once
  // This function will return all entries in directory
  readDirectory(reader, entries = []) {
    return new Promise((resolve, reject) => {
      reader.readEntries((returnEntries) => {
        Array.prototype.push.apply(entries, returnEntries)
        if(returnEntries.length > 0) {
          this.readDirectory(reader, entries).then((entries) => {
            resolve(entries)
          })
        } else {
          resolve(entries)
        }
      })
    })
  }

  traverse(entry) {
    if(entry.isDirectory) {
      const reader = entry.createReader()
      return new Promise((resolve, reject) => {
        this.readDirectory(reader).then((entries) => {
          const promises = []
          entries.forEach((entry) => {
            promises.push(this.traverse(entry))
          })
          Promise.all(promises).then(() => resolve())
        })
      })
    } else {
      const path = entry.filesystem.name + entry.fullPath
      this.localFileList.set(path, entry)
      if(entry.name.search(/\.bmson$/) >= 0) {
        return this.addFile(entry)
      }
      return Promise.resolve()
    }
  }

  addFile(entry) {
    return new Promise((resolve, reject) => {
      const path = entry.filesystem.name + entry.fullPath
      const filePath = path.replace(this.music.basedir + "/", "")
      entry.file((file) => {
        const reader = new FileReader()
        reader.onloadend = (event) => {
          const bmson = JSON.parse(event.target.result)
          const chart = {
            title: bmson.info.title,
            genre: bmson.info.genre,
            artist: bmson.info.artist,
            bpm: bmson.info.initBPM,
            level: bmson.info.level,
            file: filePath
          }
          this.music.title = this.music.title || chart.title
          this.music.genre = this.music.genre || chart.genre
          this.music.artist = this.music.artist || chart.artist
          this.music.charts.single.push(chart)
          resolve()
        }
        reader.readAsText(file)
      })
    })
  }


  load(entry) {
    return new Promise((resolve, reject) => {
      this.music.basedir = entry.filesystem.name + entry.fullPath
      this.traverse(entry).then(() => {
        if(this.music.charts.single.length == 0 && this.music.charts.double.length == 0) {
          reject()
        } else {
          resolve(this.music)
        }
      })
    })
  }
}
