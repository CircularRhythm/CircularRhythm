import { BarSpeedChangeEvent, BarSpeedChangeEventSpeed, BarSpeedChangeEventStop } from "./bar-speed-change-event"
import { Note, NoteShort, NoteLong } from "./note"
import { JudgeState } from "./judge-state"
import { AudioSlicer } from "./audio-slicer"
import { AssetLoader, AssetLoaderArchive } from "./asset-loader"
import { BmsonLoader } from "./bmson-loader"
import { PlayerUtil } from "./player-util"

export class Player {
  // TODO: Make soundChannels index-base
  // TODO: Should not iterate soundChannels every frame due to performance problems (especially bmson converted from bms)
  constructor(game, bmsonSet, parentPath) {
    this.game = game
    this.bmsonSet = bmsonSet
    this.bmson = bmsonSet.bmson
    this.assetLoader = bmsonSet.assetLoader
    this.bmsonLoader = new BmsonLoader(this.bmson)
    this.parentPath = parentPath
    this.keyConfig = [72, 74, 75, 76]
    this.keyFlashing = [0, 0, 0, 0]

    this.audioContext = new AudioContext()

    this.lastTime = 0
    this.playing = false

    this.currentY = 0
    this.currentPosition = 0
    this.currentTime = 0
    this.currentBpm = this.bmson.info.initBPM
    this.currentBarSpeed = 0
    this.currentBarLine = null

    this.visibleEndY = 0
    this.visibleEndPosition = 0.7
    this.visibleEndTime = 0

    this.supportLineVisibleEndY = 0

    // String(name) -> [Note]
    this.visibleNotes = new Map()
    // Int -> {name: String, note: Note}
    this.targetNotes = new Map()

    this.combo = 0
    this.maxCombo = 0

    // [{time: Number, y: Number, bpm: Number}]
    // used by timeToY, yToTime
    // yToTime on a stop event will return start time of the stop
    this.timingList = this.bmsonLoader.loadTimingList()

    // [{y: Number, l: Number}]
    this.barLines = this.bmsonLoader.loadBarLines()
    this.bmsonLoader.appendLackingBarLine(this.barLines)
    this.bmsonLoader.makeBeatData(this.barLines)

    this.supportLines = this.bmsonLoader.makeSupportLines(this.barLines)
    this.visibleSupportLines = []

    // [{y: Number, bpm: Number, time: Number}]
    /*this.bpmList = []
    this.stopList = []
    this.lengthChangeList = []*/
    this.barSpeedChangeList = this.bmsonLoader.getBarSpeedChangeList(this.barLines, this.timingList)

    this.visibleBarSpeedChangeList = []
    this.barMovingSpeedChangeEvent = null

    // [{name: String, notes: [Note]}]
    this.soundChannels = this.bmsonLoader.loadSoundChannels(this.barLines, this.timingList)

    this.numberOfNotes = this.bmsonLoader.getNumberOfNotes(this.soundChannels)

    this.unitPosition = 0

    this.judgeStats = [0, 0, 0, 0, 0, 0, 0]
    this.score = 0
    this.scoreMultiply = [0, 0, 0.05, 0.25, 0.5, 1, 0]
  }

  init() {
    return new Promise((resolve, reject) => {
      new AudioSlicer(this.audioContext, this.assetLoader, this.soundChannels).loadAudio().then(() => resolve())
    })
  }

  start() {
    this.visibleEndY = PlayerUtil.positionToY(this.visibleEndPosition, this.barLines[0])

    this.supportLineVisibleEndY = this.barLines[0].l
    const newSupportLines = this.supportLines.filter((e) => this.supportLineVisibleEndY > e.y)
    Array.prototype.push.apply(this.visibleSupportLines, newSupportLines)

    this.soundChannels.forEach((e, i) => {
      this.visibleNotes.set(i, e.notes.filter((note) => note.y < this.visibleEndY && 1 <= note.x && note.x <= 4))
    })

    this.currentBarLine = this.barLines[0]
    // speed [(pos)/ms] = bpm [beat/min] / 60000 [ms/min] * 240 [tick / beat] / length [tick/(pos)]
    this.currentBarSpeed = this.currentBpm / 60000 * 240 / this.barLines[0].l
    this.lastTime = Date.now()
    this.playing = true
  }

  update(input) {
    const nowTime = Date.now()
    const delta = nowTime - this.lastTime
    this.lastTime = nowTime
    this.currentTime += delta

    for(let i = 0; i < 4; i++) {
      this.keyFlashing[i] -= 0.05
      if(this.keyFlashing[i] < 0) this.keyFlashing[i] = 0
      if(input.isPressed(this.keyConfig[i])) this.keyFlashing[i] = 1
    }

    // ⊿T [tick/frame] = 240 [tick/beat(4th)] * bpm [beat(4th)/min] * delta [ms] / 60000 [ms/min]
    //const deltaY = 240 * this.currentBpm * delta / 60000
    //this.currentY += deltaY
    const timingData = PlayerUtil.getTimingDataFromTime(this.currentTime, this.timingList)
    this.currentY = PlayerUtil.timeToY(this.currentTime, timingData)
    if(timingData.bpm != 0) this.currentBpm = timingData.bpm

    const currentBarLineIndex = PlayerUtil.getBarLineIndex(this.currentY, this.barLines)
    if(currentBarLineIndex == -1) {
      this.playing = false
      this.end()
      return
    }
    const currentBarLine = this.barLines[currentBarLineIndex]
    this.currentBarLine = currentBarLine

    this.currentPosition = PlayerUtil.yToPosition(this.currentY, currentBarLine)
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
        this.visibleEndY = PlayerUtil.positionToY(this.visibleEndPosition, this.barLines[barLineIndex])
      }
    } else {
      // Not step over a barline
      this.visibleEndPosition = visibleEndPositionAdded
      this.visibleEndY = PlayerUtil.positionToY(this.visibleEndPosition, this.barLines[currentBarLineIndex])
    }
    const deltaVisibleEndY = this.visibleEndY - oldVisibleEndY

    // speed [(pos)/ms] = bpm [beat/min] / 60000 [ms/min] * 240 [tick / beat] / length [tick/(pos)]
    this.currentBarSpeed = this.currentBpm / 60000 * 240 / currentBarLine.l

    // Speed change line
    this.visibleBarSpeedChangeList = this.visibleBarSpeedChangeList.filter((e) => e.y >= this.currentY)
    const newEvent = this.barSpeedChangeList.filter((e) => e.targetable && this.visibleEndY - deltaVisibleEndY <= e.y && e.y < this.visibleEndY)
    Array.prototype.push.apply(this.visibleBarSpeedChangeList, newEvent)

    const earliestEvent = this.visibleBarSpeedChangeList.sort((a, b) => a.y - b.y)[0]
    this.barMovingSpeedChangeEvent = earliestEvent
    if(earliestEvent instanceof BarSpeedChangeEventStop && earliestEvent.y == this.currentY) {
      if(earliestEvent.barMoveTime < this.currentTime) {
        // Approaching resumption
        earliestEvent.showMovingLine = true
        earliestEvent.currentPosition = earliestEvent.position - (earliestEvent.time + earliestEvent.length - this.currentTime) * earliestEvent.speed
      }
    } else if(earliestEvent instanceof BarSpeedChangeEventSpeed) {
      if(earliestEvent.barMoveTime < this.currentTime) {
        earliestEvent.showMovingLine = true
        earliestEvent.currentPosition = earliestEvent.position - (earliestEvent.time - this.currentTime) * earliestEvent.speed
      }
    }

    // Support line
    const oldSupportLineVisibleEndY = this.supportLineVisibleEndY
    if(currentBarLineIndex >= this.barLines.length - 1) {
      this.supportLineVisibleEndY = currentBarLine.y + currentBarLine.l
    } else {
      const nextBarLine = this.barLines[currentBarLineIndex + 1]
      this.supportLineVisibleEndY = PlayerUtil.positionToY(this.currentPosition, nextBarLine)
    }
    const deltaSupportLineVisibleEndY = this.supportLineVisibleEndY - oldSupportLineVisibleEndY

    this.visibleSupportLines = this.visibleSupportLines.filter((e) => e.y > this.currentY)
    const newSupportLines = this.supportLines.filter((e) => this.supportLineVisibleEndY - deltaSupportLineVisibleEndY <= e.y && e.y < this.supportLineVisibleEndY)
    Array.prototype.push.apply(this.visibleSupportLines, newSupportLines)

    this.unitPosition = ((this.currentY - currentBarLine.y) % currentBarLine.maximumUnit) / currentBarLine.maximumUnit

    // Add notes which to be visible
    this.soundChannels.forEach((channel, i) => {
      const newVisibleNotes = channel.notes.filter((note) => this.visibleEndY - deltaVisibleEndY <= note.y && note.y < this.visibleEndY && 1 <= note.x && note.x <= 4)
      Array.prototype.push.apply(this.visibleNotes.get(i), newVisibleNotes)
    })

    // Erase notes which is already judged
    this.visibleNotes.forEach((notes, index) => {
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
      this.visibleNotes.set(index, notes)
    })

    // Target & Judge
    // Before assigning new targets, clean up old ones
    // TODO: Double-judgment
    this.targetNotes.forEach((e, x) => {
      if(!e.note.targetable) this.targetNotes.delete(x)
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
      const playSoundNotes = channel.notes.filter((note) => this.currentTime - delta < note.time && note.time <= this.currentTime && (note.x == 0 || 4 < note.x))
      playSoundNotes.forEach((note) => this.noteOn(channel.name, note))

    }

    // Judge
    for(let i = 0; i < 4; i++) {
      const button = this.keyConfig[i]
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
        if(this.currentTime - note.time > 200) this.judgeShortNote(note, JudgeState.MISS)
        else if(input.isJustPressed(button)) {
          const judge = this.getJudge(this.currentTime - note.time)
          this.judgeShortNote(note, judge)
          this.noteOn(target.name, note)
        }
      }
      if(note instanceof NoteLong) {
        // Miss
        if(this.currentTime - note.time > 200 && note.judgeState == JudgeState.NO) this.firstJudgeLongNote(note, JudgeState.MISS)
        else if(input.isJustPressed(button)) {
          const judge = this.getJudge(this.currentTime - note.time)
          this.firstJudgeLongNote(note, judge)
          this.noteOn(target.name, note)
        }

        if(note.active) {
          if(this.currentTime - note.endTime > 200) this.secondJudgeLongNote(note, false)
          else if(input.isJustReleased(button)) {
            const judge = this.getSecondJudge(this.currentTime - note.endTime)
            this.secondJudgeLongNote(note, judge)
            if(!judge) this.noteOff(target.name)
          }
        }
      }
    }
  }

  end() {
    this.game.endCallback({
      musicName: this.bmson.info.title,
      judge: this.judgeStats,
      maxCombo: this.maxCombo,
      numberOfNotes: this.numberOfNotes,
      score: Math.ceil(this.score)
    })
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
    if(diffAbs < 20) return JudgeState.EXCELLENT
    if(diffAbs < 50) return JudgeState.GREAT
    if(diffAbs < 100) return JudgeState.GOOD
    if(diffAbs < 200) return JudgeState.BAD
    return JudgeState.MISS_EMPTY
  }

  getSecondJudge(difference) {
    const diffAbs = Math.abs(difference)
    if(diffAbs <= 200) return true
    return false
  }

  judgeShortNote(note, judgeState) {
    if(judgeState != JudgeState.MISS_EMPTY) {
      note.judge(judgeState)
      if(judgeState == JudgeState.BAD || judgeState == JudgeState.MISS) {
        this.combo = 0
      } else {
        this.combo++
        if(this.combo > this.maxCombo) this.maxCombo = this.combo
      }
    }
    this.judgeStats[judgeState] ++
    this.score += 1000000 * this.scoreMultiply[judgeState] / this.numberOfNotes
  }

  firstJudgeLongNote(note, judgeState) {
    if(judgeState != JudgeState.MISS_EMPTY) {
      note.firstJudge(judgeState)
      if(judgeState == JudgeState.BAD || judgeState == JudgeState.MISS) {
        this.combo = 0
        this.judgeStats[judgeState] ++
      }
    } else {
      this.judgeStats[judgeState] ++
    }
  }

  secondJudgeLongNote(note, success) {
    note.secondJudge(success)
    if(success) {
      this.combo++
      if(this.combo > this.maxCombo) this.maxCombo = this.combo
      this.judgeStats[note.judgeState] ++
      this.score += 1000000 * this.scoreMultiply[note.judgeState] / this.numberOfNotes
    } else {
      this.combo = 0
      this.judgeStats[JudgeState.BAD] ++
      this.score += 1000000 * this.scoreMultiply[JudgeState.BAD] / this.numberOfNotes
    }
  }
}
