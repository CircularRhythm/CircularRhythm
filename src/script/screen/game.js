import style from "../template/game.sass"

import { Screen } from "./screen"
import $ from "jquery"
import { GameFramework } from "../framework/game-framework"
import { Game } from "../player/game"

export default class ScreenGame extends Screen {
  constructor(manager, app, bmsonSetConfig) {
    super(manager, app)
    this.bmsonSetConfig = bmsonSetConfig
  }
  use() {
    $("body").html('<canvas id="gameScreen"></canvas>')
    style.use()
    this.game = new Game(this.bmsonSetConfig, (resultData) => this.endCallback(resultData))
    this.gameFramework = new GameFramework(this.game, "canvas#gameScreen")
    this.gameFramework.start()
    $(window).bind({
      "resize": () => this.gameFramework.onResize(),
      "keydown": (e) => this.gameFramework.onKeyDown(e),
      "keyup": (e) => this.gameFramework.onKeyUp(e)
    })
  }

  unuse() {
    $("body").html("")
    style.unuse()
    $(window).unbind("resize keydown keyup")
  }

  endCallback(resultData) {
    this.gameFramework.end()
    this.manager.changeScreen("result", resultData)
  }
}
