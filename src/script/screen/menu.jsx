import React from "react"
import style from "./menu.sass"
import ScreenGame from "./game"
import ClassNames from "classnames"
import { LocalBmsonLoader } from "../local-bmson-loader"

// TODO: cleanup
export default React.createClass({
  modeString: {"single": "Single", "double": "Double"},
  getInitialState() {
    return {
      showDropScreen: false,
      showCompatibilityWarning: this.props.app.compatibilityWarning.length > 0,
      selectedMusic: {
        type: null,
        id: null,
        element: null
      },
      selectedChart: {
        type: null,
        id: null,
        element: null
      }
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
    if(music.local) {
      bmsonSetConfig.path = music.basedir + "/" + chart.file
      bmsonSetConfig.local = true
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

    this.props.manager.transit(ScreenGame, {bmsonSetConfig: bmsonSetConfig})
  },
  closeCompatibilityWarning() {
    this.setState({
      showCompatibilityWarning: false
    })
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
      chartDetailContent = (
        <div>
          <div className="mode">{this.modeString[this.state.selectedChart.mode]}</div>
          <div className="difficulty">{chart.chart_name}</div>
          <div className="level">Level {chart.level}</div>
          <div className="bpm">{chart.bpm.initial} BPM</div>
          <div className="notes">{chart.notes} Notes</div>
          <div id="playButton" onClick={(e) => this.play()}>Play!</div>
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
        <div id="drop" style={{display: this.state.showDropScreen ? "block" : "none"}}
          onClick={this.dropOnClick}
          onDragEnter={this.dropOnDragEnter}
          onDragLeave={this.dropOnDragLeave}
          onDragOver={this.dropOnDragOver}
          onDrop={this.dropOnDrop}></div>
        {compatibilityWarningContent}
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
    document.removeEventListener("dragenter")
  }
})
