import React from "react"
import style from "./loading.sass"
import ScreenMenu from "./menu"

export default React.createClass({
  getInitialState() {
    return {
      message1: "Loading...",
      message2: ""
    }
  },
  render() {
    return (
      <div>
        <div id="loading">{this.state.message1}</div>
        <div id="error">{this.state.message2}</div>
      </div>
    )
  },
  componentWillMount() {
    style.use()
  },
  componentDidMount() {
    this.props.app.load().then(() => {
      this.props.manager.transit(ScreenMenu, {})
    }).catch((e) => {
      console.error(e.message)
      this.setState({message1: "An error occured while loading"})
      this.setState({message2: e.message})
    })
  },
  componentWillUnmount() {
    style.unuse()
  }
})
