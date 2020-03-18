import React from "react";

export default class UserList extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      
    }
  }

  componentDidMount(){
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
              <div class="user_item__avatar"><img src="/images/avatar.png" /></div>
              <div className="user_item__name">{this.props.connections[id].name}</div>
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
        <div>{registered_user_count} registered, {anonymous_user_count} anonymous</div>
        {users}
      </div>
    );
  }

}