import { NoteShort, NoteLong } from "../note"
import { JudgeState } from "../judge-state"
import { BarSpeedChangeEvent, BarSpeedChangeEventSpeed, BarSpeedChangeEventStop } from "../bar-speed-change-event"
import { ConicalGradient } from "./conical-gradient"
import { RenderUtil } from "./render-util"
import $ from "jquery"
import { ColorScheme } from "./color-scheme"
import Color from "color"

export class Renderer {
  constructor(game, framework, colorScheme) {
    this.game = game
    this.colorScheme = colorScheme
    /*this.buffer = framework.createCanvasBuffer(800, 600, "gameScreenBuffer")
    this.buffer2 = framework.createCanvasBuffer(800, 600, "gameScreenBuffer2")*/
  }

  render(g, controller) {
    const player = this.game.player

    g.strokeStyle = "#000000"
    g.beginPath()
    g.rect(0, 0, 800, 600)
    g.stroke()

    if(player.playMode == 1) {
      g.save()
      g.translate(400, 120)
      this.renderUnit(g, controller, 0)
      g.restore()
    } else if(player.playMode == 2) {
      g.save()
      g.translate(215, 220)
      this.renderUnit(g, controller, 0)
      g.restore()
      g.save()
      g.translate(585, 220)
      this.renderUnit(g, controller, 1)
      g.restore()
    }

    RenderUtil.fillText(g, "80.0%", 20, 20, "32px sans-serif", "#000000", "left", "top")
    RenderUtil.fillText(g, Math.ceil(player.score), 780, 20, "32px sans-serif", "#000000", "right", "top")
    RenderUtil.fillText(g, "0:00/2:30", 780, 440, "16px sans-serif", "#000000", "right", "bottom")
    RenderUtil.fillText(g, player.currentBpm, 400, 500, "32px sans-serif", "#000000", "center", "top")

    RenderUtil.fillRect(g, 0, 0, 10, 440, "#FF8800")
    RenderUtil.fillRect(g, 790, 0, 10, 440, "#00FF00")
    RenderUtil.fillRect(g, 0, 440, 800, 10, "#00FFFF")
    RenderUtil.fillRect(g, 0, 450, 800, 150, "#C0C0C0")
    RenderUtil.fillRect(g, 0, 600, 800, this.game.belowHeight, "#909090")

    /*g.fillStyle = "#000000"
    g.textAlign = "left"
    g.font = "12px sans-serif"
    g.fillText(player.currentTime, 0, 60)
    g.fillText(player.currentY, 0, 80)
    g.fillText(player.supportLineVisibleEndY, 0, 100)
    g.fillText(player.judgeStats, 0, 120)*/
  }

  renderUnit(g, controller, playerNum) {
    const player = this.game.player

    const specialLaneGradient = g.createRadialGradient(0, 0, 20 + player.specialLaneFlash * 50, 0, 0, 70 + player.specialLaneFlash * 50)
    let specialLaneJudgeColor
    if(player.specialLaneJudgeState == JudgeState.NO) specialLaneJudgeColor = this.colorScheme.note.special
    else specialLaneJudgeColor = this.colorScheme.note.judge[player.specialLaneJudgeState]
    specialLaneGradient.addColorStop(0, specialLaneJudgeColor)
    specialLaneGradient.addColorStop(1, "rgba(255, 255, 255, 0)")
    g.fillStyle = specialLaneGradient
    g.beginPath()
    g.arc(0, 0, 170, Math.PI * 2, false)
    g.fill()

    const gradient = g.createRadialGradient(0, 0, 60 + player.unitPosition * 5, 0, 0, 70 + player.unitPosition * 10)
    gradient.addColorStop(0, "#FFFFFF")
    gradient.addColorStop(1, "#00FFFF")
    g.fillStyle = gradient
    g.beginPath()
    g.arc(0, 0, 70, Math.PI * 2, false)
    g.fill()

    /*g.fillStyle = "#FFFFFF"
    g.beginPath()
    g.arc(0, 0, 70, Math.PI * 2, false)
    g.fill()*/

    this.drawLaneCircle(g, 0, player.keyFlashing[playerNum * 4])
    this.drawLaneCircle(g, 1, player.keyFlashing[playerNum * 4 + 1])
    this.drawLaneCircle(g, 2, player.keyFlashing[playerNum * 4 + 2])
    this.drawLaneCircle(g, 3, player.keyFlashing[playerNum * 4 + 3])

    player.visibleSupportLines.forEach((e) => {
      const radian = this.positionToRadian(e.position)
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

    const noteBaseX = playerNum * 4 + 1
    player.visibleNotes.forEach((note) => {
      if(note instanceof NoteLong && note.endY > player.currentY) {
        const startPosition = note.y > player.currentY ? note.position : player.currentPosition
        const endPosition = note.endY < player.visibleEndY ? note.endPosition : player.visibleEndPosition
        const startRadian = this.positionToRadian(startPosition)
        const endRadian = this.positionToRadian(endPosition)
        if(noteBaseX <= note.x && note.x <= noteBaseX + 3) {
          this.drawLongNoteLine(g, note.x - noteBaseX, startRadian, endRadian, note.state)
        }
      }
      if(note instanceof NoteShort) {
        const radian = this.positionToRadian(note.position)
        if(noteBaseX <= note.x && note.x <= noteBaseX + 3) {
          this.drawNote(g, note.x - noteBaseX, radian, note.judgeState)
        }
        if(note.x == player.specialLane) {
          let radius
          let alpha
          if(note.time <= player.currentTime) {
            radius = 70
          } else {
            radius = 70 + (note.time - player.currentTime) / player.specialLaneDuration * 80
          }
          const style = this.colorScheme.note.special
          RenderUtil.strokeCircle(g, 0, 0, radius, style, 3)
        }
      }
      if(note instanceof NoteLong) {
        const noteHeadRadian = this.positionToRadian(note.noteHeadPosition)
        if(noteBaseX <= note.x && note.x <= noteBaseX + 3 && note.noteHeadVisible) {
          this.drawNote(g, note.x - noteBaseX, noteHeadRadian, note.judgeState)
        }
      }
    })

    player.visibleBarSpeedChangeList.forEach((e, i) => {
      const speedChangeLineRadian = this.positionToRadian(e.position)
      RenderUtil.strokeLine(g, 0, 0, Math.cos(speedChangeLineRadian) * 160, Math.sin(speedChangeLineRadian) * 160, 3, this.colorScheme.speedChangeLine[e.type])

      if(e.showMovingLine) {
        const speedChangeLineMovingRadian = this.positionToRadian(player.barMovingSpeedChangeEvent.currentPosition)
        RenderUtil.strokeLine(g, 0, 0, Math.cos(speedChangeLineMovingRadian) * 160, Math.sin(speedChangeLineMovingRadian) * 160, 3, this.colorScheme.speedChangeLine[e.type])
      }
    })

    const lineRadian = this.positionToRadian(player.currentPosition)
    RenderUtil.strokeLine(g, 0, 0, Math.cos(lineRadian) * 160, Math.sin(lineRadian) * 160, 5, this.colorScheme.bar)

    RenderUtil.fillText(g, player.combo, 0, 0, "32px sans-serif", "#000000", "center", "middle")
  }

  positionToRadian(position) {
    return position * 2 * Math.PI - (Math.PI / 2)
  }

  drawNote(g, lane, radian, judgeState) {
    const radius = 70 + lane * 30
    const x = Math.cos(radian) * radius
    const y = Math.sin(radian) * radius
    let style
    if(judgeState == JudgeState.NO) {
      style = this.colorScheme.note.lane[lane]
    } else {
      style = this.colorScheme.note.judge[judgeState]
    }
    const gradient = g.createRadialGradient(x, y, 10, x, y, 15)
    gradient.addColorStop(0, "rgba(180, 10, 20, 1)")
    gradient.addColorStop(1, "rgba(180, 10, 20, 0)")
    RenderUtil.fillCircle(g, x, y, 20, gradient)
    RenderUtil.fillCircle(g, x, y, 10, style)
  }

  drawLongNoteLine(g, lane, startRadian, endRadian, state) {
    let startRadianNew = startRadian
    let endRadianNew = endRadian
    if(startRadian > endRadian) endRadianNew += Math.PI * 2
    const radius = 70 + lane * 30
    let style
    if(state == 0) style = this.colorScheme.note.long.inactive[lane]
    else if(state == 1) style = this.colorScheme.note.long.active[lane]
    else if(state == 2) style = this.colorScheme.note.long.miss
    RenderUtil.strokeArc(g, 0, 0, radius, startRadianNew, endRadianNew, style, 5)
  }

  drawLaneCircle(g, lane, flashing) {
    const style = Color(this.colorScheme.lane[lane]).lighten(flashing * 0.6).rgbaString()
    RenderUtil.strokeCircle(g, 0, 0, 70 + 30 * lane, style, 1)
  }
}
