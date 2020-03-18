import React from "react";

const youtubeRegex = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;

export default class YoutubeInterface extends React.Component{
  constructor(props){
    super(props)
    this.state = {id:this.extractVideoID(this.props.link)}
    this.loadVideo = this.loadVideo.bind(this)
  }

  componentDidMount(){
    // On mount, check to see if the API script is already loaded

    if (!window.YT) { // If not, load the script asynchronously
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';

      // onYouTubeIframeAPIReady will load the video after the script is loaded
      window.onYouTubeIframeAPIReady = this.loadVideo;

      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    } else { // If script is already there, load the video directly
      this.loadVideo();
    }
  }

  loadVideo(){

    // the Player object is created uniquely based on the id in props
    this.player = new window.YT.Player(`youtube-player-${this.state.id}`, {
      videoId: this.state.id,
      events: {
        onReady: this.onPlayerReady,
      },
    });
  }

  extractVideoID(url){
    var match = url.match(youtubeRegex);
    if ( match && match[7].length == 11 ){
        return match[7];
    }else{
        console.log("Could not extract video ID.");
    }
  }

  render(){
    return (
      <div className="video__player">
        <div id={`youtube-player-${this.state.id}`} />
      </div>
    );
  }
}