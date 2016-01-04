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
          try {
            const bmson = JSON.parse(event.target.result)
            if(bmson.version) {
              let mode
              if(bmson.info.mode_hint == "circularrhythm-single") {
                mode = "single"
              } else if(bmson.info.mode_hint == "circularrhythm-double") {
                mode = "double"
              } else {
                reject("Unsupported mode hint: " + bmson.info.mode_hint)
                return
              }

              if(!this.music.title) {
                this.music.title = bmson.info.title
                this.music.subtitle = bmson.info.subtitle || ""
                this.music.artist = bmson.info.artist
                this.music.subartists = bmson.info.subartists || []
                this.music.genre = bmson.info.genre
                this.music.banner_image = bmson.info.banner_image || null
                this.music.preview_music = bmson.info.preview_music || null
              }

              const bpmList = bmson.bpm_events.map((e) => e.bpm).concat(bmson.info.init_bpm)

              let notes = 0
              bmson.sound_channels.forEach((channel) => {
                if(mode == "single") {
                  notes += channel.notes.filter((note) => 1 <= note.x && note.x <= 5).length
                } else if(mode == "double") {
                  notes += channel.notes.filter((note) => 1 <= note.x && note.x <= 9).length
                }
              })

              const chart = {
                file: filePath,
                chart_name: bmson.info.chart_name || "None",
                level: bmson.info.level,
                bpm: {
                  initial: bmson.info.init_bpm,
                  min: Math.min(...bpmList),
                  max: Math.max(...bpmList)
                }
              }

              this.music.charts[mode].push(chart)
              resolve()
            } else {
              reject("CircularRhythm cannot load legacy bmson. Convert to v1.0 format.")
            }
          } catch(e) {
            reject("Invalid bmson")
          }
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
          reject("No bmson")
        } else {
          resolve(this.music)
        }
      })
    })
  }
}
