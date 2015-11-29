import React from "react"
import style from "./loading.sass"
import ScreenMenu from "./menu"

export default React.createClass({
  getInitialState() {
    return {
      showSpinner: true,
      message1: "Loading...",
      message2: ""
    }
  },
  render() {
    let spinnerContent = this.state.showSpinner ? <div id="spinner"><i className="fa fa-spin fa-spinner"></i></div> : null
    return (
      <div>
        {spinnerContent}
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
      this.setState({
        showSpinner: false,
        message1: "An error occured while loading",
        message2: e.message
      })
    })
  },
  componentWillUnmount() {
    style.unuse()
  }
})
