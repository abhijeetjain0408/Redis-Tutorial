// to render the home page
import React, { Component } from 'react';
import { Link } from "react-router-dom"; 
const $ = window.$;
    export default class Homepage extends Component 
    {
      constructor(props) {
        super(props);
        const token = localStorage.getItem('token');
        this.state = {
          movies: [],
          recommovies: [],          
          isLoaded: false,
          token : token,
        }
      }      
      componentDidMount() {
        fetch('http://localhost:5000/movie/top10')
          .then(res1 => {
              return res1.json();})
          .then(movies => {
              this.setState ({ movies : movies});
              console.log("response1" + this.state.movies)
              if (this.state.token !== null){
                console.log(this.state.token)
                fetch(`http://localhost:5000/userpreference`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${this.state.token}`,
                }
                  })
                  .then(res2 => {
                    return res2.json();
                    
                  })
                  .then(recommovies => {
                    this.setState({ recommovies :recommovies });
                    console.log("response2" + this.state.recommovies);
                    
                  })
          }})
          .catch(console.log('error'));
      }   
      

      render() {
          const token = this.state.token;
       if (this.state.recommovies.length > 0 && this.state.movies.length>0)
          return (
            <div>
            <div className="flexbox-container">
            <div class ="left">
            <div className="col-xs-12">
            <h4>Top Trending Movies</h4>
            {this.state.movies.map((movie => (                                 
                <div class="flexbox-container" >   
                <div class = "card">
                <img src={movie.imageURL}   height = "150" width ="150"/><br></br>
                <div class="card-body">
                <Link to={`/moviedetails/${movie._id}`} class = "card-title">{movie.title}</Link>    
                </div>                                             
                </div>
                </div>
                )))}
                        
            </div>
            </div>
            </div>
            <div className="flexbox-container">
            <div class ="left">
            <div className="col-xs-12">
            <h4>Recommended For You</h4>
            {this.state.recommovies.map((recommovie => (                                 
                <div class="flexbox-container" >   
                <img src={recommovie.imageURL}  className="img-responsive"  height = "150" width ="150"/><br></br>
                <Link to={`/moviedetails/${recommovie._id}`}>{recommovie.title}</Link>                                                 
                </div>
              
                  )))}
                        
            </div>
            </div>
            </div>
            </div>
         
        );
        if (this.state.recommovies.length == 0)
          return (
            <div>
            <div className="flexbox-container">
            <div class ="left">
            <div className="col-xs-12">
            <h4>Top Trending Movies</h4>
            {this.state.movies.map((movie => (                                 
                <div class="flexbox-container" >   
                <div class = "card">
                <img src={movie.imageURL}   height = "150" width ="150"/><br></br>
                <div class="card-body">
                <Link to={`/moviedetails/${movie._id}`} class = "card-title">{movie.title}</Link>    
                </div>                                             
                </div>
                </div>
                )))}
                        
            </div>
            </div>
            </div>
            </div>
         
        );
      }
    }
    
    