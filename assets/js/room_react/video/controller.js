import React from "react";
import Tippy from '@tippyjs/react';

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
        <button className="controller__previous btn" onClick={this.props.previousLink} data-tippy-content='previous' data-tippy-arrow='true' data-tippy-placement="top">
          <span className="oi" data-glyph="media-step-backward" title="previous" aria-hidden="true"></span>
        </button>
        <button className="controller__play btn" disabled={!this.props.playerReady} onClick={this.props.togglePlay} data-tippy-content='pause' data-tippy-arrow='true' data-tippy-placement="top">
          <span className="oi" data-glyph={this.props.clientPosition.playing ? "media-pause" : "media-play"} title="play/pause" aria-hidden="true"></span>
        </button>
        <button className="controller__next btn" onClick={this.props.nextLink} data-tippy-content='next' data-tippy-arrow='true' data-tippy-placement="top">
          <span className="oi" data-glyph="media-step-forward" title="next" aria-hidden="true"></span>
        </button>

        <button className={remoteBtnClassName} disabled={!this.props.hasRemote && !this.props.remoteAvailable} onClick={this.props.toggleRemote}  data-tippy-content='Take Control' data-tippy-arrow='true' data-tippy-placement="top">
         <img src="/images/remote.svg"></img>
        </button>
        <button className={liveBtnClassName} onClick={this.props.setLive} data-tippy-content='go live' data-tippy-arrow='true' data-tippy-placement="top">
          <span className="oi" data-glyph="media-record" title="Set Live" aria-hidden="true"></span>
        </button>
        <Tippy
          trigger="click"
          interactive
          placement="bottom"
          disabled={!this.props.hasRemote}
          content={(
            <NewLinkForm onEnter={this.props.enqueueLink} />
          )}
        >
          <button className="controller__add btn" disabled={!this.props.hasRemote} data-tippy-content='add link' data-tippy-arrow='true' data-tippy-placement="top">
            <span className="oi" data-glyph="plus" title="Add Link" aria-hidden="true"></span>
          </button>
        </Tippy>
        <Tippy
          trigger="click"
          interactive
          placement="bottom" 
          content={(
            <SettingsMenu 
            closeRoom={this.props.closeRoom} 
            setAutoplay={this.props.setAutoplay} 
            ownsRoom={this.props.ownsRoom} 
            roomName={this.props.roomName} />
          )}
        >
          <button className="controller__settings btn">
            <span className="oi" data-glyph="ellipses" title="Room Settings" aria-hidden="true"></span>
          </button>
        </Tippy>
      </div>
    </div>
    );
  }

}

class NewLinkForm extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      value: "",
      message: null
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
      if(this.isValidUrl(this.state.value)){
        this.props.onEnter(this.state.value)
        this.setState({
          value: "",
          message: ""
        })
      }else{
        this.setState({
          message: "Not a valid URL"
        })
      }
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
    } catch (_) {
      return false;  
    }
  
    return true;
  }

  render(){
    return (
      <div>
        <input type="text" 
          placeholder="Enter a link"
          value={this.state.value}
          onChange={this.handleChange}
          onKeyDown={this.onKeyDown}
        />
        <div style={{"marginTop": "5px"}}>
          {this.state.message}
        </div>
      </div>
    )
  }
}

class SettingsMenu extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      autoplay: true
    }
    this.handleAutoplay = this.handleAutoplay.bind(this)
  }

  handleAutoplay(e){
    this.setState({
      autoplay: e.target.checked
    })
    this.props.setAutoplay(e.target.checked)
  }

  render(){

    return (
      <div>
        <div className="dropdown__item btn-flat">
          <label htmlFor="autoplay" className="dropdown__label">Autoplay</label>
          <input 
            id="autoplay" 
            className="dropdown__input switch" 
            type="checkbox" 
            checked={this.state.autoplay}
            onChange={this.handleAutoplay} />
        </div>
        {this.props.ownsRoom &&
          [
          <div className="dropdown__item btn-flat" onClick={this.props.closeRoom}>
            Close Room
          </div>,
          <a className="dropdown__item btn-flat" href={"/room/edit/" + this.props.roomName}>
            Edit Room
          </a>
          ]
        }
      </div>
    )
  }
}