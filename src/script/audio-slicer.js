import { FileLoader } from "./file"

export class AudioSlicer {
  constructor(audioContext, fileLoader, soundChannels) {
    this.audioContext = audioContext
    this.fileLoader = fileLoader
    this.soundChannels = soundChannels
  }

  loadAudio() {
    // TODO: WAV / OGG selecting
    const promises = []
    this.soundChannels.forEach((channel, i) => promises.push(new Promise((resolve, reject) => {
      this.fileLoader.load(channel.name.replace(/\.wav$/, ".ogg"), "arraybuffer").then((data) => {
        this.audioContext.decodeAudioData(data, (audioBuffer) => {
          const numberOfChannels = audioBuffer.numberOfChannels
          const sampleRate = audioBuffer.sampleRate

          let audioStartTime = 0
          if(channel.notes[0].c == true) {
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
              console.warn(`There is a note data which has to slice out of audio length, y=${note.y}, sliceTime=${sliceStartTime}, audioLength=${e.audioBuffer.length}`)
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
      })
    })))
    return Promise.all(promises)
  }
}
