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
    var self = this;
    self.url = new URL(link);
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