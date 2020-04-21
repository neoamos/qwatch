import $ from 'jquery';

export default class SoundCloudInterface {

  constructor(listeners) {
    var self = this;
    self.listeners = listeners;
    self.enabled = false;
    self.loaded = false;
    self.ready = false;
    self.playing = true;

    this.matches = this.matches.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this)
    this.seek = this.seek.bind(this)

  }

  disable() {
    if (self.widget) {
      self.widget = null;
    }

    $('#soundcloud-widget').remove();
    this.enabled = false;
    this.ready = false;
    this.widget = null;
    this.listeners.onPlayerStateUpdate({ ready: false })
  }

  enable(url, initialPosition) {
    var self = this;
    initialPosition = initialPosition || {};
    if (!self.loaded) {
      var tag = document.createElement('script');
      tag.crossOrigin;
      tag.src = "https://w.soundcloud.com/player/api.js";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      tag.addEventListener('load', (e) => {
        self.loaded = true
        self.enable(url, initialPosition)
      })
      return
    }

    var regex = /[a-z]+:\/\/[a-z.]+\/[a-z0-9-]+\/[a-z0-9-]+/;
    if (url.href.match(regex)) {
      var videoUrl = 'https://w.soundcloud.com/player/?url=' + url.href + "&color=%23ff5500&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=true&show_teaser=true&visual=true&single_active=false&download=true";
      if(initialPosition.index != null){
        videoUrl += "&start_track=" + initialPosition.index;
      }
    } else {
      videoUrl = url.href;
    }

    self.enabled = true;

    var targetDiv = $(document.createElement('iframe'));
    targetDiv.attr("id", "soundcloud-widget")
    targetDiv.attr("allowtransparency", "true")
    targetDiv.attr("src", videoUrl)
    targetDiv.attr("allow", "autoplay")
    $('#player_container').append(targetDiv)
    if (self.widget) {
      self.widget.load(url)
      $('#soundcloud-widget').show();
      self.ready = true;
      self.listeners.onPlayerStateUpdate({ ready: true })
    } else {
      var widgetIframe = document.getElementById('soundcloud-widget');
      self.widget = window.SC.Widget(widgetIframe);
      self.widget.bind(SC.Widget.Events.READY, function () {
        self.onPlayerReady();
      })

      self.widget.bind(SC.Widget.Events.PLAY, function () {
        if (this.enabled) {
          this.getPosition(this.listeners.onPlayerPositionUpdate)
        }
      }.bind(this))

      self.widget.bind(SC.Widget.Events.PAUSE, function () {
        if (this.enabled) {
          this.getPosition(this.listeners.onPlayerPositionUpdate)
        }
      }.bind(this))

      self.widget.bind(SC.Widget.Events.SEEK, function (seconds) {
        if (this.enabled) {
          this.getPosition(this.listeners.onPlayerPositionUpdate)
        }
        //On safari, soundcloud has a delayed play after a seek, so we have to cancel it
        if(!this.playing && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)){
          setTimeout(this.pause, 500)
        }
      }.bind(this));
      self.widget.bind(SC.Widget.Events.FINISH, function () {
        console.log("Soundcloud finished")
        if (this.enabled) {
          setTimeout(this.listeners.onEnded, 400)
        }
      }.bind(this));
    }

  }
  selectIndex(index) {
    this.widget.getCurrentSoundIndex(function(currentIndex){
      if (this.widget && index != currentIndex) {
        this.index = index
        this.widget.skip(index)
      }
    }.bind(this))
  }

  onPlayerReady() {

    this.ready = true;
    console.log("Soundcloud player is Ready");
    this.play();
    // event.target.unMute();
    this.listeners.onPlayerStateUpdate({ ready: true })
  }
  play() {
    this.playing = true
    if (this.widget) {
      this.widget.play();
    }
  }

  pause() {
    this.playing = false
    if (this.widget) {
      this.widget.pause();
    }
  }

  seek(seconds) {
    if (this.widget) {
      this.widget.seekTo(seconds * 1000);
    }
  }

  stop() {
    this.playing = false
    if (this.widget) {
      this.widget.pause()
    }
  }
  ready() {
    return this.ready;
  }

  onError() {
    console.log("Error:")
  }

  getPosition(callback) {
    var self = this;
    self.widget.getPosition(function (seconds) {
      self.widget.getDuration(function (duration) {
        self.widget.isPaused(function (isPaused) {
          self.widget.getCurrentSoundIndex(function (index) {

            let position = {
              seconds: seconds / 1000,
              duration: duration / 1000,
              playing: !isPaused,
              index: index,
              at: Date.now()
            }
            callback(position)
          })
        })
      })
    })
    return
  }
  matches(url) {
    return (
      url.host.includes("soundcloud.com")
    )
  }
}