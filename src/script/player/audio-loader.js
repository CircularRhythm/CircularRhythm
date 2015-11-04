import { AssetLoader, FileErrorStatus } from "./asset-loader"
import { SliceData } from "./slice-data"

export class AudioLoader {
  constructor(audioContext, assetLoader, soundChannels) {
    this.audioContext = audioContext
    this.assetLoader = assetLoader
    this.soundChannels = soundChannels
    this.extensions = ["wav", "ogg"]
  }

  loadAudio() {
    const promises = []
    this.soundChannels.forEach((channel, i) => promises.push(new Promise((resolve, reject) => {
      new Promise((resolve, reject) => {
        this.assetLoader.load(channel.name).then((data) => resolve(data)).catch((e) => {
          if(e == FileErrorStatus.NOT_FOUND) {
            const that = this
            function newExtensionModifiedPromise(baseName, index) {
              return new Promise((resolve, reject) => {
                that.assetLoader.load(baseName + "." + that.extensions[index]).then((data) => resolve(data)).catch((e) => {
                  if(e == FileErrorStatus.NOT_FOUND) {
                    if(index < that.extensions.length - 1) {
                      return newExtensionModifiedPromise(baseName, index + 1)
                    } else {
                      reject(FileErrorStatus.NOT_FOUND)
                    }
                  } else {
                    reject(e)
                  }
                }).then((data) => resolve(data)).catch((e) => reject(e))
              })
            }
            return newExtensionModifiedPromise(channel.name.replace(/\.[^/.]+$/, ""), 0)
          } else {
            reject(e)
          }
        }).then((e) => resolve(e)).catch((e) => reject(e))
      }).then((data) => {
        this.audioContext.decodeAudioData(data, (audioBuffer) => {
          // Duration is millisecond-base
          channel.audioBuffer = audioBuffer
          const audioDuration = audioBuffer.duration * 1000

          let audioStartTime = 0
          if(channel.notes.length > 0 && channel.notes[0].c == true) {
            console.warn("First note of each channel should be c=false")
          }
          for(let i = 0; i < channel.notes.length; i++) {
            const note = channel.notes[i]
            const noteTime = note.time
            if(note.c == false) {
              audioStartTime = noteTime
            }
            const sliceStartTime = noteTime - audioStartTime
            let sliceEndTime

            if(sliceStartTime >= audioDuration) {
              console.warn("Slicing started at out of audio duration")
              note.sliceData = null
            } else {
              let addIndex = 0
              let reachEnd = false
              // search next time note
              while(channel.notes[i + addIndex].y <= note.y) {
                addIndex ++
                if(i + addIndex >= channel.notes.length) {
                  // If there is no next note
                  sliceEndTime = audioDuration
                  reachEnd = true
                  break
                }
              }
              if(!reachEnd) {
                // If there is a next note
                const nextNote = channel.notes[i + addIndex]
                const nextNoteTime = nextNote.time
                sliceEndTime = nextNoteTime - audioStartTime
              }

              const sliceDuration = sliceEndTime - sliceStartTime

              note.sliceData = new SliceData(audioBuffer, sliceStartTime, sliceDuration)
            }
          }
          resolve()
        })
      }).catch((e) => console.error(e))
    })))
    return Promise.all(promises)
  }
}
