import { Screen } from "./screen"
import $ from "jquery"
import { GameFramework } from "../game-framework"
import { Game } from "../game"

export default class ScreenGame extends Screen {
  constructor(manager, app, bmsonSetConfig) {
    super(manager, app)
    this.bmsonSetConfig = bmsonSetConfig
  }
  use() {
    $("body").html('<canvas id="gameScreen"></canvas>')
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
    $(window).unbind("resize keydown keyup")
  }

  endCallback(resultData) {
    this.gameFramework.end()
    this.manager.changeScreen("result", resultData)
  }
}
