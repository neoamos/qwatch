
import $ from 'jquery'

export default class DirectVideoInterface {
  constructor(listeners){
    this.listeners = listeners
    this.enabled = false
  
    this.disable = this.disable.bind(this)
    this.play = this.play.bind(this)
    this.pause = this.pause.bind(this)
    this.seek = this.seek.bind(this)
    this.enable = this.enable.bind(this)
    this.matches = this.matches.bind(this)
    this.ready = this.ready.bind(this)
  }

  // Interface API
  disable(){
    $('#direct-video-player').remove();
  }

  play(){
    if(this.tag){
      this.tag.play()
    }
  }
  pause(){
    if(this.tag){
      this.tag.pause()
    }
  }
  seek(seconds){
    if(this.tag){
      this.tag.currentTime = seconds
    }
  }

  enable(url){
    console.log("Enable video with url " + url.href)
    this.url = url;
    this.enabled = true

    var tag = $(document.createElement('video'));
    this.tag = tag[0];
    tag.attr("src", url.href)
    tag.attr("id", "direct-video-player")
    tag.attr("autoplay", "true")
    tag.attr("muted", "true")
    tag.attr("controls", "true")
    $('#player_container').append(tag)

    tag.on("canplay", function(){
      this.listeners.onPlayerStateUpdate({ready: true})
    }.bind(this))
    tag.on("play", function(){
      let position = this.getPosition();
      if(this.enabled){
        this.listeners.onPlayerPositionUpdate(position)
      }
    }.bind(this))
    tag.on("pause", function(){
      let position = this.getPosition();
      if(this.enabled){
        this.listeners.onPlayerPositionUpdate(position)
      }
    }.bind(this))
    tag.on("seeked", function(){
      let position = this.getPosition();
      if(this.enabled){
        this.listeners.onPlayerPositionUpdate(position)
      }
    }.bind(this))
    tag.on("ended", function(){
      if(this.enabled){
        this.listeners.onEnded()
      }
    }.bind(this))


  }

  matches(url){
    return (
      url.pathname.endsWith(".mp4") || 
      url.pathname.endsWith(".webm")
    )
  }


  ready(){
    return false;
  }

  getPosition(){
    return {
      seconds: this.tag.currentTime,
      duration: this.tag.duration,
      playing: !this.tag.paused,
      at: Date.now()
    }
  }
}