// to render the home page
import React, { Component } from 'react';
import { Link } from "react-router-dom"; 
import queryString from 'query-string';
import 'bootstrap/dist/css/bootstrap.css';
//const $ = window.$;
    class SearchResult extends Component 
    {
        constructor(props) {
          super(props);
          this.state = {
            movies: [],          
            isLoaded: false,
          }
        }      
        componentDidMount() {
            const values = queryString.parse(this.props.location.search)
            let key = values.search;
          fetch(`http://localhost:5000/search/${key}`)
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
            <div class = "pull left">
            <div className="col-xs-12">
            
            <h4>Search Results</h4>
            {this.state.movies.map((movie => (                  
                               
                <div class="flexbox-container" >   
                <img src={movie.imageURL}  className="img-responsive"  height = "150" width ="150"/><br></br>
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
    export default SearchResult;