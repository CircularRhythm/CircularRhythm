import FormatNumber from "format-number"

export default class Util {
  static formatTime(ms) {
    const minute = Math.floor(ms / 60000)
    const second = Math.floor((ms % 60000) / 1000)

    return minute + ":" + FormatNumber({padLeft: 2})(second)
  }
}
