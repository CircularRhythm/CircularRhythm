import React from "react"
import KeyCode from "keycode"

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
      return <div key={i} className="button" style={{left: pos[0], top: pos[1], width: pos[2], height: pos[3], lineHeight: pos[3] + "px"}} onClick={(e) => this.onButtonClick(i, e)}>{KeyCode(this.props.config[i])}</div>
    })
    return (
      <div className="content" onClick={(e) => this.cancel(e)}>
        <div className="buttons">{buttons}</div>
      </div>
    )
  },
  onButtonClick(i, e) {
    e.stopPropagation()
    if(this.state.selected != null) this.cancel(e)
    else {
      this.setState({selected: i, oldCode: this.props.config[i]})
    }
  },
  cancel(e) {
    e.stopPropagation()
    if(this.state.selected != null) {
      this.props.config[this.state.selected] = this.state.oldCode
      this.setState({selected: null, oldCode: null})
    }
  }
})
