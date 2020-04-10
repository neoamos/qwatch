import React from "react";

import Video from "./video.js"
import Chat from "./chat.js"
import UserList from "./user_list.js"
import {Presence} from "phoenix"

export default class RoomReact extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      connections: {},
      title: null,
      description: null,
      ownerID: null,
      ownsRoom: false
    }

    this.chat_channel = this.props.socket.channel("chat:" + props.name, {})
    this.video_channel = this.props.socket.channel("room:" + props.name, {})
    this.user_status_channel = this.props.socket.channel("status:" + props.name, {})

    let presence = new Presence(this.chat_channel)

    presence.onSync(() => this.updateOnlineUsers(presence))

    this.chat_channel.on("user:kick", function(payload) {
      if(payload.user_id == this.props.userID){
        window.location.href = "/?message=You have been kicked from the room";
      }
    }.bind(this))



    this.updateRoomMetadata = this.updateRoomMetadata.bind(this)
  }

  updateRoomMetadata(update){
    this.setState(state => {
      let ownerID = update.ownerID || state.ownerID
      let ownsRoom = false;
      if(this.props.userID && (ownerID == this.props.userID)){
        ownsRoom = true;
      }
      return {
        title: update.title || state.title,
        description: update.description || state.description,
        ownerID: ownerID,
        ownsRoom: ownsRoom
      }
    })
  }

  updateOnlineUsers(presence){
    console.log(presence)
    let connections = {}
    presence.list((id, {metas: [ ...rest]}) => {
      connections[id] = rest[0]
    })

    this.setState({
      connections: connections
    })
  }

  render(){
    return (
      <div className="room">
        <Video 
          channel={this.video_channel} 
          name={this.props.name} 
          userID={this.props.userID}
          ownsRoom={this.state.ownsRoom}
          updateRoomMetadata={this.updateRoomMetadata} />
        <Chat 
          channel={this.chat_channel} 
          name={this.props.name} 
          userID={this.props.userID}
          ownsRoom={this.state.ownsRoom}
          signedIn={!!this.props.userID} />
        <UserList 
          channel={this.chat_channel}
          connections={this.state.connections}
          name={this.props.name}
          userID={this.props.userID}
          ownsRoom={this.state.ownsRoom}
          kickUser={this.kickUser} />
      </div>
    );
  }

}