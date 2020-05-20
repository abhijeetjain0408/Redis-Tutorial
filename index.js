require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require ('redis');
const mongoose = require ('mongoose');
const neo4j = require('neo4j-driver');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const Movies = require ('./movies'); // importing movies schema
const Users = require('./user.js');
const cookieParser = require('cookie-parser');
const withAuth = require('./middleware');
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
// mongo connection using mongoose library
mongoose.connect("mongodb://localhost:27017/Movies", {
    useNewUrlParser: true,
    useUnifiedTopology : true});

mongoose.set('useFindAndModify', false);
const PORT = process.env.PORT || 5000;

const REDIS_PORT = process.env.PORT || 6379;
const redisclient = redis.createClient(REDIS_PORT); // redis connection 
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'Abhijeet')); //neo4j connection
const session = driver.session();
//const tx = session.beginTransaction();
const secret = 'ABCDEF$123';

// Enable express to parse body data from raw application/json data
app.use(bodyParser.json());
// Enables express to parse body data from x-www-form-encoded data
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
   next();
  });

app.use(express.static(path.join(__dirname, 'public')));



async function getMoviebyTitle(req,res) {
        try{
            const result = [];
            const searchkey = req.params.id;
        
            //finding movie details from mongo
            Movies.find({ "_id" : searchkey} , function(err, items){
              if (items.length !== 0 ){
                var movie = [];
                var z = "";
                var x = searchkey ;
                for (var i = 0 ; i < items.length ; i++){    
                  movie.push(items[i]);
                  z= items[i].title;
                  if (req.params.username){
                    key = req.params.username +  '-searched';
                    searchcount = req.params.username +  '-count';
                    redisclient.sadd(key,JSON.stringify(z) );//setting the search result for a particular user in redis for search history
                    redisclient.incr(searchcount ); // setting the search count for a user in redis for offers
                    }}
                    //getting movie recommendation with the searched movie's genre and director from neo4j
                session.run('MATCH (m:movie) WHERE m._id = $id SET  m.searchcount= m.searchcount+ 1 WITH m OPTIONAL MATCH (m)-[:Belong_To]->()<-[:Belong_To]-(x) WITH m, COLLECT(x) AS xs OPTIONAL MATCH (m)<-[:Directed]-()-[:Directed]->(y) WITH m, xs, COLLECT(y) AS ys UNWIND (xs + ys) AS otherMovie RETURN distinct otherMovie',
                            { id:searchkey}
                        )
                        
                        .then(function (recommendations) {
                            recommendations.records.forEach(function(record){
                                result.push(record._fields[0].properties);  
                            })
                            
                            var y = movie.concat(result);
                            redisclient.setex ( x,600, JSON.stringify(y)); // storing searched movie data and related recommendations in redis
                            res.json(y);
                            })
                        .catch(function(error){
                            console.log(error);
                        })   
                  }
                if(items.length=== 0){
                    res.send("Invalid search key");
                }}
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
        session.run("Match (a:actor) where a.name = $actor match (a)-[:Acted_In]->(x) with COLLECT(x) as xs UNWIND (xs) as movies Return movies",
            { actor: searchkey }
                )
               .then(function (results) {
                   
                  if (results.records.length == 0){
                    res.send("Incorrect search") 
                    }
                  else{
                    results.records.forEach(function(record){
                        movies.push(record._fields[0].properties.name);  // pushing the search record in array       
                        })
                    console.log("Data is fetched from Neo4j");
                    redisclient.setex ( searchkey,600, JSON.stringify(movies));// storing search result in redis for cache
                    if (req.params.username){
                        key = req.params.username +  '-searched';
                        searchcount = req.params.username +  '-count'
                        redisclient.incr(searchcount ); // setting the search count for a user in redis for offers
                        movies.forEach(element => {
                            redisclient.sadd(key,JSON.stringify(element) );//setting the search result for a particular user in redis for search history
                        });
                    }
                    res.json(movies);
                    }
                  
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
        session.run("Match (d:director) where d.name = $director match (d)-[:Directed]->(x) with COLLECT(x) as xs UNWIND (xs) as movies Return movies",
                    { director: searchkey }
                    )
               .then(function (results) {

                    if (results.records.length == 0){
                    res.send("Incorrect search") 
                    }

                    else {
                    results.records.forEach(function(record){ 
                        console.log("record._fields[0].properties = ",record._fields[0].properties.name);
                        movies.push(record._fields[0].properties.name);     
                    })
                    console.log("Data is fetched from Neo4j");
                    
                    console.log(movies);
                    redisclient.setex ( searchkey,600, JSON.stringify(movies));// storing search result in redis for cache
                        if (req.params.username){
                            key = req.params.username +  '-searched';
                            searchcount = req.params.username +  '-count';
                            redisclient.incr(searchcount);// setting the search count for a user in redis for offers
                                movies.forEach(element => {
                            redisclient.sadd(key,JSON.stringify(element));//setting the search result for a particular user in redis for search history
                        });
                    }
                    res.json(movies); 
                }
                           
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
                  if(results.records.length > 0){
                    results.records.forEach(function(record){
                        console.log("record._fields[0].properties = ",record._fields[0].properties.name);
                        movies.push(record._fields[0].properties.name);  
                    })
                    console.log("Data is fetched from Neo4j");
                    
                    console.log(movies);
                    redisclient.setex ( searchkey,600, JSON.stringify(movies));// storing search result in redis for cache
                    if (req.params.username){
                        key = req.params.username +  '-searched'
                        searchcount = req.params.username +  '-count'
                        redisclient.incr(searchcount );// setting the search count for a user in redis for offers
                        movies.forEach(element => {
                            redisclient.sadd(key,JSON.stringify(element));//setting the search result for a particular user in redis for search history
                        });
                    }
                    res.json(movies);
                }
                  else{
                      res.send("Incorrect Search");
                  }
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
        searchkey=req.params.username; //setting search key for cache search   
    }
    else if(req.params.name) {
        searchkey = req.params.name; //setting search key for cache search
    }
    movies = [];
    // getting data from client based on searchkey
    redisclient.get(searchkey, (err ,data)=>{
            if (err) throw err;
            if (data !== null){
                console.log(" Data is coming from redis"); 
                session.run('MATCH (m:movie) WHERE m.name = $title SET  m.searchcount= m.searchcount+ 1 ',
                {title : searchkey})
                       .then(function (result) {
                             })
                       .catch(function(error){
                console.log(error);
                })
                //console.log(JSON.parse(data));
                result = JSON.parse(data); 
                if (req.params.username){
                    searchcount =req.params.username +  '-count';
                    redisclient.incr(searchcount );
                }
                res.json(result);
            }
            else{
                next();  // calling next function in the api if no result found in redis for the search 
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
        if(!data){
            res.send('You dont have any search history');
        }

    })
}

function getAvailableOffers(req,res){
    key= req.params.username+'-count';
    
    redisclient.get(key,(err,data)=>{ //getting the search count performed by the user
        if (err) throw err;
        if(data === null || data <5 ){
            res.send("No offers Available");
        }
        else if (data){
            
            if( 5<= data && data <10 ){
                offername = "free lunch coupons";
            }
            else if( 10<= data && data < 50){
                offername = "free movie tickets";
                
            }
            // creating offer for user based on search count
            session.run("Match (u:username) where u.name = $username Merge (p:promotion {name:$offer})-[:Available_For]-> (u) on create SET p.offercode = apoc.text.random(7,'A-Za-z0-9') ",
                    { username: req.params.username,
                     offer: offername }
                        )
                    .then(function (result) {
                        offerlist = [];
                        session.run(" Match ( u: username) where u.name = $username Match (u)<-[:Available_For]-(x) Return x",
                        { username: req.params.username }
                                )
                                .then (function (offers){
                                    offers.records.forEach(function(record){
                                        offerlist.push(record._fields[0].properties);
                                    })
                                    res.json(offerlist);
                       
                                })
                                .catch(function(error){
                                    console.log(error);
                                })
                        
                    })
                    .catch(function(error){
                    console.log(error);
                    })  
        }
        
    })
}
function getTopMovies(req,res){
    
    trending = [];
    session.run("MATCH (m:movie) RETURN m ORDER BY m.searchcount DESC LIMIT 10 ",
        )
    .then(function (result) {
        result.records.forEach(function(record){
            trending.push(record._fields[0].properties) //storing the result in trending array
            
        })
        console.log("trending========================================="+ trending);
        res.json(trending);
    })
    .catch(function(error){
    console.log(error);
    }) 
}

async function getMoviebyPreference(req,res) {
    try{
        console.log("Fetching Movies by User Preference ..");
        const searchkey = req.email;
        const result =[];
        console.log(searchkey);
        //Getting movie list based on the preferred genres for a user 
        session.run('MATCH (u:username) WHERE u.email = $email MATCH (u)-[:Prefers]->()<-[:Belong_To]-(x) WITH COLLECT(x) AS xs UNWIND (xs) AS Recommendation RETURN Recommendation',
                    { email: searchkey }
                    )
        
                .then(function (recommendations) {
                    recommendations.records.forEach(function(record){
                        
                        result.push(record._fields[0].properties);   
                    })
                    //redisclient.setex ( searchkey,600, JSON.stringify(result));// storing the result in redis for a user for cache
                    console.log("result ====================="+result)
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


function getSearchResult(req,res){
    const searchkey = req.params.key;
    console.log("key " + req.params.key)
    searchResult = [];
    session.run("OPTIONAL MATCH (a:actor) where a.name contains $key with collect (a) as a UNWIND a as actor OPTIONAL MATCH (actor)-[:Acted_In]-(x) WITH COLLECT (x) as xx  UNWIND (xx) as Movies Return Movies",
        { key : searchkey}
    )
    .then(function (result) {
        result.records.forEach(function(record){
            searchResult.push(record._fields[0].properties); //storing the result in trending array
        })
        session.run("OPTIONAL MATCH (d:director) where d.name contains $key with  collect (d) as d UNWIND d as director OPTIONAL MATCH (director)-[:Directed]-(q) WITH COLLECT (q) as qx UNWIND ( qx) as Search RETURN Search",
            {key : searchkey})
            .then(function (result) {
                result.records.forEach(function(record){
                    searchResult.push(record._fields[0].properties); //storing the result in trending array
                })
                session.run("OPTIONAL MATCH (m:movie) where m.title contains $key with m ,collect (m) as mx UNWIND (mx) as Movies Return Movies",
                    {key:searchkey})
                    .then(function (result) {
                        result.records.forEach(function(record){
                            searchResult.push(record._fields[0].properties); //storing the result in trending array
                        })
                        session.run("OPTIONAL MATCH (g:genre) where g.name contains $key with collect (g) as g UNWIND g as genre OPTIONAL MATCH (genre)-[:Belong_To]-(q) WITH COLLECT (q) as qx UNWIND (qx) as Movies Return Movies",
                            {key:searchkey})
                            .then(function (result) {
                                result.records.forEach(function(record){
                                    searchResult.push(record._fields[0].properties); //storing the result in trending array
                        })
                                var lookup = {};
                                var items = searchResult;
                                var result = [];
                                
                                for (var item, i = 0; item = items[i++];) {
                                var title = item.title;
                                
                                if (!(title in lookup)) {
                                    lookup[title] = 1;
                                    result.push(item);
                                    console.log(result);
                                }
                                }
                                res.json(result);
                            })
                    .catch(function(error){
                    console.log(error);
                    })

                    })
                    .catch(function(error){
                    console.log(error);
                    }) 
        })
            .catch(function(error){
            console.log(error);
            }) 
    })
    .catch(function(error){
    console.log(error);
    }) 
}


async function Signup (req, res) {
    try{
          
        const { name, email, password} = req.body;
        const users = new Users({ name, email, password});
        Users.findOne({email}, function (err, user){
         if (user){
             res.status(500).send("User already exist");
         }
         else{
             users.save(function(err){
                if (err) {
                    console.log(err);
                  res.status(400)
                    .send("Error registering new user please try again.");
                } else 
                {
                  console.log(user);
                  email = req.body.email;
                  name = req.body.name;
                  session.run('CREATE (u:username) SET u.name = $name SET u.email= $email',{
                      email : email,
                      name : name
                  })
                  res.status(200).send("Successful Registration. Please login.");
                }
             })
         }
        }) 
      }
      catch(err){
        console.error(err);
        res.status(500);
    }
    }




async function Authenticate(req, res) {
     email = req.body.email;
     password = req.body.password;
    Users.findOne({ email }, function(err, user) {
    if (err) {
        console.error(err + "error found");
        res.status(500)
        .json({
        error: 'Internal error please try again'
        });
    } else if (!user) {
        res.status(401)
        .json({
            error: 'Incorrect email or password'
        });
    } else {
        user.isCorrectPassword(password, function(err, same) {
        if (err) {
            res.status(500)
            .json({
                error: 'Internal error please try again'
            });
        } else if (!same) {
            res.status(401)
            .json({
                error: 'Incorrect email or password'
            });
        } else {
            // Issue token
            
            const payload = { email };
            const token = jwt.sign(payload, secret, {
            expiresIn: '1h'
            });
            res.json({
                sucess: true,
                err: null,
                token
              }) 
            
        }
        });
    }
    });
}


async function SaveUserDetails (req, res) {
    try{ 
        const genre = [];
        const email = req.email;
        const x = req.body;
        for ( i= 0 ; i<x.length ; i++){
            genre.push({"name":x[i].value});
        }
        Users.findOneAndUpdate({email: email},{$set:{genre:genre}},{new:true}, function (err,doc){
        if (err){
            res.status(400)
             }
         else{
            console.log(doc);
            session.run(' Match (u:username) where u.email= $email with u OPTIONAL MATCH (u)-[p:Prefers]-(g) Delete p return u',{
                email : email
            })
                .then(function(result){
                    console.log("1st");
                    session.run('MATCH (u:username) where u.email = $email UNWIND $genrelist AS genre MERGE (g:genre {name:genre.name}) with u, g MERGE (u)-[:Prefers]-> (g) return u',{
                        email : email,
                        genrelist : genre
                    })
                    .then (function (result){
                        console.log("2nd");
                        console.log(genre);
                        console.log("relationship created");
                        res.json(true);
                    })
                    .catch(function(err){
                        console.log(err);
                    })
                })
                .catch(function(err){
                    console.log(err);
                })
            
         }
        }) 
      }
      catch(err){
        console.error(err);
        res.status(500);
    }
    }

app.get('/checkToken', withAuth, function(req, res) {
  res.sendStatus(200);
    });
app.get('/secret', withAuth, function(req, res) {
        res.send('The password is potato');
      });

app.get('/userpreference',withAuth, getMoviebyPreference); // for searching movies list based on the genre preferred by a registered user
app.get('/:username/availableoffers', getAvailableOffers) // for getting the list of the offers available for the user
app.get('/movie/top10',getTopMovies);//for getting top searched movies across the globe on the application 
app.get('/movie/details/:id', getMoviebyTitle); // for searching movie by title 
app.get('/movie/actor/:name',cache, getMoviebyActor);// for searching movies by actor
app.get('/movie/genre/:name',cache, getMoviebyGenre) ; // for searching movies by genre
app.get('/movie/director/:name',cache, getMoviebyDirector);// for searching movies by director
app.get('/usersearchhistory',getSearchBasedResutls); // for getting the movie list based on search history of the user
app.get('/search/:key' , getSearchResult);
app.post ('/signup' , Signup);
app.post('/authenticate', Authenticate);
app.post('/saveuserdetails' ,withAuth, SaveUserDetails);



app.listen(5000,() =>{
    console.log(`App listening on port ${PORT}`);
});