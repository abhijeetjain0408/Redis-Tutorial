const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require ('redis');
const mongoose = require ('mongoose');
const neo4j = require('neo4j-driver');

const Movies = require ('./movies'); // importing movies schema

// mongo connection using mongoose library
mongoose.connect("mongodb://localhost:27017/Movies", {
    useNewUrlParser: true,
    useUnifiedTopology : true
  });

const PORT = process.env.PORT || 5000;

const REDIS_PORT = process.env.PORT || 6379;
const redisclient = redis.createClient(REDIS_PORT); // redis connection 
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
                  redisclient.sadd(key,JSON.stringify(z) );//setting the search result for a particular user in redis for search history
                  redisclient.incr(searchcount ); // setting the search count for a user in redis for offers
                }}
                    //getting movie recommendation with the searched movie's genre and director from neo4j
                  session.run('MATCH (m:movie) WHERE m.name = $title OPTIONAL MATCH (m)-[:Belong_To]->()<-[:Belong_To]-(x) WITH m, COLLECT(x) AS xs OPTIONAL MATCH (m)<-[:Directed]-()-[:Directed]->(y) WITH m, xs, COLLECT(y) AS ys UNWIND (xs + ys) AS otherMovie RETURN otherMovie',
                            { title:searchkey}
                        )
                        
                         .then(function (recommendations) {
                            recommendations.records.forEach(function(record){
                                result.push(record._fields[0].properties.name);  
                            })
                            console.log(result);
                            var y = [movie , result];
                            redisclient.setex ( x,600, JSON.stringify(y)); // storing searched movie data and related recommendations in redis
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
        // Getting movie list based on actor search from Neo4j
        session.run("Match (a:actor) where a.name = $actor match (a)-[:Acted_In]-(x) with COLLECT(x) as xs UNWIND (xs) as movies Return movies",
            { actor: searchkey }
                )
               .then(function (results) {
                    results.records.forEach(function(record){
                        movies.push(record._fields[0].properties.name);  // pushing the search record in array       
                        })
                console.log("Data is fetched from Neo4j");
                var x = searchkey ;
                console.log(movies);
                redisclient.setex ( x,600, JSON.stringify(movies));// storing search result in redis for cache
                if (req.params.username){
                key = req.params.username +  '-searched';
                searchcount = req.params.username +  '-count'
                redisclient.incr(searchcount ); // setting the search count for a user in redis for offers
                movies.forEach(element => {
                    redisclient.sadd(key,JSON.stringify(element) );//setting the search result for a particular user in redis for search history
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
        // Getting movie list based on director search from Neo4j
        session.run("Match (d:director) where d.name = $director match (d)-[:Directed]-(x) with COLLECT(x) as xs UNWIND (xs) as movies Return movies",
                    { director: searchkey }
                    )
               .then(function (results) {
                    results.records.forEach(function(record){ 
                        console.log("record._fields[0].properties = ",record._fields[0].properties.name);
                        movies.push(record._fields[0].properties.name);     
                    })
                    console.log("Data is fetched from Neo4j");
                    var x = searchkey ;
                    console.log(movies);
                    redisclient.setex ( x,600, JSON.stringify(movies));// storing search result in redis for cache
                    if (req.params.username){
                        key = req.params.username +  '-searched';
                        searchcount = req.params.username +  '-count';
                        redisclient.incr(searchcount);// setting the search count for a user in redis for offers
                        movies.forEach(element => {
                            redisclient.sadd(key,JSON.stringify(element));//setting the search result for a particular user in redis for search history
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
        const searchkey = req.params.name;
        console.log(searchkey);
        const movies =[];
        // Getting movie list based on Genre search from Neo4j
        session.run("Match (g:genre) where g.name = $genre match (g)-[:Belong_To]-(x) with COLLECT(x) as xs UNWIND (xs) as movies Return movies",
                    { genre: searchkey }
                )
                .then(function (results) {
                    results.records.forEach(function(record){
                        console.log("record._fields[0].properties = ",record._fields[0].properties.name);
                        movies.push(record._fields[0].properties.name);  
                    })
                    console.log("Data is fetched from Neo4j");
                    var x = searchkey ;
                    console.log(movies);
                    redisclient.setex ( x,600, JSON.stringify(movies));// storing search result in redis for cache
                    if (req.params.username){
                        key = req.params.username +  '-searched'
                        searchcount = req.params.username +  '-count'
                        redisclient.incr(searchcount );// setting the search count for a user in redis for offers
                        movies.forEach(element => {
                            redisclient.sadd(key,JSON.stringify(element));//setting the search result for a particular user in redis for search history
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
        //Getting movie list based on the preferred genres for a user 
        session.run('MATCH (u:username) WHERE u.name = $username MATCH (u)-[:Prefers]->()<-[:Belong_To]-(x) WITH  COLLECT(x) AS xs UNWIND (xs) AS Recommendation RETURN Recommendation',
                    { username: searchkey }
                    )
        
                .then(function (recommendations) {
                    recommendations.records.forEach(function(record){
                        //console.log("record._fields[0].properties = ",record._fields[0].properties.name);
                        result.push(record._fields[0].properties.name);   
                    })
                    var x = searchkey ;
                    console.log(result);
                    redisclient.setex ( x,600, JSON.stringify(result));// storing the result in redis for a user for cache
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
    var searchkey;
    if (!req.params.name){
        searchkey=req.params.username //setting search key for cache search
        console.log(searchkey);   
    }
    else if(req.params.name) {
        searchkey = req.params.name;//setting search key for cache search
        console.log(searchkey);
    }
    movies = [];
    // getting data from client based on searchkey
    redisclient.get(searchkey, (err ,data)=>{
            if (err) throw err;
            if (data !== null){
                console.log(" Data is coming from redis"); 
                console.log(JSON.parse(data));
                result = JSON.parse(data); 
                res.json(result);
            }else{
                next();  // calling next function in the api if no result found in redis cache for the search 
            }})     
    }

// function to get the list of the movies based on users search history
function getSearchBasedResutls(req,res){
    key = req.params.username +  '-searched';
    redisclient.smembers( key , (err,data)=>{
        if (err) throw err;
        if (data){
            res.json(data);
        }

    })
}

function getAvailableOffers(req,res){
    key= req.params.username+'-count';
    offers = [];
    redisclient.get(key,(err,data)=>{ //getting the search count performed by the user
        if (err) throw err;
        if (data){
            console.log(data);
            // creating a relationship between the user and the offer based on search count
            session.run("MATCH (a:username),(b:promotion) WHERE a.name = $username AND b.OnCount <= $count AND b.Status = 'Unused' MERGE (b)-[r:Available_For]->(a) RETURN b ",
                    { username: req.params.username,
                     count : neo4j.int(data) }
                        )
                    .then(function (result) {
                        result.records.forEach(function(record){
                            offers.push(record._fields[0].properties.name); //storing the result in offers array
                        })
                        console.log(offers);
                        res.json(offers);
                    })
                    .catch(function(error){
                    console.log(error);
                    })  
        }
    })
}

// A user can add movies to wishlist.(Raj)
async function addMoviestoUserlist(req,res) {
    try{
        console.log("Adding movie to wishlist using Neo4j...");
        const searchkey = req.params.name;
        const moviename = req.params.title;
        results = true;
        console.log(searchkey);
        console.log(moviename);
        session.run('MATCH (a:Movie), (b:us_name) WHERE a.name = $movietitle AND b.email = $username MERGE (a)-[r: IN_Wishlist]->(b) ON CREATE SET r.alreadyExisted=false  ON MATCH SET r.alreadyExisted=true RETURN r.alreadyExisted',
            {   username: searchkey,
                movietitle : moviename
            }
        ).then(function (relationshipexist) {
                results = relationshipexist;                
                res.json(results);
            }).catch(function(error){
                    console.log(error);
                }) 
    }
    catch(err){
        console.error(err);
        res.status(500);
    }
}

app.get('/movie/:name/:title', addMoviestoUserlist);

app.get('/movie/:name',cache, getMoviebyTitle); // for searching movie by title 

app.get('/:username/movie/:name',cache, getMoviebyTitle);// for searching movie by title for a registered user

app.get('/movie/actor/:name', getMoviebyActor);// for searching movies by actor

app.get('/:username/actor/:name',cache, getMoviebyActor);// for searching movies by actor for a registered user

app.get('/movie/genre/:name',cache, getMoviebyGenre) ; // for searching movies by genre

app.get('/:username/genre/:name',cache, getMoviebyGenre); // for searching movies by genre for a registered user

app.get('/movie/director/:name',cache, getMoviebyDirector);// for searching movies by director name

app.get('/:username/director/:name',cache, getMoviebyDirector);// for searching movies by director for a registered user

app.get('/userpreference/:username',cache, getMoviebyPreference); // for searching movies list based on the genre preferred by a registered user

app.get('/search/:username',getSearchBasedResutls); // for getting the movie list based on search history of the user

app.get('/:username/availableoffers', getAvailableOffers) // for getting the list of the offers available for the user




app.listen(5000,() =>{
    console.log(`App listening on port ${PORT}`);
});