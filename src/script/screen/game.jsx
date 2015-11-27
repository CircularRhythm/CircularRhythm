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
    window.addEventListener("resize", (e) => this.gameFramework.onResize(e))
    window.addEventListener("keydown", (e) => this.gameFramework.onKeyDown(e))
    window.addEventListener("keyup", (e) => this.gameFramework.onKeyUp(e))
  },
  componentWillUnmount() {
    window.removeEventListener("resize")
    window.removeEventListener("keydown")
    window.removeEventListener("keyup")
    style.unuse()
  }
})
