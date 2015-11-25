export class BarSpeedChangeEvent {
  constructor(type, y, time, position, speed, barMoveTime) {
    this.y = y
    this.time = time
    this.position = position
    this.speed = speed
    this.barMoveTime = barMoveTime

    this.type = type
    this.currentPosition = 0
    this.targetable = true
    this.showMovingLine = false

    this.phase = 0
    this.movingPhase = 0
  }
}

export class BarSpeedChangeEventSpeed extends BarSpeedChangeEvent {
  constructor(type, y, time, position, speed, barMoveTime) {
    super(type, y, time, position, speed, barMoveTime)
  }
}

export class BarSpeedChangeEventStop extends BarSpeedChangeEvent {
  constructor(y, time, position, speed, length, barMoveTime) {
    super(BarSpeedChangeEventType.STOP, y, time, position, speed, barMoveTime)
    this.length = length
  }
}

export class BarSpeedChangeEventType {
  static get FASTER() { return 0 }
  static get SLOWER() { return 1 }
  static get STOP() { return 2 }
}
