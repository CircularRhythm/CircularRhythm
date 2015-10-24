export class Screen {
  constructor(manager, app) {
    this.manager = manager
    this.app = app
  }
  use() {
  }
  unuse() {
  }
}

export class ScreenManager {
  // String => Screen
  constructor(app, screens) {
    this.app = app
    this.screens = screens
    this.currentScreen = null
  }

  changeScreen(screenName, ...constructorArgs) {
    if(this.currentScreen) this.currentScreen.unuse()
    this.currentScreen = new (this.screens.get(screenName))(this, this.app, ...constructorArgs)
    this.currentScreen.use()
  }
}
