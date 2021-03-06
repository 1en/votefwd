// src/Dashboard.js

import React, { Component } from 'react';
import axios from 'axios';
import history from './history';
import { AdoptVoter } from './AdoptVoter';
import { Header } from './Header';
import { Login } from './Login';
import { Qualify } from './Qualify';
import { VoterList } from './VoterList';

class Dashboard extends Component {
  constructor(props) {
    super(props);

    this.handleAdoptedVoter = this.handleAdoptedVoter.bind(this);
    this.handleConfirmSend = this.handleConfirmSend.bind(this);
    this.state = { voters: [], user: {}, isQualified: true }
  }

  getUser() {
    let user_id = localStorage.getItem('user_id');
    if (user_id) {
      axios.get(`${process.env.REACT_APP_API_URL}/user`,
        {
          params: { auth0_id: user_id }
        })
        .then(res => {
          this.setState({ user: res.data[0] }, () => {
            this.isUserQualified();
          })
        })
        .catch(err => {
          console.error(err)
        });
      return true;
    }
    else {
      return false;
    }
  }

  isUserQualified() {
    if (
        this.state.user.is_human_at &&
        this.state.user.accepted_code_at &&
        this.state.user.is_resident_at &&
        this.state.user.zip &&
        this.state.user.full_name
      )
    {
      this.setState({ isQualified: true })
    }
    else {
      this.setState({ isQualified: false })
    }
  }

  getAdoptedVoters() {
    let user_id = localStorage.getItem('user_id');
    if(user_id) {
      axios.get(`${process.env.REACT_APP_API_URL}/voters`,
        {
          params: { user_id: user_id }
        })
        .then(res => {
          this.setState( {voters: res.data} );
        })
        .catch(err => {
          console.error(err)
        });
    }
  }

  handleAdoptedVoter(voter, pdfUrl) {
    voter.plea_letter_url = pdfUrl;
    this.setState({ voters: this.state.voters.concat([voter])});
  }

  handleConfirmSend(voter) {
    axios({
      method: 'PUT',
      url: `${process.env.REACT_APP_API_URL}/voter/confirm-send`,
      data: { id: voter.id }
      })
      .then(res => {
        voter.confirmed_sent_at = res.data[0].confirmed_sent_at;
        var voters = this.state.voters;
        // find the position of the voter in the voters array
        var index = voters.map(function(voter) {return voter.id}).indexOf(voter.id);
        if (index !== -1) {
          voters[index] = voter;
        }
        this.setState({ voters: voters });
      })
      .catch(err => {
        console.error(err);
    })
  }

  componentWillMount(){
    if (!this.getUser()) {
      history.replace('/');
    }
    this.getAdoptedVoters();
  }

  render() {
    return (
      <div className="tc">
        <Header auth={this.props.auth} />
        { this.props.auth.isAuthenticated() ? (
          <div>
            <Qualify isQualified={this.state.isQualified} user={this.state.user} />
            <AdoptVoter handleAdoptedVoter={this.handleAdoptedVoter}/>
            <VoterList voters={this.state.voters} confirmSend={this.handleConfirmSend}/>
          </div>
        ) : (
          <div>
            <Login auth={this.props.auth} buttonText="Sign Up or Log In To Send Letters" />
          </div>
        )}
      </div>
    );
  }
}

export default Dashboard
