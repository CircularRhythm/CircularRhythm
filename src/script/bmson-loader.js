import { PlayerUtil } from "./player-util"
import { Note, NoteShort, NoteLong } from "./note"

export class BmsonLoader {
  constructor(bmson) {
    this.bmson = bmson
  }

  loadTimingList() {
    const bmsonBpmList = this.bmson.bpmNotes
    const bmsonStopList = this.bmson.stopNotes
    const timingList = []

    // y -> {bpm: {}, stop: {}}
    const combinedList = new Map()
    bmsonBpmList.forEach((e, i) => combinedList.set(e.y, {bpm: e, stop: null}))
    bmsonStopList.forEach((e, i) => {
      if(combinedList.has(e.y)) {
        combinedList.get(e.y)["stop"] = e
      } else {
        combinedList.set(e.y, {bpm: null, stop: e})
      }
    })

    let lastTime = 0
    let lastY = 0
    let lastBpm = this.bmson.info.initBPM
    Array.from(combinedList)  // Convert to an array
    .sort((a, b) => a[0] - b[0]).forEach((e) => {  // to sort by y
      const y = e[0]
      const bpm = e[1].bpm
      const stop = e[1].stop
      if(bpm == null) {
        // Only stop
        lastTime += (y - lastY) / 240 / lastBpm * 60000
        // Start
        timingList.push({time: lastTime, y: y, bpm: 0})
        // End
        timingList.push({time: lastTime + stop.v, y: y, bpm: lastBpm})
        // Push to barSpeedChangeList
        //this.barSpeedChangeList.push(new BarSpeedChangeEventStop(y, lastBpm, stop.v))
        lastTime += stop.v
        lastY = y
      } else if(stop == null) {
        // Only bpm
        // [tick] / 240 [tick/beat(4th)] / bpm [beat(4th)/min] * 60000 [ms/min]
        lastTime += (y - lastY) / 240 / lastBpm * 60000
        timingList.push({time: lastTime, y: y, bpm: bpm.v})
        // Push to barSpeedChangeList
        //this.barSpeedChangeList.push(new BarSpeedChangeEventSpeed(y, bpm.v))
        lastBpm = bpm.v
        lastY = y
      } else {
        // Both
        // [tick] / 240 [tick/beat(4th)] / bpm [beat(4th)/min] * 60000 [ms/min]
        lastTime += (y - lastY) / 240 / lastBpm * 60000
        // Start
        timingList.push({time: lastTime, y: y, bpm: 0})
        // End
        timingList.push({time: lastTime + stop.v, y: y, bpm: bpm.v})
        // Push to barSpeedChangeList
        //this.barSpeedChangeList.push(new BarSpeedChangeEventStop(y, bpm.v, stop.v))
        lastTime += stop.v
        lastBpm = bpm.v
        lastY = y
      }
    })

    if(timingList.length == 0 || timingList[0].y != 0) {
      timingList.unshift({time: 0, y: 0, bpm: this.bmson.info.initBPM})
    }

    return timingList
  }

  loadBarLines() {
    const bmsonBarLines = this.bmson.lines.slice().sort((a, b) => a.y - b.y)
    const barLines = []

    if(!bmsonBarLines[0] || bmsonBarLines[0].y != 0) new Error("First barline must be y=0")
    for(let i = 0; i < bmsonBarLines.length - 1; i++) {
      const line1 = bmsonBarLines[i]
      const line2 = bmsonBarLines[i + 1]
      barLines.push({y: line1.y, l: line2.y - line1.y})
    }

    return barLines
  }

  // It corrupts barLines; add additional barline if there is a note whose y is larger than y of the last barline
  loadSoundChannels(barLines, timingList) {
    const soundChannels = []

    for(let bmsonSoundChannel of this.bmson.soundChannel) {
      const bmsonNotes = bmsonSoundChannel.notes.slice().sort((a, b) => a.y - b.y)
      const notes = []
      for(let note of bmsonNotes) {
        // TODO: Can improve speed
        this.checkAndAppendBarLine(note.y, barLines)
        const barLine = PlayerUtil.getBarLine(note.y, barLines)
        const timingData = PlayerUtil.getTimingDataFromY(note.y, timingList)
        const time = PlayerUtil.yToTime(note.y, timingData)
        const position = PlayerUtil.yToPosition(note.y, barLine)
        if(note.l > 0) {
          // Long note
          const endY = note.y + note.l
          this.checkAndAppendBarLine(endY, barLines)
          const endBarLine = PlayerUtil.getBarLine(endY, barLines)
          const endTimingData = PlayerUtil.getTimingDataFromY(endY, timingList)
          const endTime = PlayerUtil.yToTime(endY, endTimingData)
          const endPosition = PlayerUtil.yToPosition(endY, endBarLine)
          notes.push(new NoteLong(note.x, note.y, note.c, time, position, endY, endTime, endPosition))
        } else {
          // Normal note
          notes.push(new NoteShort(note.x, note.y, note.c, time, position))
        }
      }
      soundChannels.push({name: bmsonSoundChannel.name, source: null, notes: notes})
    }

    return soundChannels
  }

  checkAndAppendBarLine(y, barLines) {
    while(barLines[barLines.length - 1].y <= y) {
      const lastBarLine = barLines[barLines.length - 1]
      barLines.push({y: lastBarLine.y + lastBarLine.l, l: lastBarLine.l})
    }
  }
}
