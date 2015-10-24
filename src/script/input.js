export class Input {
  constructor() {
    this.keys = []
    this.states = []
    for(let i = 0; i < 256; i++) {
      this.keys[i] = false
      this.states[i] = Input.NONE
    }
  }

  isPressed(keyCode) {
    return this.states[keyCode] == Input.JUST_PRESSED || this.states[keyCode] == Input.PRESSED
  }

  isJustPressed(keyCode) {
    return this.states[keyCode] == Input.JUST_PRESSED
  }

  isJustReleased(keyCode) {
    return this.states[keyCode] == Input.JUST_RELEASED
  }

  update() {
    for(let i = 0; i < 256; i++) {
      if(this.keys[i]) {
        switch(this.states[i]) {
          case Input.NONE:
          case Input.JUST_RELEASED:
            this.states[i] = Input.JUST_PRESSED
            break
          case Input.JUST_PRESSED:
          case Input.PRESSED:
            this.states[i] = Input.PRESSED
            break
        }
      } else {
        switch(this.states[i]) {
          case Input.NONE:
          case Input.JUST_RELEASED:
            this.states[i] = Input.NONE
            break
          case Input.JUST_PRESSED:
          case Input.PRESSED:
            this.states[i] = Input.JUST_RELEASED
            break
        }
      }
    }
  }

  static get NONE() { return 0 }
  static get JUST_PRESSED() { return 1 }
  static get PRESSED() { return 2 }
  static get JUST_RELEASED() { return 3 }
}
