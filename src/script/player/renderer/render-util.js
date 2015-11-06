import { JudgeState } from "../judge-state"

export class RenderUtil {
  /*static getJudgeColor(judge) {
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
  }*/

  static strokeArc(g, x, y, r, start, end, style, lineWidth) {
    g.strokeStyle = style
    g.lineWidth = lineWidth
    g.beginPath()
    g.arc(x, y, r, start, end, false)
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
