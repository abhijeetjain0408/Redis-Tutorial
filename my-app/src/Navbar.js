//to render navigation bar

import React, { Component } from 'react';
import { Link } from "react-router-dom"; 
import history from './history';

class Navbar extends Component 
{
    constructor(props) {
        super(props);
       
        this.onSubmit = this.onSubmit.bind(this);
        const token = localStorage.getItem('token');
        this.state ={
                token : token,
        }
        
    }
    
    onSubmit() {
        console.log("searched word " +  this.refs.key.value);
        history.push(`/searchresult/${this.refs.key.value}`);
    }
    
    render() 
    {
      const token = this.state.token;
      let link;
      if (token) {
        link = <Logout />;
      } else {
        link = <Login />;
      }
        return (
            
            <nav class="navbar navbar-dark bg-dark">
              <div class="navbar-header">
                <a class="navbar-brand">MoviesInfoSys</a>
              </div>
              <div class="navbar-text text-white big  ">
              <Link to={`/`}>Home</Link> 
              </div>
              <div >
              <form className="form"  onSubmit= {this.onSubmit}>
                    <span className="navbar-text text-white small text-uppercase mr-3"></span>
                    <input 
                        name="search" 
                        className="form-control mr-sm-2 " 
                        type="text" 
                        placeholder="Search"  
                        ref="key"
                         />
                    <button className="btn btn-outline-light my-2 my-sm-0" type="submit">Search</button>
                </form>
              </div>
              <div>
              <div class="navbar-text text-white ">
                {link} 
              </div>
            </div>
            
          </nav>
        );
    }
}

function Login(props) {
  return (
    <div>
    <Link to = {`/login`} >Login</Link><span>&nbsp;</span><span>&nbsp;</span>
    <Link to = {`/`}>Register</Link> 
    </div>
  );
}

function Logout(props) {
  
  return (
    <div>
      <Link to = {`/`} onClick={() => onLogout()} >Logout</Link>
    </div>
    
  );
}

function onLogout () {
  localStorage.clear(); // clear token on logout
  window.location.reload(); // to reload homepage to update navbar
}


export default Navbar;