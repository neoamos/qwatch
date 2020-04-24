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
    this.updatePositionInterval = setInterval(this.updatePercent,20)
  }

  updatePercent(){
    this.setState({
      percent: 1
    })
  }

  calculatePercent(position){
    let time = 0;
    if(position.duration == null){
      return 0;
    }
    if(position.playing){
      time = Math.min(position.seconds + (Date.now() - position.at)/1000, position.duration);
    }else{
      time =  Math.min(position.seconds, position.duration)
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
    let remoteBtnClassName = "controller__remote";
    if(this.props.hasRemote){
      remoteBtnClassName += " controller__remote--has"
    }

    let liveBtnClassName = "controller__live btn";
    if(this.props.live || this.props.hasRemote){
      liveBtnClassName += " btn-highlighted-red"
    }

    return (
    <div className="controller">
      <div className="controller__progress" onClick={this.onClickProgressBar}>
        <div className="controller__progress-bar" style={{width: this.calculatePercent(this.props.clientPosition) + "%"}}></div>
      </div>
      <div className="controller__buttons">
        <button className="controller__previous btn" onClick={this.props.previousLink} data-tippy-content='Previous' data-tippy-arrow='true' data-tippy-placement="top">
          <span className="oi" data-glyph="media-step-backward" title="previous" aria-hidden="true"></span>
        </button>
        <button className="controller__play btn" disabled={!this.props.playerReady} onClick={this.props.togglePlay} data-tippy-content='Pause' data-tippy-arrow='true' data-tippy-placement="top">
          <span className="oi" data-glyph={this.props.clientPosition.playing ? "media-pause" : "media-play"} title="play/pause" aria-hidden="true"></span>
        </button>
        <button className="controller__next btn" onClick={this.props.nextLink} data-tippy-content='Next' data-tippy-arrow='true' data-tippy-placement="top">
          <span className="oi" data-glyph="media-step-forward" title="next" aria-hidden="true"></span>
        </button>

        <button className={remoteBtnClassName} disabled={!this.props.hasRemote && !this.props.remoteAvailable} onClick={this.props.toggleRemote}  data-tippy-content='Take control' data-tippy-arrow='true' data-tippy-placement="top">
          <svg version="1.1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 1000 1000" enableBackground="new 0 0 1000 1000" width="25" height="25">
          <metadata> Svg Vector Icons : http://www.onlinewebfonts.com/icon </metadata>
          <g><g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"><path d="M7300.3,5008c-88.1-38.3-118.8-80.5-128.4-164.7c-9.6-76.6-3.8-92,46-143.7c42.1-40.2,82.4-59.4,151.3-67.1c542.1-67,977-293.1,1411.9-729.9C9193,3487,9449.7,2990.8,9512.9,2487c24.9-183.9,183.9-262.4,314.2-153.3c78.5,65.1,90,145.6,51.7,348.6c-151.3,833.3-812.2,1685.8-1624.5,2093.8C7921,4942.9,7426.7,5063.6,7300.3,5008z"/><path d="M5643.2,3839.4c-118.8-7.7-302.7-74.7-400.4-143.7c-47.9-34.5-1189.6-1170.5-2538.3-2524.9C16.9-1530.2,162.5-1371.2,112.7-1658.5c-17.2-103.5-17.2-162.8,1.9-266.3c49.8-277.8,9.6-231.8,1310.3-1532.5c971.2-973.2,1210.7-1203,1304.6-1254.8c114.9-61.3,120.7-63.2,365.9-63.2c427.2,0,124.5-262.5,2971.2,2580.4C7773.5-490,8539.7,287.8,8583.8,360.6c178.2,295,185.8,649.4,17.2,919.5c-78.5,124.5-2316.1,2362-2440.6,2438.6C6016.8,3810.7,5827.1,3854.8,5643.2,3839.4z M5901.9,3412.2c65.1-28.7,352.5-304.6,1218.4-1172.4c624.5-624.5,1149.4-1164.7,1168.6-1201.1c53.7-101.5,47.9-310.3-9.6-421.4C8212.1,485.1,3436.4-4290.7,3308-4353.9c-120.7-61.3-287.4-65.1-390.8-11.5C2810-4309.8,564.8-2053.1,528.4-1965c-36.4,90-36.4,264.4,0,352.5c17.2,44.1,841,883.1,2446.3,2498c1331.4,1335.2,2444.4,2448.2,2475,2473.1C5574.3,3456.3,5756.3,3477.4,5901.9,3412.2z"/><path d="M5403.8,2262.8c-614.9-69-1149.4-526.8-1321.8-1132.2c-51.7-178.2-70.9-500-40.2-676.2c116.9-666.7,628.3-1178.1,1295-1295c176.2-30.7,498.1-11.5,676.2,40.2C6626-626,7076.2-93.4,7145.1,536.8C7254.3,1536.8,6407.6,2375.9,5403.8,2262.8z M5945.9,1826.1c191.6-67.1,342.9-160.9,473.2-289.3c358.2-358.2,444.4-906.1,216.5-1362c-78.5-157.1-249-348.6-404.2-450.2c-59.4-40.2-182-97.7-272-128.3c-134.1-47.9-195.4-57.5-344.8-57.5c-222.2-1.9-344.8,24.9-553.6,124.5c-224.1,107.3-408,291.2-515.3,515.3C4445.9,387.4,4419.1,510,4421,732.2c1.9,517.2,360.1,973.2,871.6,1111.1C5474.7,1893.1,5779.2,1885.5,5945.9,1826.1z"/><path d="M5442.1,1065.5c-149.4-65.1-235.6-191.6-237.5-352.5c-3.8-362.1,434.9-532.6,672.4-260.5c76.6,86.2,107.3,183.9,97.7,302.7C5949.7,1004.3,5672,1165.2,5442.1,1065.5z"/><path d="M2947.9-292.7c-122.6-30.6-205-97.7-256.7-208.8c-59.4-126.4-57.5-210.7,3.8-335.2c69-136,164.8-199.2,321.8-208.8c490.4-28.7,569,672.4,86.2,762.4C3064.7-275.4,2995.8-279.2,2947.9-292.7z"/><path d="M1879-1302.2c-243.3-130.3-279.7-459.8-72.8-636c254.8-218.4,647.5-32.6,647.5,304.6c0,93.9-86.2,247.1-174.3,308.4C2166.3-1248.6,1999.6-1239,1879-1302.2z"/><path d="M4072.4-1478.4c-164.8-70.9-251-220.3-235.6-402.3c11.5-143.7,78.5-241.4,208.8-306.5c124.5-61.3,208.8-63.2,335.2-3.8c304.6,141.8,295,580.4-15.3,710.7C4279.3-1445.9,4150.9-1444,4072.4-1478.4z"/><path d="M3114.6-2451.6c-262.5-91.9-350.6-413.8-170.5-624.5c176.2-206.9,505.7-170.5,636,72.8c63.2,120.7,53.6,287.4-23,400.4C3461.3-2465,3267.8-2398,3114.6-2451.6z"/><path d="M7221.8,3780.1c-74.7-74.7-76.6-180.1-7.7-256.7c26.8-28.7,55.6-51.7,63.2-51.7c7.7,0,72.8-13.4,143.7-28.7c425.3-90,819.9-488.5,906.1-913.8c34.5-168.6,99.6-245.2,210.7-245.2c80.5,0,178.2,84.3,182,157.1c7.7,147.5-28.7,296.9-116.8,486.6c-160.9,348.6-444.4,632.2-793.1,793.1c-182,84.3-298.8,114.9-432.9,114.9C7292.6,3835.6,7269.7,3826,7221.8,3780.1z"/></g></g>
          </svg>
        </button>
        <button className={liveBtnClassName} onClick={this.props.setLive} data-tippy-content='Go live' data-tippy-arrow='true' data-tippy-placement="top">
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
          <button className="controller__add btn" disabled={!this.props.hasRemote} data-tippy-content='Add link' data-tippy-arrow='true' data-tippy-placement="top">
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
          <div className="dropdown__item btn-flat" onClick={this.props.closeRoom} key="close">
            Close Room
          </div>,
          <a className="dropdown__item btn-flat" href={"/room/edit/" + this.props.roomName} key="edit">
            Edit Room
          </a>
          ]
        }
      </div>
    )
  }
}