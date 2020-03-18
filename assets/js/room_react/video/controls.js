import React from "react";

export default class Controls extends React.Component{
  render(){
    return (
    <div className="video__controls">
      <div>
        <input type="textarea"></input>
        <a href="#">Remote ({this.props.remote.has_remote}, {this.props.remote.remote_available})</a>
        <a href="#">Live ({this.props.remote.live})</a>
      </div>
    </div>
    );
  }

}