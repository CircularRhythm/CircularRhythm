import { RenderUtil } from "./render-util"
export class AnalyzerRenderer {
  constructor(x, y, width, height) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
  strokeAnalyzerComponent(g, component, maxValue, width, style, length = 100) {
    g.strokeWidth = width
    g.strokeStyle = style
    g.beginPath()
    //g.moveTo(this.x, this.y + (1 - component[0] / maxValue) * this.height)
    if(length > 0) RenderUtil.strokeLine(g, this.x, this.y + (1 - component[0] / maxValue) * this.height, this.x + this.width * 0.01, this.y + (1 - (component[0] / maxValue)) * this.height, width, style)
    for(let i = 0; i < length; i++) {
      const p = (i + 1) / 100
      const d = component[i] / maxValue
      g.lineTo(this.x + this.width * p, this.y + (1 - d) * this.height)
    }
    g.stroke()
  }

  fillAnalyzerComponent(g, component, maxValue, style, length = 100) {
    g.fillStyle = style
    g.beginPath()
    g.moveTo(this.x, this.y + this.height)
    g.lineTo(this.x, this.y + (1 - component[0] / maxValue) * this.height)
    for(let i = 0; i < length; i++) {
      const p = (i + 1) / 100
      const d = component[i] / maxValue
      g.lineTo(this.x + this.width * p, this.y + (1 - d) * this.height)
    }
    g.lineTo(this.x + this.width * length / 100, this.y + this.height)
    g.closePath()
    g.fill()
  }
}
