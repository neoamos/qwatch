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
                  {!this.state.minimized &&
                 <img className="avatar-lg" src={"/avatar/" + this.props.connections[id].avatar} />
                  }
                  { this.props.ownsRoom && !this.state.minimized &&
                    <div className="dropdown__item btn-flat" onClick={() => {this.kickUser(this.props.connections[id].user_id)}}>
                      Kick User
                    </div>
                  }
                </div>
              )}
            >
              <div className={classes} key={this.props.connections[id].user_id}>
                <div className="user_item__avatar">
                <Tippy 
                  placement="left"
                  content={this.props.connections[id].name}
                  >
                    {this.props.connections[id].avatar &&
                  <img src={"/avatar/" + this.props.connections[id].avatar} />
                  }
                  </Tippy>
                </div>
                {!this.state.minimized &&
                 [
                <div className="user_item__name">
                <span>{this.props.connections[id].name}</span>
                </div>
                ]}
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
    // if(this.state.minimized){
    //   wrapperClass += " users--minimized"
    // }
    return (
      <div className={wrapperClass} id={wrapperClass}>
      <div className="user_list_toggle">
        {[!this.state.minimized &&
        <h3>User List</h3>
        ]}
        <span className="oi" 
        data-glyph={this.state.minimized ? "people" : "minus"}
        aria-hidden="true"
        onClick={()=>{this.minimiseFunction(!this.state.minimized)}}/>
      </div>
      
        <div className="users__list">
        {users}
        </div>
        {[!this.state.minimized &&
        <div className="users__count"> 
             {registered_user_count} users, {anonymous_user_count} anonymous
          </div>
        ]}
      </div>
    );
  }
  minimiseFunction(minimize){
  var x =   document.getElementById("users");
  if(minimize){
    x.style.flex = "0 0 auto";
  }
  else{
    x.style.flex = "0 0 240px";
  }
  this.setState({minimized:!this.state.minimized});
  }
}