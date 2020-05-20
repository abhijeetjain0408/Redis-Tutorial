import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.css';

export default class Signup extends Component {
  constructor(props) {
    super(props)
    this.state = {
      email : '',
      password: '',
      token : '',
      name : ''
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
        name : this.state.name,
        email:this.state.email,
      password:this.state.password,    
        
      }
    console.log("you are here" + this.state.email + " " + this.state.password);
    fetch(`http://localhost:5000/signup`, {
      method: 'POST',
      body: JSON.stringify(User),
      headers: {
        'Content-Type': 'application/json',
      }
    })
    .then(res => {
      if (res.status === 200){
        alert("Registered. Please login."); 
          }
      else{
        const error = new Error(res.body);
        throw error;
        
        }
      } 
    )
    .catch(err => {
      console.error(err);
      alert('Error logging in please try again');
    });
  }
  render() {
    return (
      <form onSubmit={this.onSubmit}>
        <h1>Register</h1>
        <input
          type="name"
          name="name"
          placeholder="Enter name"
          value={this.state.name}
          onChange={this.handleInputChange}
          required
        /><br></br><br></br>
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