import React from "react"
import KeyCode from "keycode"
import ClassNames from "classnames"

export default React.createClass({
  getInitialState() {
    return {
      selected: null,
      oldCode: null
    }
  },
  render() {
    const buttonPositions = [
      [180, 120, 40, 60],
      [130, 120, 40, 60],
      [80, 120, 40, 60],
      [30, 120, 40, 60],
      [280, 120, 40, 60],
      [330, 120, 40, 60],
      [380, 120, 40, 60],
      [430, 120, 40, 60],
      [80, 200, 340, 40]
    ]
    const buttons = buttonPositions.map((e, i) => {
      const pos = buttonPositions[i]
      const className = ClassNames({"button": true, "buttonActive": this.state.selected == i})
      return <div key={i} className={className} style={{left: pos[0], top: pos[1], width: pos[2], height: pos[3], lineHeight: pos[3] + "px"}} onClick={(e) => this.onButtonClick(i, e)}>{this.getKeyName(this.props.config[i])}</div>
    })
    return (
      <div className="content" onClick={(e) => this.cancel(e)}>
        <div className="buttons">{buttons}</div>
        <div className="ui">
          <span className="button" onClick={() => this.setToDefault()}>Default</span>
          <span className="button" onClick={() => this.props.onClose()}>Close</span>
        </div>
      </div>
    )
  },
  getKeyName(code) {
    const name = KeyCode(code)
    if(name) return name
    return `[${code}]`
  },
  onButtonClick(i, e) {
    e.stopPropagation()
    if(this.state.selected != null) this.cancel()
    else {
      this.setState({selected: i, oldCode: this.props.config[i]})
      document.addEventListener("keydown", this.onKeyDown)
    }
  },
  onCancel(e) {
    e.stopPropagation()
    this.cancel()
  },
  onKeyDown(e) {
    e.preventDefault()
    e.stopPropagation()
    this.props.config[this.state.selected] = e.keyCode
    this.setState({selected: null, oldCode: null})
    document.removeEventListener("keydown", this.onKeyDown)
  },
  cancel() {
    if(this.state.selected != null) {
      this.props.config[this.state.selected] = this.state.oldCode
      this.setState({selected: null, oldCode: null})
    }
    document.removeEventListener("keydown", this.onKeyDown)
  },
  setToDefault() {
    [71, 70, 68, 83, 72, 74, 75, 76, 32].forEach((e, i) => this.props.config[i] = e)
    this.forceUpdate()
  },
  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyDown)
  }
})
