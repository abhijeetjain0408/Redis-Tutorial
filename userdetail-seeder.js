var User = require('./user');
var mongoose = require('mongoose');
const neo4j = require('neo4j-driver');

mongoose.connect("mongodb://localhost:27017/Movies", {
  useNewUrlParser: true,
  useUnifiedTopology : true
});
const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'Abhijeet')); //neo4j connection
const session = driver.session();


var users = [
    new User({
        name : 'abhijain0408@gmail.com',
        genre : [
            { name: 'Drama' },
            { name: 'Sci-fi' },
            { name: 'Romantic' }
            ],
        email : 'abhijain0408@gmail.com',
        
        })
];      
var done = 0;
for (var i = 0; i < users.length ; i++ ){
    username = users[i].email;
    genrelist = users[i].genre;
    users[i].save( function(err,resutl) {
        done++;
        
        session.run(' MERGE (u:username {name:$username}) on create u.email = $username return u',{
            username: username
        })
            .then(function(result){
                session.run(' MATCH (u:username) where u.name = $username UNWIND $genrelist AS genre MERGE (g:genre {name:genre.name}) with u, g MERGE (u)-[:Prefers]-> (g)',{
                    username : username,
                    genrelist : genrelist
                })
                .then (function (result){
                    console.log("relationship created");
                })
                .catch(function(err){
                    console.log(err);
                })
            
            })
            .catch(function(err){
                console.log(err);
            })
        if (done === users.length) {
            exit();
        }
    });
}

function exit(){
    mongoose.disconnect();
}
