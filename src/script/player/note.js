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
  }

  judge(judgeState) {
    this.judgeState = judgeState
    this.targetable = false
  }
}

export class NoteLong extends Note {
  constructor(x, y, c, time, position, endY, endTime, endPosition) {
    super(x, y, c, time, position)
    this.endY = endY
    this.endTime = endTime
    this.endPosition = endPosition

    this.noteHeadPosition = position
    this.noteHeadMovable = false
    this.noteHeadVisible = true

    // 0: Inactive, 1: Active, 2: Miss
    this.state = 0
  }

  firstJudge(judgeState) {
    this.judgeState = judgeState
    if(judgeState == JudgeState.BAD || judgeState == JudgeState.MISS) {
      this.state = 2
      this.noteHeadVisible = false
      this.targetable = false
    } else {
      this.state = 1
      this.noteHeadMovable = true
    }
  }

  secondJudge(success) {
    if(!success) {
      this.state = 2
      this.noteHeadVisible = false
      this.judgeState = JudgeState.MISS
      this.noteHeadMovable = false
    } else {
      this.state = 0
    }
    this.targetable = false
  }

}
