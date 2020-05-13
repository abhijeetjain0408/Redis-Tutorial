var Movie = require('./movies');
var mongoose = require('mongoose');
const neo4j = require('neo4j-driver');

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'Abhijeet')); //neo4j connection
const session = driver.session();



mongoose.connect("mongodb://localhost:27017/Movies", {
  useNewUrlParser: true,
  useUnifiedTopology : true
});


var movies = [
    
    new Movie({
        title : 'Chris',
        actor : [
            { name: 'Chris' },
            { name: 'Barry Keoghan' }
            ],
        director : 'Christopher Nolan',
        genre: 'Drama',
        imageURL: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.insider.com%2Fchris-hemsworth-fitness-centr-free-guided-meditations-for-kids-video-2020-4&psig=AOvVaw0PFGriQRiTELm2Dke1NO3U&ust=1589226689644000&source=images&cd=vfe&ved=0CAIQjRxqFwoTCNjAo_SIqukCFQAAAAAdAAAAABAD'
                }),
];      
var done = 0;
for (var i = 0; i < movies.length ; i++ ){
    title = movies[i].title;
    director = movies[i].director;
    genre = movies[i].genre;
    imageURL = movies[i].imageURL;
    actorlist = movies[i].actor;
    movies[i].save( function(err,resutl) {
        done++;
        session.run('MERGE (m:movie{title:$title}) ON Create Set m.searchcount = 0 Set m.MId =$id Set m.imageURL= $imageurl  with m MERGE (g:genre { name : $genre}) WITH g , m MERGE (m)-[:Belong_To]->(g) with m MERGE (d:director { name : $director}) WITH d , m MERGE (d)-[:Directed]->(m) ',{
            title: title,
            director : director,
            genre : genre,
            id: _id,
            imageurl : imageURL
        })
               .then(function(result){
                session.run(' MATCH (m:movie) where m.title = $title UNWIND $actorlist AS actor MERGE (a:actor {name:actor.name}) with m, a MERGE (a)-[:Acted_In]->(m)',{
                    title : title,
                    actorlist : actorlist
                })
                    .then (function (result){
                    console.log("sdkjfhdjk");
                    })
                
                    .catch(function(err){
                        console.log(err);
                    })
                })
                .catch(function(err){
                    console.log(err);
                })
            
            })
            
        if (done === movies.length) {
            exit();
        }
    }

function exit(){
    mongoose.disconnect();
}
