import $ from 'jquery'

import YoutubeInterface from './iframe_interfaces/youtube_interface.js';
import BaseInterface from './iframe_interfaces/base_interface.js';

export default class Player {
  constructor(listeners){
    var self = this;

    self.listeners = listeners;
    self.url = null;
    self.interface = null;
    self.interfaces = {};

  }

  updateLink(link){
    console.log("Updating link: " + link)
    var self = this;
    try{
      self.url = new URL(link);
    }catch(e){
      console.log(e)
      return
    }
    console.log(self.url)

    if(self.interface){
      self.interface.disable()
    }

    if(self.url.host.includes("youtube.com")){
      if(self.interfaces.youtube){
        self.interfaces.youtube.enable(self.url)
      }else{
        self.interfaces.youtube = new YoutubeInterface(self.url, self.listeners)
      }
      self.interface = self.interfaces.youtube;
    }else{
      self.interface = new BaseInterface(self.url, self.listeners)
    }
  }

  disable(){
    var self = this
    if(self.interface){
      self.interface.disable();
    }
  }

  play(){
    if(this.interface){
      this.interface.play()
    }
  }

  pause(){
    if(this.interface){
      this.interface.pause()
    }
  }

  seek(seconds){
    if(this.interface){
      this.interface.seek(seconds)
    }
  }

  updatePosition(position){
    var self = this
    console.log("Player updating position")
    console.log(position)
    console.log(self.interface)
    if(self.interface){
      self.interface.updatePosition(position)
    }
  }

  ready(){
    var self = this
    if(self.interface == null){
      return false;
    }else{
      return self.interface.ready()
    }
  }
}