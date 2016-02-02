import React from "react"
import style from "./result.sass"
import ScreenGame from "./game"
import ScreenMenu from "./menu"
import ClassNames from "classnames"
import DropdownMenu from "react-dd-menu"
import { Rank } from "../player/rank"
import { AnalyzerRenderer } from "../player/renderer/analyzer-renderer"
import GaugeType from "../player/gauge-type"

export default React.createClass({
  modeString: {1: "Single", 2: "Double"},
  gaugeString: {
    [GaugeType.NORMAL]: "Normal",
    [GaugeType.EASY]: "Easy",
    [GaugeType.SURVIVAL]: "Survival",
    [GaugeType.DANGER]: "Danger"
  },
  getClearString(dead) {
    if(dead) return "Failed"
    else return "Cleared"
  },
  getInitialState() {
    return {
      showRetryMenu: false,
      analyzerRenderer: new AnalyzerRenderer(0, 50, 880, 150)
    }
  },
  getTweetText(result) { return `I played ${result.title} [${this.modeString[result.mode]} ${result.chartName}] and got ${result.score} points in #CircularRhythm !` },
  returnToMenu() {
    this.props.manager.transit(ScreenMenu, {})
  },
  retry() {
    this.props.manager.transit(ScreenGame, {bmsonSetConfig: this.props.bmsonSetConfig})
  },
  render() {
    const result = this.props.result
    const menuOptions = {
      isOpen: this.state.showRetryMenu,
      close: () => this.closeRetryMenu(),
      toggle: <span></span>,
      align: "left",
      className: ClassNames({ "dd-menu-invisible": !this.state.showRetryMenu })
    }
    return (
      <div>
        <div id="header">
          <div id="title">{result.title}<span className="subtitle">{result.subtitle}</span></div>
          <div id="chartType">
            <span className="mode">{this.modeString[result.mode]}</span>
            <span className="chartName">{result.chartName}</span>
            <span className="level">Level {result.level}</span>
          </div>
        </div>
        <div id="clearScore">
          <div id="clear">{this.gaugeString[result.gaugeType]} Gauge {this.getClearString(result.dead)}</div>
          <div id="score">Score: {result.score}</div>
        </div>
        <div id="analyzerContainer">
          <canvas id="analyzer" width="880px" height="200px"></canvas>
        </div>
        <div id="column">
          <div id="left">
            <div className="judgeList">
              <div className="judge">
                <div className="judgeRow">
                  <span className="judgeName">Perfect</span>
                  <span className="judgeNumber">{result.judge[5]}</span>
                </div>
                <div className="judgeRow">
                  <span className="judgeName">Great</span>
                  <span className="judgeNumber">{result.judge[4]}</span>
                </div>
                <div className="judgeRow">
                  <span className="judgeName">Good</span>
                  <span className="judgeNumber">{result.judge[3]}</span>
                </div>
                <div className="judgeRow">
                  <span className="judgeName">Bad</span>
                  <span className="judgeNumber">{result.judge[2]}</span>
                </div>
                <div className="judgeRow">
                  <span className="judgeName">Miss</span>
                  <span className="judgeNumber">{result.judge[1] + result.judge[6]} ({result.judge[1]})</span>
                </div>
              </div>
              <div className="rank">
                <div className="rankHeader">Rank</div>
                <div className={ClassNames({rankContent: true, ["rankContent" + Rank.toString(result.rank)]: true})}>{Rank.toString(result.rank)}</div>
              </div>
            </div>
            <div className="maxCombo">
              <div className="judgeName">Max Combo</div>
              <div className="judgeNumber">{result.maxCombo} / {result.notes}</div>
            </div>
          </div>
          <div id="right">
            <span id="tweet">
              <a href="https://twitter.com/share" className="twitter-share-button" data-url="http://circularrhythm.github.io/" data-text={this.getTweetText(result)} data-size="large" data-count="none">Tweet</a>
            </span>
          </div>
        </div>
        <div id="footer">
          <div className="button returnToMenu" onClick={(e) => this.returnToMenu()}><i className="fa fa-arrow-left"></i></div>
          <div className="retry">
            <div className="button buttonRetry" onClick={(e) => this.retry()}><i className="fa fa-repeat"></i></div>
            <div className="button buttonRetryMenu" onClick={() => this.toggleRetryMenu()}><i className="fa fa-angle-up"></i></div>
            <DropdownMenu {...menuOptions}>
              <li onClick={(e) => this.retry()}>Retry</li>
            </DropdownMenu>
          </div>
        </div>
      </div>
    )
  },
  toggleRetryMenu() {
    this.setState({showRetryMenu: !this.state.showRetryMenu})
  },
  closeRetryMenu() {
    this.setState({showRetryMenu: false})
  },
  componentWillMount() {
    style.use()
  },
  componentDidMount() {
    if(typeof twttr === "undefined") {
      !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs)}}(document, 'script', 'twitter-wjs');
    } else {
      twttr.widgets.load()
    }

    const analyzer = this.props.result.analyzer
    const colorScheme = this.props.app.preference.renderer.colorScheme
    const analyzerElement = document.getElementById("analyzer")
    const ctx = analyzerElement.getContext("2d")
    const analyzerRenderer = this.state.analyzerRenderer
    analyzerRenderer.strokeAnalyzerComponent(ctx, analyzer.density, analyzer.densityMax, 1, colorScheme.analyzer.density)
    analyzerRenderer.fillAnalyzerComponent(ctx, analyzer.accuracy, analyzer.densityMax, colorScheme.analyzer.accuracy)
    analyzerRenderer.strokeAnalyzerComponent(ctx, analyzer.gauge, 100, 2, colorScheme.analyzer.density)
  },
  componentWillUnmount() {
    style.unuse()
  }
})
