import { JudgeState } from "./judge-state"

export default class GaugeGain {
  getInitialGauge() { return 100 }
  getNewGauge(gauge, judgeState, numberOfNotes, total) { return 0 }
  isDead(gauge) { return false }
}

export class GaugeGainNormal extends GaugeGain {
  constructor() {
    super()
    this.map = {
      [JudgeState.NO]: 0,
      [JudgeState.MISS]: -8,
      [JudgeState.MISS_EMPTY]: -2.5,
      [JudgeState.BAD]: -5,
      [JudgeState.GOOD]: 0.4,
      [JudgeState.GREAT]: 0.7,
      [JudgeState.PERFECT]: 1
    }
  }
  getInitialGauge() { return 50 }
  getNewGauge(gauge, judgeState, numberOfNotes, total) {
    return gauge += this.map[judgeState] * 300 / numberOfNotes * total / 100
  }
  isDead(gauge) { return false }
}

export class GaugeGainEasy extends GaugeGainNormal {
  constructor() {
    super()
    this.map = {
      [JudgeState.NO]: 0,
      [JudgeState.MISS]: -5,
      [JudgeState.MISS_EMPTY]: -1.5,
      [JudgeState.BAD]: -3,
      [JudgeState.GOOD]: 0.5,
      [JudgeState.GREAT]: 0.8,
      [JudgeState.PERFECT]: 1.2
    }
  }
  getInitialGauge() { return 75 }
}

export class GaugeGainSurvival extends GaugeGain {
  constructor() {
    super()
    this.map = {
      [JudgeState.NO]: 0,
      [JudgeState.MISS]: -16,
      [JudgeState.MISS_EMPTY]: -4,
      [JudgeState.BAD]: -10,
      [JudgeState.GOOD]: 0.15,
      [JudgeState.GREAT]: 0.3,
      [JudgeState.PERFECT]: 0.6
    }
  }
  getInitialGauge() { return 80 }
  getNewGauge(gauge, judgeState, numberOfNotes, total) {
    return gauge += this.map[judgeState] * 300 / numberOfNotes * total / 100
  }
  isDead(gauge) { return gauge == 0 }
}

export class GaugeGainDanger extends GaugeGainSurvival {
  constructor() {
    super()
    this.map = {
      [JudgeState.NO]: 0,
      [JudgeState.MISS]: -Infinity,
      [JudgeState.MISS_EMPTY]: -8,
      [JudgeState.BAD]: -Infinity,
      [JudgeState.GOOD]: 0.15,
      [JudgeState.GREAT]: 0.3,
      [JudgeState.PERFECT]: 0.6
    }
  }
  getInitialGauge() { return 100 }
}
