import React, { Component } from 'react';
import decode from 'jwt-decode';
export default class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      email : '',
      password: '',
      isLoggedIn: 'false',
      token : ''
    };
  }
  handleInputChange = (event) => {
    const { value, name } = event.target;
    this.setState({
      [name]: value
    });
  }
  onSubmit = (event) => {
    event.preventDefault();
    const User={
      email:this.state.email,
      password:this.state.password,        
      }
    console.log("you are here" + this.state.email + " " + this.state.password);
    fetch(`http://localhost:5000/authenticate`, {
      method: 'POST',
      body: JSON.stringify(User),
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(res => {
      if (res.status === 200){
        return res.json();  
        }
      else{
        const error = new Error(res.error);
        throw error;
        }
      } 
    )
    .then(token => {
      
        this.setState(token); //setting token in state
        localStorage.setItem('token' ,this.state.token); //setting token value in local storage
        this.props.history.push('/'); //redirecting to homepage after successfull login
        window.location.reload();      //reloading post login to update navbar and homepage
    })
    .catch(err => {
      console.error(err);
      alert('Error logging in please try again');
    });
  }
  render() {
    return (
      <form onSubmit={this.onSubmit}>
        <h1>Login</h1>
        <input
          type="email"
          name="email"
          placeholder="Enter email"
          value={this.state.email}
          onChange={this.handleInputChange}
          required
        /><br></br><br></br>
        <input
          type="password"
          name="password"
          placeholder="Enter password"
          value={this.state.password}
          onChange={this.handleInputChange}
          required
        /><br></br>
       <input type="submit" value="Submit"/>
      </form>
    );
  }
}