//route paths for navigating from one compononent to another based on user input
import React, { Component } from 'react';
import { Switch, Route } from "react-router-dom";
import Homepage from './Homepage';
import MovieDetials from './MovieDetails';
import SearchResult from  './SearchResult';
import Login from './Login'
class Router extends Component {
    render() {
      return (          
        <Switch>
          <Route exact path="/" component={Homepage} />
          <Route exact path="/moviedetails/:id" component= {props=> <MovieDetials id={props.match.params.id}/>}/>
          <Route path="/searchresult" component= {SearchResult}/>}/>
          <Route path="/login" component= {Login}/>}/>
        </Switch>
      );
    }
}
export default Router;