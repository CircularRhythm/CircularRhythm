import { PlayerUtil } from "./player-util"
import { Note, NoteShort, NoteLong } from "./note"
import { BarSpeedChangeEvent, BarSpeedChangeEventSpeed, BarSpeedChangeEventStop, BarSpeedChangeEventType } from "./bar-speed-change-event"

// TODO: Exclude long special
export class BmsonLoader {
  constructor(bmson) {
    this.bmson = bmson
  }

  loadTimingList() {
    const bmsonBpmList = this.bmson.bpm_events
    const bmsonStopList = this.bmson.stop_events
    const timingList = []

    // y -> {bpmEvent: {}, stopEvent: {}}
    const combinedList = new Map()
    bmsonBpmList.forEach((e, i) => combinedList.set(e.y, {bpmEvent: e, stopEvent: null}))
    bmsonStopList.forEach((e, i) => {
      if(combinedList.has(e.y)) {
        combinedList.get(e.y).stopEvent = e
      } else {
        combinedList.set(e.y, {bpmEvent: null, stopEvent: e})
      }
    })

    let lastTime = 0
    let lastY = 0
    let lastBpm = this.bmson.info.init_bpm
    Array.from(combinedList)  // Convert to an array
    .sort((a, b) => a[0] - b[0]).forEach((e) => {  // to sort by y
      const y = e[0]
      const bpmEvent = e[1].bpmEvent
      const stopEvent = e[1].stopEvent
      if(bpmEvent  == null) {
        // Only stop
        lastTime += (y - lastY) / 240 / lastBpm * 60000
        // Start
        timingList.push({time: lastTime, y: y, bpm: 0})
        // End
        timingList.push({time: lastTime + stopEvent.duration, y: y, bpm: lastBpm})
        lastTime += stopEvent.duration
        lastY = y
      } else if(stopEvent == null) {
        // Only bpm
        // [tick] / 240 [tick/beat(4th)] / bpm [beat(4th)/min] * 60000 [ms/min]
        lastTime += (y - lastY) / 240 / lastBpm * 60000
        timingList.push({time: lastTime, y: y, bpm: bpmEvent.bpm})
        lastBpm = bpmEvent.bpm
        lastY = y
      } else {
        // Both
        // [tick] / 240 [tick/beat(4th)] / bpm [beat(4th)/min] * 60000 [ms/min]
        lastTime += (y - lastY) / 240 / lastBpm * 60000
        // Start
        timingList.push({time: lastTime, y: y, bpm: 0})
        // End
        timingList.push({time: lastTime + stopEvent.duration, y: y, bpm: bpmEvent.bpm})
        lastTime += stopEvent.duration
        lastBpm = bpmEvent.bpm
        lastY = y
      }
    })

    if(timingList.length == 0 || timingList[0].y != 0) {
      timingList.unshift({time: 0, y: 0, bpm: this.bmson.info.init_bpm})
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
      const maximumUnit = bmsonBarLines[i].maxUnit || null
      const minimumUnit = bmsonBarLines[i].minUnit || null
      const supportLines = bmsonBarLines[i].support || null
      barLines.push({y: line1.y, l: line2.y - line1.y, maximumUnit: maximumUnit, minimumUnit: minimumUnit, supportLines: supportLines})
    }

    return barLines
  }

  // It corrupts barLines; add additional barline if there is a note whose y is larger than y of the last barline
  loadSoundChannels(barLines, timingList) {
    const soundChannels = []

    for(let bmsonSoundChannel of this.bmson.sound_channels) {
      const bmsonNotes = bmsonSoundChannel.notes.slice().sort((a, b) => a.y - b.y)
      const notes = []
      for(let note of bmsonNotes) {
        // TODO: Can improve speed
        const barLine = PlayerUtil.getBarLine(note.y, barLines)
        const timingData = PlayerUtil.getTimingDataFromY(note.y, timingList)
        const time = PlayerUtil.yToTime(note.y, timingData)
        const position = PlayerUtil.yToPosition(note.y, barLine)
        let unitType
        const unit = barLine.supportLines.find((e) => e.y == note.y)
        if(unit) {
          unitType = unit.type
        } else {
          unitType = 0
        }
        if(note.l > 0) {
          // Long note
          const endY = note.y + note.l
          const endBarLine = PlayerUtil.getBarLine(endY, barLines)
          const endTimingData = PlayerUtil.getTimingDataFromY(endY, timingList)
          const endTime = PlayerUtil.yToTime(endY, endTimingData)
          const endPosition = PlayerUtil.yToPosition(endY, endBarLine)
          notes.push(new NoteLong(note.x, note.y, note.c, unitType, time, position, endY, endTime, endPosition))
        } else {
          // Normal note
          notes.push(new NoteShort(note.x, note.y, note.c, unitType, time, position))
        }
      }
      soundChannels.push({name: bmsonSoundChannel.name, source: null, notes: notes})
    }

    return soundChannels
  }

  // It corrupts barLines; add additional barline if there is a speed event whose y is larger than y of the last barline
  getBarSpeedChangeList(barLines, timingList) {
    const barSpeedChangeList = []

    const bmsonBpmList = this.bmson.bpm_events
    const bmsonStopList = this.bmson.stop_events

    // y -> {bpm: {}, stop: {}}
    const combinedSet = new Set()
    bmsonBpmList.forEach((e, i) => combinedSet.add(e.y))
    bmsonStopList.forEach((e, i) => combinedSet.add(e.y))

    for(let i = 0; i < barLines.length - 1; i++) {
      const line1 = barLines[i]
      const line2 = barLines[i + 1]
      if(line1.l != line2.l) combinedSet.add(line2.y)
    }

    // speed [(pos)/ms] = bpm [beat/min] / 60000 [ms/min] * 240 [tick / beat] / length [tick/(pos)]
    let lastSpeed = this.bmson.info.init_bpm / 60000 * 240 / barLines[0].l
    Array.from(combinedSet).sort((a, b) => a - b).forEach(y => {
      const timingData = PlayerUtil.getTimingDataFromY(y, timingList)
      const barLineIndex = PlayerUtil.getBarLineIndex(y, barLines)
      const barLine = barLines[barLineIndex]
      const position = PlayerUtil.yToPosition(y, barLine)
      if(timingData.bpm == 0) {
        // Stop
        const endTimingData = PlayerUtil.getTimingDataFromY(y, timingList, true)
        const speed = endTimingData.bpm / 60000 * 240 / barLine.l
        const length = endTimingData.time - timingData.time

        // activate 0.5 position prior to NEW SPEED
        const barMoveTime = timingData.time + length - 0.5 / speed
        barSpeedChangeList.push(new BarSpeedChangeEventStop(y, timingData.time, position, speed, length, barMoveTime))
        lastSpeed = speed
      } else {
        // Speed change only
        const time = PlayerUtil.yToTime(y, timingData)
        const speed = timingData.bpm / 60000 * 240 / barLine.l
        if(speed > lastSpeed){
          // activate 0.5 position prior to NEW SPEED
          const barMoveTime = time - 0.5 / speed
          barSpeedChangeList.push(new BarSpeedChangeEventSpeed(BarSpeedChangeEventType.FASTER, y, time, position, speed, barMoveTime))
        } else if(speed < lastSpeed) {
          // activate 0.5 position prior to CURRENT SPEED
          let barMovePosition = position - 0.5
          let barMoveTime
          if(barMovePosition < 0) {
            barMovePosition += 1
            // Previous measure
            if(barLineIndex == 0) {
              // No previous measure
              barMoveTime = 0
            } else {
              const previousBarLine = barLines[barLineIndex - 1]
              const barMoveY = PlayerUtil.positionToY(barMovePosition, previousBarLine)
              const barMoveTimingData = PlayerUtil.getTimingDataFromY(barMoveY, timingList)
              barMoveTime = PlayerUtil.yToTime(barMoveY, barMoveTimingData)
            }
          } else {
            const barMoveY = PlayerUtil.positionToY(barMovePosition, barLine)
            const barMoveTimingData = PlayerUtil.getTimingDataFromY(barMoveY, timingList)
            barMoveTime = PlayerUtil.yToTime(barMoveY, barMoveTimingData)
          }
          barSpeedChangeList.push(new BarSpeedChangeEventSpeed(BarSpeedChangeEventType.SLOWER, y, time, position, speed, barMoveTime))
        }
        lastSpeed = speed
      }
    })

    return barSpeedChangeList
  }

  appendLackingBarLine(barLines) {
    this.bmson.sound_channels.forEach((channel) => {
      channel.notes.forEach((note) => {
        this.checkAndAppendBarLine(note.y + note.l, barLines)
      })
    })
    this.bmson.bpm_events.forEach((e) => {
      this.checkAndAppendBarLine(e.y, barLines)
    })
    this.bmson.stop_events.forEach((e) => {
      this.checkAndAppendBarLine(e.y, barLines)
    })
  }

  // Add beat data for each bar line
  makeBeatData(barLines) {
    for(let barLine of barLines) {
      if(barLine.maximumUnit == null) {
        if(barLine.l % 240 == 0) {
          // Unit 4
          barLine.maximumUnit = 240
        } else if(barLine.l % 120 == 0) {
          // Unit 8
          barLine.maximumUnit = 120
        } else {
          // Unknown, Unit 4
          barLine.maximumUnit = 240
        }
      }
      if(barLine.minimumUnit == null) barLine.minimumUnit = 60
      if(barLine.supportLines == null) {
        barLine.supportLines = []
        function push(y, type) {
          barLine.supportLines.push({y: barLine.y + y, position: y / barLine.l, type: type})
        }
        for(let y = 0; y < barLine.l; y += barLine.minimumUnit) {
          if(y % 240 == 0) { push(y, 1); continue }
          if(y % 120 == 0) { push(y, 2); continue }
          if(y % 80 == 0) { push(y, 3); continue }
          if(y % 60 == 0) { push(y, 4); continue }
        }
      }
    }
  }

  makeSupportLines(barLines) {
    let supportLines = []
    barLines.forEach((e) => {
      supportLines = supportLines.concat(e.supportLines)
    })
    return supportLines
  }

  checkAndAppendBarLine(y, barLines) {
    while(barLines[barLines.length - 1].y <= y) {
      const lastBarLine = barLines[barLines.length - 1]
      barLines.push({y: lastBarLine.y + lastBarLine.l, l: lastBarLine.l, minimumUnit: lastBarLine.minimumUnit, maximumUnit: lastBarLine.maximumUnit, supportLines: lastBarLine.supportLines})
    }
  }

  getNumberOfNotes(soundChannels, playMode) {
    let number = 0
    soundChannels.forEach((channel) => {
      let notes
      if(playMode == 1) {
        notes = channel.notes.filter((note) => 1 <= note.x && note.x <= 5)
      } else if(playMode == 2) {
        notes = channel.notes.filter((note) => 1 <= note.x && note.x <= 9)
      }
      number += notes.length
    })
    return number
  }

  getPlayMode(hook) {
    if(this.bmson.info.mode_hint == "circularrhythm-single") return 1
    else if(this.bmson.info.mode_hint == "circularrhythm-double") return 2
    else return 1 // TODO
  }
}
