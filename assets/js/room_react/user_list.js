import React from "react";
import Tippy from '@tippyjs/react';

export default class UserList extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      
    }
  }

  componentDidMount(){

    this.kickUser = this.kickUser.bind(this)
  }

  kickUser(userID){
    this.props.channel.push("user:kick", {user_id: userID})
  }

  render(){
    console.log("Updating user list")
    console.log(this.props)
    let users = []
    let anonymous_user_count = 0;
    let registered_user_count = 0;
    let userSet = new Set();
    for(const id in this.props.connections){
      if(this.props.connections[id].user_id){
        if(!userSet.has(this.props.connections[id].user_id)){
          users.push((
            <div className="user_item" key={this.props.connections[id].user_id}>
              <div className="user_item__avatar"><img src={"/avatar/" + this.props.connections[id].avatar} /></div>
              <div className="user_item__name">
              <Tippy
                trigger="click"
                interactive
                placement="bottom"
                content={(
                  <div class="dropdown">
                    <div className="dropdown__item">
                      <a href={"/user/" + this.props.connections[id].name}>Profile</a>
                    </div>
                    { this.props.ownsRoom &&
                      <div className="dropdown__item btn-flat" onClick={() => {this.kickUser(this.props.connections[id].user_id)}}>
                        Kick User
                      </div>
                    }
                  </div>
                )}
              >
                <span>{this.props.connections[id].name}</span>
              </Tippy>
           </div>
           </div>
          ))
          registered_user_count++;
        }
        userSet.add(this.props.connections[id].user_id)
      }else{
        anonymous_user_count++;
      }
    }
    return (
      <div className="users">
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