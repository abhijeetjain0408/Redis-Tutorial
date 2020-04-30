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
    new Movie({
        title : 'The Shawshank Redemption',
        actor : [
            { name: 'Tim Robbins' },
            { name: 'Morgan Freeman' }
            ],
        director : 'Frank Derabont',
        genre: 'Drama',
        }), 
    new Movie({
        title : 'The Godfather',
        actor : [
            { name: 'Al Pacino' },
            { name: 'Marlon Brando' }
            ],
        director : 'Francis Ford Coppola',
        genre: 'Crime',
            }), 
    new Movie({
        title : 'The Dark Knight',
        actor : [
            { name: 'Christian Bale' },
            { name: 'Heath Ledger' }
            ],
        director : 'Christopher Nolan',
        genre: 'Action',
                }),
     new Movie({
        title : 'Pulp Fiction',
        actor : [
            { name: 'John Travolta' },
            { name: 'Uma Thurman' }
            ],
        director : 'Quentin Tarantino',
        genre: 'Drama',
                })
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
