export default class Chat {

    mount(view, socket, room) {
        let self = this
        self.channels = {}
        self.view = view;
  
        self.channels[room] = socket.channel("chat:" + room, {})
  
        self.channels[room].on("message", function(payload) {
          console.log(payload)
          let message = payload;
           self.view.addMessage(message)
        })
  
        // self.channels[room].on("message:delete", function(payload) {
        //     delete_message(payload.message_id)
        // })
  
        self.channels[room].join()
            .receive("ok", resp => {
                console.log(resp)
                let messages = resp.messages
                for (let i = 0; i < messages.length; i++) {
                    self.view.addMessage(messages[i])
                }
            })
            .receive("error", resp => { console.log("Unable to join", resp) })
    }

}