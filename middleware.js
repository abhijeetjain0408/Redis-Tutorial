const jwt = require('jsonwebtoken');
const secret = 'ABCDEF$123';
const withAuth = function(req, res, next) {
  const authstring = req.headers.authorization;
  const str = authstring.split(" ");
  const token = str[1];
  console.log(token);
  if (!token) {
    console.log("1");
    res.status(401).send('Unauthorized: No token provided');
  } else {
    jwt.verify(token, secret, function(err, decoded) {
      if (err) {
        console.log("2");
        res.status(401).send('Unauthorized: Invalid token');
      } else {
        console.log("3");
        req.email = decoded.email;
        next();
      }
    });
  }
}
module.exports = withAuth;