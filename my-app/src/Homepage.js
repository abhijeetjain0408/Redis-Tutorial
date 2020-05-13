// to render the home page
import React, { Component } from 'react';
import { Link } from "react-router-dom"; 
//const $ = window.$;
    class Homepage extends Component 
    {
        constructor(props) {
          super(props);
          this.state = {
            movies: [],          
            isLoaded: false,
          }
        }      
        componentWillMount() {
          fetch('http://localhost:5000/movie/top10')
          .then(res => {
              return res.json();})
          .then(movies => {
            this.setState({ movies });
            
          })
          .catch(console.log('error'));
        }        
        render() {
          return (
            <div className="flexbox-container">
            <div class ="left">
            <div className="col-xs-12">
            
            <h4>Top Trending Movies</h4>
            {this.state.movies.map((movie => (                  
                               
                <div class="flexbox-container" >   
                <img src={movie.imageURL}  className="img-responsive"  height = "120" width ="120"/><br></br>
                <Link to={`/moviedetails/${movie._id}`}>{movie.title}</Link>                                                 
                </div>
              
            )
          ))}
          </div>
         </div>
         </div>
        );
      }
    }
    export default Homepage;