import React from "react"
import style from "./game.sass"
import ScreenResult from "./result"
import { GameFramework } from "../framework/game-framework"
import { Game } from "../player/game"

export default React.createClass({
  onGameEnd(result) {
    this.gameFramework.end()
    this.props.manager.transit(ScreenResult, {result: result, bmsonSetConfig: this.props.bmsonSetConfig})
  },
  render() {
    return <canvas id="gameScreen"></canvas>
  },
  componentWillMount() {
    style.use()
  },
  componentDidMount() {
    this.game = new Game(this.props.bmsonSetConfig, this.props.app.localFileList, this.props.app.preference, (resultData) => this.onGameEnd(resultData))
    this.gameFramework = new GameFramework(this.game, "canvas#gameScreen")
    this.gameFramework.start()

    this.onResize = (e) => this.gameFramework.onResize(e)
    this.onKeyDown = (e) => this.gameFramework.onKeyDown(e)
    this.onKeyUp = (e) => this.gameFramework.onKeyUp(e)

    window.addEventListener("resize", this.onResize)
    window.addEventListener("keydown", this.onKeyDown)
    window.addEventListener("keyup", this.onKeyUp)
  },
  componentWillUnmount() {
    window.removeEventListener("resize", this.onResize)
    window.removeEventListener("keydown", this.onKeyDown)
    window.removeEventListener("keyup", this.onKeyUp)
    style.unuse()
  }
})
