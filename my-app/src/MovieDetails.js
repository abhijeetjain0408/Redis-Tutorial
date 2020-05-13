// to render the home page
import React, { Component } from 'react';
import { Link } from "react-router-dom"; 
const $ = window.$;

    class MovieDetails extends Component 
    {
        constructor(props) {
          super(props);
          this.state = {
            movie: [],
               mov : [],  
               actor:[],
               recom : [],     
            isLoaded: false,
          }
          
        }      
        componentDidMount() {
            let id = this.props.id           
            fetch(`http://localhost:5000/movie/details/${id}`)
            .then(res => {
              return res.json();})
            .then(movie => {
                let recom = [];
                for (let i = 1 ; i< movie.length ; i++){
                    recom.push(movie[i]);
                    
                }                
                this.setState({ movie,
                    recom,
                    actor : movie[0].actor,
                    mov : movie[0],
                     });
                     
            })
            .catch(console.log('error'));
        } 
        
        componentDidUpdate(prevProps) {
                if (this.props.id !== prevProps.id){ 
                    let id = this.props.id               
                    fetch(`http://localhost:5000/movie/details/${id}`)
                    .then(res => {
                    return res.json();})
                    .then(movie => {
                        let recom = [];
                        for (let i = 1 ; i< movie.length ; i++){
                            recom.push(movie[i]);
                            
                        }                
                        this.setState({ movie,
                            recom,
                            actor : movie[0].actor,
                            mov : movie[0],
                            });
                            
                    })
                .catch(console.log('error'));
                }
        }
        
        render() {
            
          return (
            <div className="container">
            <div className ="centre">
            <div className="col-xs-12"> 
            <h3>{this.state.mov.title}</h3>
            <img src={this.state.mov.imageURL}  className="img-responsive"  height = "120" width ="120"/>
            <h5 className="card-genre" >Genre : {this.state.mov.genre}</h5> 
            <h5 className="card-director">Directed by : {this.state.mov.director}</h5>
            
            {
                this.state.actor.map((actor => (
                    <h5 className="card-actor">Actor: {actor.name}</h5>
                        )))
            }
            <h2> Recommendations</h2>
            {
                this.state.recom.map(( recom =>(
                    <div className = "flexbox-container">
                        <img src={recom.imageURL}  className="img-responsive"  height = "120" width ="120"/><br></br>
                        <Link to={`/moviedetails/${recom._id}`} >{recom.title}</Link>
                    </div>
                    
                )))
            }
            
            
            
          
          </div>
         </div>
         </div>
        );
      }
    }
    export default MovieDetails;