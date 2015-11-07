import { JudgeState } from "../judge-state"
export class ColorScheme {
  constructor(json) {
    function getData(keyArray, data) {
      if(!data || !data[keyArray[0]]) return null
      if(keyArray.length == 1) {
        return data[keyArray[0]]
      } else {
        return getData(keyArray.slice(1), data[keyArray[0]])
      }
    }

    function getColor(key, defaultValue) {
      const data = getData(key.split(".").map((e) => e.search(/^(0|[1-9]\d*)$/) == -1 ? e : Number(e)), json)
      return data || defaultValue
    }

    this.background = this.arrayToRGBA(getColor("background", [255, 255, 255, 1]))
    this.bar = this.arrayToRGBA(getColor("bar", [0, 0, 0, 1]))
    this.beatLine = {}
    this.beatLine[1] = this.arrayToRGBA(getColor("beat_line.0", [255, 0, 0, 1]))
    this.beatLine[2] = this.arrayToRGBA(getColor("beat_line.1", [0, 0, 255, 1]))
    this.beatLine[3] = this.arrayToRGBA(getColor("beat_line.2", [0, 255, 0, 1]))
    this.beatLine[4] = this.arrayToRGBA(getColor("beat_line.3", [255, 255, 0, 1]))
    this.note = {}
    this.note.lane = {}
    this.note.lane = //TODO
    this.note.judge = {}
    this.note.judge[JudgeState.MISS] = this.arrayToRGBA(getColor("note.judge.0", [127, 127, 127, 1]))
    this.note.judge[JudgeState.BAD] = this.arrayToRGBA(getColor("note.judge.1", [255, 127, 0, 1]))
    this.note.judge[JudgeState.GOOD] = this.arrayToRGBA(getColor("note.judge.2", [0, 255, 255, 1]))
    this.note.judge[JudgeState.GREAT] = this.arrayToRGBA(getColor("note.judge.3", [0, 255, 0, 1]))
    this.note.judge[JudgeState.EXCELLENT] = this.arrayToRGBA(getColor("note.judge.4", [255, 255, 0, 1]))
    this.note.long = {}
    this.note.long.inactive = this.arrayToRGBA(getColor("note.long.inactive", [0, 127, 0, 1]))
    this.note.long.active = this.arrayToRGBA(getColor("note.long.active", [0, 255, 0, 1]))
    this.note.long.miss = this.arrayToRGBA(getColor("note.long.miss", [127, 127, 127, 1]))

  }

  arrayToRGBA(array) {
    if(array.length == 4) {
      return `rgba(${array[0]},${array[1]},${array[2]},${array[3]})`
    } else {
      return `rgb(${array[0]},${array[1]},${array[2]})`
    }
  }
}
