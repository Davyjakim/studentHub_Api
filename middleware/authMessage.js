const jwt = require("jsonwebtoken");
const config = require("config");

function authMessage(socket, next) {
  const token = socket.handshake.headers["x-auth-token"];
  if (!token) {
    const error = new Error("Access denied. No token provided");
    error.data = { content: "No token provided" };
    return next(error);
  }
  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    socket.user = decoded;
    next();
  } catch (e) {
    const error = new Error("Invalid token");
    error.data = { content: "Invalid token" };
    next(error);
  }
}

module.exports.authMessage = authMessage;
