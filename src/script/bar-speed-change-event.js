export class BarSpeedChangeEvent {
  constructor(y, bpm) {
    this.y = y
    this.bpm = bpm
  }
}

export class BarSpeedChangeEventSpeed extends BarSpeedChangeEvent {
  constructor(y, bpm) {
    super(y, bpm)
  }
}

export class BarSpeedChangeEventStop extends BarSpeedChangeEvent {
  constructor(y, bpm, length) {
    super(y, bpm)
    this.length = length
  }
}
