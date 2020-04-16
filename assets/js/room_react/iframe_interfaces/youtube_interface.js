
import $ from 'jquery'

export default class YoutubeInterface {
  constructor(listeners){
    var self = this;
    self.listeners = listeners;
    self.enabled = false;
    self.loaded = false;
    self.ready = false;


    this.play = this.play.bind(this)
    this.pause = this.pause.bind(this)
    this.seek = this.seek.bind(this)

  }

  // Interface API
  disable(){
    var self = this;
    // $('#player_container').empty();
    $('#yt-player').hide()
    self.player.stopVideo()
    self.enabled = false;
    self.ready = false;
    self.listeners.onPlayerStateUpdate({ready: false})
  }

  enable(url){
    var self = this;

    // Load youtube iframe api if its not loaded already
    if(!self.loaded){
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);


      window['onYouTubeIframeAPIReady'] = function() {
        console.log("Youtube iframe api ready")
        self.loaded=true;
        self.enable(url)
      }
      return
    }

    console.log("Enable video with url " + url.href)
    self.url = url;
    self.videoId = this.extractVideoID(url.href)
    self.enabled = true;
    
    if(self.player){
      self.player.loadVideoById(self.videoId)
      $('#yt-player').show()
      self.ready = true;
      self.listeners.onPlayerStateUpdate({ready: true})
    }else{
      var targetDiv = $(document.createElement('div'));
      targetDiv.attr("id", "yt-player")
      $('#player_container').append(targetDiv)
  
      self.player = new window['YT'].Player('yt-player', {
        videoId: self.videoId,
        playerVars: { 'autoplay': 1, 'mute': true},
        events: {
          'onReady': self.onPlayerReady.bind(self),
          'onStateChange': self.onPlayerStateChange.bind(self),
          'onApiChange': self.onApiChange.bind(self),
          'onError': self.onError.bind(self)
        } 
      });
    }
  }

  matches(url){
    return (
      url.host.includes("youtube.com") ||
      url.host.includes("youtu.be")
    )
  }

  ready(){
    return self.ready;
  }

  play(){
    console.log("Iframe received play")
    this.player.playVideo()
  }

  pause(){
    console.log("Iframe received pause")
    this.player.pauseVideo()
  }

  seek(seconds){
    this.player.seekTo(seconds, true)
  }


  // Youtube event listeners
  onPlayerReady(event) {
    var self = this;
    console.log("Player ready")
    self.ready = true;
    event.target.playVideo();
    // event.target.unMute();
    if(self.enabled){
      self.listeners.onPlayerStateUpdate({ready: true})
    }
  }

  onPlayerStateChange(event) {
    var self = this;
    if(event.data == 1){
      let position = self.getPosition();
      position.playing = true;
      if(self.enabled){
        self.listeners.onPlayerPositionUpdate(position)
      }
    }else if(event.data == 2){
      let position = self.getPosition();
      position.playing = false;
      if(self.enabled){
        self.listeners.onPlayerPositionUpdate(position)
      }
    }else if(event.data == 0){
      self.listeners.onEnded()
    }
  }
  onApiChange(event){
    var self = this;
    console.log("Api change: " + event.data)
  }

  onError(event){
    var self = this;
    console.log("Error: " + event.data)
  }


  // Helpers
  extractVideoID(url){
    var self = this;
    var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    var match = url.match(regExp);
    if ( match && match[7].length == 11 ){
        return match[7];
    }else{
        console.log("Could not extract video ID.");
    }
  }

  getPosition(){
    var self = this;

    return {
      seconds: self.player.getCurrentTime(),
      duration: self.player.getDuration(),
      playing: self.player.getPlayerState()==1,
      at: Date.now()
    }
  }
}