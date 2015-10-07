export class Player {
  constructor(game, bmson, parentPath) {
    this.game = game
    this.bmson = bmson
    this.parentPath = parentPath

    this.audioContext = new AudioContext()

    this.lastTime = 0
    this.playing = false

    this.currentY = 0
    this.currentPosition = 0
    this.currentTime = 0
    this.currentBpm = 0

    this.visibleEndY = 0
    this.visibleEndPosition = 0
    this.visibleEndTime = 0

    // String(name) -> [Note]
    this.visibleNotes = new Map()
    // Int -> {name: String, note: Note}
    this.targetNotes = new Map()

    this.combo = 0

    // [{y: Number, bpm: Number, time: Number}]
    this.bpmList = []
    this.bpmList.push({y: 0, bpm: this.bmson.info.initBPM, time: 0})

    // [{y: Number, l: Number}]
    this.barLines = []
    const bmsonBarLines = this.bmson.lines.slice().sort((a, b) => a.y - b.y)
    if(!bmsonBarLines[0] || bmsonBarLines[0].y != 0) new Error("First barline must be y=0")
    for(let i = 0; i < bmsonBarLines.length - 1; i++) {
      const line1 = bmsonBarLines[i]
      const line2 = bmsonBarLines[i + 1]
      this.barLines.push({y: line1.y, l: line2.y - line1.y})
    }

    // [{name: String, notes: [Note]}]
    this.soundChannels = []
    for(let bmsonSoundChannel of this.bmson.soundChannel) {
      const bmsonNotes = bmsonSoundChannel.notes.slice().sort((a, b) => a.y - b.y)
      const notes = []
      for(let note of bmsonNotes) {
        // TODO: Can improve speed
        this.checkAndAppendBarLine(note.y)
        const barLine = this.getBarLine(note.y)
        const bpmData = this.getBpmData(note.y)
        const time = this.calculateTime(note.y, bpmData)
        const position = this.calculatePosition(note.y, barLine)
        if(note.l > 0) {
          // Long note
          const endY = note.y + note.l
          this.checkAndAppendBarLine(endY)
          const endBarLine = this.getBarLine(endY)
          const endBpmData = this.getBpmData(endY)
          const endTime = this.calculateTime(endY, bpmData)
          const endPosition = this.calculatePosition(endY, endBarLine)
          notes.push(new NoteLong(note.x, note.y, note.c, time, position, endY, endTime, endPosition))
        } else {
          // Normal note
          notes.push(new NoteShort(note.x, note.y, note.c, time, position))
        }
      }
      this.soundChannels.push({name: bmsonSoundChannel.name, source: null, notes: notes})
    }

    this.currentBpm = bmson.info.initBPM
    this.visibleEndPosition = 0.7
    this.visibleEndY = this.calculatePositionInv(this.visibleEndPosition, this.barLines[0])

    for(let e of this.soundChannels) {
      this.visibleNotes.set(e.name, e.notes.filter((note) => note.y < this.visibleEndY))
    }
  }

  loadAudio() {
    return new Promise((resolve, reject) => {
      const promises = []
      this.soundChannels.forEach((channel) => {
        promises.push(new Promise((resolve, reject) => {
          const request = new XMLHttpRequest()
          request.open("GET", this.parentPath + "/" + channel.name.replace(/\.wav$/, ".ogg"))
          request.responseType = "arraybuffer"
          request.onload = () => {
            if(request.status == 200) {
              this.audioContext.decodeAudioData(request.response, (data) => {
                resolve({name: channel.name, audioBuffer: data})
              })
            } else {
              console.error(request.statusText)
            }
          }
          request.onerror = () => reject(console.error("Network Error"))
          request.send()
        }))
      })
      Promise.all(promises).then((result) => {
        result.forEach((e) => {
          const channel = this.soundChannels.find((channel) => channel.name == e.name)
          const numberOfChannels = e.audioBuffer.numberOfChannels
          const sampleRate = e.audioBuffer.sampleRate

          let audioStartTime = 0
          for(let i = 0; i < channel.notes.length; i++) {
            const note = channel.notes[i]
            const noteStartTime = this.calculateTime(note.y, this.getBpmData(note.y))
            if(note.c == false) {
              audioStartTime = noteStartTime
            }
            const sliceStartTime = noteStartTime - audioStartTime
            const sliceStartSample = sampleRate * sliceStartTime / 1000

            let sliceEndSample
            if(sliceStartSample >= e.audioBuffer.length) {
              console.warn(`There is a note data which has to slice out of audio length, y=${note.y}, sliceTime=${sliceStartTime}, audioLength=${e.audioBuffer.length}`)
              const buffer = this.audioContext.createBuffer(numberOfChannels, 1, sampleRate)
              note.audioBuffer = buffer
            } else {
              let addIndex = 0
              let reachEnd = false
              while(channel.notes[i + addIndex].y <= note.y) {
                addIndex ++
                if(i + addIndex >= channel.notes.length) {
                  sliceEndSample = e.audioBuffer.length - 1
                  reachEnd = true
                  break
                }
              }
              if(!reachEnd) {
                const nextNote = channel.notes[i + addIndex]
                const nextNoteTime = this.calculateTime(nextNote.y, this.getBpmData(nextNote.y))
                const sliceEndTime = nextNoteTime - audioStartTime
                sliceEndSample = sampleRate * sliceEndTime / 1000
              }

              const sliceSampleLength = sliceEndSample - sliceStartSample
              const audioBuffer = this.audioContext.createBuffer(numberOfChannels, sliceSampleLength, sampleRate)
              for(let c = 0; c < numberOfChannels; c++) {

                const array = new Float32Array(sliceSampleLength)
                e.audioBuffer.copyFromChannel(array, c, sliceStartSample)
                audioBuffer.copyToChannel(array, c)
              }
              note.audioBuffer = audioBuffer
            }
          }
        })
        resolve()
      })
    })
  }

  start() {
    this.lastTime = Date.now()
    this.playing = true
  }

  update(controller) {
    const nowTime = Date.now()
    const delta = nowTime - this.lastTime
    this.lastTime = nowTime
    this.currentTime += delta

    // ⊿T [tick/frame] = 240 [tick/beat(4th)] * bpm [beat(4th)/min] * delta [ms] / 60000 [ms/min]
    const deltaY = 240 * this.currentBpm * delta / 60000
    this.currentY += deltaY

    const currentBarLineIndex = this.getBarLineIndex(this.currentY)
    if(currentBarLineIndex == -1) {
      this.playing = false
      console.log("Stopped")
      return
    }
    const currentBarLine = this.barLines[currentBarLineIndex]

    this.currentPosition = this.calculatePosition(this.currentY, currentBarLine)
    const visibleEndPositionAdded = this.currentPosition + 0.7
    const oldVisibleEndY = this.visibleEndY
    if(visibleEndPositionAdded >= 1) {
      // Step over a barline
      this.visibleEndPosition = visibleEndPositionAdded - 1
      const barLineIndex = currentBarLineIndex + 1
      if(barLineIndex >= this.barLines.length) {
        // There's no next measure
        const lastBarLine = this.barLines[this.barLines.length - 1]
        this.visibleEndPosition = 0
        this.visibleEndY = lastBarLine.y + lastBarLine.l
      } else {
        this.visibleEndY = this.calculatePositionInv(this.visibleEndPosition, this.barLines[barLineIndex])
      }
    } else {
      // Not step over a barline
      this.visibleEndPosition = visibleEndPositionAdded
      this.visibleEndY = this.calculatePositionInv(this.visibleEndPosition, this.barLines[currentBarLineIndex])
    }
    const deltaVisibleEndY = this.visibleEndY - oldVisibleEndY

    // Add notes which to be visible
    for(let channel of this.soundChannels) {
      const newVisibleNotes = channel.notes.filter((note) => this.visibleEndY - deltaVisibleEndY <= note.y && note.y < this.visibleEndY && 1 <= note.x && note.x <= 4)
      Array.prototype.push.apply(this.visibleNotes.get(channel.name), newVisibleNotes)
    }

    // Erase notes which is already judged
    this.visibleNotes.forEach((notes, name) => {
      notes.filter((note) => note instanceof NoteShort && note.eraseTimer >= 0).forEach((note) => {
        note.eraseTimer += delta
      })
      // Remove eraseTimer > 500
      notes = notes.filter((note) => !(note instanceof NoteShort) || note.eraseTimer <= 500)

      notes.filter((note) => note instanceof NoteLong).forEach((note) => {
        if(note.noteHeadEraseTimer >= 0) {
          note.noteHeadEraseTimer += delta
          if(note.noteHeadEraseTimer > 500) note.noteHeadEraseTimer = 500
        }
        if(note.noteHeadMovable) {
          note.noteHeadPosition = note.endY > this.currentY ? this.currentPosition : note.endPosition
        }
      })
      // Remove currentTime > note.endTime + 500
      notes = notes.filter((note) => !(note instanceof NoteLong) || this.currentTime <= note.endTime + 500)

      // Set new notes list
      this.visibleNotes.set(name, notes)
    })

    // Target & Judge
    // Before assigning new targets, clean up old ones
    this.targetNotes.forEach((e, x) => {
      if(!e.note.active) this.targetNotes.delete(x)
    })
    for(let channel of this.soundChannels) {
      // Assign new targets
      const newTargets = channel.notes.filter((note) => note.time - this.currentTime < 1000 && note.judgeState == JudgeState.NO && 1 <= note.x && note.x <= 4)
      for(let note of newTargets) {
        const x = note.x
        const target = this.targetNotes.get(x)
        if(!target) {
          // Target is empty
          this.targetNotes.set(x, {name: channel.name, note: note})
        } else {
          // If target is not empty, prior note will be assigned
          if(note.time < target.note.time) this.targetNotes.set(x, {name: channel.name, note: note})
        }
      }
      const playSoundNotes = channel.notes.filter((note) => this.currentTime - delta < note.time && note.time <= this.currentTime && (note.x < 1 || 4 < note.x))
      playSoundNotes.forEach((note) => this.noteOn(channel.name, note))

      // TODO: Clap

      // Judge
      for(let i = 0; i < 4; i++) {
        const button = controller[i]
        const x = i + 1
        const target = this.targetNotes.get(x)
        let note
        if(target) {
          note = target.note
        } else {
          note = null
        }

        if(note instanceof NoteShort && note.judgeState == JudgeState.NO) {
          // Miss
          if(this.currentTime - note.time > 400) this.judgeShortNote(note, JudgeState.MISS)
          else if(button.isJustPressed()) {
            const judge = this.getJudge(this.currentTime - note.time)
            this.judgeShortNote(note, judge)
            this.noteOn(target.name, note)
          }
        }
        if(note instanceof NoteLong) {
          // Miss
          if(this.currentTime - note.time > 400 && note.judgeState == JudgeState.NO) this.firstJudgeLongNote(note, JudgeState.MISS)
          else if(button.isJustPressed()) {
            const judge = this.getJudge(this.currentTime - note.time)
            this.firstJudgeLongNote(note, judge)
            this.noteOn(target.name, note)
          }

          if(note.active) {
            if(this.currentTime - note.endTime > 400) this.secondJudgeLongNote(note, false)
            else if(button.isJustReleased()) {
              const judge = this.getSecondJudge(this.currentTime - note.endTime)
              this.secondJudgeLongNote(note, judge)
              if(!judge) this.noteOff(target.name)
            }
          }
        }
      }
    }
  }

  noteOn(channelName, note) {
    const channel = this.soundChannels.find((channel) => channel.name == channelName)
    if(channel.source != null) channel.source.stop()
    const source = this.audioContext.createBufferSource()
    source.buffer = note.audioBuffer
    source.connect(this.audioContext.destination)
    source.start(0)
    channel.source = source
  }

  noteOff(channelName) {
    const channel = this.soundChannels.find((channel) => channel.name == channelName)
    if(channel.source != null) channel.source.stop()
    channel.source = null
  }

  // currentTime - noteTime; Early : <0, Slow: >0
  getJudge(difference) {
    const diffAbs = Math.abs(difference)
    if(0 <= diffAbs && diffAbs < 100) return JudgeState.EXCELLENT
    if(100 <= diffAbs && diffAbs < 200) return JudgeState.GREAT
    if(200 <= diffAbs && diffAbs < 300) return JudgeState.GOOD
    if(300 <= diffAbs && diffAbs < 400) return JudgeState.BAD
    return JudgeState.MISS_EMPTY
  }

  getSecondJudge(difference) {
    const diffAbs = Math.abs(difference)
    if(0 <= diffAbs && diffAbs <= 400) return true
    return false
  }

  judgeShortNote(note, judgeState) {
    if(judgeState != JudgeState.MISS_EMPTY) {
      note.judge(judgeState)
      if(judgeState == JudgeState.BAD || judgeState == JudgeState.MISS) {
        this.combo = 0
      } else {
        this.combo++
      }
    }
  }

  firstJudgeLongNote(note, judgeState) {
    if(judgeState != JudgeState.MISS_EMPTY) {
      note.firstJudge(judgeState)
      if(judgeState == JudgeState.BAD || judgeState == JudgeState.MISS) {
        this.combo = 0
      }
    }
  }

  secondJudgeLongNote(note, success) {
    note.secondJudge(success)
    if(success) {
      this.combo++
    } else {
      this.combo = 0
    }
  }

  checkAndAppendBarLine(y) {
    while(this.barLines[this.barLines.length - 1].y <= y) {
      const lastBarLine = this.barLines[this.barLines.length - 1]
      this.barLines.push({y: lastBarLine.y + lastBarLine.l, l: lastBarLine.l})
    }
  }

  getBarLineIndex(y) {
    return this.barLines.findIndex((e, i, a) => e.y <= y && y < e.y + e.l)
  }

  getBarLine(y) {
    return this.barLines.find((e, i, a) => e.y <= y && y < e.y + e.l)
  }

  getBpmData(y) {
    const list = this.bpmList.filter((e) => e.y <= y)
    return list[list.length - 1]
  }

  calculatePosition(y, barLine) {
    return (y - barLine.y) / barLine.l
  }

  calculatePositionInv(position, barLine) {
    return barLine.y + position * barLine.l
  }

  calculateTime(y, bpmData) {
    // [tick] / 240 [tick/beat(4th)] / bpm [beat(4th)/min] * 60000 [ms/min]
    return bpmData.time + (y - bpmData.y) / 240 / bpmData.bpm * 60000
  }
}

export class JudgeState {
  static get NO() { return 0 }
  static get MISS() { return 1 }
  static get BAD() { return 2 }
  static get GOOD() { return 3 }
  static get GREAT() { return 4 }
  static get EXCELLENT() { return 5 }
  static get MISS_EMPTY() { return 6 }
}

export class Note {
  constructor(x, y, c, time, position) {
    this.x = x
    this.y = y
    this.c = c
    this.time = time
    this.position = position

    this.judgeState = JudgeState.NO
    this.targetable = true

    this.audioBuffer = null
  }
}

export class NoteShort extends Note {
  constructor(x, y, c, time, position) {
    super(x, y, c, time, position)
    this.eraseTimer = -1
  }

  judge(judgeState) {
    this.judgeState = judgeState
    this.eraseTimer = 0
    this.targetable = false
  }
}

export class NoteLong extends Note {
  constructor(x, y, c, time, position, endY, endTime, endPosition) {
    super(x, y, c, time, position)
    this.endY = endY
    this.endTime = endTime
    this.endPosition = endPosition

    this.noteHeadEraseTimer = -1
    this.noteHeadPosition = position
    this.noteHeadMovable = false

    // Whether note is being pressed
    this.active = false
    // Whether line is rendered as active
    this.lineActive = true
  }

  firstJudge(judgeState) {
    this.judgeState = judgeState
    if(judgeState == JudgeState.BAD || judgeState == JudgeState.MISS) {
      this.targetable = false
      this.lineActive = false
    } else {
      this.active = true
      this.noteHeadMovable = true
    }
  }

  secondJudge(success) {
    if(!success) {
      this.judgeState = JudgeState.MISS
      this.noteHeadMovable = false
      this.lineActive = false
    }
    this.noteHeadEraseTimer = 0
    this.targetable = false
    this.active = false
  }

}
