import { Screen } from "./screen"
import $ from "jquery"
import { Game } from "../game"

export default class ScreenGame extends Screen {
  constructor(manager, cr) {
    super(manager, cr)
  }
  use() {
    $("body").html('<canvas id="gameScreen"></canvas>')
    this.cr.game = new Game(this.cr.bmsonData, this.unuse)
    this.cr.game.start()
    $(window).bind({
      "resize": () => this.cr.game.onResize(),
      "keydown": (e) => this.cr.game.onKeyDown(e),
      "keyup": (e) => this.cr.game.onKeyUp(e)
    })
  }

  unuse() {
    $("body").html("")
    $(window).unbind("resize keydown keyup")
  }
}
