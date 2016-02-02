import { JudgeState } from "../judge-state"
import { BarSpeedChangeEventType } from "../bar-speed-change-event"
import { ChartType } from "../../chart-type"
import { Rank } from "../rank"
import GaugeType from "../gauge-type"
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

    const that = this
    function color(key, defaultValue) {
      return that.arrayToRGBA(getColor.call(that, key, defaultValue))
    }

    this.background = color("background", [255, 255, 255, 1])
    this.bar = color("bar", [0, 0, 0, 1])
    this.center = color("center", [255, 255, 255, 1])
    this.beat = color("beat", [0, 127, 127, 1])
    this.gauge = {}
    this.gauge[GaugeType.NORMAL] = {}
    this.gauge[GaugeType.NORMAL].top = color("gauge.normal.top", [255, 255, 0, 1])
    this.gauge[GaugeType.NORMAL].bottom = color("gauge.normal.bottom", [255, 127, 0, 1])
    this.gauge[GaugeType.EASY] = {}
    this.gauge[GaugeType.EASY].top = color("gauge.easy.top", [255, 255, 0, 1])
    this.gauge[GaugeType.EASY].bottom = color("gauge.easy.bottom", [0, 255, 0, 1])
    this.gauge[GaugeType.SURVIVAL] = {}
    this.gauge[GaugeType.SURVIVAL].usual = color("gauge.survival.usual", [255, 0, 0, 1])
    this.gauge[GaugeType.SURVIVAL].caution = color("gauge.survival.caution", [127, 0, 0, 1])
    this.gauge[GaugeType.DANGER] = color("gauge.danger", [0, 0, 0, 1])
    this.gauge.text = color("gauge.text", [0, 0, 0, 1])
    this.score = {}
    this.score.current = color("score.current", [0, 255, 0, 1])
    this.score.text = color("score.text", [0, 0, 0, 1])
    this.duration = color("duration", [0, 255, 255, 1])
    this.information = {}
    this.information.background = color("information.background", [192, 192, 192, 1])
    this.information.header = color("information.header", [0, 0, 0, 1])
    this.information.separator = color("information.separator", [96, 96, 96, 1])
    this.information.judge = {}
    this.information.judge.header = color("information.judge.header", [0, 0, 0, 1])
    this.information.judge.number = color("information.judge.number", [0, 0, 0, 1])
    this.information.chartName = {}
    this.information.chartName[ChartType.UNKNOWN] = color("information.chart_name.unknown", [255, 255, 255, 1])
    this.information.chartName[ChartType.VERYEASY] = color("information.chart_name.very_easy", [0, 255, 0, 1])
    this.information.chartName[ChartType.EASY] = color("information.chart_name.easy", [0, 255, 255, 1])
    this.information.chartName[ChartType.MEDIUM] = color("information.chart_name.medium", [255, 255, 0, 1])
    this.information.chartName[ChartType.HARD] = color("information.chart_name.hard", [255, 0, 0, 1])
    this.information.chartName[ChartType.VERYHARD] = color("information.chart_name.very_hard", [0, 0, 0, 1])
    this.information.level = {}
    this.information.level.header = color("information.level.header", [0, 0, 0, 1])
    this.information.level.number = color("information.level.number", [0, 0, 0, 1])
    this.information.title = color("information.title", [0, 0, 0, 1])
    this.information.subtitle = color("information.subtitle", [0, 0, 0, 1])
    this.information.status = {}
    this.information.meter = {}
    this.information.meter.header = color("information.meter.header", [0, 0, 0, 1])
    this.information.meter.border = color("information.meter.border", [0, 0, 0, 1])
    this.information.status.header = color("information.status.header", [0, 0, 0, 1])
    this.information.status.content = color("information.status.content", [0, 0, 0, 1])
    this.information.rank = {}
    this.information.rank[Rank.D] = color("information.rank.d", [0, 0, 0, 1])
    this.information.rank[Rank.C] = color("information.rank.c", [0, 0, 0, 1])
    this.information.rank[Rank.B] = color("information.rank.b", [0, 0, 0, 1])
    this.information.rank[Rank.A] = color("information.rank.a", [0, 0, 0, 1])
    this.information.rank[Rank.AA] = color("information.rank.aa", [0, 0, 0, 1])
    this.information.rank[Rank.AAA] = color("information.rank.aaa", [0, 0, 0, 1])
    this.analyzer = {}
    this.analyzer.background = color("analyzer.background", [255, 255, 255, 1])
    this.analyzer.border = color("analyzer.border", [0, 0, 0, 1])
    this.analyzer.position = color("analyzer.position", [0, 0, 0, 1])
    this.analyzer.trail = color("analyzer.trail", [255, 255, 255, 1])
    this.analyzer.density = color("analyzer.density", [0, 0, 0, 1])
    this.analyzer.accuracy = color("analyzer.accuracy", [0, 255, 0, 1])
    this.analyzer.gauge = {}
    this.analyzer.gauge[GaugeType.NORMAL] = color("analyzer.gauge.normal", [255, 127, 0, 1])
    this.analyzer.gauge[GaugeType.EASY] = color("analyzer.gauge.easy", [0, 255, 0, 1])
    this.analyzer.gauge[GaugeType.SURVIVAL] = color("analyzer.gauge.survival", [255, 0, 0, 1])
    this.analyzer.gauge[GaugeType.DANGER] = color("analyzer.gauge.danger", [0, 0, 0, 1])
    this.analyzer.gauge.clear = color("analyzer.gauge.clear", [255, 255, 0, 1])
    this.controller = {}
    this.controller.background = color("controller.background", [120, 120, 120, 1])
    this.loading = {}
    this.loading.background = color("loading.background", [255, 255, 255, 1])
    this.loading.bar = color("loading.bar", [255, 255, 255, 1])
    this.loading.title = color("loading.title", [0, 0, 0, 1])
    this.loading.subtitle = color("loading.subtitle", [0, 0, 0, 1])
    this.loading.artist = color("loading.artist", [0, 0, 0, 1])
    this.loading.genre = color("loading.genre", [0, 0, 0, 1])
    this.loading.text = color("loading.text", [0, 0, 0, 1])
    this.failed = {}
    this.failed.background = color("failed.background", [0, 0, 0, 1])
    this.failed.bar = color("failed.bar", [255, 0, 0, 0.2])
    this.failed.text = color("failed.text", [0, 0, 0, 1])
    this.failed.comment = color("failed.comment", [0, 0, 0, 1])
    this.start = color("start", [0, 0, 0, 1])
    this.combo = color("combo", [0, 0, 0, 1])
    this.bpm = color("bpm", [0, 0, 0, 1])
    this.lane = []
    this.lane[0] = color("lane.0", [255, 0, 0, 1])
    this.lane[1] = color("lane.1", [255, 255, 0, 1])
    this.lane[2] = color("lane.2", [0, 255, 0, 1])
    this.lane[3] = color("lane.3", [0, 0, 255, 1])
    this.beatLine = {}
    this.beatLine[1] = color("beat_line.0", [255, 0, 0, 1])
    this.beatLine[2] = color("beat_line.1", [0, 0, 255, 1])
    this.beatLine[3] = color("beat_line.2", [0, 255, 0, 1])
    this.beatLine[4] = color("beat_line.3", [255, 255, 0, 1])
    this.note = {}
    this.note.default = color("note.default", [0, 0, 0, 1])
    this.note.special = color("note.special", [0, 0, 0, 1])
    this.note.lane = []
    this.note.lane[0] = color("note.lane.0", [255, 0, 0, 1])
    this.note.lane[1] = color("note.lane.1", [255, 255, 0, 1])
    this.note.lane[2] = color("note.lane.2", [0, 255, 0, 1])
    this.note.lane[3] = color("note.lane.3", [0, 0, 255, 1])
    this.note.judge = {}
    this.note.judge[JudgeState.MISS] = color("note.judge.miss", [127, 127, 127, 1])
    this.note.judge[JudgeState.BAD] = color("note.judge.bad", [255, 127, 0, 1])
    this.note.judge[JudgeState.GOOD] = color("note.judge.good", [0, 255, 255, 1])
    this.note.judge[JudgeState.GREAT] = color("note.judge.great", [0, 255, 0, 1])
    this.note.judge[JudgeState.PERFECT] = color("note.judge.perfect", [255, 255, 0, 1])
    this.note.unit = {}
    this.note.unit[0] = color("note.unit.0", [0, 0, 0, 1])
    this.note.unit[1] = color("note.unit.1", [255, 0, 0, 1])
    this.note.unit[2] = color("note.unit.2", [0, 0, 255, 1])
    this.note.unit[3] = color("note.unit.3", [0, 255, 0, 1])
    this.note.unit[4] = color("note.unit.4", [255, 255, 0, 1])
    this.note.long = {}
    this.note.long.inactive = []
    this.note.long.inactive[0] = color("note.long.inactive.0", [127, 0, 0, 1])
    this.note.long.inactive[1] = color("note.long.inactive.1", [127, 127, 0, 1])
    this.note.long.inactive[2] = color("note.long.inactive.2", [0, 127, 0, 1])
    this.note.long.inactive[3] = color("note.long.inactive.3", [0, 0, 127, 1])
    this.note.long.active = []
    this.note.long.active[0] = color("note.long.active.0", [255, 0, 0, 1])
    this.note.long.active[1] = color("note.long.active.1", [255, 255, 0, 1])
    this.note.long.active[2] = color("note.long.active.2", [0, 255, 0, 1])
    this.note.long.active[3] = color("note.long.active.3", [0, 0, 255, 1])
    this.note.long.miss = color("note.long.miss", [127, 127, 127, 1])
    this.speedChangeLine = {}
    this.speedChangeLine[BarSpeedChangeEventType.FASTER] = color("speed_change.faster", [255, 0, 0, 1])
    this.speedChangeLine[BarSpeedChangeEventType.SLOWER] = color("speed_change.slower", [0, 0, 255, 1])
    this.speedChangeLine[BarSpeedChangeEventType.STOP] = color("speed_change.stop", [127, 127, 127, 1])
    this.fps = color("fps", [0, 0, 0, 1])
  }

  arrayToRGBA(array) {
    if(array.length == 4) {
      return `rgba(${array[0]},${array[1]},${array[2]},${array[3]})`
    } else {
      return `rgb(${array[0]},${array[1]},${array[2]})`
    }
  }
}
