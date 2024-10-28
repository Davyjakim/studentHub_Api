const jwt = require("jsonwebtoken");
const config = require("config");

function auth(req, res, next) {

  const token = req.header("x-auth-token");;

  if (!token) return res.status(401).send("Access denied. No token provided");

  try {

    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    req.user = decoded;
    console.log("User authenticated:", req.user);
    next();
  } catch (e) {
    console.log(e);
    res.status(401).send("Invalid token.");
  }
}

module.exports.auth = auth;

