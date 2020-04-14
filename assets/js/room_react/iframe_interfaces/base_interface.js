
import $ from 'jquery'

export default class BaseInterface {
  constructor(url, listeners){
    var self = this;
    self.listeners = listeners
    
    self.enable(url, listeners)
  
}

  // Interface API
  disable(){
    var self = this;
    $('#base-player').remove();
  }

  play(){}
  pause(){}
  seek(){}

  enable(url){
    var self = this;
    console.log("Enable video with url " + url.href)
    self.url = url;
    self.listeners.onPlayerStateUpdate({ready: false})

    var iframe = $(document.createElement('iframe'));
    iframe.attr("src", url.href)
    iframe.attr("id", "base-player")
    iframe.attr("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture")
    iframe.attr("allowfullscreen", "")
    iframe.attr("frameborder", "0")
    $('#player_container').append(iframe)
  }

  updatePosition(position){}

  ready(){
    return false;
  }
}