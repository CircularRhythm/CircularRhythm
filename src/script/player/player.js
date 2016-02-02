import { BarSpeedChangeEvent, BarSpeedChangeEventSpeed, BarSpeedChangeEventStop } from "./bar-speed-change-event"
import { Note, NoteShort, NoteLong } from "./note"
import { JudgeState } from "./judge-state"
import { AssetLoader, AssetLoaderPacked, AssetLoaderLocal } from "./asset-loader"
import { PlayerUtil } from "./player-util"
import { ChartType } from "../chart-type"
import { Rank } from "./rank"
import XHRPromise from "../xhr-promise"
import LoaderBmson from "./loader/loader-bmson"
import LoaderChart from "./loader/loader-chart"
import LoaderAsset from "./loader/loader-asset"
import { SliceData } from "./slice-data.js"
import { GaugeGainNormal, GaugeGainEasy, GaugeGainSurvival, GaugeGainDanger } from "./gauge-gain"
import GaugeType from "./gauge-type"

export class Player {
  // TODO: Should not iterate soundChannels every frame due to performance problems (especially bmson converted from bms)
  constructor(game, bmsonSetConfig) {
    this.game = game
    this.state = States.LOADING
    this.loadingScreenOpacity = 1
    this.readyMessageOpacity = 1
    this.deadTimer = 0
    this.bmsonSetConfig = bmsonSetConfig
    this.playMode = bmsonSetConfig.playMode
    this.lanes = this.playMode * 4 + 1
    this.specialLane = this.playMode * 4 + 1
    this.autoSpecial = bmsonSetConfig.config.autoSpecial
    this.keyConfig = game.preference.keyConfig

    this.title = null
    this.subtitle = null
    this.artist = null
    this.subartists = []
    this.level = null
    this.chartType = null
    this.chartName = null

    this.loaderBmson = null
    this.loaderChart = null
    this.loaderAsset = null

    this.bmson = null
    this.assetDefinition = null

    this.keyFlashing = [0, 0, 0, 0, 0, 0, 0, 0]
    this.specialLaneFlash = 0
    this.specialLaneJudgeState = JudgeState.NO
    this.visibleNotes = []
    // [{x: Number, position: Number, phase: Number, judgeState: Number}]
    this.eraseParticleList = []
    this.unitPosition = 0

    this.audioContext = new AudioContext()
    this.backgroundGainNode = this.audioContext.createGain()
    this.backgroundGainNode.connect(this.audioContext.destination)
    this.foregroundGainNode = this.audioContext.createGain()
    this.foregroundGainNode.connect(this.audioContext.destination)
    this.soundEffectGainNode = this.audioContext.createGain()
    this.soundEffectGainNode.connect(this.audioContext.destination)

    this.lastTime = 0
    this.playing = false

    this.currentY = 0
    this.currentPosition = 0
    this.currentTime = 0
    //this.currentBpm = this.bmson.info.init_bpm
    this.currentBpm = bmsonSetConfig.bpm.initial
    this.currentBarSpeed = 0
    this.currentBarLine = null

    this.visibleEndY = 0
    this.visibleEndPosition = 0.7
    this.visibleEndTime = 0

    this.specialLaneDuration = 750

    this.supportLineVisibleEndY = 0

    this.visibleBarSpeedChangeList = []
    this.barMovingSpeedChangeEvent = null
    this.visibleSupportLines = []

    // Int -> {name: String, note: Note}
    this.targetNotes = new Map()

    this.combo = 0
    this.maxCombo = 0

    this.currentAnalyzerPosition = 0
    this.analyzer = {}
    this.analyzer.density = null
    this.analyzer.densityMax = null
    this.analyzer.accuracy = new Array(100).fill(0)

    this.judgeStats = {
      [JudgeState.MISS_EMPTY]: 0,
      [JudgeState.MISS]: 0,
      [JudgeState.BAD]: 0,
      [JudgeState.GOOD]: 0,
      [JudgeState.GREAT]: 0,
      [JudgeState.PERFECT]: 0
    }
    this.score = 0
    this.scoreMultiply = {
      [JudgeState.NO]: 0,
      [JudgeState.MISS]: 0,
      [JudgeState.MISS_EMPTY]: 0,
      [JudgeState.BAD]: 0.1,
      [JudgeState.GOOD]: 0.5,
      [JudgeState.GREAT]: 0.75,
      [JudgeState.PERFECT]: 1
    }
    this.accuracyMultiply = {
      [JudgeState.NO]: 0,
      [JudgeState.MISS]: 0,
      [JudgeState.MISS_EMPTY]: 0,
      [JudgeState.BAD]: 0,
      [JudgeState.GOOD]: 0.5,
      [JudgeState.GREAT]: 0.75,
      [JudgeState.PERFECT]: 1
    }

    switch(bmsonSetConfig.config.gaugeType) {
      case GaugeType.NORMAL:
        this.gaugeGain = new GaugeGainNormal()
        break
      case GaugeType.EASY:
        this.gaugeGain = new GaugeGainEasy()
        break
      case GaugeType.SURVIVAL:
        this.gaugeGain = new GaugeGainSurvival()
        break
      case GaugeType.DANGER:
        this.gaugeGain = new GaugeGainDanger()
        break
    }

    this.theoreticalScore = 0
    this.rank = Rank.D

    this.gauge = this.gaugeGain.getInitialGauge()

    this.load()
  }

  load() {
    new Promise((resolve, reject) => {
      this.loaderBmson = new LoaderBmson(this.bmsonSetConfig)
      this.loaderBmson.load().then((result) => {
        this.bmson = result.bmson
        this.assetDefinition = result.assetDefinition
        this.loaderChart = new LoaderChart(this)
        return this.loaderChart.load()
      }).then((result) => {
        const parentPath = this.bmsonSetConfig.path.replace(/\/[^\/]*$/, "")
        let assetLoader
        if(this.bmsonSetConfig.local) {
          assetLoader = new AssetLoaderLocal(parentPath, this.bmsonSetConfig.localFileList)
        } else if(this.bmsonSetConfig.packedAssets) {
          assetLoader = new AssetLoaderPacked(parentPath, this.assetDefinition)
        } else {
          assetLoader = new AssetLoader(parentPath)
        }
        this.loaderAsset = new LoaderAsset(this.audioContext, this.soundChannels.map((e) => e.name), assetLoader)
        return this.loaderAsset.load()
      }).then((result) => {
        result.forEach((e, i) => this.soundChannels[i].audioBuffer = e)

        console.log("Loading completed.")
        this.state = States.READY

        resolve()
      })
    })
  }

  start() {
    this.visibleEndY = PlayerUtil.positionToY(this.visibleEndPosition, this.barLines[0])

    this.supportLineVisibleEndY = this.barLines[0].l
    const newSupportLines = this.supportLines.filter((e) => this.supportLineVisibleEndY > e.y)
    Array.prototype.push.apply(this.visibleSupportLines, newSupportLines)

    this.soundChannels.forEach((e, i) => {
      //const firstVisibleNotes = []
      Array.prototype.push.apply(this.visibleNotes, e.notes.filter((note) => note.y < this.visibleEndY && this.isNormalLane(note.x)))
      if(!this.autoSpecial) Array.prototype.push.apply(this.visibleNotes, e.notes.filter((note) => note.time < this.specialLaneDuration && this.isSpecialLane(note.x)))
      //this.visibleNotes.set(i, firstVisibleNotes)
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

    if(this.state != States.LOADING) {
      this.loadingScreenOpacity -= delta / 500
      if(this.loadingScreenOpacity < 0) this.loadingScreenOpacity = 0
    }

    if(this.state == States.READY) {
      if(input.isJustPressed(13)) {
        // Enter
        this.start()
        this.state = States.IN_GAME
      }
    }

    if(this.state == States.DEAD) {
      this.deadTimer += delta / 3000
      if(this.deadTimer > 1) {
        this.end(true)
        this.state = States.END
      }
    }

    for(let i = 0; i < this.lanes - 1; i++) {
      this.keyFlashing[i] -= 0.05
      if(this.keyFlashing[i] < 0) this.keyFlashing[i] = 0
      if(this.isPressed(i, input)) this.keyFlashing[i] = 1
    }
    this.specialLaneFlash -= 0.05
    if(this.specialLaneFlash < 0) this.specialLaneFlash = 0
    if(this.isJustPressed(this.specialLane - 1, input)) {
      this.specialLaneFlash = 1
      this.specialLaneJudgeState = JudgeState.NO
    }
    if(!this.playing) return

    this.readyMessageOpacity -= delta / 300
    if(this.readyMessageOpacity < 0) this.readyMessageOpacity = 0

    this.currentTime += delta

    const lastAnalyzerPosition = this.currentAnalyzerPosition
    this.currentAnalyzerPosition = Math.floor(this.currentTime / this.duration * 100)
    /*if(lastAnalyzerPosition != this.currentAnalyzerPosition) {
      // TODO: Add accuracy of long note
      //this.analyzer.accuracy[lastAnalyzerPosition]
    }*/

    // ⊿T [tick/frame] = 240 [tick/beat(4th)] * bpm [beat(4th)/min] * delta [ms] / 60000 [ms/min]
    //const deltaY = 240 * this.currentBpm * delta / 60000
    //this.currentY += deltaY
    const timingData = PlayerUtil.getTimingDataFromTime(this.currentTime, this.timingList)
    this.currentY = PlayerUtil.timeToY(this.currentTime, timingData)
    if(timingData.bpm != 0) this.currentBpm = timingData.bpm

    const currentBarLineIndex = PlayerUtil.getBarLineIndex(this.currentY, this.barLines)
    if(currentBarLineIndex == -1) {
      this.playing = false
      this.end(false)
      this.state = States.END
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
        earliestEvent.movingPhase = Math.min(1, 2 - (earliestEvent.time + earliestEvent.length - this.currentTime) / (earliestEvent.time + earliestEvent.length - earliestEvent.barMoveTime) * 2)
        earliestEvent.currentPosition = earliestEvent.position - (earliestEvent.time + earliestEvent.length - this.currentTime) * earliestEvent.speed
      }
    } else if(earliestEvent instanceof BarSpeedChangeEventSpeed) {
      if(earliestEvent.barMoveTime < this.currentTime) {
        earliestEvent.showMovingLine = true
        earliestEvent.movingPhase = Math.min(1, 2 - (earliestEvent.time - this.currentTime) / (earliestEvent.time - earliestEvent.barMoveTime) * 2)
        earliestEvent.currentPosition = earliestEvent.position - (earliestEvent.time - this.currentTime) * earliestEvent.speed
      }
    }

    this.visibleBarSpeedChangeList.forEach((e) => {
      e.phase += 0.003 * delta
      if(e.phase > 1) e.phase = 1
    })

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
      const newVisibleNotes = channel.notes.filter((note) => this.visibleEndY - deltaVisibleEndY <= note.y && note.y < this.visibleEndY && this.isNormalLane(note.x))
      Array.prototype.push.apply(this.visibleNotes, newVisibleNotes)
      if(!this.autoSpecial) {
        const newVisibleNotesSpecial = channel.notes.filter((note) => this.currentTime + this.specialLaneDuration - delta <= note.time && note.time < this.currentTime + this.specialLaneDuration && this.isSpecialLane(note.x))
        Array.prototype.push.apply(this.visibleNotes, newVisibleNotesSpecial)
      }
    })

    this.visibleNotes.forEach((note) => {
      if(this.isSpecialLane(note.x)) {
        note.phase = Math.min(1 - (note.time - this.currentTime) / this.specialLaneDuration, 1)
      } else {
        if(note instanceof NoteShort && note.time - 300 <= this.currentTime) {
          const gap = Math.max(Math.abs(this.currentTime - note.time) / 300, 0)
          note.phase = 1 - gap
        } else if(note instanceof NoteLong && note.time - 300 <= this.currentTime) {
          const gap = Math.max((note.time - this.currentTime) / 300, (this.currentTime - note.endTime) / 300, 0)
          note.phase = 1 - gap
        } else {
            note.phase += delta * 0.005
            if(note.phase > 0) note.phase = 0
        }
      }
    })

    this.visibleNotes.filter((note) => note instanceof NoteLong && note.noteHeadMovable).forEach((note) => {
      if(note.y <= this.currentY && this.currentY < note.endY) {
        note.noteHeadPosition = this.currentPosition
      } else if(note.endY <= this.currentY) {
        note.noteHeadPosition = note.endPosition
      } else {
        note.noteHeadPosition = note.position
      }
      //note.noteHeadPosition = note.endY > this.currentY ? this.currentPosition : note.endPosition
    })

    this.visibleNotes.filter((note) => note instanceof NoteLong && this.currentTime > note.endTime && note.state != 2).forEach((note) => {
      this.eraseParticleList.push({x: note.x, position: note.noteHeadPosition, phase: 0, judgeState: note.judgeState})
    })

    // Remove currentTime > endTime && state != 1
    this.visibleNotes = this.visibleNotes.filter((note) => !(note instanceof NoteLong) || this.currentTime <= note.endTime || note.state == 1)

    this.eraseParticleList.forEach((e) => e.phase += delta * 0.003)
    this.eraseParticleList = this.eraseParticleList.filter((e) => e.phase < 1)

    // Target & Judge
    // Before assigning new targets, clean up old ones
    // TODO: Double-judgment
    this.targetNotes.forEach((e, x) => {
      if(!e.note.targetable) this.targetNotes.delete(x)
    })
    this.soundChannels.forEach((channel, i) => {
      // Assign new targets
      const newTargets = channel.notes.filter((note) => note.time - this.currentTime < 1000 && note.judgeState == JudgeState.NO && this.isControllableLane(note.x))
      for(let note of newTargets) {
        const x = note.x
        const target = this.targetNotes.get(x)
        if(!target) {
          // Target is empty
          this.targetNotes.set(x, {channelIndex: i, note: note})
        } else {
          // If target is not empty, prior note will be assigned
          if(note.time < target.note.time) this.targetNotes.set(x, {channelIndex: i, note: note})
        }
      }
      const playSoundNotes = channel.notes.filter((note) => this.currentTime - delta < note.time && note.time <= this.currentTime && !this.isControllableLane(note.x))
      playSoundNotes.forEach((note) => {
        if(note.sliceData) note.sliceData.play(this.audioContext, this.backgroundGainNode, channel.audioBuffer)
      })
    })

    // Judge
    for(let i = 0; i < this.lanes; i++) {
      const x = i + 1
      const target = this.targetNotes.get(x)
      if(target) {
        const channel = this.soundChannels[target.channelIndex]
        const note = target.note
        if(note instanceof NoteShort && note.judgeState == JudgeState.NO) {
          // Miss
          if(this.currentTime - note.time > 200) this.judgeShortNote(note, JudgeState.MISS)
          else if(this.isJustPressed(i, input)) {
            const judge = JudgeState.firstFromDelta(this.currentTime - note.time)
            this.judgeShortNote(note, judge)
            if(note.sliceData) note.sliceData.play(this.audioContext, this.foregroundGainNode, channel.audioBuffer)
          }
        }
        if(note instanceof NoteLong) {
          // Miss
          if(this.currentTime - note.time > 200 && note.judgeState == JudgeState.NO) this.firstJudgeLongNote(note, JudgeState.MISS)
          else if(this.isJustPressed(i, input)) {
            const judge = JudgeState.firstFromDelta(this.currentTime - note.time)
            this.firstJudgeLongNote(note, judge)
            if(note.sliceData) note.sliceData.play(this.audioContext, this.foregroundGainNode, channel.audioBuffer)
          }

          if(note.state == 1) {
            if(this.currentTime - note.endTime > 200) this.secondJudgeLongNote(note, false)
            else if(this.isJustReleased(i, input)) {
              const judge = JudgeState.secondFromDelta(this.currentTime - note.endTime)
              this.secondJudgeLongNote(note, judge)
              if(!judge && note.sliceData) note.sliceData.stop()
            }
          }
        }
      }
    }
  }

  end(dead) {
    this.playing = false
    this.audioContext.close().then(() => {
      this.game.endCallback({
        title: this.bmson.info.title,
        subtitle: this.bmson.info.subtitle,
        mode: this.playMode,
        chartName: this.bmson.info.chart_name,
        level: this.bmson.info.level,
        judge: this.judgeStats,
        maxCombo: this.maxCombo,
        notes: this.numberOfNotes,
        score: Math.round(this.score),
        rank: this.rank,
        analyzer: this.analyzer,
        gaugeType: this.bmsonSetConfig.config.gaugeType,
        dead: dead
      })
    })
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
      this.visibleNotes = this.visibleNotes.filter((e) => e !== note)
      if(note.x == this.specialLane) {
        this.specialLaneJudgeState = judgeState
        if(judgeState == JudgeState.MISS) this.specialLaneFlash = 1
      } else {
        this.eraseParticleList.push({x: note.x, position: note.position, phase: 0, judgeState: judgeState})
      }
      this.applyScore(judgeState)
      this.applyGauge(judgeState)
      this.analyzer.accuracy[Math.floor(note.time / this.duration * 100)] += this.accuracyMultiply[judgeState]
    } else {
      this.applyGauge(judgeState)
    }
    this.judgeStats[judgeState] ++
  }

  firstJudgeLongNote(note, judgeState) {
    if(judgeState != JudgeState.MISS_EMPTY) {
      note.firstJudge(judgeState)
      if(judgeState == JudgeState.BAD || judgeState == JudgeState.MISS) {
        this.combo = 0
        this.judgeStats[judgeState] ++
        this.applyScore(judgeState)
        this.applyGauge(judgeState)
        this.eraseParticleList.push({x: note.x, position: note.position, phase: 0, judgeState: judgeState})
      }

      const startIndex = Math.floor(note.time / this.duration * 100)
      const endIndex = Math.floor(note.endTime / this.duration * 100)
      for(let i = startIndex; i <= endIndex; i++) {
        this.analyzer.accuracy[i] += this.accuracyMultiply[judgeState]
      }
    } else {
      this.judgeStats[judgeState] ++
      this.applyGauge(judgeState)
    }
  }

  secondJudgeLongNote(note, success) {
    const firstJudgeState = note.judgeState
    note.secondJudge(success)
    if(success) {
      this.combo++
      if(this.combo > this.maxCombo) this.maxCombo = this.combo
      this.judgeStats[note.judgeState] ++
      this.applyScore(note.judgeState)
      this.applyGauge(note.judgeState)
    } else {
      this.combo = 0
      this.judgeStats[JudgeState.BAD] ++
      this.applyScore(JudgeState.BAD)
      this.applyGauge(JudgeState.BAD)
      this.eraseParticleList.push({x: note.x, position: note.noteHeadPosition, phase: 0, judgeState: JudgeState.BAD})

      const startIndex = Math.floor(note.time / this.duration * 100)
      const endIndex = Math.floor(note.endTime / this.duration * 100)
      for(let i = startIndex; i <= endIndex; i++) {
        this.analyzer.accuracy[i] -= this.accuracyMultiply[firstJudgeState]
      }
    }
  }

  applyScore(judgeState) {
    this.score += 1000000 * this.scoreMultiply[judgeState] / this.numberOfNotes
    this.theoreticalScore += 1000000 / this.numberOfNotes
    this.rank = Rank.fromRate(this.score / this.theoreticalScore)
  }

  applyGauge(judgeState) {
    this.gauge = this.gaugeGain.getNewGauge(this.gauge, judgeState, this.numberOfNotes, 100)
    if(this.gauge > 100) this.gauge = 100
    if(this.gauge < 0) this.gauge = 0
    if(this.gaugeGain.isDead(this.gauge)) {
      this.playing = false
      this.state = States.DEAD
      this.backgroundGainNode.gain.value = 0
      this.foregroundGainNode.gain.value = 0
    }
  }

  isNormalLane(x) {
    return 1 <= x && x <= this.lanes - 1
  }

  isSpecialLane(x) {
    return x == this.specialLane
  }

  isControllableLane(x) {
    if(this.autoSpecial) return 1 <= x && x <= this.lanes - 1
    return 1 <= x && x <= this.lanes
  }

  isJustPressed(lane, input) {
    if(this.playMode == 1 && 0 <= lane && lane <= 3) {
      return input.isJustPressed(this.keyConfig[lane]) || input.isJustPressed(this.keyConfig[lane + 4])
    } else if(this.playMode == 1 && lane == 4) {
      return input.isJustPressed(this.keyConfig[8])
    } else if(this.playMode == 2) {
      return input.isJustPressed(this.keyConfig[lane])
    }
  }

  isPressed(lane, input) {
    if(this.playMode == 1 && 0 <= lane && lane <= 3) {
      return input.isPressed(this.keyConfig[lane]) || input.isPressed(this.keyConfig[lane + 4])
    } else if(this.playMode == 1 && lane == 4) {
      return input.isPressed(this.keyConfig[8])
    } else if(this.playMode == 2) {
      return input.isPressed(this.keyConfig[lane])
    }
  }

  isJustReleased(lane, input) {
    if(this.playMode == 1 && 0 <= lane && lane <= 3) {
      return input.isJustReleased(this.keyConfig[lane]) || input.isJustReleased(this.keyConfig[lane + 4])
    } else if(this.playMode == 1 && lane == 4) {
      return input.isJustReleased(this.keyConfig[8])
    } else if(this.playMode == 2){
      return input.isJustReleased(this.keyConfig[lane])
    }
  }
}

export class States {
  static get LOADING() { return 0 }
  static get READY() { return 1 }
  static get PLAYING() { return 2 }
  static get DEAD() { return 3 }
  static get END() { return 4 }
}
