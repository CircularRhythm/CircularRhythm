import React from "react"
import style from "./result.sass"
import ScreenGame from "./game"
import ScreenMenu from "./menu"

export default React.createClass({
  modeString: {1: "Single", 2: "Double"},
  getTweetText(result) { return `I played ${result.title} [${this.modeString[result.mode]} ${result.chartName}] and got ${result.score} points in #CircularRhythm !` },
  returnToMenu() {
    this.props.manager.transit(ScreenMenu, {})
  },
  retry() {
    this.props.manager.transit(ScreenGame, {bmsonSetConfig: this.props.bmsonSetConfig})
  },
  render() {
    const result = this.props.result
    return (
      <div>
        <div id="musicName">{result.title} [{this.modeString[result.mode]} {result.chartName}]</div>
        <div id="score">Score: {result.score}</div>
        <div id="judgeList">
          <div className="judgeRow">
            <div className="judgeName">Perfect</div>
            <div className="judgeNumber">{result.judge[5]}</div>
          </div>
          <div className="judgeRow">
            <div className="judgeName">Great</div>
            <div className="judgeNumber">{result.judge[4]}</div>
          </div>
          <div className="judgeRow">
            <div className="judgeName">Good</div>
            <div className="judgeNumber">{result.judge[3]}</div>
          </div>
          <div className="judgeRow">
            <div className="judgeName">Bad</div>
            <div className="judgeNumber">{result.judge[2]}</div>
          </div>
          <div className="judgeRow">
            <div className="judgeName">Miss</div>
            <div className="judgeNumber">{result.judge[1] + result.judge[6]} ({result.judge[1]})</div>
          </div>
          <div className="judgeRow judgeRowMaxCombo">
            <div className="judgeName">Max Combo</div>
            <div className="judgeNumber">{result.maxCombo} / {result.notes}</div>
          </div>
        </div>
        <div id="tweet">
          <a href="https://twitter.com/share" className="twitter-share-button" data-url="http://circularrhythm.github.io/" data-text={this.getTweetText(result)} data-size="large" data-count="none">Tweet</a>
          {/*<script dangerouslySetInnerHTML={{__html: `!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs)}}(document, 'script', 'twitter-wjs');`}} />*/}
        </div>
        <div id="retry" className="button" onClick={(e) => this.retry()}>Retry</div>
        <div id="returnMenu" className="button" onClick={(e) => this.returnToMenu()}>Return to menu</div>
      </div>
    )
  },
  componentWillMount() {
    style.use()
  },
  componentDidMount() {
    !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs)}}(document, 'script', 'twitter-wjs');
    //if(typeof twttr !== "undefined") twttr.widgets.load()
  },
  componentWillUnmount() {
    style.unuse()
  }
})

//if(typeof twttr !== "undefined") twttr.widgets.load()
