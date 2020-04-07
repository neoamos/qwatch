import React from "react";

export default class Queue extends React.Component{
  constructor(props){
    super(props)
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
         />
    })
    return (
    <div className="video__queue">
      {queueItems}
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
        <div className="tile_image-container">
          <img className="tile__image" src={this.props.item.image || "/images/no-image.png"} />
        </div>
        <div className="tile__title-wrap">
          <div className="tile__title">{this.props.item.title || "Some title"}</div>
          <div className="tile__info">
            <div>{this.props.item.site_name || "Some Site"}</div>
            <div><a href="#" onClick={this.handleDelete}>X</a></div>
          </div>
        </div>
      </div>
    )
  }
}