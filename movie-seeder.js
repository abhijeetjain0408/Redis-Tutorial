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
        title : 'Titanic',
        actor : [
            { name: 'Leonardo DiCaprio' },
            { name: 'Kate Winslet' }
            ],
        director : 'James Cameron',
        genre: 'Romantic',
        }), 
    new Movie({
        title : 'Inception',
        actor : [
            { name: 'Leonardo DiCaprio' },
            { name: 'Cillian Murphy' }
            ],
        director : 'Christopher Nolan',
        genre: 'Thriller',
            }), 
    new Movie({
        title : 'Intersteller',
        actor : [
            { name: 'Matthew McConaughey' },
            { name: 'Anna Hathaway' }
            ],
        director : 'Christopher Nolan',
        genre: 'Sci-fi',
                }),
];      
var done = 0;
for (var i = 0; i < movies.length ; i++ ){
    movies[i].save( function(err,resutl) {
        done++;
        if (done === movies.length) {
            exit();
        }
    });
}

function exit(){
    mongoose.disconnect();
}
