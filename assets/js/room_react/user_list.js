import React from "react";
import Tippy from '@tippyjs/react';

export default class UserList extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      minimized: false
    }
  }

  componentDidMount(){

    this.kickUser = this.kickUser.bind(this)
  }

  kickUser(userID){
    this.props.channel.push("user:kick", {user_id: userID})
  }

  render(){
    let users = []
    let anonymous_user_count = 0;
    let registered_user_count = 0;
    let userSet = new Set();
    for(const id in this.props.connections){
      if(this.props.connections[id].user_id){
        if(!userSet.has(this.props.connections[id].user_id)){
          let classes = "user_item"
          if(this.props.connections[id].user_id == this.props.remoteHolderUserID){
            classes = classes + " user_item--has_remote"
          }
          users.push(
            <Tippy
              trigger="click"
              interactive
              placement="bottom"
              content={(
                <div className="dropdown">
                  <img className="avatar-lg" src={"/avatar/" + this.props.connections[id].avatar} />
                  { this.props.ownsRoom &&
                    <div className="dropdown__item btn-flat" onClick={() => {this.kickUser(this.props.connections[id].user_id)}}>
                      Kick User
                    </div>
                  }
                </div>
              )}
            >
              <div className={classes} key={this.props.connections[id].user_id}>
                <div className="user_item__avatar">
                  <img src={"/avatar/" + this.props.connections[id].avatar} />
                </div>
                <div className="user_item__name">
                <span>{this.props.connections[id].name}</span>
                </div>
              </div>
            </Tippy>
          )
          registered_user_count++;
        }
        userSet.add(this.props.connections[id].user_id)
      }else{
        anonymous_user_count++;
      }
    }
    let wrapperClass= "users"
    if(this.state.minimized){
      wrapperClass += " users--minimized"
    }
    return (
      <div className={wrapperClass}>
        <h3>Users</h3>
        <div className="users__list">
        {users}
        </div>
        <div className="users__count"> 
             {registered_user_count} users, {anonymous_user_count} anonymous
          </div>
      </div>
    );
  }

}