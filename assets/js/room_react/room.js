import React from "react";

import Video from "./video.js"
import Chat from "./chat.js"
import UserList from "./user_list.js"

export default class RoomReact extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      connections: {}
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
  }

  render(){
    return (
      <div className="room">
        <Video channel={this.video_channel} name={this.props.name} userID={this.props.userID} />
        <Chat channel={this.chat_channel} name={this.props.name} userID={this.props.userID}/>
        <UserList 
          connections={this.state.connections}
          name={this.props.name} />
      </div>
    );
  }

}