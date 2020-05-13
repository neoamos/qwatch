
import $ from 'jquery'
import { Janus } from 'janus-gateway';

export default class ScreenCaptureInterface {
  constructor(listeners) {
    this.listeners = listeners
    this.enabled = false

    this.disable = this.disable.bind(this)
    this.play = this.play.bind(this)
    this.pause = this.pause.bind(this)
    this.seek = this.seek.bind(this)
    this.enable = this.enable.bind(this)
    this.matches = this.matches.bind(this)
    this.ready = this.ready.bind(this)

    Janus.init({
      debug: true,
      dependencies: Janus.useDefaultDependencies(), // or: Janus.useOldDependencies() to get the behaviour of previous Janus versions
      callback: function () {
        // Done!
      }
    });

  }

  // Interface API
  disable() {
    $('#screen-capture-player').remove();
  }

  play() { }
  pause() { }
  seek(seconds) { }
  stop() { }

  enable(url) {
    var self = this
    console.log(Janus)
    console.log("Enable video with url " + url.href)
    this.url = url;
    this.enabled = true

    if (!this.janus) {
      this.janus = new Janus(
        {
          server: 'ws://34.236.33.152:8188/janus',
          // server: 'wss://janus.conf.meetecho.com/ws',
          success: function () {
            console.log("Janus connected successfully")
            self.enable(url)
          },
          error: function (cause) {
            console.log("Error connecting janus")
            console.log(cause)
          },
          destroyed: function () {
          }
        });
      return;
    }

    var remoteVideo = $(document.createElement('video'));
    this.remoteVideo = remoteVideo[0];
    remoteVideo.attr("id", "screen-capture-player-remote")
    remoteVideo.attr("autoplay", "true")
    remoteVideo.attr("width", "320")
    remoteVideo.attr("height", "240")
    remoteVideo.attr("playsinline", true)

    var localVideo = $(document.createElement('video'));
    this.localVideo = localVideo[0];
    localVideo.attr("id", "screen-capture-player-local")
    localVideo.attr("autoplay", "true")
    // tag.attr("muted", "true")
    // tag.attr("controls", "true")
    $('#player_container').append(self.remoteVideo)

    // navigator.mediaDevices.getDisplayMedia({
    //   video: {
    //     cursor: "always"
    //   },
    //   audio: false
    // }).then(function(stream){
    //   console.log(stream)
    //   this.tag.srcObject = stream;
    //   $('#player_container').append(tag)
    // }.bind(this));

    this.janus.attach(
      {
        plugin: "janus.plugin.streaming",
        success: function (pluginHandle) {
          self.handle = pluginHandle
          console.log("Janus attached")
          self.handle.send({
            message: {
              "request": "list"
            },
            success: function (res) {
              console.log(res)
            }
          })


          self.handle.send({
            message: {
              "request": "watch",
              "id": 3
            }
          })
          // pluginHandle.createOffer({
          //   media: {audio: true, video: true},
          //   success: function(jsep) {
          //     Janus.debug("Got SDP!");
          //     Janus.debug(jsep);
          //     pluginHandle.send({"message": body, "jsep": jsep});
          //   },
          //   error: function(error) {
          //     console.log("WebRTC error:", error);
          //   }
          // })
          // Plugin attached! 'pluginHandle' is our handle
        },
        error: function (cause) {
          console.log("Janus error")
          console.log(cause)
          // Couldn't attach to the plugin
        },
        consentDialog: function (on) {
          // e.g., Darken the screen if on=true (getUserMedia incoming), restore it otherwise
        },
        onmessage: function (msg, jsep) {
          console.log("Got message from janus:")
          console.log(msg)
          console.log(jsep)
          if (jsep !== undefined && jsep !== null) {
            console.log("Handling SDP as well...")
            self.handle.createAnswer({
              // We attach the remote OFFER
              jsep: jsep,
              // We want recvonly audio/video
              media: { audioSend: false, videoSend: false },
              success: function (ourjsep) {
                // Got our SDP! Send our ANSWER to the plugin
                var body = { "request": "start" };
                self.handle.send({ "message": body, "jsep": ourjsep });
              },
              error: function (error) {
                // An error occurred...
              }
            });
          }
          // We got a message/event (msg) from the plugin
          // If jsep is not null, this involves a WebRTC negotiation
        },
        onlocalstream: function (stream) {
          console.log("got local stream")
          // We have a local stream (getUserMedia worked!) to display
        },
        onremotestream: function (stream) {
          // We have a remote stream (working PeerConnection!) to display
          console.log("Got remote stream")
          Janus.attachMediaStream(self.remoteVideo, stream);
        },
        oncleanup: function () {
          // PeerConnection with the plugin closed, clean the UI
          // The plugin handle is still valid so we can create a new one
        },
        detached: function () {
          // Connection with the plugin closed, get rid of its features
          // The plugin handle is not valid anymore
        }
      });

  }

  matches(url) {
    return (url.href == "http://screen-capture.com/")
  }


  ready() {
    return false;
  }

  getPosition() { }
}