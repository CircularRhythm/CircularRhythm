export class PlayerUtil {
  static getBarLineIndex(y, barLines) {
    return barLines.findIndex((e, i, a) => e.y <= y && y < e.y + e.l)
  }

  static getBarLine(y, barLines) {
    return barLines.find((e, i, a) => e.y <= y && y < e.y + e.l)
  }

  static getTimingDataFromY(y, timingList) {
    const list = timingList.filter((e) => e.y <= y)
    if(list.length >= 2 && list[list.length - 2].y == y) {
      // If in stop event
      return list[list.length - 2]
    }
    return list[list.length - 1]
  }

  static getTimingDataFromTime(time, timingList) {
    const list = timingList.filter((e) => e.time <= time)
    return list[list.length - 1]
  }

  static yToPosition(y, barLine) {
    return (y - barLine.y) / barLine.l
  }

  static positionToY(position, barLine) {
    return barLine.y + position * barLine.l
  }

  static yToTime(y, timingData) {
    // [tick] / 240 [tick/beat(4th)] / bpm [beat(4th)/min] * 60000 [ms/min]
    return timingData.time + (y - timingData.y) / 240 / timingData.bpm * 60000
  }

  static timeToY(time, timingData) {
    // [ms] / 60000 [ms/min] * bpm [beat(4th)/min] * 240 [tick/beat(4th)]
    return timingData.y + (time - timingData.time) / 60000 * timingData.bpm * 240
  }
}
