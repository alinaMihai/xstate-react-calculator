import React from 'react';
import ReactDOM from 'react-dom';
import { inspect } from "@xstate/inspect";
inspect({
  url: "https://statecharts.io/inspect",
  iframe: false
});


// import './tailwind.css';

import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.querySelector('#root'),
);
