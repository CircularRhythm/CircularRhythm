export class Timer {
  now() {}
}

export class TimerDate extends Timer {
  now() {
    return Date.now()
  }
}

export class TimerPerformance extends Timer {
  now() {
    return performance.now()
  }
}
