import React, { Component } from 'react';
import './App.css';
import Chatroom from './components/ChatRoom';
import Login from './components/Login';
import Errorpage from './components/ErrorPage';
import { BrowserRouter, Route } from 'react-router-dom';

// setting up socket client to connect to our express server runninng
// in http://loclhost:3001

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <Route exact path="/" component={Login} />
          <Route exact path="/chatroom" component={Chatroom} />
          <Route exact path="/error" component={Errorpage} />
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
