import React from "react";
import YoutubeInterface from "./interfaces/youtube_interface.js"
import BaseInterface from "./interfaces/base_interface.js"

const youtubeRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;

export default class Player extends React.Component{
  constructor(props){
    super(props)
  }
  render(){
    let player = null;
    console.log(this.props)
    if(true || !this.props.link){
      return <div className="video__player" />
    }
    if(this.props.link.match(youtubeRegex)){
      player = <YoutubeInterface link={this.props.link} />
    }else{
      player = <BaseInterface link={this.props.link} />
    }
    return player;
  }

}