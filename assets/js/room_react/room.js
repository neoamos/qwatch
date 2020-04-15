import React from "react";

import Chat from "./chat.js"
import UserList from "./user_list.js"
import Player from "./player.js"
import Controller from "./video/controller.js"
import Queue from "./video/queue.js"
import {Presence} from "phoenix"

export default class RoomReact extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      connections: {},
      title: null,
      description: null,
      ownerID: null,
      ownsRoom: false,
      connection_id: null,
      links: {},
      queue: [],
      suggestions: [],
      clientPlaying: {},
      serverPlaying: {},
      serverPosition: {seconds: 0, duration: 0, playing: true, at: Date.now(), link_id: null},
      clientPosition: {seconds: 0, duration: 0, playing: true, at: Date.now(), link_id: null},
      hasRemote: false,
      remoteAvailable: false,
      remoteHolderUserID: null,
      remoteHolderConnectionID: null,
      live: true,
      playerReady: false,
      initialSync: true,
      autoplay: true
    }

    this.chatChannel = this.props.socket.channel("chat:" + props.name, {})
    this.videoChannel = this.props.socket.channel("room:" + props.name, {})

    let presence = new Presence(this.chatChannel)

    presence.onSync(() => this.updateOnlineUsers(presence))

    this.chatChannel.on("user:kick", function(payload) {
      if(payload.user_id == this.props.userID){
        window.location.href = "/?message=You have been kicked from the room";
      }
    }.bind(this))

    this.syncIntervalFunc = function(){
      if(this.state.live && !this.state.hasRemote && !this.checkSynced()){
        this.synchronize()
      }
    }
    this.syncInterval = setInterval(this.syncIntervalFunc.bind(this), 1000)


    this.selectLink = this.selectLink.bind(this)
    this.nextLink = this.nextLink.bind(this)
    this.previousLink = this.previousLink.bind(this)
    this.deleteLink = this.deleteLink.bind(this)
    this.sendQueue = this.sendQueue.bind(this)
    this.toggleRemote = this.toggleRemote.bind(this)
    this.togglePlay = this.togglePlay.bind(this)
    this.seek = this.seek.bind(this)
    this.setLive = this.setLive.bind(this)
    this.onPlayerStateUpdate = this.onPlayerStateUpdate.bind(this)
    this.onPlayerPositionUpdate = this.onPlayerPositionUpdate.bind(this)
    this.enqueueLink = this.enqueueLink.bind(this)
    this.closeRoom = this.closeRoom.bind(this)
    this.scheduleAutoplay = this.scheduleAutoplay.bind(this)
    this.cancelAutoplay = this.cancelAutoplay.bind(this)
    this.setAutoplay = this.setAutoplay.bind(this)
    this.videoEnded = this.videoEnded.bind(this)
  }

  componentDidMount(){
    this.player = new Player({
      onPlayerPositionUpdate: this.onPlayerPositionUpdate,
      onPlayerStateUpdate: this.onPlayerStateUpdate,
      onEnded: this.videoEnded
    });

    this.videoChannel.on("state:update", function(payload){
      let state = payload.state
      this.updateState(state)
    }.bind(this))

    this.videoChannel.on("link:info", function(payload){
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

    this.videoChannel.on("room:close", function(){
      window.location.href = "/?message=The room has been closed";
    }.bind(this))

    this.videoChannel.join()
      .receive("ok", resp => {
        let newState = resp.state
        this.setState({
          connection_id: resp.connection_id,
          remoteHolderUserID: newState.remote_holder_user_id,
          remoteHolderConnectionID: newState.remote_holder_connection_id,
          hasRemote: (resp.connection_id == newState.remote_holder_connection_id),
          remoteAvailable: (newState.owner_id == this.props.userID || newState.remote_holder_user_id == this.props.userID),
          ownerID: newState.owner_id,
          ownsRoom: (this.props.userID == newState.owner_id),
        })
        this.updateState(newState)

      }).receive("error", resp => {
        window.location.href = "/?message=" + resp.reason;
      })
  }

  // Update functions
  updateState(newState){
    console.log("Received new state")
    console.log(newState)

    if(newState.server_position){
      this.setState({serverPosition: this.generatePosition(newState.server_position)})
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
      this.setState(state => {
        let queue = newState.link_queue.map(id => {
          return state.links[id]
        })
        return {queue: queue}
      }, () => {
        if(!this.state.clientPlaying.id && this.state.queue.length > 0 && this.state.hasRemote){
          this.selectLink(this.state.queue[0])
        }
      })

    }

    if(newState.remote_available != null){
      if(this.state.ownerID != this.props.userID){
        this.setState({remoteAvailable: (newState.remote_available || this.state.remoteHolderUserID == this.props.userID)})
      }
    }

    if(newState.remote_holder_user_id != null){
      this.setState({remoteHolderUserID: newState.remote_holder_user_id})
    }

    if(newState.remote_holder_connection_id != null){
      this.setState({remoteHolderConnectionID: newState.remote_holder_connection_id})
      if(this.state.remoteHolderConnectionID == this.state.connection_id){
        this.setState({hasRemote: true});
        if(this.state.clientPlaying.id){
          this.videoChannel.push('link:select', {link_id: this.state.clientPlaying.id})
        }
        this.sendPosition()
      }else{
        this.setState({hasRemote: false});
      }
    }

    if(newState.server_playing != undefined){
      console.log("Updating currently playing " + newState.server_playing)
      let update = this.state.queue[newState.server_playing] || {}
      this.setState(state => {
        return {
          serverPlaying: state.queue[newState.server_playing] || {}
        }
      }, () => {
        if(this.state.hasRemote){
          this.updateClientPlaying(this.state.serverPlaying)
        }
      })
    }

    if(this.state.live && !this.state.hasRemote && !this.checkSynced()){
      this.synchronize()
    }
  }

  updateOnlineUsers(presence){
    let connections = {}
    presence.list((id, {metas: [ ...rest]}) => {
      connections[id] = rest[0]
    })

    this.setState({
      connections: connections
    })
  }

  updateClientPlaying(newLink){
    let oldLink = this.state.clientPlaying
    this.setState({clientPlaying: newLink, initialSync: true}, () => {
      if(!newLink.id){
        this.player.disable()
      }else if(!oldLink || oldLink.link != newLink.link){
        this.player.updateLink(newLink.link)
      }
    })
  }

  sendPosition(){
    this.videoChannel.push("position:update", {
      position: {
        seconds: Math.trunc(this.calculateCurrentTime(this.state.clientPosition)*100)/100,
        duration: Math.trunc(this.state.clientPosition.duration*100)/100,
        playing: this.state.clientPosition.playing
      }
    })
  }

  sendQueue(queue){
    queue = queue.map(l => l.id);
    this.videoChannel.push("queue:update", {queue: queue})
  }

  selectLink(link){
    console.log("select " + link.id)
    this.cancelAutoplay()
    
    if(this.state.hasRemote){
      this.videoChannel.push('link:select', {link_id: link.id})
    }else{
      this.updateClientPlaying(link)
      this.setState({live: false})
    }
  }

  nextLink(){
    console.log("next link")
    let currId = this.state.clientPlaying.id
    let currPosition = this.state.queue.findIndex(e => {
      return currId == e.id
    })
    if(currPosition != -1 && this.state.queue[currPosition+1]){
      this.selectLink(this.state.queue[currPosition+1])
    }
  }

  previousLink(){
    console.log("next link")
    let currId = this.state.clientPlaying.id
    let currPosition = this.state.queue.findIndex(e => {
      return currId == e.id
    })
    if(currPosition != -1 && this.state.queue[currPosition-1]){
      this.selectLink(this.state.queue[currPosition-1])
    }
  }

  deleteLink(link){
    if(this.state.hasRemote){
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

  toggleRemote(){
    if(this.state.hasRemote){
      this.videoChannel.push('remote:drop', {})
      this.setState({live: true})
    }else{
      this.videoChannel.push('remote:request', {})
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
    if(this.state.clientPlaying.id != this.state.serverPlaying.id){
      console.log("changing link")
      this.updateClientPlaying(this.state.serverPlaying)
    }else{
      console.log("updating position")
      if(this.state.serverPosition.link_id && this.state.serverPosition.link_id == this.state.clientPlaying.id){
        this.player.updatePosition(this.state.serverPosition)
        this.setState({clientPosition: this.state.serverPosition})
      }
    }
  }

  checkSynced(){
    if(this.state.clientPlaying.id == this.state.serverPlaying.id){
      if(Math.abs(this.calculateCurrentTime(this.state.clientPosition) - this.calculateCurrentTime(this.state.serverPosition)) > 1
         || this.state.serverPosition.playing != this.state.clientPosition.playing){
        return false;
      }else{
        return true
      }
    }else{
      return false;
    }
  }

  togglePlay(){
    if(!this.state.hasRemote){
      this.setState({live: false})
    }
    if(this.state.clientPosition.playing){
      console.log("Pausing")
      this.player.pause()
    }else{
      console.log("Playing")
      this.player.play()
    }
  }

  seek(seconds){
    if(!this.state.hasRemote){
      this.setState({live: false})
    }
    this.setState(state => {
      return {
        clientPosition: {
          seconds: seconds, 
          duration: state.clientPosition.duration, 
          playing: state.clientPosition.playing, 
          at: Date.now(), 
          link_id: state.clientPosition.link_id
        }
      }
    })
    this.player.seek(seconds)
  }

  calculateCurrentTime(position){
    if(position.playing){
      return Math.min(position.seconds + (Date.now() - position.at)/1000, position.duration-1);
    }else{
      return Math.min(position.seconds, position.duration-1)
    }
  }

  generatePosition(position){
    return {
      seconds: position.seconds,
      duration: position.duration,
      playing: position.playing,
      at: Date.now(),
      link_id: position.link_id
    }
  }

  onPlayerPositionUpdate(position){
    console.log("Player update: " + position.seconds + "s of " + position.duration + "s. Playing: " + position.playing)
    this.cancelAutoplay()

    this.setState({
      clientPosition:{
        seconds: position.seconds,
        duration: position.duration,
        playing: position.playing,
        at: position.at,
        stale: false
      }
    })
    if(this.state.hasRemote){
      this.sendPosition()
    }
  }

  onPlayerStateUpdate(state){
    console.log("Received player state")
    if(state.ready){
      this.setState({playerReady: true})
      if(this.state.initialSync){
        this.setState({initialSync: false})
        if(this.state.live){
          this.synchronize()
        }
      }
    }else{
      this.setState({playerReady: false})
    }
  }

  videoEnded(){
    if(this.state.autoplay && (!this.state.live || this.state.hasRemote)){
      this.scheduleAutoplay()
    }
  }

  enqueueLink(link){
    if(this.state.hasRemote){
      this.videoChannel.push('link:enqueue', { link: link })
    }
  }

  closeRoom(){
    this.videoChannel.push("room:close", {})
  }

  setAutoplay(value){
    if(value==false){
      this.cancelAutoplay()
    }
    this.setState({
      autoplay: value
    })
  }

  scheduleAutoplay(){
    this.autoplayTimeout = setTimeout(this.nextLink, 5000)
  }

  cancelAutoplay(){
    if(this.autoplayTimeout){
      clearTimeout(this.autoplayTimeout)
      this.autoplayTimeout = null;
    }
  }

  render(){
    return (
      <div className="room">
        <div className="video">
          <div className="video__player" id="player_container" />
          <div className="video__under">
            <div className="controller__wrapper">
              <Controller 
                hasRemote={this.state.hasRemote}
                remoteAvailable={this.state.remoteAvailable}
                live={this.state.live}
                playerReady={this.state.playerReady}
                clientPosition={this.state.clientPosition}
                serverPosition={this.state.serverPosition}
                toggleRemote={this.toggleRemote}
                setLive={this.setLive}
                togglePlay={this.togglePlay}
                seek={this.seek}
                enqueueLink={this.enqueueLink}
                nextLink={this.nextLink}
                previousLink={this.previousLink}
                ownsRoom={this.state.ownerID==this.props.userID}
                closeRoom={this.closeRoom}
                setAutoplay={this.setAutoplay}
                roomName={this.props.name}
              />
            </div>
            <Queue 
              items={this.state.queue} 
              clientPlaying={this.state.clientPlaying}
              serverPlaying={this.state.serverPlaying}
              selectLink={this.selectLink}
              deleteLink={this.deleteLink}
              hasRemote={this.state.hasRemote}
              />
          </div>  
        </div>
        <Chat 
          channel={this.chatChannel} 
          name={this.props.name} 
          userID={this.props.userID}
          ownsRoom={this.state.ownsRoom}
          signedIn={!!this.props.userID} />
        <UserList 
          channel={this.chatChannel}
          connections={this.state.connections}
          name={this.props.name}
          userID={this.props.userID}
          ownsRoom={this.state.ownsRoom}
          kickUser={this.kickUser}
          remoteHolderUserID={this.state.remoteHolderUserID} />
      </div>
    );
  }

}