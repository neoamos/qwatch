import React from "react";

import Video from "./video.js"
import Chat from "./chat.js"
import UserList from "./user_list.js"

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

    //On getting user list
    this.chat_channel.on("presence_state", function(payload) {
      console.log("Presence")
      console.log(payload)
      let connections = {}
      for(const id in payload){
        connections[id] = payload[id].metas[0]
      }
      this.setState({
          connections: connections
      })
    }.bind(this))


    // On user list update
    this.chat_channel.on("presence_diff", function(payload) {
      console.log("Presence diff")
      console.log(payload)
      let joins = payload.joins
      let leaves = payload.leaves
      this.setState(state => {
        let connections = {}
        for(const id in state.connections){
          if(!leaves[id]){
            connections[id] = state.connections[id]
          }
        }

        for(const id in joins){
          connections[id] = joins[id].metas[0]
        }
        
        return { 
          connections: connections
        }
      })
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

  render(){
    return (
      <div className="room">
        <Video 
          channel={this.video_channel} 
          name={this.props.name} 
          userID={this.props.userID}
          updateRoomMetadata={this.updateRoomMetadata} />
        <Chat 
          channel={this.chat_channel} 
          name={this.props.name} 
          userID={this.props.userID}
          ownsRoom={this.state.ownsRoom}/>
        <UserList 
          connections={this.state.connections}
          name={this.props.name}
          userID={this.props.userID}
          ownsRoom={this.state.ownsRoom} />
      </div>
    );
  }

}