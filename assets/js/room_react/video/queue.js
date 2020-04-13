import React from "react";
import ReactDOM from "react-dom";

export default class Queue extends React.Component{
  constructor(props){
    super(props)

    this.scrollToPlaying = true
  }

  componentDidUpdate(){
    if (this.scrollToPlaying && this.props.clientPlaying.id) {
      let playingIndex = this.props.items.findIndex(e => {
        return this.props.clientPlaying.id == e.id
      })
      const node = ReactDOM.findDOMNode(this)
      node.scrollLeft = 214*playingIndex;
      this.scrollToPlaying = false
    }
  }

  render(){
    const queueItems = this.props.items.map(item => {
      let serverPlaying = this.props.serverPlaying && item.id==this.props.serverPlaying.id
      let clientPlaying = this.props.clientPlaying && item.id==this.props.clientPlaying.id
      return <QueueItem 
        item={item} 
        key={item.id} 
        handleClick={this.props.selectLink} 
        handleDelete={this.props.deleteLink}
        serverPlaying={serverPlaying}
        clientPlaying={clientPlaying}
        hasRemote={this.props.hasRemote}
         />
    })
    return (
    <div className="video__queue">
      {queueItems.length>0 ?   
        [
          <div className="queue-spacer" />,
          queueItems,
          <div className="queue-spacer" />
        ]
         :
      <div className="placeholder_message">No items in the queue yet.  Request the remote to add something.</div> 
      }
    </div>
    );
  }

}

class QueueItem extends React.Component {
  constructor(props){
    super(props)
    // console.log(props)

    this.handleClick = this.handleClick.bind(this)
    this.handleDelete = this.handleDelete.bind(this)
  }

  handleClick(e){
    e.stopPropagation(); 
    this.props.handleClick(this.props.item)
  }

  handleDelete(e){
    e.stopPropagation(); 
    this.props.handleDelete(this.props.item)
  }

  render(){
    let className = "tile"
    if(this.props.serverPlaying){
      className += " tile--server_playing"
    }
    if(this.props.clientPlaying){
      className += " tile--client_playing"
    }
    return (
      <div className={className} onClick={this.handleClick} >
        <div className="tile__image">
          <img src={this.props.item.image || "/images/no-image.png"} />
        </div>
        <div className="tile__title-wrap">
          <div className="tile__title">{this.props.item.title || "Unknown title"}</div>
          <div className="tile__info">
            <div>{this.props.item.site_name}</div>
            { this.props.hasRemote && 
              <div class="btn-flat" onClick={this.handleDelete}>
                <span className="oi" data-glyph="x" title="Delete" aria-hidden="true"></span>
              </div>
            }
          </div>
        </div>
      </div>
    )
  }
}