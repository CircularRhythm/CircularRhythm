import { Screen } from "./screen"
import $ from "jquery"
import { Game } from "../game"

export default class ScreenGame extends Screen {
  constructor(manager, app, bmsonSetConfig) {
    super(manager, app)
    this.bmsonSetConfig = bmsonSetConfig
  }
  use() {
    $("body").html('<canvas id="gameScreen"></canvas>')
    this.game = new Game(this.bmsonSetConfig, this.unuse)
    this.game.start()
    $(window).bind({
      "resize": () => this.game.onResize(),
      "keydown": (e) => this.game.onKeyDown(e),
      "keyup": (e) => this.game.onKeyUp(e)
    })
  }

  unuse() {
    $("body").html("")
    $(window).unbind("resize keydown keyup")
  }
}
