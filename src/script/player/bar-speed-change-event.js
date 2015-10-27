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
  }
}

export class BarSpeedChangeEventSpeed extends BarSpeedChangeEvent {
  constructor(type, y, time, position, speed, barMoveTime) {
    super(type, y, time, position, speed, barMoveTime)
  }
}

export class BarSpeedChangeEventStop extends BarSpeedChangeEvent {
  constructor(y, time, position, speed, length, barMoveTime) {
    super("stop", y, time, position, speed, barMoveTime)
    this.length = length
  }
}
