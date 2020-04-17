import React from "react";
import ReactDOM from "react-dom";

export default class Chat extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      value: '',
      messages: [],
      playSound: true
    }

    this.channel = this.props.channel
    this.audio = new Audio("/sounds/chat.mp3")
    

  }

  componentDidMount(){
    // Set up chat event listeners
    this.channel.on("message", function(payload) {
      console.log(payload)
      let message = payload;
       this.setState(state => {
         return {
           messages: state.messages.concat(message)
         }
       })
       if(this.state.playSound && message.user_id != this.props.userID){
        this.audio.play();
       }
    }.bind(this))

    this.channel.on("message:delete", function(payload){
      this.setState(state => {
        return {
          messages: state.messages.filter(function(message){
              return message.id != payload.message_id
            })
        }
      })
    }.bind(this))

    this.channel.join()
        .receive("ok", function(resp){
            console.log(resp)
            let messages = resp.messages
            this.setState({
              messages: messages
            })
        }.bind(this))
        .receive("error", resp => { console.log("Unable to join", resp) })


    this.onKeyDown = this.onKeyDown.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.deleteMessage = this.deleteMessage.bind(this)
    this.toggleSound = this.toggleSound.bind(this)
  }

  onKeyDown(e){
    if (e.key === 'Enter') {
      // this.props.onEnter(this.state.value)
      this.channel.push('message:new', { message: this.state.value})
      this.setState({value: ''})
    }
  }

  handleChange(e){
    this.setState({value: e.target.value})
  }

  deleteMessage(messageID){
    this.channel.push("message:delete", {message_id: messageID})
  }

  toggleSound(){
    this.setState(state => {
      return {
        playSound: !state.playSound
      }
    })
  }


  render(){
    let placeholder = ""
    if(this.props.signedIn){
      placeholder = "Say something..."
    }else{
      placeholder = "Sign in to chat."
    }
    let soundIcon = this.state.playSound ? "volume-high" : "volume-off"
    return (
    <div className="chat">
    <h3 className="chat__header">{this.props.title || "Chat"}</h3>
      <MessageList 
        messages={this.state.messages} 
        deleteMessage={this.deleteMessage}
        ownsRoom={this.props.ownsRoom}
        userID={this.props.userID} />

      <div className="chat__input">
        <input type="textarea"
        placeholder={placeholder}
        value={this.state.value}
        onChange={this.handleChange}
        onKeyDown={this.onKeyDown}
        disabled={!this.props.signedIn}
        maxLength="255" />
      </div>
      <div className="chat__buttons">
        <span className="oi btn-flat" data-glyph={soundIcon} title="Toggle Sound" aria-hidden="true" onClick={this.toggleSound}></span>
      </div>
    </div>);
  }

}

class MessageList extends React.Component{
  constructor(props){
    super(props)
  }

  componentWillUpdate() {
    const node = ReactDOM.findDOMNode(this)
    this.shouldScrollToBottom = node.scrollTop + node.clientHeight >= node.scrollHeight
  }

  componentDidUpdate(){
    if (this.shouldScrollToBottom) {
      const node = ReactDOM.findDOMNode(this)
      node.scrollTop = node.scrollHeight   
    }
  }


  render(){

    let messages = this.props.messages.map(m => {
      return (
        <div className="chat__item" v-for="message in messages" key={m.id}>
          <div className="chat__content">
            <div className="chat__username">{m.name}</div>
            <div className="chat__message">
              {m.message}
            </div>
          </div>
          { (this.props.ownsRoom || this.props.userID == m.user_id) &&
          <div className="chat__options btn-flat" onClick={() => {this.props.deleteMessage(m.id)}}>
            <span className="oi" data-glyph="circle-x" title="Delete" aria-hidden="true"></span>
          </div>
          }
        </div>
      )
    })

    return (
      <div className="chat__body">
        {messages}
      </div>
    );
  }
}