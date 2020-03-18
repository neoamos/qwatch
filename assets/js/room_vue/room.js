import Vue from "vue/dist/vue.esm"
import Player from "./player.js"

export default class Room {

  mount(socket, room) {
    var self = this;
    self.player = new Player({
      updatePosition: self.updatePosition.bind(self),
      updatePlayerState: self.updatePlayerState.bind(self)
    })

    // Set up view model
    self.vm = new Vue({
      el: '#room',
      data: {
        messages: [],
        users: [],
        connection_id: null,
        video_state: {
          links: {},
          link_queue: [],
          link_suggestions: [],
          client_playing: {},
          server_playing: {},
          server_position: {seconds: 0, duration: 0, playing: true, at: Date.now(), link_id: null},
          client_position: {seconds: 0, duration: 0, playing: true, at: Date.now(), link_id: null},
          has_remote: false,
          remote_available: false,
          remote_holder_user_id: null,
          remote_holder_connection_id: null,
          live: true,
          player_ready: false,
          initial_sync: true
        }
      },
      watch:{
        'video_state.client_playing': function(val){
          if(val){
            self.player.updateLink(val.link);
          }else{
            console.log("Disabling player")
            self.player.disable()
          }
        }
      },
      methods: {
        addMessage: function(message){
          this.messages.push(message)
        },
        sendMessage: function(data){
          // If the message body is empty, do not submit
          if (event.target.value.length === 0) {
              return;
          }
          console.log(event.target.value)
          self.chat_channel.push('message:new', { message: event.target.value })
          event.target.value = '';
        },
        enqueueLink: function(data){
          if (event.target.value.length === 0) {
            return;
          }
          console.log(event.target.value)
          self.room_channel.push('link:enqueue', { link: event.target.value })
          event.target.value = '';
        },
        next: function(){
          self.room_channel.push('link:next', {})
        },
        selectLink: function(id){
          console.log("select " + id)
          if(self.state.has_remote){
            self.room_channel.push('link:select', {link_id: id})
          }else{
            self.state.client_playing = self.state.links[id]
            self.state.live = false;
            // self.player.updateLink(self.state.client_playing.link)
          }
        },
        removeLink: function(id){
          if(self.state.has_remote){
            let index = self.state.link_queue.indexOf(self.state.links[id])
            self.state.link_queue.splice(index, 1)
            self.send_queue();
          }
        },
        toggleRemote: function(){
          if(self.state.has_remote){
            self.room_channel.push('remote:drop', {})
          }else{
            self.room_channel.push('remote:request', {})
          }
        },
        synchronize: function(){
          if(self.state.live){
            self.state.live = false
          }else{
            self.state.live = true
            self.synchronize()
          }
        }
      }
    })

    self.state = self.vm.video_state;

    // Set up channels
    self.room_name = window.room_name
    self.chat_channel = socket.channel("chat:" + self.room_name, {})
    self.room_channel = socket.channel("room:" + self.room_name, {})


    // Set up chat event listeners
    self.chat_channel.on("message", function(payload) {
      console.log(payload)
      let message = payload;
       self.vm.addMessage(message)
    })

    self.chat_channel.join()
        .receive("ok", resp => {
            console.log(resp)
            let messages = resp.messages
            for (let i = 0; i < messages.length; i++) {
                self.vm.addMessage(messages[i])
            }
        })
        .receive("error", resp => { console.log("Unable to join", resp) })


    // Set up room channel listeners
    self.room_channel.on("state:update", function(payload){
      let state = payload.state
      self.update_state(state);
    })

    self.room_channel.on("link:info", function(payload){
      console.log("Received link info: ")
      console.log(payload)
      let link = payload.link
      let target = self.state.links[link.id]
      target.description = link.description
      target.title = link.title
      target.image = link.image
      target.image = link.image
      target.site_name = link.site_name
      self.vm.$forceUpdate()
    })

    self.room_channel.join()
      .receive("ok", resp => {
          console.log(resp)
          let video_state = resp.state
          self.vm.connection_id = resp.connection_id
          self.update_state(video_state)
      })
      .receive("error", resp => { console.log("Unable to join", resp) })
  }

  update_state(new_state){
    console.log("Updating state with new state: ")
    console.log(new_state)
    var self = this;
    if(new_state.server_position){
      self.state.server_position = self.generatePosition(new_state.server_position)
    }
    if(new_state.links){
      Object.keys(new_state.links).forEach(function(key) {
        Vue.set(self.state.links, key, new_state.links[key]);
      });
    }

    if(new_state.link_queue){
      console.log("Updating link queue")
      console.log(new_state.link_queue)
      for(let i = 0; i< new_state.link_queue.length; i++){
        if(self.state.link_queue.length <= i){
          self.state.link_queue.push(self.state.links[new_state.link_queue[i]])
        }else{
          self.state.link_queue[i] = self.state.links[new_state.link_queue[i]]
        }
      }
      self.state.link_queue.splice(new_state.link_queue.length)

    }

    if(new_state.remote_available != null){
      self.state.remote_available = new_state.remote_available
    }

    if(new_state.remote_holder_user_id != null){
      self.state.remote_holder_user_id = new_state.remote_holder_user_id
    }

    if(new_state.remote_holder_connection_id != null){
      self.state.remote_holder_connection_id = new_state.remote_holder_connection_id
      if(self.state.remote_holder_connection_id == self.vm.connection_id){
        self.state.has_remote = true;
        self.room_channel.push('link:select', {link_id: self.state.client_playing.id})
        self.sendPosition()
      }else{
        self.state.has_remote = false;
      }
    }

    if(new_state.server_playing != null){
      console.log("Updating currently playing")
      self.state.server_playing = self.state.link_queue[new_state.server_playing];
      if(self.state.has_remote){
        self.state.client_playing = self.state.link_queue[new_state.server_playing];
      }
    }

    if(self.state.live && !self.state.has_remote && !self.checkSynced()){
      self.synchronize()
    }
  }

  send_queue(){
    var self = this
    let queue = self.state.link_queue.map(l => l.id);
    self.room_channel.push("queue:update", {queue: queue})
  }

  sendPosition(){
    var self = this
    self.room_channel.push("position:update", {
      position: {
        seconds: self.calculateCurrentTime(self.state.client_position),
        duration: self.state.client_position.duration,
        playing: self.state.client_position.playing
      }
    })
  }

  synchronize(){
    var self = this;
    console.log("synchronizing")
    if(self.state.client_playing.id != self.state.server_playing.id){
      console.log("changing link")
      self.state.initial_sync = true;
      self.state.client_playing = self.state.server_playing
    }else{
      console.log("updating position")
      if(self.state.server_position.link_id && self.state.server_position.link_id == self.state.client_playing.id){
        self.player.updatePosition(self.state.server_position)
      }
    }
  }

  checkSynced(){
    var self = this;
    if(self.state.client_playing.id == self.state.server_playing.id){
      if(Math.abs(self.calculateCurrentTime(self.state.client_position) - self.calculateCurrentTime(self.state.server_position)) > 1
         || self.state.server_position.playing != self.state.client_position.playing){
        return false;
      }else{
        return true
      }
    }else{
      return false;
    }
  }

  generatePosition(position){
    var self = this;
    console.log(position)
    return {
      seconds: position.seconds,
      duration: position.duration,
      playing: position.playing,
      at: Date.now(),
      link_id: position.link_id
    }
  }


  // Player Calback functions
  updatePosition(position){
    var self = this;
    console.log("Player update: " + position.seconds + "s of " + position.duration + "s. Playing: " + position.playing)

    self.state.client_position.seconds = position.seconds
    self.state.client_position.duration = position.duration
    self.state.client_position.playing = position.playing
    self.state.client_position.at = position.at
    self.state.client_position.stale = false
    if(self.state.has_remote){
      self.sendPosition()
    }
  }

  updatePlayerState(state){
    var self = this;
    if(state.ready){
      self.state.player_ready = true;
      if(self.state.initial_sync){
        self.state.initial_sync = false;
        self.synchronize()
      }
    }else{
      self.state.player_ready = false;
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