import React from 'react';
import Sidebar from '../Sidebar';
import ChatWindow from '../ChatWindow';
import ChatUser from '../ChatUser';
import TextInput from '../TextInput';
import { withRouter } from 'react-router-dom';
import cookie from 'react-cookies';
import io from 'socket.io-client';
import './index.css';
const request = require('request');

class Chatroom extends React.Component {
  // assigning props
  constructor(props) {
    super(props);
    this.state = {
      isEstablishingSession: false,
      chattingWith: null,
      socket: null,
      onlineUsers: [],
      myMessages: [],
      errorMsg: null,
      isloading: false,
    };
  }

  // React life cycle hoo. redirect to login page
  // if n user cookies are found..
  componentWillMount() {
    this.setState({ isloading: true });
    if (cookie.load('user')) {
      console.log('usr cookie...cookie found');
    } else {
      console.log('no cookie found..redirecting to login.');
      this.props.history.push('/');
    }
  }

  // react life cycle hook. Establish socket if sucessfully mounted
  componentDidMount() {
    let _this = this;
    // get ip address of client
    request('https://ipapi.co/json/', (err, res, body) => {
      console.log('your ip', JSON.parse(body).ip);
      const clientIP = JSON.parse(body).ip;

      // Ensuring we only use HTTP to simulate a browser/proxy server without websocket support
      const url = `${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;
      const socket = io(url, { transports: ['polling'] });

      // checking for socket connection
      socket.on('connect', () => {
        this.setState({ isloading: true });
        console.log('socket established successfully with server..');
        console.log('requesting user session..');
        socket.emit('createsession', { ...cookie.load('user'), clientIP });
        socket.on('usernametaken', () => {
          alert('username already taken please use another');
          cookie.remove('user');
          this.props.history.push('/');
        });
        socket.on('accessdenied', data => {
          this.setState({ isloading: false });
          // check if user session already present
          if ((data.err = 'alreadyrunning')) {
            console.log('session with username:' + cookie.load('user').email + 'already running at', data.address);
            if (clientIP === data.address) {
              // redirect to error page
              this.props.history.push('/error');
            }
          } else {
            this.setState({ isloading: false });
            console.log('error creating your session..');
            console.log('clearing cookies..redirecting to login page');
            cookie.remove('user');
            this.props.history.push('/');
            this.state.socket = null; // no need for re-rendering..hence not using setState()
            socket.close();
          }
        });

        socket.on('newClientOnline', user => {
          console.log('new client connected', user);
          if (cookie.load('user') && cookie.load('user').email !== user.email) {
            let olUsers = this.state.onlineUsers;
            olUsers.push(user.email);
            this.setState({ onlineUsers: olUsers });
            console.log('available users', this.state.onlineUsers);
          }
        });

        socket.on('clientOffline', user => {
          console.log('client is offline', user);
          const index = this.state.onlineUsers.indexOf(user);
          if (index > -1) {
            console.log('index', index);
            let olUsers = this.state.onlineUsers;
            olUsers.splice(index, 1);
            console.log('online users are **', olUsers);
            const messages = this.state.myMessages.filter(message => {
              if (message.from !== user && message.to !== user) return message;
            });

            this.setState({ onlineUsers: olUsers, myMessages: messages });
          }
        });

        socket.on('accessgranted', users => {
          this.setState({ isloading: false });
          console.log('user session established....');
          this.setState({ socket: socket });
          if (cookie.load('user')) {
            let index = users.indexOf(cookie.load('user').email);
            if (index > -1) {
              users.splice(index, 1);
            }
          }
          console.log('online users', users);
          this.setState({ onlineUsers: users });
        });

        socket.on('newMessage', msg => {
          console.log('got new message', msg);
          const messages = this.state.myMessages;
          messages.push({
            from: msg.from,
            text: msg.text,
            time: Date.now(),
            type: 'from',
          });
          this.setState({ myMessages: messages });
        });
      });
    });
  }

  sentMessage = (touser, message) => {
    const messages = this.state.myMessages;
    messages.push({
      to: touser,
      text: message,
      time: Date.now(),
      type: 'to',
    });
    this.setState({ myMessages: messages });
  };

  chatWithuser(user) {
    this.setState({ chattingWith: user });
  }

  render() {
    console.log('renderingg', cookie.load('user'));
    const chattingWith = this.state.chattingWith || this.state.onlineUsers[0];
    return this.state.isloading ? (
      <p>Establishing connection please wait....</p>
    ) : (
      <div>
        <div className="side-bar-parent">
          <Sidebar chatWithuser={this.chatWithuser.bind(this)} cookie={cookie} users={this.state.onlineUsers} />
        </div>
        <div className="chat-window-parent">
          <ChatUser socket={this.state.socket} cookie={cookie} chattingWith={chattingWith} />
          <ChatWindow chattingWith={chattingWith} messages={this.state.myMessages} />
          <TextInput sentMessage={this.sentMessage.bind(this)} chatWithuser={chattingWith} socket={this.state.socket} />
        </div>
      </div>
    );
  }
}

export default withRouter(Chatroom);
