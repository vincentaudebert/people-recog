import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

window.descriptorLength = 256;
window.matchesShown = 30;
window.blurRadius = 3;

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
