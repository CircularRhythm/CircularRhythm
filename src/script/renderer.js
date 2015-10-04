import { NoteShort, NoteLong, JudgeState } from "./player"
export default class Renderer {
  constructor(game) {
    this.game = game
  }

  render(g, controller) {
    const player = this.game.player
    this.drawLaneCircle(g, 400, 300, 70, controller[0].isPressed())
    this.drawLaneCircle(g, 400, 300, 100, controller[1].isPressed())
    this.drawLaneCircle(g, 400, 300, 130, controller[2].isPressed())
    this.drawLaneCircle(g, 400, 300, 160, controller[3].isPressed())

    player.visibleNotes.forEach((notes, name) => {
      for(let note of notes) {
        if(note instanceof NoteLong && note.endY > player.currentY) {
          const startPosition = note.y > player.currentY ? note.position : player.currentPosition
          const endPosition = note.endY < player.visibleEndY ? note.endPosition : player.visibleEndPosition
          const startRadian = this.positionToRadian(startPosition)
          const endRadian = this.positionToRadian(endPosition)
          this.drawLongNoteLine(g, note.x - 1, startRadian, endRadian, note.lineActive)
        }
        if(note instanceof NoteShort) {
          const radian = this.positionToRadian(note.position)
          if(1 <= note.x && note.x <= 4) {
            this.drawNote(g, note.x - 1, radian, note.judgeState)
          }
        }
        if(note instanceof NoteLong) {
          const noteHeadRadian = this.positionToRadian(note.noteHeadPosition)
          if(1 <= note.x && note.x <= 4 && note.noteHeadEraseTimer < 500) {
            this.drawNote(g, note.x - 1, noteHeadRadian, note.judgeState)
          }
        }
      }
    })

    const lineRadian = this.positionToRadian(player.currentPosition)
    g.strokeStyle = "#000000"
    g.lineWidth = 5
    g.beginPath()
    g.moveTo(400, 300)
    g.lineTo(400 + Math.cos(lineRadian) * 160, 300 + Math.sin(lineRadian) * 160)
    g.stroke()

    g.fillStyle = "#000000"
    g.textAlign = "center"
    g.font = "32px sans-serif"
    g.fillText(player.combo, 400, 312)
  }

  getJudgeColor(judge) {
    if(judge == JudgeState.NO) return "#0000FF"
    if(judge == JudgeState.EXCELLENT) return "#FFFF00"
    if(judge == JudgeState.GREAT) return "#00FF00"
    if(judge == JudgeState.GOOD) return "#00FFFF"
    if(judge == JudgeState.BAD) return "#FF7F00"
    if(judge == JudgeState.MISS) return "#888888"
    return "#000000"
  }

  positionToRadian(position) {
    return position * 2 * Math.PI - (Math.PI / 2)
  }

  drawNote(g, lane, radian, judgeState) {
    const radius = 70 + lane * 30
    const x = Math.cos(radian) * radius
    const y = Math.sin(radian) * radius
    const style = this.getJudgeColor(judgeState)
    this.fillCircle(g, 400 + x, 300 + y, 10, style)
  }

  drawLongNoteLine(g, lane, startRadian, endRadian, active) {
    let startRadianNew = startRadian
    let endRadianNew = endRadian
    if(startRadian > endRadian) endRadianNew += Math.PI * 2
    const radius = 70 + lane * 30
    const style = active ? "#00FF00" : "#888888"
    this.strokeArc(g, 400, 300, radius, startRadianNew, endRadianNew, style, 5)
    //this.strokeArc(g, 400, 300, radius, 1, 2, "#00FF00", 5)
  }

  drawLaneCircle(g, x, y, r, active) {
    const style = active ? "#FF0000" : "#000000"
    this.strokeCircle(g, x, y, r, style, 1)
  }

  strokeArc(g, x, y, r, start, end, style, lineWidth) {
    g.strokeStyle = style
    g.lineWidth = lineWidth
    g.beginPath()
    g.arc(x, y, r, start, end, false)
    //g.closePath()
    g.stroke()
  }

  strokeCircle(g, x, y, r, style, lineWidth) {
    g.strokeStyle = style
    g.lineWidth = lineWidth
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2, false)
    g.closePath()
    g.stroke()
  }

  fillCircle(g, x, y, r, style) {
    g.fillStyle = style
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2, false)
    g.closePath()
    g.fill()
  }
}
