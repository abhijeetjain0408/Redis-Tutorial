//to render navigation bar

import React, { Component } from 'react';
import { Link } from "react-router-dom"; 
import history from './history';

class Navbar extends Component 
{
    constructor(props) {
        super(props);
       
        this.onSubmit = this.onSubmit.bind(this);
        
        
    }
    
    onSubmit() {
        console.log("searched word " +  this.refs.key.value);
        history.push(`/searchresult/${this.refs.key.value}`);
    }

    render() 
    {
        return (
            
            <nav class="navbar top navbar-dark bg-primary">
            <div class="container-fluid">
              <div class="navbar-header">
                <a class="navbar-brand">Movies</a>
              </div>
              <div class="navbar-text text-white big float-left">
              <Link to={`/`}>Home</Link> 
              </div>
              <div>
              <form className="form-inline my-2 my-lg-0 pull-right" onSubmit= {this.onSubmit}>
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
                <a href="#"><span class="glyphicon glyphicon-user"></span> Sign Up </a>
                <a href="#"><span class="glyphicon glyphicon-log-in"></span> Login</a>
              </div>
            </div>
            </div>
          </nav>
        );
    }
}
export default Navbar;