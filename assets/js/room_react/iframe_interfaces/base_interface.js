
import $ from 'jquery'
import playerjs from 'player.js'

export default class BaseInterface {
  constructor(listeners){
    this.enabled = false
    this.listeners = listeners
    this.playerReady = false
  
}

  // Interface API
  disable(){
    this.player = null
    this.enabled = false
    this.playerReady = false
    this.listeners.onPlayerStateUpdate({ready: false})
    $('#base-player').remove();
  }

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

    this.enabled = true
    $('#player_container').append(iframe)

    this.player = new playerjs.Player(iframe[0])
    this.player.on('ready', function(){
      console.log("Playerjs player is ready")
      this.listeners.onPlayerStateUpdate({ready: true})
      this.playerReady = true
    }.bind(this))
    this.player.on("play", function(){
      if (this.enabled) {
        this.getPosition(this.listeners.onPlayerPositionUpdate)
      }
    }.bind(this))
    this.player.on("pause", function(){
      if (this.enabled) {
        this.getPosition(this.listeners.onPlayerPositionUpdate)
      }
    }.bind(this))
    this.player.on("seeked", function(){
      if (this.enabled) {
        this.getPosition(this.listeners.onPlayerPositionUpdate)
      }
    }.bind(this))
    this.player.on("ended", function(){
      if (this.enabled) {
        this.player.
        this.listeners.onEnded()
      }
    }.bind(this))

    console.log(this.player)

  }

  matches(url){
    return true;
  }

  ready(){
    return false;
  }

  play(){
    if(this.player){
      this.player.play()
    }
  }

  pause(){
    if(this.player){
      this.player.pause()
    }
  }

  stop(){
    if(this.player){
      this.player.pause()
    }
  }

  seek(seconds){
    if(this.player && this.playerReady){
      this.player.setCurrentTime(seconds)
      this.getPosition(this.listeners.onPlayerPositionUpdate, seconds)
    }
  }

  selectIndex(index){

  }

  getPosition(callback, defaultSeconds){
    var self = this
    self.player.getDuration(function (duration) {
      self.player.getCurrentTime(function (seconds) {
        self.player.getPaused(function (isPaused) {

          let position = {
            seconds: defaultSeconds || seconds,
            duration: duration,
            playing: !isPaused,
            at: Date.now()
          }
          callback(position)
        })
      })
    })
    return
  }

  rewriteToEmbedURL(url){
    if(url.host == "www.twitch.tv"){
      let channel = url.pathname.substring(1)
      return "https://player.twitch.tv/?channel=" + channel
    }if(url.host == "mixer.com"){
      let channel = url.pathname.substring(1)
      return "https://mixer.com/embed/player/" + channel + "?disableLowLatency=1"
    }else if(url.host == "streamable.com"){
      return "https://streamable.com/o" + url.pathname
    }else{
      return url.href
    }
  }
}