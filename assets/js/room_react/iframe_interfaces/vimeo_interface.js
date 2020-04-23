
import $ from 'jquery'
import Player from '@vimeo/player'

export default class VimeoInterface {
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
    let videoId = url.pathname.substring(1)
    self.url = "https://player.vimeo.com/video/" + videoId + "?autopause=false&autoplay=true";
    self.listeners.onPlayerStateUpdate({ready: false})

    var iframe = $(document.createElement('iframe'));
    iframe.attr("src", self.url)
    iframe.attr("id", "base-player")
    iframe.attr("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture")
    iframe.attr("allowfullscreen", "")
    iframe.attr("frameborder", "0")

    this.enabled = true
    $('#player_container').append(iframe)

    this.player = new Player(iframe[0])
    this.player.on('loaded', function(){
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
        console.log("ended")
        setTimeout(this.listeners.onEnded, 400)
      }
    }.bind(this))

    console.log(this.player)

  }

  matches(url){
    return (
      url.host.includes("vimeo.com")
    )
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
    self.player.getDuration().then(function (duration) {
      self.player.getCurrentTime().then(function (seconds) {
        self.player.getPaused().then(function (isPaused) {

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

}