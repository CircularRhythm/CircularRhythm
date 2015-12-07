export class JudgeState {
  static get NO() { return 0 }
  static get MISS() { return 1 }
  static get BAD() { return 2 }
  static get GOOD() { return 3 }
  static get GREAT() { return 4 }
  static get PERFECT() { return 5 }
  static get MISS_EMPTY() { return 6 }

  // currentTime - noteTime; Early : <0, Slow: >0
  static firstFromDelta(difference) {
    const diffAbs = Math.abs(difference)
    if(diffAbs < 20) return JudgeState.PERFECT
    if(diffAbs < 50) return JudgeState.GREAT
    if(diffAbs < 100) return JudgeState.GOOD
    if(diffAbs < 200) return JudgeState.BAD
    return JudgeState.MISS_EMPTY
  }

  static secondFromDelta(difference) {
    const diffAbs = Math.abs(difference)
    if(diffAbs <= 200) return true
    return false
  }
}
