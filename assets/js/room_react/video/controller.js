import React from "react";
import {
  Tooltip,
} from 'react-tippy';

export default class Controller extends React.Component{

  constructor(props){
    super(props)

    this.state = {
      percent: 0
    }

    this.updatePercent = this.updatePercent.bind(this)
    this.onClickProgressBar = this.onClickProgressBar.bind(this)
    this.updatePositionInterval = setInterval(this.updatePercent,1000)
  }

  updatePercent(){
    this.setState({
      percent: 1
    })
  }

  calculatePercent(position){
    let time = 0;
    if(position.playing){
      time = Math.min(position.seconds + (Date.now() - position.at)/1000, position.duration-1);
    }else{
      time =  Math.min(position.seconds, position.duration-1)
    }
    return (time/position.duration)*100
  }

  onClickProgressBar(e){
    var rect = e.target.getBoundingClientRect();

    let percent = (e.clientX-rect.left)/e.currentTarget.offsetWidth
    let res = percent*this.props.clientPosition.duration
    this.props.seek(res)
  }

  render(){
    let remoteBtnClassName = "controller_remote btn";
    if(this.props.hasRemote){
      remoteBtnClassName += " btn-highlighted-orange"
    }

    let liveBtnClassName = "controller_live btn";
    if(this.props.live || this.props.hasRemote){
      liveBtnClassName += " btn-highlighted-red"
    }

    return (
    <div className="controller">
      <div className="controller__progress" onClick={this.onClickProgressBar}>
        <div className="controller__progress-bar" style={{width: this.calculatePercent(this.props.clientPosition) + "%"}}></div>
      </div>
      <div className="controller__buttons">
        <button className="controller__previous btn" onClick={this.props.previousLink}>
          <span className="oi" data-glyph="media-skip-backward" title="previous" aria-hidden="true"></span>
        </button>
        <button className="controller__play btn" disabled={!this.props.playerReady} onClick={this.props.togglePlay}>
          <span className="oi" data-glyph={this.props.clientPosition.playing ? "media-pause" : "media-play"} title="play/pause" aria-hidden="true"></span>
        </button>
        <button className="controller__next btn" onClick={this.props.nextLink}>
          <span className="oi" data-glyph="media-skip-forward" title="next" aria-hidden="true"></span>
        </button>

        <button className={remoteBtnClassName} disabled={!this.props.remoteAvailable} onClick={this.props.toggleRemote}>
          R
        </button>
        <button className={liveBtnClassName} onClick={this.props.setLive}>
          <span className="oi" data-glyph="media-record" title="Set Live" aria-hidden="true"></span>
        </button>
        <Tooltip
          trigger="click"
          interactive
          position="bottom"
          disabled={!this.props.hasRemote}
          html={(
            <NewLinkForm onEnter={this.props.enqueueLink} />
          )}
        >
          <button className="controller__add btn" disabled={!this.props.hasRemote}>
            <span className="oi" data-glyph="plus" title="Add Link" aria-hidden="true"></span>
          </button>
        </Tooltip>
        <button className="controller__settings btn">
          <span className="oi" data-glyph="cog" title="Room Settings" aria-hidden="true"></span>
        </button>
      </div>
    </div>
    );
  }

}

class NewLinkForm extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      value: ""
    }
    this.handleChange = this.handleChange.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
  }

  handleChange(event){
    this.setState({value: event.target.value})
  }

  onKeyDown(e){
    console.log(e)
    if (e.key === 'Enter') {
      this.props.onEnter(this.state.value)
      this.setState({value: ''})
    }
  }

  render(){
    return (
      <input type="text" 
        placeholder="Enter a link"
        value={this.state.value}
        onChange={this.handleChange}
        onKeyDown={this.onKeyDown}
      />
    )
  }
}