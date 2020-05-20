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
import {Socket} from "phoenix"
import RoomReact from './room_react/room.js'
import ReactDOM from "react-dom";
import React from "react";

import tippy from 'tippy.js';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import $ from 'jquery'

let userID = window.userID || null;
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

$(function() {
  $(".close-flash").click(function(e){
    $(this).parent().remove()
  })
});

$(function () {

  $(".faq-item_header").click(function (e) {
    var onClickHeader = e.currentTarget.className.split(" ")[1];
    var showCOntent = ".faq-item_content_" + onClickHeader;
    var headerInfo = "." + onClickHeader;
    var x = $(headerInfo).children("span").attr("data-glyph");
    if (x == "minus")
    {
      $(headerInfo).children("span").attr("data-glyph", "plus");
      $(showCOntent).hide();
    }
    
    else {
      $(headerInfo).children("span").attr("data-glyph", "minus");
      $(showCOntent).show();
    }
    
  })
});