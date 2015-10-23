export class Screen {
  constructor(manager, cr) {
    this.manager = manager
    this.cr = cr
  }
  use() {
  }
  unuse() {
  }
}

export class ScreenManager {
  // String => Screen
  constructor(screens) {
    this.screens = screens
    this.currentScreen = null
  }

  changeScreen(screenName) {
    if(this.currentScreen) this.currentScreen.unuse()
    this.screens.get(screenName).use()
  }
}
