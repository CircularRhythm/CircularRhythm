import { NoteShort, NoteLong } from "../note"
import { JudgeState } from "../judge-state"
import { BarSpeedChangeEvent, BarSpeedChangeEventSpeed, BarSpeedChangeEventStop } from "../bar-speed-change-event"
import { ConicalGradient } from "./conical-gradient"
import { RenderUtil } from "./render-util"
import $ from "jquery"

export class Renderer {
  constructor(game, framework) {
    this.game = game
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

    g.fillStyle = "#000000"
    g.textAlign = "left"
    g.textBaseline = "top"
    g.font = "32px sans-serif"
    g.fillText("80.0%", 20, 20)

    g.fillStyle = "#000000"
    g.textAlign = "right"
    g.textBaseline = "top"
    g.font = "32px sans-serif"
    g.fillText(Math.ceil(player.score), 780, 20)

    g.fillStyle = "#000000"
    g.textAlign = "right"
    g.textBaseline = "bottom"
    g.font = "16px sans-serif"
    g.fillText("0:00/2:30", 780, 440)

    g.fillStyle = "#000000"
    g.textAlign = "center"
    g.textBaseline = "top"
    g.font = "32px sans-serif"
    g.fillText(player.currentBpm, 400, 500)


    g.fillStyle = "#FF8800"
    g.beginPath()
    g.rect(0, 0, 10, 440)
    g.fill()

    g.fillStyle = "#00FF00"
    g.beginPath()
    g.rect(790, 0, 10, 440)
    g.fill()

    g.fillStyle = "#00FFFF"
    g.beginPath()
    g.rect(0, 440, 800, 10)
    g.fill()

    g.fillStyle = "#C0C0C0"
    g.beginPath()
    g.rect(0, 450, 800, 150)
    g.fill()

    g.fillStyle = "#909090"
    g.beginPath()
    g.rect(0, 600, 800, this.game.belowHeight)
    g.fill()

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

    const beaterSize = 80 - player.unitPosition * 8
    const gradient = g.createRadialGradient(0, 0, 70, 0, 0, beaterSize)
    gradient.addColorStop(0, "#00FFFF")
    gradient.addColorStop(1, "#FFFFFF")
    g.fillStyle = gradient
    g.beginPath()
    g.arc(0, 0, beaterSize, Math.PI * 2, false)
    g.fill()

    g.fillStyle = "#FFFFFF"
    g.beginPath()
    g.arc(0, 0, 70, Math.PI * 2, false)
    g.fill()

    RenderUtil.drawLaneCircle(g, 0, 0, 70, player.keyFlashing[playerNum * 4])
    RenderUtil.drawLaneCircle(g, 0, 0, 100, player.keyFlashing[playerNum * 4 + 1])
    RenderUtil.drawLaneCircle(g, 0, 0, 130, player.keyFlashing[playerNum * 4 + 2])
    RenderUtil.drawLaneCircle(g, 0, 0, 160, player.keyFlashing[playerNum * 4 + 3])

    player.visibleSupportLines.forEach((e) => {
      const radian = RenderUtil.positionToRadian(e.position)
      g.strokeStyle = RenderUtil.getLineColor(e.type)
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
    player.visibleNotes.forEach((notes, name) => {
      for(let note of notes) {
        if(note instanceof NoteLong && note.endY > player.currentY) {
          const startPosition = note.y > player.currentY ? note.position : player.currentPosition
          const endPosition = note.endY < player.visibleEndY ? note.endPosition : player.visibleEndPosition
          const startRadian = RenderUtil.positionToRadian(startPosition)
          const endRadian = RenderUtil.positionToRadian(endPosition)
          if(noteBaseX <= note.x && note.x <= noteBaseX + 3) {
            RenderUtil.drawLongNoteLine(g, note.x - noteBaseX, startRadian, endRadian, note.lineActive)
          }
        }
        if(note instanceof NoteShort) {
          const radian = RenderUtil.positionToRadian(note.position)
          if(noteBaseX <= note.x && note.x <= noteBaseX + 3) {
            RenderUtil.drawNote(g, note.x - noteBaseX, radian, note.judgeState)
          }
          if(note.x == player.specialLane) {
            let radius
            let alpha
            if(note.time <= player.currentTime) {
              radius = 70
            } else {
              radius = 70 + (note.time - player.currentTime) / player.specialLaneDuration * 80
            }
            const style = RenderUtil.getJudgeColor(note.judgeState)
            RenderUtil.strokeCircle(g, 0, 0, radius, style, 3)
          }
        }
        if(note instanceof NoteLong) {
          const noteHeadRadian = RenderUtil.positionToRadian(note.noteHeadPosition)
          if(noteBaseX <= note.x && note.x <= noteBaseX + 3 && note.noteHeadEraseTimer < 500) {
            RenderUtil.drawNote(g, note.x - noteBaseX, noteHeadRadian, note.judgeState)
          }
        }
      }
    })

    player.visibleBarSpeedChangeList.forEach((e, i) => {
      const speedChangeLineRadian = RenderUtil.positionToRadian(e.position)
      switch(e.type) {
        case "stop":
          g.strokeStyle = "#888888"
          break
        case "slower":
          g.strokeStyle = "#0000FF"
          break
        case "faster":
          g.strokeStyle = "#FF0000"
          break
      }
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(0, 0)
      g.lineTo(Math.cos(speedChangeLineRadian) * 160, Math.sin(speedChangeLineRadian) * 160)
      g.stroke()

      if(e.showMovingLine) {
        const speedChangeLineMovingRadian = RenderUtil.positionToRadian(player.barMovingSpeedChangeEvent.currentPosition)
        g.beginPath()
        g.moveTo(0, 0)
        g.lineTo(Math.cos(speedChangeLineMovingRadian) * 160, Math.sin(speedChangeLineMovingRadian) * 160)
        g.stroke()
      }
    })

    const lineRadian = RenderUtil.positionToRadian(player.currentPosition)
    g.strokeStyle = "#000000"
    g.lineWidth = 5
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(Math.cos(lineRadian) * 160, Math.sin(lineRadian) * 160)
    g.stroke()

    g.fillStyle = "#000000"
    g.textAlign = "center"
    g.textBaseline = "middle"
    g.font = "32px sans-serif"
    g.fillText(player.combo, 0, 0)
  }
}
