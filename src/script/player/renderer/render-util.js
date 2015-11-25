import { JudgeState } from "../judge-state"

export class RenderUtil {
  static strokeArc(g, x, y, r, start, end, style, lineWidth, reverse) {
    g.strokeStyle = style
    g.lineWidth = lineWidth
    g.beginPath()
    g.arc(x, y, r, start, end, reverse)
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

  static fillRect(g, x, y, w, h, style) {
    g.fillStyle = style
    g.beginPath()
    g.rect(x, y, w, h)
    g.fill()
  }

  static fillText(g, text, x, y, font, style, align, baseline) {
    g.fillStyle = style
    g.font = font
    g.textAlign = align
    g.textBaseline = baseline
    g.fillText(text, x, y)
  }

  static strokeLine(g, x1, y1, x2, y2, width, style) {
    g.lineWidth = width
    g.strokeStyle = style
    g.beginPath()
    g.moveTo(x1, y1)
    g.lineTo(x2, y2)
    g.stroke()
  }
}
