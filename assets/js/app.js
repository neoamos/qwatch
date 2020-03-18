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
import feather from "feather-icons"
import 'simplebar'
import 'simplebar/dist/simplebar.css';
import Room from "./room_vue/room.js"
import {Socket} from "phoenix"
import { createPopper } from '@popperjs/core';
import RoomReact from './room_react/room.js'
import ReactDOM from "react-dom";
import React from "react";

feather.replace({class: "feather-icon"})

let socket = new Socket("/socket", {params:  { token: window.userToken } })
socket.connect();
console.log(window.userToken)

// var room = new Room();
// room.mount(socket, "general");

let el = document.getElementById("root");

ReactDOM.render(<RoomReact name={el.getAttribute('data-room-name')} socket={socket} />, el);


const button = document.querySelector('#button');
const tooltip = document.querySelector('#tooltip');

// Pass the button, the tooltip, and some options, and Popper will do the
// magic positioning for you:
createPopper(button, tooltip, {
  placement: 'right',
});

// Import local files
//
// Local files can be imported directly using relative paths, for example:
// import socket from "./socket"
