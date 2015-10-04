import fontParser from "parse-bmfont-ascii"
import $ from "jquery"
import Game from "./game"

$(() => {
  const game = new Game()
  game.start()
  $(window).resize(() => game.onResize())
  $(window).keydown((e) => game.onKeyDown(e))
  $(window).keyup((e) => game.onKeyUp(e))
});
