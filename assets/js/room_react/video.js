import React from "react";
import Player from "./player.js"
import Controls from "./video/controls.js"
import Queue from "./video/queue.js"

export default class Video extends React.Component{
  constructor(props){
    super(props)

    this.state = {
      connection_id: null,
      links: {},
      queue: [],
      suggestions: [],
      client_playing: {},
      server_playing: {},
      server_position: {seconds: 0, duration: 0, playing: true, at: Date.now(), link_id: null},
      client_position: {seconds: 0, duration: 0, playing: true, at: Date.now(), link_id: null},
      has_remote: false,
      remote_available: false,
      remote_holder_user_id: null,
      remote_holder_connection_id: null,
      live: true,
      player_ready: false,
      initial_sync: true
    }

    this.selectLink = this.selectLink.bind(this)
    this.deleteLink = this.deleteLink.bind(this)
    this.sendQueue = this.sendQueue.bind(this)
    this.toggleRemote = this.toggleRemote.bind(this)
    this.setLive = this.setLive.bind(this)
    this.updatePlayerState = this.updatePlayerState.bind(this)
    this.updatePosition = this.updatePosition.bind(this)
    this.enqueueLink = this.enqueueLink.bind(this)

    this.syncIntervalFunc = function(){
      if(this.state.live && !this.state.has_remote && !this.checkSynced()){
        this.synchronize()
      }
    }
    this.syncInterval = setInterval(this.syncIntervalFunc.bind(this), 1000)
  }

  componentDidMount(){
    this.player = new Player({
      updatePosition: this.updatePosition,
      updatePlayerState: this.updatePlayerState
    });
    this.channel = this.props.channel

    this.channel.on("state:update", function(payload){
      let state = payload.state
      this.updateState(state)
    }.bind(this))

    this.channel.on("link:info", function(payload){
      console.log("Received link info: ")
      console.log(payload)
      let link = payload.link
      this.setState((state) => {
        let target = state.links[link.id]
        target.description = link.description
        target.title = link.title
        target.image = link.image
        target.image = link.image
        target.site_name = link.site_name

        return {
          links: state.links
        }
      })
    }.bind(this))

    this.channel.join()
      .receive("ok", resp => {
        console.log(resp)
        let newState = resp.state
        this.setState({
          connection_id: resp.connection_id
        })
        this.updateState(newState)

      })
  }

  updateState(newState){
    console.log("Received new state")
    console.log(newState)

    if(newState.server_position){
      this.setState({server_position: this.generatePosition(newState.server_position)})
    }

    if(newState.links){
      this.setState(state => {
        let links = state.links
        Object.keys(newState.links).forEach(function(key) {
          links[key] = newState.links[key];
        });
        return {links: links}
      })
    }

    if(newState.link_queue){
      console.log("Updating link queue")
      console.log(newState.link_queue)
      this.setState(state => {
        let queue = newState.link_queue.map(id => {
          return state.links[id]
        })
        return {queue: queue}
      })

    }

    if(newState.remote_available != null){
      this.setState({remote_available: newState.remote_available})
    }

    if(newState.remote_holder_user_id != null){
      this.setState({remote_holder_user_id: newState.remote_holder_user_id})
    }

    if(newState.remote_holder_connection_id != null){
      this.setState({remote_holder_connection_id: newState.remote_holder_connection_id})
      if(this.state.remote_holder_connection_id == this.state.connection_id){
        this.setState({has_remote: true});
        this.channel.push('link:select', {link_id: this.state.client_playing.id})
        this.sendPosition()
      }else{
        this.setState({has_remote: false});
      }
    }

    if(newState.server_playing != null){
      console.log("Updating currently playing " + newState.server_playing)
      this.setState(state => {
        return {
          server_playing: state.queue[newState.server_playing]
        }
      })
      if(this.state.has_remote){
        this.updateClientPlaying(this.state.queue[newState.server_playing])
      }
    }

    if(this.state.live && !this.state.has_remote && !this.checkSynced()){
      this.synchronize()
    }
  }

  updateClientPlaying(newLink){
    let oldLink = this.state.client_playing
    this.setState({client_playing: newLink, initial_sync: true})
    if(oldLink.link != newLink.link){
      this.player.updateLink(newLink.link)
    }
  }

  sendPosition(){
    this.channel.push("position:update", {
      position: {
        seconds: this.calculateCurrentTime(this.state.client_position),
        duration: this.state.client_position.duration,
        playing: this.state.client_position.playing
      }
    })
  }

  // enqueueLink = (data) => {
  //   if (event.target.value.length === 0) {
  //     return;
  //   }
  //   console.log(event.target.value)
  //   self.room_channel.push('link:enqueue', { link: event.target.value })
  //   event.target.value = '';
  // }
  // next = () => {
  //   this.channel.push('link:next', {})
  // } 

  selectLink(link){
    console.log("select " + link.id)
    if(this.state.has_remote){
      this.channel.push('link:select', {link_id: link.id})
    }else{
      this.updateClientPlaying(link)
      this.setState({live: false})
    }
  }

  deleteLink(link){
    if(this.state.has_remote){
      this.setState(state => {
        let index = state.queue.indexOf(link)
        let queue = [...state.queue];
        queue.splice(index, 1)
        this.sendQueue(queue);
        return {
          queue: queue
        }
      })
    }
  }

  sendQueue(queue){
    queue = queue.map(l => l.id);
    this.channel.push("queue:update", {queue: queue})
  }

  toggleRemote(){
    if(this.state.has_remote){
      this.channel.push('remote:drop', {})
    }else{
      this.channel.push('remote:request', {})
    }
  }

  setLive(){
    if(this.state.live){
      this.setState({live: false})
    }else{
      this.setState({live: true})
      this.synchronize()
    }
  }

  synchronize(){
    if(this.state.client_playing.id != this.state.server_playing.id){
      console.log("changing link")
      this.updateClientPlaying(this.state.server_playing)
    }else{
      console.log("updating position")
      if(this.state.server_position.link_id && this.state.server_position.link_id == this.state.client_playing.id){
        this.player.updatePosition(this.state.server_position)
        this.setState({client_position: this.state.server_position})
      }
    }
  }

  checkSynced(){
    if(this.state.client_playing.id == this.state.server_playing.id){
      if(Math.abs(this.calculateCurrentTime(this.state.client_position) - this.calculateCurrentTime(this.state.server_position)) > 1
         || this.state.server_position.playing != this.state.client_position.playing){
        return false;
      }else{
        return true
      }
    }else{
      return false;
    }
  }

  calculateCurrentTime(position){
    if(position.playing){
      return Math.min(position.seconds + (Date.now() - position.at)/1000, position.duration-1);
    }else{
      return Math.min(position.seconds, position.duration-1)
    }
  }

  generatePosition(position){
    console.log(position)
    return {
      seconds: position.seconds,
      duration: position.duration,
      playing: position.playing,
      at: Date.now(),
      link_id: position.link_id
    }
  }

  updatePosition(position){
    console.log("Player update: " + position.seconds + "s of " + position.duration + "s. Playing: " + position.playing)

    this.setState({
      client_position:{
        seconds: position.seconds,
        duration: position.duration,
        playing: position.playing,
        at: position.at,
        stale: false
      }
    })
    if(this.state.has_remote){
      this.sendPosition()
    }
  }

  updatePlayerState(state){
    console.log("Received player state")
    if(state.ready){
      this.setState({player_ready: true})
      if(this.state.initial_sync){
        this.setState({initial_sync: false})
        if(this.state.live){
          this.synchronize()
        }
      }
    }else{
      this.setState({player_ready: false})
    }
  }

  enqueueLink(link){
    console.log(link)
    this.channel.push('link:enqueue', { link: link })
  }

  render(){
    return (
    <div className="video">
      <div className="video__player" id="player_container" />
      <div className="video__under">
        <div className="video__controls">
          <div>
            <a href="#" className="btn" onClick={this.toggleRemote}>Request remote (Has: {String(this.state.has_remote)}, Available: {String(this.state.remote_available)}) </a>
            <a href="#" className="btn" onClick={this.setLive}>Toggle Live ({String(this.state.live)})</a>
          </div>
          <div>
            <NewLinkForm onEnter={this.enqueueLink} />
          </div>
        </div>
        <Queue 
          items={this.state.queue} 
          clientPlaying={this.state.client_playing}
          serverPlaying={this.state.server_playing}
          selectLink={this.selectLink}
          deleteLink={this.deleteLink}
          />
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