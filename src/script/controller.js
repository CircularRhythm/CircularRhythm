export default class ControllerState {
  constructor() {
    this.state = ControllerState.NONE
  }
  isPressed() {
    return this.state == ControllerState.JUST_PRESSED || this.state == ControllerState.PRESSED
  }
  isJustPressed() {
    return this.state == ControllerState.JUST_PRESSED
  }
  isJustReleased() {
    return this.state == ControllerState.JUST_RELEASED
  }
  static get NONE() { return 0 }
  static get JUST_PRESSED() { return 1 }
  static get PRESSED() { return 2 }
  static get JUST_RELEASED() { return 3 }
}
