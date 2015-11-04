import { JudgeState } from "../judge-state"

export class RenderUtil {
  static getJudgeColor(judge) {
    if(judge == JudgeState.NO) return "#0000FF"
    if(judge == JudgeState.EXCELLENT) return "#FFFF00"
    if(judge == JudgeState.GREAT) return "#00FF00"
    if(judge == JudgeState.GOOD) return "#00FFFF"
    if(judge == JudgeState.BAD) return "#FF7F00"
    if(judge == JudgeState.MISS) return "#888888"
    return "#000000"
  }

  static getLineColor(type) {
    const arr = ["#000000", "#FF0000", "#0000FF", "#00FF00", "#FFFF00"]
    return arr[type]
  }

  static positionToRadian(position) {
    return position * 2 * Math.PI - (Math.PI / 2)
  }

  static drawNote(g, lane, radian, judgeState) {
    const radius = 70 + lane * 30
    const x = Math.cos(radian) * radius
    const y = Math.sin(radian) * radius
    const style = this.getJudgeColor(judgeState)
    this.fillCircle(g, x, y, 10, style)
  }

  static drawLongNoteLine(g, lane, startRadian, endRadian, active) {
    let startRadianNew = startRadian
    let endRadianNew = endRadian
    if(startRadian > endRadian) endRadianNew += Math.PI * 2
    const radius = 70 + lane * 30
    const style = active ? "#00FF00" : "#888888"
    this.strokeArc(g, 0, 0, radius, startRadianNew, endRadianNew, style, 5)
    //this.strokeArc(g, 400, 300, radius, 1, 2, "#00FF00", 5)
  }

  static drawLaneCircle(g, x, y, r, flashing) {
    const style = `rgb(${Math.floor(flashing * 255)}, 0, 0)`
    this.strokeCircle(g, x, y, r, style, 1)
  }

  static strokeArc(g, x, y, r, start, end, style, lineWidth) {
    g.strokeStyle = style
    g.lineWidth = lineWidth
    g.beginPath()
    g.arc(x, y, r, start, end, false)
    //g.closePath()
    g.stroke()
  }

  static strokeCircle(g, x, y, r, style, lineWidth) {
    g.strokeStyle = style
    g.lineWidth = lineWidth
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2, false)
    g.closePath()
    g.stroke()
  }

  static fillCircle(g, x, y, r, style) {
    g.fillStyle = style
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2, false)
    g.closePath()
    g.fill()
  }
}
