import { AssetLoader, FileErrorStatus } from "./asset-loader"

export class AudioSlicer {
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
          // TODO: Stop slicing because it's too heavy
          const numberOfChannels = audioBuffer.numberOfChannels
          const sampleRate = audioBuffer.sampleRate

          let audioStartTime = 0
          if(channel.notes.length > 0 && channel.notes[0].c == true) {
            console.warn("First note of each channel should be c=false")
          }
          for(let i = 0; i < channel.notes.length; i++) {
            const note = channel.notes[i]
            const noteStartTime = note.time
            if(note.c == false) {
              audioStartTime = noteStartTime
            }
            const sliceStartTime = noteStartTime - audioStartTime
            const sliceStartSample = sampleRate * sliceStartTime / 1000

            let sliceEndSample
            if(sliceStartSample >= audioBuffer.length) {
              console.warn(`There is a note data which has to slice out of audio length, y=${note.y}, sliceTime=${sliceStartTime}, audioLength=${audioBuffer.length}`)
              const buffer = this.audioContext.createBuffer(numberOfChannels, 1, sampleRate)
              note.audioBuffer = buffer
            } else {
              let addIndex = 0
              let reachEnd = false
              while(channel.notes[i + addIndex].y <= note.y) {
                addIndex ++
                if(i + addIndex >= channel.notes.length) {
                  // If there is no next note
                  sliceEndSample = audioBuffer.length - 1
                  reachEnd = true
                  break
                }
              }
              if(!reachEnd) {
                // If there is a next note
                const nextNote = channel.notes[i + addIndex]
                const nextNoteTime = nextNote.time
                const sliceEndTime = nextNoteTime - audioStartTime
                sliceEndSample = sampleRate * sliceEndTime / 1000
              }

              const sliceSampleLength = sliceEndSample - sliceStartSample
              const slicedAudioBuffer = this.audioContext.createBuffer(numberOfChannels, sliceSampleLength, sampleRate)
              for(let c = 0; c < numberOfChannels; c++) {
                // Copy buffer from whole source
                const array = new Float32Array(sliceSampleLength)
                audioBuffer.copyFromChannel(array, c, sliceStartSample)
                slicedAudioBuffer.copyToChannel(array, c)
              }
              note.audioBuffer = slicedAudioBuffer
            }
          }
          resolve()
        })
      }).catch((e) => console.error(e))
    })))
    return Promise.all(promises)
  }
}
