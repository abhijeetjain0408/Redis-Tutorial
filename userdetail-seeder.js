var User = require('./user');
var mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/Movies", {
  useNewUrlParser: true,
  useUnifiedTopology : true
});


var users = [
    new User({
        name : 'Abhijeet Jain',
        genre : [
            { name: 'Comedy' },
            { name: 'Romantic' }
            ],
        email : 'abhijeet.jain@gmail.com',
        
        }), 
    new User({
        name : 'Anusha Jain',
        genre : [
            { name: 'Sci-fi' },
            { name: 'Thriller' }
            ],
        email : 'anusha.jain@gmail.com',
            }), 
];      
var done = 0;
for (var i = 0; i < users.length ; i++ ){
    users[i].save( function(err,resutl) {
        done++;
        if (done === users.length) {
            exit();
        }
    });
}

function exit(){
    mongoose.disconnect();
}
