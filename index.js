const express = require('express');
const logger = require('morgan');
const path = require('path');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const redis = require ('redis');
const mongoose = require ('mongoose');
const neo4j = require('neo4j-driver');


const Movies = require ('./movies')

// mongo connection using mongoose library
mongoose.connect("mongodb://localhost:27017/Movies", {
    useNewUrlParser: true,
    useUnifiedTopology : true
  });

const PORT = process.env.PORT || 5000;

const REDIS_PORT = process.env.PORT || 6379;
const client = redis.createClient(REDIS_PORT); // redis connection 
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'Abhijeet')); //neo4j connection
const session = driver.session();
const app = express();
// Enable express to parse body data from raw application/json data
app.use(bodyParser.json());
// Enables express to parse body data from x-www-form-encoded data
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

 async function getMoviebyTitle(req,res) {
        try{
             const result = [];
            
            const searchkey = req.params.name;
            console.log("Fetching Movie by Title"+ searchkey);
            //finding movie details from mongo
            Movies.find({"title" : { "$regex": searchkey , "$options": "i" }}, function(err, items){
                var movie = [];
                var z = "";
                var x = searchkey ;
                
                for (var i = 0 ; i < items.length ; i++){    
                  movie.push(items[i]);
                  console.log(movie);
                    z= items[i].title;
                    if (req.params.username){
                    key = req.params.username +  '-searched';
                    searchcount = req.params.username +  '-count';
                    client.sadd(key,JSON.stringify(z) );//setting the search result for a particular user in redis
                    client.incr(searchcount );
                }}
                    //searching related movies using gerne and director in neo4j
                    session.run('MATCH (m:movie) WHERE m.name = $title OPTIONAL MATCH (m)-[:Belong_To]->()<-[:Belong_To]-(x) WITH m, COLLECT(x) AS xs OPTIONAL MATCH (m)<-[:Directed]-()-[:Directed]->(y) WITH m, xs, COLLECT(y) AS ys UNWIND (xs + ys) AS otherMovie RETURN otherMovie',
                        { title:searchkey}
                        
                        )
                        
                        .then(function (recommendations) {
                            recommendations.records.forEach(function(record){
                         
                                result.push(record._fields[0].properties.name);  
                            })
                            console.log(result);
                            var y = [movie , result];
                            client.setex ( x,600, JSON.stringify(y)); // storing data in redis
                            res.json(y);
                            })
                        .catch(function(error){
                            console.log(error);
                        })   
                  }
              )   
        }
        catch(err){
            console.error(err);
            res.status(500);
        }
    }
async function getMoviebyActor(req,res) {
    try{
        console.log("Fetching Data via actor..");
        const searchkey = req.params.name;
        console.log(searchkey);
        
          const movies =[];
          session.run("Match (a:actor) where a.name = $actor match (a)-[:Acted_In]-(x) with COLLECT(x) as xs UNWIND (xs) as movies Return movies",
          { actor: searchkey }
          
          )
              .then(function (results) {
            results.records.forEach(function(record){
            movies.push(record._fields[0].properties.name);        
              })
              console.log("Data is fetched from Neo4j");
              var x = searchkey ;
              console.log(movies);
              client.setex ( x,600, JSON.stringify(movies));
              if (req.params.username){
                key = req.params.username +  '-searched';
                searchcount = req.params.username +  '-count'
                client.incr(searchcount );
                  movies.forEach(element => {
                    client.sadd(key,JSON.stringify(element) );
                       });
                    }
              res.json(movies);
              
              })
              .catch(function(error){
              console.log(error);  
          }) 
    }
    catch(err){
        console.error(err);
        res.status(500);
    }
}


async function getMoviebyDirector(req,res) {
    try{
        console.log("Fetching Data via Director..");

        const searchkey = req.params.name;
        console.log(searchkey);
    
          const movies =[];
          session.run("Match (d:director) where d.name = $director match (d)-[:Directed]-(x) with COLLECT(x) as xs UNWIND (xs) as movies Return movies",
          { director: searchkey }
          
          )
              .then(function (results) {
              results.records.forEach(function(record){ 
                  //console.log("record._fields[0].properties = ",record._fields[0].properties.name);
                movies.push(record._fields[0].properties.name);     
              })
              console.log("Data is fetched from Neo4j");
              var x = searchkey ;
              console.log(movies);
              client.setex ( x,600, JSON.stringify(movies));
              
              if (req.params.username){
                key = req.params.username +  '-searched';
                searchcount = req.params.username +  '-count';
                client.incr(searchcount );

                  movies.forEach(element => {
                    client.sadd(key,JSON.stringify(element) );
                       });
                    }
                    res.json(movies);             
                    })
              .catch(function(error){
              console.log(error);  
          }) 
    }
    catch(err){
        console.error(err);
        res.status(500);
    }
}

async function getMoviebyGenre(req,res) {
    try{
        console.log("Fetching Movies with Genre..");

        //const { username } = req.params.username;
        const searchkey = req.params.name;
        console.log(searchkey);
        
    const movies =[];

        session.run("Match (g:genre) where g.name = $genre match (g)-[:Belong_To]-(x) with COLLECT(x) as xs UNWIND (xs) as movies Return movies",
        { genre: searchkey }

        )

            .then(function (results) {

            results.records.forEach(function(record){
                
                //console.log("record._fields[0].properties = ",record._fields[0].properties.name);
                movies.push(record._fields[0].properties.name);  
                
            })
            console.log("Data is fetched from Neo4j");
            var x = searchkey ;
            console.log(movies);
            client.setex ( x,600, JSON.stringify(movies));
            if (req.params.username){
                key = req.params.username +  '-searched'
                searchcount = req.params.username +  '-count'
                client.incr(searchcount );
                  movies.forEach(element => {
                    client.sadd(key,JSON.stringify(element) );
                       });
                    }

            res.json(movies);

            })
            .catch(function(error){
            console.log(error); 
        })    
    }
    catch(err){
        console.error(err);
        res.status(500);
    }
}

async function getMoviebyPreference(req,res) {
    try{
        console.log("Fetching Movies by User Preference ..");
        const searchkey = req.params.username;
        const result =[];
        console.log(searchkey);
        session.run('MATCH (u:username) WHERE u.name = $username MATCH (u)-[:Prefers]->()<-[:Belong_To]-(x) WITH  COLLECT(x) AS xs UNWIND (xs) AS Recommendation RETURN Recommendation',
        { username: searchkey }
        
        )
        
            .then(function (recommendations) {
            recommendations.records.forEach(function(record){
            //console.log("record._fields[0].properties = ",record._fields[0].properties.name);
             result.push(record._fields[0].properties.name);   
            })
            //console.log(result);
            var x = searchkey ;
            console.log(result);
            client.setex ( x,600, JSON.stringify(result));
            res.json(result);
            })
            .catch(function(error){
            console.log(error);
        })    

    }
    catch(err){
        console.error(err);
        res.status(500);
    }
}


function cache(req, res, next){
    
    var searchkey=[];
    
    if (!req.params.name){
        searchkey=req.params.username
        console.log(searchkey);   
    }
    else if(req.params.name) {
        searchkey = req.params.name;
        console.log(searchkey);

    }
    movies = [];
    
    client.get(searchkey, (err ,data)=>{
            if (err) throw err;
            if (data !== null){
                console.log(" Data is coming from redis");
                console.log(JSON.parse(data));
                result = JSON.parse(data);
                res.json(result);
            }else{
                next(); 
            }})     
    }

function getSearchBasedResutls(req,res){
    key = req.params.username +  '-searched';
    client.smembers( key , (err,data)=>{
        if (err) throw err;
        if (data){
            res.json(data);
        }

    })
}

function getAvailableOffers(req,res){
    key= req.params.username+'-count';
    client.get(key,(err,data)=>{
        if (err) throw err;
        if (data){
            count= data;
            console.log(data);
            if (data == 5){
                session.run('MATCH (a:username),(b:promotion) WHERE a.name = $username AND b.OnCount = $count CREATE (b)-[r:Available_For]->(a) RETURN b ',
                { username: req.params.username,
                count : count  }
                
                )
                
                    .then(function (result) {
                    recommendations.records.forEach(function(record){
                    console.log("record._fields[0].properties = ",record._fields[0].properties.name);
                     result.push(record._fields[0].properties.name);   
                    })
                    console.log(result);
                    console.log(result);
                    res.json(result);
                    })
                    .catch(function(error){
                    console.log(error);
                })  
            }
        }
    })
}

app.get('/movie/:name',cache, getMoviebyTitle);

app.get('/:username/movie/:name',cache, getMoviebyTitle);

app.get('/movie/actor/:name', getMoviebyActor);

app.get('/:username/actor/:name',cache, getMoviebyActor);

app.get('/movie/genre/:name',cache, getMoviebyGenre) ;

app.get('/:username/genre/:name',cache, getMoviebyGenre);

app.get('/movie/director/:name',cache, getMoviebyDirector);

app.get('/:username/director/:name',cache, getMoviebyDirector);

app.get('/userpreference/:username',cache, getMoviebyPreference);

app.get('/search/:username',getSearchBasedResutls);

app.get('/availableoffers/:username', getAvailableOffers)




app.listen(5000,() =>{
    console.log(`App listening on port ${PORT}`);
});