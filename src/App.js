// src/App.js

import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class Header extends Component {
  goTo(route) {
    this.props.history.replace(`/${route}`)
  }

  login() {
    this.props.auth.login()
  }

  logout() {
    this.props.auth.logout()
  }

  render() {
    const { isAuthenticated } = this.props.auth;
    return (
      <div className="tc">
        <div className="fl w-100 pa2">
          <img src={logo} className="App-logo w3" alt="logo" />
          <h1 className="title pb2">Vote Forward</h1>
        </div>
        <div className="fl w-100 pa2">
          {
            !isAuthenticated() && (
              <button onClick={this.login.bind(this)}>
                Log In
              </button>
            )
          }
          {
            isAuthenticated() && (
              <button onClick={this.logout.bind(this)}>
                Log Out
              </button>
            )
          }
        </div>
      </div>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="sans-serif">
        <Header auth={this.props.auth}/>
      </div>
    );
  }
}

export default App;
