
import $ from 'jquery'

export default class BaseInterface {
  constructor(listeners){
    var self = this;
    self.listeners = listeners
  
}

  // Interface API
  disable(){
    var self = this;
    $('#base-player').remove();
  }

  play(){}
  pause(){}
  seek(){}
  stop(){}

  enable(url){
    var self = this;
    console.log("Enable video with url " + url.href)
    self.url = url;
    self.listeners.onPlayerStateUpdate({ready: false})

    var iframe = $(document.createElement('iframe'));
    iframe.attr("src", this.rewriteToEmbedURL(url))
    iframe.attr("id", "base-player")
    iframe.attr("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture")
    iframe.attr("allowfullscreen", "")
    iframe.attr("frameborder", "0")
    $('#player_container').append(iframe)
  }

  matches(url){
    return true;
  }

  ready(){
    return false;
  }

  rewriteToEmbedURL(url){
    if(url.host == "www.twitch.tv"){
      let channel = url.pathname.substring(1)
      return "https://player.twitch.tv/?channel=" + channel
    }if(url.host == "mixer.com"){
      let channel = url.pathname.substring(1)
      return "https://mixer.com/embed/player/" + channel + "?disableLowLatency=1"
    }else{
      return url.href
    }
  }
}