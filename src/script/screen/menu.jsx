import React from "react"
import style from "./menu.sass"
import ScreenGame from "./game"
import ClassNames from "classnames"
import { LocalBmsonLoader } from "../local-bmson-loader"
import { ChartType } from "../chart-type"
import KeyConfig from "./menu-keyconfig"
import GaugeType from "../player/gauge-type"

// TODO: cleanup
export default React.createClass({
  modeString: {"single": "Single", "double": "Double"},
  modeId: {"single": 1, "double": 2},
  gaugeString: {
    [GaugeType.NORMAL]: "Normal",
    [GaugeType.EASY]: "Easy",
    [GaugeType.SURVIVAL]: "Survival",
    [GaugeType.DANGER]: "Danger"
  },
  getInitialState() {
    const playConfig = this.props.app.preference.playConfig
    return {
      showDropScreen: false,
      showCompatibilityWarning: this.props.app.compatibilityWarning.length > 0,
      showKeyConfig: false,
      selectedMusic: {
        type: null,
        id: null,
        element: null
      },
      selectedChart: {
        type: null,
        id: null,
        element: null
      },
      gaugeType: playConfig.gaugeType
    }
  },
  selectMusic(type, id) {
    let element
    if(type == "default") element = this.props.app.musicList[id]
    else if(type == "local") element = this.props.app.localMusicList[id]
    this.setState({
      selectedMusic: {
        type: type,
        id: id,
        element: element
      },
      selectedChart: {
        mode: null,
        id: null,
        element: null
      }
    })
  },
  selectChart(mode, id) {
    if(mode == this.state.selectedChart.mode && id == this.state.selectedChart.id) {
      this.setState({
        selectedChart: {
          mode: null,
          id: null,
          element: null
        }
      })
    } else {
      this.setState({
        selectedChart: {
          mode: mode,
          id: id,
          element: this.state.selectedMusic.element.charts[mode][id]
        }
      })
    }
  },
  bodyOnDragEnter(e) {
    e.stopPropagation()
    e.preventDefault()

    if(e.dataTransfer.types.indexOf("Files") == -1) return

    this.setState({
      showDropScreen: true
    })
  },
  dropOnDragEnter(e) {
    e.stopPropagation()
    e.preventDefault()
  },
  dropOnDragLeave(e) {
    e.stopPropagation()
    e.preventDefault()
    this.setState({
      showDropScreen: false
    })
  },
  dropOnDragOver(e) {
    e.stopPropagation()
    e.preventDefault()
  },
  dropOnDrop(e) {
    e.stopPropagation()
    e.preventDefault()
    this.setState({
      showDropScreen: false
    })
    this.onDropFiles(e.dataTransfer)
  },
  dropOnClick(e) {
    this.setState({
      showDropScreen: false
    })
  },
  onDropFiles(dataTransfer) {
    const length = dataTransfer.items.length
    for(let i = 0; i < length; i++) {
      const entry = dataTransfer.items[i].webkitGetAsEntry()
      if(entry.isDirectory) {
        const loader = new LocalBmsonLoader(this.props.app.localFileList)
        loader.load(entry).then((music) => {
          this.props.app.localMusicList.push(music)
          this.forceUpdate()  // TODO: React won't detect modification of this.props.app.localMusicList
        })
      }
    }
  },
  play() {
    const bmsonSetConfig = {}
    const music = this.state.selectedMusic.element
    const chart = this.state.selectedChart.element
    bmsonSetConfig.title = music.title
    bmsonSetConfig.subtitle = music.subtitle
    bmsonSetConfig.artist = music.artist
    bmsonSetConfig.subartists = music.subartists
    bmsonSetConfig.genre = music.genre
    bmsonSetConfig.chartName = chart.chart_name
    bmsonSetConfig.level = chart.level
    bmsonSetConfig.bpm = chart.bpm
    if(music.local) {
      bmsonSetConfig.path = music.basedir + "/" + chart.file
      bmsonSetConfig.local = true
      bmsonSetConfig.localFileList = this.props.app.localFileList
    } else {
      bmsonSetConfig.path = this.props.app.serverUrl + "/" + music.basedir + "/" + chart.file
      bmsonSetConfig.local = false
      if(music.packed_assets) {
        bmsonSetConfig.packedAssets = true
        bmsonSetConfig.assetPath = this.props.app.serverUrl + "/" + music.basedir + "/assets.json"
      } else {
        bmsonSetConfig.packedAssets = false
      }
    }
    bmsonSetConfig.playMode = this.modeId[this.state.selectedChart.mode]

    this.props.app.preference.playConfig = {
      autoSpecial: false,
      gaugeType: this.state.gaugeType
    }
    this.props.app.savePreference()
    bmsonSetConfig.config = this.props.app.preference.playConfig
    console.log(bmsonSetConfig)

    this.props.manager.transit(ScreenGame, {bmsonSetConfig: bmsonSetConfig})
  },
  closeCompatibilityWarning() {
    this.setState({
      showCompatibilityWarning: false
    })
  },
  showKeyConfig() {
    this.setState({
      showKeyConfig: true
    })
  },
  hideKeyConfig() {
    this.setState({
      showKeyConfig: false
    })

    this.props.app.savePreference()
  },
  render() {
    let musicDetailContent
    if(this.state.selectedMusic.element) {
      const music = this.state.selectedMusic.element
      musicDetailContent = (
        <div>
          <div className="banner"></div>
          <div className="preview">
            <audio controls></audio>
          </div>
          <div className="genre">{music.genre}</div>
          <div className="title">
            {music.title}
            { (() => { if(music.subtitle && music.subtitle != "") return <span className="subtitle">{music.subtitle}</span> })() }
          </div>
          <div className="artist">{music.artist}</div>
          <div className="subartists">{music.subartists.join(", ")}</div>
          <div className="vr"></div>
          <div className="difficulty">
            <div className="label">Single</div>
            <div className="buttonContainer">
              {this.state.selectedMusic.element.charts.single.map((e, i) => {
                const className = ClassNames({
                  button: true,
                  ["button" + ChartType.toCamelCaseString(ChartType.fromString(e.chart_name))]: true,
                  buttonActive: (this.state.selectedChart.mode == "single" && this.state.selectedChart.id == i)
                })
                return (
                  <div className={className} key={i} onClick={(e) => this.selectChart("single", i)}>{e.level}</div>
                )
              })}
            </div>
            <div className="label">Double</div>
            <div className="buttonContainer">
              {this.state.selectedMusic.element.charts.double.map((e, i) => {
                const className = ClassNames({
                  button: true,
                  ["button" + ChartType.toCamelCaseString(ChartType.fromString(e.chart_name))]: true,
                  buttonActive: (this.state.selectedChart.mode == "double" && this.state.selectedChart.id == i)
                })
                return (
                  <div className={className} key={i} onClick={(e) => this.selectChart("double", i)}>{e.level}</div>
                )
              })}
            </div>
          </div>
        </div>
      )
    } else {
      musicDetailContent = <div className="noMusic">Select music</div>
    }

    let chartDetailContent
    if(this.state.selectedChart.element){
      const chart = this.state.selectedChart.element
      let bpmContent
      if(chart.bpm.min != chart.bpm.max) {
        bpmContent = <span className="content"><span className="bpmMin">{chart.bpm.min}</span><span className="bpmInitial">{chart.bpm.initial}</span><span className="bpmMax">{chart.bpm.max}</span></span>
      } else {
        bpmContent = <span className="content"><span className="bpmInitial">{chart.bpm.initial}</span></span>
      }
      const className = ClassNames({
        typeColor: true,
        ["typeColor" + ChartType.toCamelCaseString(ChartType.fromString(chart.chart_name))]: true
      })
      chartDetailContent = (
        <div>
          <div className={className}></div>
          <div className="mode">{this.modeString[this.state.selectedChart.mode]}</div>
          <div className="chartName">{chart.chart_name}</div>
          <div className="level">{chart.level}</div>
          <div className="levelVr"></div>
          <div className="gaugeType">
            <div className="selected">{this.gaugeString[this.state.gaugeType] + " Gauge"}</div>
            <div className="buttonContainer">
              {[GaugeType.EASY, GaugeType.NORMAL, GaugeType.SURVIVAL, GaugeType.DANGER].map((e, i) => {
                const className = ClassNames({
                  button: true,
                  ["button" + this.gaugeString[e]]: true,
                  buttonActive: this.state.gaugeType == e
                })
                return (
                  <div className={className} key={i} onClick={() => this.setState({gaugeType: e})}></div>
                )
              })}
            </div>
          </div>
          <div className="bpmNotes"><span className="prefix">BPM:</span>{bpmContent}<span className="prefix">Notes:</span><span className="content">{chart.notes}</span></div>
          <div id="playButton" onClick={(e) => this.play()}><i className="fa fa-play"></i></div>
        </div>
      )
    } else {
      chartDetailContent = null
    }

    let localMusicListContent = this.props.app.localMusicList.map((e, i) => {
      return (
        <div className="musicContainer" key={i} onClick={(e) => this.selectMusic("local", i)}>
          <div className="title">
            {e.title}
            { (() => { if(e.subtitle && e.subtitle != "") return <span className="subtitle">{e.subtitle}</span> })() }
          </div>
          <div className="artist">{e.artist}</div>
        </div>
      )
    })
    let musicListContent = this.props.app.musicList.map((e, i) => {
      return (
        <div className="musicContainer" key={i} onClick={(e) => this.selectMusic("default", i)}>
          <div className="title">
            {e.title}
            { (() => { if(e.subtitle && e.subtitle != "") return <span className="subtitle">{e.subtitle}</span> })() }
          </div>
          <div className="artist">{e.artist}</div>
        </div>
      )
    })

    let compatibilityWarningContent
    if(this.state.showCompatibilityWarning) {
      compatibilityWarningContent = (
        <div id="compatibilityWarning">
          {this.props.app.compatibilityWarning.map((e, i) => {
            return <div className="message" key={i}>{e}</div>
          })}
          <div className="button" onClick={(e) => this.closeCompatibilityWarning()}>Close</div>
        </div>
      )
    } else {
      compatibilityWarningContent = null
    }

    let keyConfigContent = (
      <div>
        <div className="background" onClick={() => this.hideKeyConfig()}></div>
        <KeyConfig preference={this.props.app.preference} onClose={() => this.hideKeyConfig()}/>
      </div>
    )

    const chartDetailClassName = ClassNames({
      chartDetailInvisible: (this.state.selectedChart.element == null),
      chartDetailVisible: (this.state.selectedChart.element != null)
    })

    return (
      <div>
        <div id="musicDetail">{musicDetailContent}</div>
        <div id="chartDetail" className={chartDetailClassName}>{chartDetailContent}</div>
        <div id="musicListContainer">
          <div id="localMusicList">{localMusicListContent}</div>
          <div id="musicList">{musicListContent}</div>
        </div>
        <div id="keyConfig" style={{display: this.state.showKeyConfig ? "block" : "none"}}>{keyConfigContent}</div>
        <div id="drop" style={{display: this.state.showDropScreen ? "block" : "none"}}
          onClick={this.dropOnClick}
          onDragEnter={this.dropOnDragEnter}
          onDragLeave={this.dropOnDragLeave}
          onDragOver={this.dropOnDragOver}
          onDrop={this.dropOnDrop}></div>
        {compatibilityWarningContent}
        <div id="footer">
          <span className="item">Version {this.props.app.version}</span>
          <span className="itemButton" onClick={() => this.showKeyConfig()}>Keyconfig</span>
          <span className="spacer"></span>
          <a className="itemButton" href="https://twitter.com/circular_rhythm" target="_blank">Twitter</a>
          <a className="itemButton" href="https://github.com/CircularRhythm/CircularRhythm" target="_blank">Github</a>
        </div>
      </div>
    )
  },
  componentWillMount() {
    style.use()
  },
  componentDidMount() {
    document.addEventListener("dragenter", this.bodyOnDragEnter)
  },
  componentWillUnmount() {
    style.unuse()
    document.removeEventListener("dragenter", this.bodyOnDragEnter)
  }
})
