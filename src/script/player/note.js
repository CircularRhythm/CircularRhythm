import { JudgeState } from "./judge-state"

export class Note {
  constructor(x, y, c, time, position) {
    this.x = x
    this.y = y
    this.c = c
    this.time = time
    this.position = position

    this.judgeState = JudgeState.NO
    this.targetable = true

    this.sliceData = null
  }
}

export class NoteShort extends Note {
  constructor(x, y, c, time, position) {
    super(x, y, c, time, position)
    this.eraseTimer = -1
  }

  judge(judgeState) {
    this.judgeState = judgeState
    this.eraseTimer = 0
    this.targetable = false
  }
}

export class NoteLong extends Note {
  constructor(x, y, c, time, position, endY, endTime, endPosition) {
    super(x, y, c, time, position)
    this.endY = endY
    this.endTime = endTime
    this.endPosition = endPosition

    this.noteHeadEraseTimer = -1
    this.noteHeadPosition = position
    this.noteHeadMovable = false

    // Whether note is being pressed
    this.active = false
    // Whether line is rendered as active
    this.lineActive = true
  }

  firstJudge(judgeState) {
    this.judgeState = judgeState
    if(judgeState == JudgeState.BAD || judgeState == JudgeState.MISS) {
      this.targetable = false
      this.lineActive = false
    } else {
      this.active = true
      this.noteHeadMovable = true
    }
  }

  secondJudge(success) {
    if(!success) {
      this.judgeState = JudgeState.MISS
      this.noteHeadMovable = false
      this.lineActive = false
    }
    this.noteHeadEraseTimer = 0
    this.targetable = false
    this.active = false
  }

}
