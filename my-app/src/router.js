//route paths for navigating from one compononent to another based on user input
import React, { Component } from 'react';
import { Switch, Route } from "react-router-dom";
import Homepage from './Homepage';
import MovieDetials from './MovieDetails';
import SearchResult from  './SearchResult';
import Login from './Login';
import Signup from './Signup';
import Profile from './Profile';
class Router extends Component {
    render() {
      return (          
        <Switch>
          <Route exact path="/" component={Homepage} />
          <Route exact path="/moviedetails/:id" component= {props=> <MovieDetials id={props.match.params.id}/>}/>
          <Route path="/searchresult" component= {SearchResult}/>}/>
          <Route path="/login" component= {Login}/>
          <Route path="/signup" component= {Signup}/>
          <Route path ="/profile" component = {Profile}/>
        </Switch>
      );
    }
}
export default Router;