import { NoteShort, NoteLong } from "../note"
import { JudgeState } from "../judge-state"
import { BarSpeedChangeEvent, BarSpeedChangeEventSpeed, BarSpeedChangeEventStop } from "../bar-speed-change-event"
import { ConicalGradient } from "./conical-gradient"
import { RenderUtil } from "./render-util"
import $ from "jquery"
import { ColorScheme } from "./color-scheme"
import Color from "color"
import { Rank } from "../rank"
import FormatNumber from "format-number"
import Util from "../../util"
import { AnalyzerRenderer } from "./analyzer-renderer"
import { States } from "../player"

export class Renderer {
  constructor(game, framework, preference) {
    this.game = game
    this.framework = framework
    this.preference = preference
    this.colorScheme = preference.renderer.colorScheme
    this.analyzerRenderer = new AnalyzerRenderer(190, 520, 420, 70)
    this.roundDigit1 = FormatNumber({round: 1, padRight: 1})
  }

  render(graphicContexts, controller) {
    const player = this.game.player
    const g = graphicContexts[0]  // Main
    const gl = graphicContexts[1] // Layer

    if(player.loadingScreenOpacity > 0) {
      gl.canvas.style.opacity = player.loadingScreenOpacity
      RenderUtil.fillRect(gl, 0, 0, 800, 600, this.colorScheme.background)
      gl.save()
      gl.translate(400, 300)
      RenderUtil.strokeCircle(gl, 0, 0, 100, this.colorScheme.lane[0], 1)
      RenderUtil.strokeCircle(gl, 0, 0, 130, this.colorScheme.lane[1], 1)
      RenderUtil.strokeCircle(gl, 0, 0, 160, this.colorScheme.lane[2], 1)
      RenderUtil.strokeCircle(gl, 0, 0, 190, this.colorScheme.lane[3], 1)

      if(player.loaderBmson) RenderUtil.strokeArc(gl, 0, 0, 100, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * player.loaderBmson.progress, this.colorScheme.note.long.active[0], 5, false)
      if(player.loaderChart) RenderUtil.strokeArc(gl, 0, 0, 130, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * player.loaderChart.progress, this.colorScheme.note.long.active[1], 5, false)
      if(player.loaderAsset) RenderUtil.strokeArc(gl, 0, 0, 160, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * player.loaderAsset.assetProgress, this.colorScheme.note.long.active[2], 5, false)
      if(player.loaderAsset) RenderUtil.strokeArc(gl, 0, 0, 190, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * player.loaderAsset.audioProgress, this.colorScheme.note.long.active[3], 5, false)
      gl.restore()

      RenderUtil.fillRect(gl, 0, 225, 800, 150, "rgba(255, 255, 255, 0.8)")
      RenderUtil.fillText(gl, player.bmsonSetConfig.genre, 400, 245, "18px 'Open Sans'", "#000000", "center", "top")
      RenderUtil.fillText(gl, player.bmsonSetConfig.title, 400, 265, "32px 'Open Sans'", "#000000", "center", "top")
      RenderUtil.fillText(gl, player.bmsonSetConfig.artist, 400, 310, "18px 'Open Sans'", "#000000", "center", "top")
      RenderUtil.fillText(gl, "Loading...", 400, 355, "14px 'Open Sans'", "#000000", "center", "bottom")
    }
    if(player.playMode == 1) {
      g.save()
      g.translate(400, 220)
      this.renderUnit(g, controller, 0, this.preference.renderer.ccwSingle)
      g.restore()
    } else if(player.playMode == 2) {
      g.save()
      g.translate(215, 220)
      this.renderUnit(g, controller, 0, this.preference.renderer.ccwDouble1)
      g.restore()
      g.save()
      g.translate(585, 220)
      this.renderUnit(g, controller, 1, this.preference.renderer.ccwDouble2)
      g.restore()
    }

    RenderUtil.fillText(g, this.roundDigit1(player.gauge) + "%", 20, 20, "32px 'Open Sans'", "#000000", "left", "top")
    RenderUtil.fillText(g, Math.round(player.score), 780, 20, "32px 'Open Sans'", "#000000", "right", "top")
    if(player.state != States.LOADING) RenderUtil.fillText(g, `${Util.formatTime(player.currentTime)}/${Util.formatTime(player.duration)}`, 780, 440, "16px 'Open Sans'", "#000000", "right", "bottom")
    RenderUtil.fillText(g, player.currentBpm, 400, 440, "32px 'Open Sans'", "#000000", "center", "bottom")

    const gaugeHeight = 440 * player.gauge / 100
    RenderUtil.fillRect(g, 0, 0, 10, 440, Color(this.colorScheme.gauge[0]).clearer(0.7).rgbaString())
    RenderUtil.fillRect(g, 0, 440 - gaugeHeight, 10, gaugeHeight, this.colorScheme.gauge[0])
    const scoreHeight = 440 * player.score / 1000000
    RenderUtil.fillRect(g, 790, 0, 10, 440, Color(this.colorScheme.score.current).clearer(0.7).rgbaString())
    RenderUtil.fillRect(g, 790, 440 - scoreHeight, 10, scoreHeight, this.colorScheme.score.current)
    RenderUtil.fillRect(g, 0, 440, 800, 10, Color(this.colorScheme.duration).clearer(0.7).rgbaString())
    RenderUtil.fillRect(g, 0, 440, 800 * (player.currentTime / player.duration), 10, this.colorScheme.duration)
    RenderUtil.fillRect(g, 0, 450, 800, 150, this.colorScheme.information.background)

    if(player.readyMessageOpacity > 0) RenderUtil.fillText(g, `Press Enter`, 400, 400, "28px 'Open Sans'", Color("#000000").clearer(1 - player.readyMessageOpacity).rgbaString(), "center", "bottom")

    this.drawInfo(g, 1)

    RenderUtil.fillText(g, `${this.framework.currentFps.toFixed(2)} FPS`, 10, 590, "10px 'Open Sans'", "#000000", "left", "bottom")
    RenderUtil.fillRect(g, 0, 600, 800, this.game.belowHeight, this.colorScheme.controller.background)
  }

  renderUnit(g, controller, playerNum, ccw) {
    const player = this.game.player
    const noteBaseX = playerNum * 4 + 1

    // Special lane flash
    const specialLaneGradient = g.createRadialGradient(0, 0, 20 + player.specialLaneFlash * 50, 0, 0, 70 + player.specialLaneFlash * 50)
    let specialLaneJudgeColor
    if(player.specialLaneJudgeState == JudgeState.NO) specialLaneJudgeColor = this.colorScheme.note.judge[JudgeState.MISS]
    else specialLaneJudgeColor = this.colorScheme.note.judge[player.specialLaneJudgeState]
    specialLaneGradient.addColorStop(0, specialLaneJudgeColor)
    specialLaneGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
    RenderUtil.fillCircle(g, 0, 0, 170, specialLaneGradient)

    RenderUtil.fillCircle(g, 0, 0, 70, this.colorScheme.center)
    RenderUtil.fillText(g, player.combo, 0, 0, "32px 'Open Sans'", "#000000", "center", "middle")

    // Beat flash
    const beatGradient = g.createRadialGradient(0, 0, 60 + player.unitPosition * 5, 0, 0, 70 + player.unitPosition * 10)
    beatGradient.addColorStop(0, Color(this.colorScheme.beat).clearer(1).rgbaString())
    beatGradient.addColorStop(1, this.colorScheme.beat)
    RenderUtil.fillCircle(g, 0, 0, 70, beatGradient)

    // Lane circle
    this.drawLaneCircle(g, 0, player.keyFlashing[playerNum * 4])
    this.drawLaneCircle(g, 1, player.keyFlashing[playerNum * 4 + 1])
    this.drawLaneCircle(g, 2, player.keyFlashing[playerNum * 4 + 2])
    this.drawLaneCircle(g, 3, player.keyFlashing[playerNum * 4 + 3])

    // Support lines
    player.visibleSupportLines.forEach((e) => {
      const radian = this.positionToRadian(e.position, ccw)
      g.strokeStyle = this.colorScheme.beatLine[e.type]
      if(e.type == 1) {
        g.lineWidth = 2
      } else {
        g.lineWidth = 1
      }
      g.globalAlpha = 0.4
      g.beginPath()
      g.moveTo(Math.cos(radian) * 70 , Math.sin(radian) * 70)
      g.lineTo(Math.cos(radian) * 160, Math.sin(radian) * 160)
      g.stroke()
      g.globalAlpha = 1
    })

    // Erase particle
    player.eraseParticleList.forEach((e) => {
      if(noteBaseX <= e.x && e.x <= noteBaseX + 3) {
        const radian = this.positionToRadian(e.position, ccw)
        this.drawEraseParticle(g, e.x - noteBaseX, radian, e.phase, e.judgeState)
      }
    })

    // Note
    player.visibleNotes.forEach((note) => {
      if(note instanceof NoteLong && note.endY > player.currentY) {
        const startPosition = note.y > player.currentY ? note.position : player.currentPosition
        const endPosition = note.endY < player.visibleEndY ? note.endPosition : player.visibleEndPosition
        const startRadian = this.positionToRadian(startPosition, ccw)
        const endRadian = this.positionToRadian(endPosition, ccw)
        if(noteBaseX <= note.x && note.x <= noteBaseX + 3) {
          this.drawLongNoteLine(g, note.x - noteBaseX, startRadian, endRadian, ccw, note.state)
        }
      }
      if(note instanceof NoteShort) {
        const radian = this.positionToRadian(note.position, ccw)
        if(noteBaseX <= note.x && note.x <= noteBaseX + 3) {
          this.drawNote(g, note.x - noteBaseX, radian, note.phase, note.unitType)
        }
        if(note.x == player.specialLane) {
          this.drawSpecialNote(g, note.phase)
        }
      }
      if(note instanceof NoteLong) {
        const noteHeadRadian = this.positionToRadian(note.noteHeadPosition, ccw)
        if(noteBaseX <= note.x && note.x <= noteBaseX + 3 && note.noteHeadVisible) {
          if(note.state == 1) this.drawLongNoteParticle(g, note.x - noteBaseX, noteHeadRadian, note.judgeState)
          const unitType = note.state == 1 ? null : note.unitType
          this.drawNote(g, note.x - noteBaseX, noteHeadRadian, note.phase, unitType)
        }
      }
    })

    // Bar speed change
    player.visibleBarSpeedChangeList.forEach((e, i) => {
      const radian = this.positionToRadian(e.position, ccw)
      this.drawBarSpeedChangeEvent(g, radian, e.type, e.phase)
    })

    if(player.barMovingSpeedChangeEvent && player.barMovingSpeedChangeEvent.showMovingLine) {
      const e = player.barMovingSpeedChangeEvent
      const radian = this.positionToRadian(e.currentPosition, ccw)
      this.drawBarSpeedChangeEvent(g, radian, e.type, e.movingPhase)
    }

    // Bar
    const lineRadian = this.positionToRadian(player.currentPosition, ccw)
    RenderUtil.strokeLine(g, 0, 0, Math.cos(lineRadian) * 160, Math.sin(lineRadian) * 160, 5, this.colorScheme.bar)
  }

  positionToRadian(position, ccw) {
    if(ccw) return - position * 2 * Math.PI + (Math.PI * 3 / 2)
    return position * 2 * Math.PI - (Math.PI / 2)
  }

  // phase: -1 - 0: showing, 0 - 1: active
  drawNote(g, lane, radian, phase, unitType) {
    let size
    if(-1 <= phase && phase <= 0) {
      size = 1 - Math.pow(phase, 2)
    } else if(0 < phase && phase <= 1) {
      size = 1 + Math.sin(phase * Math.PI / 2) * 0.3
    } else {
      size = 0
    }
    const radius = 70 + lane * 30
    const x = Math.cos(radian) * radius
    const y = Math.sin(radian) * radius
    const style = this.colorScheme.note.lane[lane]
    const unit = this.colorScheme.note.unit[unitType]
    if(unitType != null) {
      const gradient = g.createRadialGradient(x, y, 10 * size, x, y, 15 * size)
      gradient.addColorStop(0, unit)
      gradient.addColorStop(1, Color(unit).clearer(1).rgbaString())
      RenderUtil.fillCircle(g, x, y, 15 * size, gradient)
    }
    RenderUtil.fillCircle(g, x, y, 10 * size, style)
  }

  drawLongNoteLine(g, lane, startRadian, endRadian, ccw, state) {
    let startRadianNew = startRadian
    let endRadianNew = endRadian
    if(ccw) {
      if(startRadian < endRadian) startRadianNew += Math.PI * 2
    } else {
      if(startRadian > endRadian) endRadianNew += Math.PI * 2
    }
    const radius = 70 + lane * 30
    let style
    if(state == 0) style = this.colorScheme.note.long.inactive[lane]
    else if(state == 1) style = this.colorScheme.note.long.active[lane]
    else if(state == 2) style = this.colorScheme.note.long.miss
    RenderUtil.strokeArc(g, 0, 0, radius, startRadianNew, endRadianNew, style, 5, ccw)
  }

  // phase: 0 - 1
  drawSpecialNote(g, phase) {
    const radius = 70 + (1 - phase) * 90
    const clear = Math.max(0, 1 - phase * 2)
    const style = Color(this.colorScheme.note.special).clearer(clear).rgbaString()
    RenderUtil.strokeCircle(g, 0, 0, radius, style, 3)
  }

  drawLaneCircle(g, lane, flashing) {
    const style = Color(this.colorScheme.lane[lane]).lighten(flashing * 0.6).rgbaString()
    RenderUtil.strokeCircle(g, 0, 0, 70 + 30 * lane, style, 1)
  }

  // phase: 0-1
  drawEraseParticle(g, lane, radian, phase, judgeState) {
    const size = 1 - phase
    const radius = 70 + lane * 30
    const x = Math.cos(radian) * radius
    const y = Math.sin(radian) * radius
    const color = this.colorScheme.note.judge[judgeState]
    const gradient = g.createRadialGradient(x, y, 10 * size, x, y, 20 * size)
    gradient.addColorStop(0, Color(color).clearer(phase).rgbaString())
    gradient.addColorStop(1, Color(color).clearer(1).rgbaString())
    RenderUtil.fillCircle(g, x, y, 20 * size, gradient)
  }

  drawLongNoteParticle(g, lane, radian, judgeState) {
    const size = 1.3
    const radius = 70 + lane * 30
    const x = Math.cos(radian) * radius
    const y = Math.sin(radian) * radius
    const color = this.colorScheme.note.judge[judgeState]
    const gradient = g.createRadialGradient(x, y, 10 * size, x, y, 20 * size)
    gradient.addColorStop(0, Color(color).clearer(0).rgbaString())
    gradient.addColorStop(1, Color(color).clearer(1).rgbaString())
    RenderUtil.fillCircle(g, x, y, 20 * size, gradient)
  }

  drawBarSpeedChangeEvent(g, radian, type, phase) {
      g.globalAlpha = phase
      RenderUtil.strokeLine(g, 0, 0, Math.cos(radian) * 160, Math.sin(radian) * 160, 3, this.colorScheme.speedChangeLine[type])
      g.globalAlpha = 1
  }

  drawInfo(g, state) {
    const player = this.game.player
    RenderUtil.fillText(g, "- Judge -", 85, 470, "bold 12px 'Open Sans'", this.colorScheme.information.header, "center", "bottom")
    RenderUtil.fillText(g, "Perfect:", 20, 490, "12px 'Open Sans'", this.colorScheme.information.judge.header, "left", "bottom")
    RenderUtil.fillText(g, "Great:", 20, 510, "12px 'Open Sans'", this.colorScheme.information.judge.header, "left", "bottom")
    RenderUtil.fillText(g, "Good:", 20, 530, "12px 'Open Sans'", this.colorScheme.information.judge.header, "left", "bottom")
    RenderUtil.fillText(g, "Bad:", 20, 550, "12px 'Open Sans'", this.colorScheme.information.judge.header, "left", "bottom")
    RenderUtil.fillText(g, "Miss:", 20, 570, "12px 'Open Sans'", this.colorScheme.information.judge.header, "left", "bottom")
    RenderUtil.fillText(g, player.judgeStats[JudgeState.PERFECT], 150, 490, "16px 'Open Sans'", this.colorScheme.information.judge.number, "right", "bottom")
    RenderUtil.fillText(g, player.judgeStats[JudgeState.GREAT], 150, 510, "16px 'Open Sans'", this.colorScheme.information.judge.number, "right", "bottom")
    RenderUtil.fillText(g, player.judgeStats[JudgeState.GOOD], 150, 530, "16px 'Open Sans'", this.colorScheme.information.judge.number, "right", "bottom")
    RenderUtil.fillText(g, player.judgeStats[JudgeState.BAD], 150, 550, "16px 'Open Sans'", this.colorScheme.information.judge.number, "right", "bottom")
    RenderUtil.fillText(g, player.judgeStats[JudgeState.MISS] + player.judgeStats[JudgeState.MISS_EMPTY], 150, 570, "16px 'Open Sans'", this.colorScheme.information.judge.number, "right", "bottom")
    RenderUtil.fillText(g, `(${player.judgeStats[JudgeState.MISS]})`, 150, 590, "16px 'Open Sans'", this.colorScheme.information.judge.number, "right", "bottom")
    RenderUtil.strokeLine(g, 170, 460, 170, 590, 1, this.colorScheme.information.separator)
    if(state > 0) {
      g.globalAlpha = state
      RenderUtil.fillText(g, player.chartName, 190, 462, "16px 'Open Sans'", this.colorScheme.information.chartName[player.chartType], "left", "top")
      RenderUtil.fillText(g, "Level", 540, 466, "12px 'Open Sans'", this.colorScheme.information.level.header, "left", "top")
      RenderUtil.fillText(g, player.level, 610, 462, "16px 'Open Sans'", this.colorScheme.information.level.number, "right", "top")
      const titleWidth = RenderUtil.measureText(g, player.title, "bold 18px 'Open Sans'").width
      RenderUtil.fillText(g, player.title, 190, 505, "bold 18px 'Open Sans'", this.colorScheme.information.title, "left", "bottom")
      RenderUtil.fillText(g, player.subtitle, 190 + titleWidth + 10, 505, "14px 'Open Sans'", this.colorScheme.information.subtitle, "left", "bottom")
      RenderUtil.strokeLine(g, 190, 510, 610, 510, 1, this.colorScheme.information.separator)
      this.drawAnalyzer(g)
      g.globalAlpha = 1
    }
    RenderUtil.strokeLine(g, 630, 460, 630, 590, 1, this.colorScheme.information.separator)
    RenderUtil.fillText(g, "Current", 650, 475, "12px 'Open Sans'", this.colorScheme.information.meter.header, "left", "bottom")
    RenderUtil.fillRect(g, 762, 457, 16, 16, this.colorScheme.score.current)
    RenderUtil.strokeRect(g, 762, 457, 16, 16, 1, this.colorScheme.information.meter.border)
    /*RenderUtil.fillText(g, "Current", 650, 495, "12px 'Open Sans'", this.colorScheme.information.status.header, "left", "bottom")
    RenderUtil.fillText(g, "Current", 650, 515, "12px 'Open Sans'", this.colorScheme.information.status.header, "left", "bottom")
    RenderUtil.fillText(g, "Current", 650, 535, "12px 'Open Sans'", this.colorScheme.information.status.header, "left", "bottom")*/
    RenderUtil.strokeLine(g, 650, 545, 780, 542, 1, this.colorScheme.information.separator)
    RenderUtil.fillText(g, "Max combo:", 650, 565, "12px 'Open Sans'", this.colorScheme.information.status.header, "left", "bottom")
    RenderUtil.fillText(g, player.maxCombo, 780, 565, "16px 'Open Sans'", this.colorScheme.information.status.content, "right", "bottom")
    RenderUtil.fillText(g, "Rank:", 650, 590, "12px 'Open Sans'", this.colorScheme.information.status.header, "left", "bottom")
    RenderUtil.fillText(g, Rank.toString(player.rank), 782, 592, "20px 'Open Sans'", Color(this.colorScheme.information.rank[player.rank]).darken(0.5).clearer(0.5).rgbaString(), "right", "bottom")
    RenderUtil.fillText(g, Rank.toString(player.rank), 780, 590, "20px 'Open Sans'", this.colorScheme.information.rank[player.rank], "right", "bottom")
  }

  drawAnalyzer(g) {
    const player = this.game.player
    RenderUtil.fillRect(g, 190, 520, 420, 70, this.colorScheme.analyzer.background)
    g.save()
    g.beginPath()
    g.rect(190, 520, 420, 70)
    g.clip()

    if(player.state == States.LOADING) {

    } else {
      const position = player.currentTime / player.duration
      this.analyzerRenderer.strokeAnalyzerComponent(g, player.analyzer.density, player.analyzer.densityMax, 1, this.colorScheme.analyzer.density)
      this.analyzerRenderer.fillAnalyzerComponent(g, player.analyzer.accuracy, player.analyzer.densityMax, this.colorScheme.analyzer.accuracy, Math.floor(position * 100))
      const gradient = g.createLinearGradient(190 + 420 * position - 6.3, 0, 190 + 420 * position - 2.1, 0)
      gradient.addColorStop(0, Color(this.colorScheme.analyzer.trail).clearer(1).rgbaString())
      gradient.addColorStop(0.5, this.colorScheme.analyzer.trail)
      gradient.addColorStop(1, this.colorScheme.analyzer.trail)
      RenderUtil.fillRect(g, 190 + 420 * position - 6.3, 520, 4.2, 70, gradient)
      RenderUtil.fillRect(g, 190 + 420 * position - 2.1, 520, 4.2, 70, this.colorScheme.analyzer.position)
    }

    g.restore()
    RenderUtil.strokeRect(g, 190, 520, 420, 70, 1, this.colorScheme.analyzer.border)
  }
}
