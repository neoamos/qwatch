import $ from 'jquery'

import YoutubeInterface from './iframe_interfaces/youtube_interface.js';
import DirectVideoInterface from './iframe_interfaces/direct_video_interface.js'
import BaseInterface from './iframe_interfaces/base_interface.js';

export default class Player {
  constructor(listeners){
    var self = this;

    self.listeners = listeners;
    self.url = null;
    self.interface = null;
    self.interfaces = [
      new YoutubeInterface(listeners),
      new DirectVideoInterface(listeners),
      new BaseInterface(listeners)
    ];

  }

  updateLink(link, initialPosition){
    console.log("Updating link: " + link)
    var self = this;
    initialPosition = initialPosition || {}
    try{
      self.url = new URL(link);
    }catch(e){
      console.log(e)
      return
    }

    if(self.interface){
      self.interface.disable()
    }

    for(let i = 0; i < self.interfaces.length; i++){
      if(self.interfaces[i].matches(self.url)){
        self.interface = self.interfaces[i]
        self.interfaces[i].enable(self.url, initialPosition)
        break
      }
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
    var self = this;
    console.log("Player updating position")
    console.log(position)
    if(self.interface){
      if(self.calculateCurrentTime(position) < position.duration){
        if(position.index){
          self.interface.selectIndex(position.index)
        }
        if(position.playing){
          self.interface.play()
        }else{
          self.interface.pause()
        }
        self.interface.seek(self.calculateCurrentTime(position))
      }else{
        self.interface.stop()
      }
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

  calculateCurrentTime(position){
    if(position.playing){
      return position.seconds + (Date.now() - position.at)/1000;
    }else{
      return position.seconds
    }
  }
}