const express = require("express");
const user = require("../routes/User");
const auth = require('../routes/auth')

module.exports = function (app) {
  app.use(express.json());
  app.use("/users", user);
  app.use("/auth", auth);
};
