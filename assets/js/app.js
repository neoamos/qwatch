// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.
import css from "../css/app.scss"

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import dependencies
//
import "phoenix_html"
import 'simplebar'
import 'simplebar/dist/simplebar.css';
import {Socket} from "phoenix"
import RoomReact from './room_react/room.js'
import ReactDOM from "react-dom";
import React from "react";

import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'react-tippy/dist/tippy.css'

let userID = parseInt(window.userID)
let socket = new Socket("/socket", {params:  { token: window.userToken } })
socket.connect();
console.log(window.userToken)

// var room = new Room();
// room.mount(socket, "general");

let el = document.getElementById("root");

if(el){
  ReactDOM.render(<RoomReact name={el.getAttribute('data-room-name')} userID={userID} socket={socket} />, el);
}

tippy('[data-tippy-menu]', {
  content(reference) {
    const id = reference.getAttribute('data-tippy-menu');
    const template = document.getElementById(id);
    return template.innerHTML;
  },
  allowHTML: true,
  interactive: true,
  interactiveBorder: 30,
  interactiveDebounce: 75,
  trigger: 'click'
});

tippy('[data-tippy-content]');