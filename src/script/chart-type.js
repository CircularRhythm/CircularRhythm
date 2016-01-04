export class ChartType {
  static get UNKNOWN() { return -1 }
  static get VERYEASY() { return 0 }
  static get EASY() { return 1 }
  static get MEDIUM() { return 2 }
  static get HARD() { return 3 }
  static get VERYHARD() { return 4 }

  static fromString(chartName) {
    const s = chartName.toLowerCase()
    if(s.indexOf("easy") != -1) {
      if(s.indexOf("very") != -1) return ChartType.VERYEASY
      return ChartType.EASY
    }
    if(s.indexOf("medium") != -1) return ChartType.MEDIUM
    if(s.indexOf("hard") != -1) {
      if(s.indexOf("very") != -1) return ChartType.VERYHARD
      return ChartType.HARD
    }
    if(s.indexOf("beginner") != -1) return ChartType.VERYEASY
    if(s.indexOf("normal") != -1) return ChartType.EASY
    if(s.indexOf("hyper") != -1) return ChartType.MEDIUM
    if(s.indexOf("another") != -1) {
      if(s.indexOf("+") != -1) return ChartType.VERYHARD
      return ChartType.HARD
    }
    if(s.indexOf("black") != -1) return ChartType.VERYHARD
    if(s.indexOf("leggendaria") != -1) return ChartType.VERYHARD
    return ChartType.UNKNOWN
  }

  static toCamelCaseString(type) {
    switch(type) {
      case this.UNKNOWN: return "Unknown"
      case this.VERYEASY: return "VeryEasy"
      case this.EASY: return "Easy"
      case this.MEDIUM: return "Medium"
      case this.HARD: return "Hard"
      case this.VERYHARD: return "VeryHard"
    }
  }

  static toSnakeCaseString(type) {
    switch(type) {
      case this.UNKNOWN: return "unknown"
      case this.VERYEASY: return "very-easy"
      case this.EASY: return "easy"
      case this.MEDIUM: return "medium"
      case this.HARD: return "hard"
      case this.VERYHARD: return "very-hard"
    }
  }
}
