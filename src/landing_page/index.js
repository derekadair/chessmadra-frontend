import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import QAPI from "qapi";
window.QAPI = QAPI;
ReactDOM.render( /*#__PURE__*/React.createElement(App, null), document.getElementById("root"));