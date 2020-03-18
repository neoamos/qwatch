import React from "react";

export default class Chat extends React.Component{
  constructor(props){
    super(props)
    this.state = {
      value: '',
      messages: [],

    }

    this.channel = this.props.channel
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

  render(){
    console.log(this.state.messages)
    let messages = this.state.messages.map(m => {

  
      return (
        <div className="chat__item" v-for="message in messages" key={m.id}>
        <div className="chat__username">{m.name}</div>
        <div className="chat__message">{m.message}</div>
        </div>
      )
    })
    return (<div className="chat">
    <h3 className="chat__header">{this.props.name}</h3>
      <div className="chat__body">
        {messages}
      </div>

      <div className="chat__input">
        <input type="textarea"
        placeholder="Say something..."
        value={this.state.value}
        onChange={this.handleChange}
        onKeyDown={this.onKeyDown} />
      </div>
    </div>);
  }

}