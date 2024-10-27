const Joi = require("joi");
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.post("/login", async (req, res) => {
  const { error } = validate(req.body);
  if (error) {
    res.status(400).send(error.message);
    return;
  }
  let user = await User.findOne({
    $or: [{ email: req.body.emailorName }, { name: req.body.emailorName }],
  });

  if (!user) return res.status(400).send("Invalid Name/email or Password ");
  //   user = new Users({
  //     name: req.body.name,
  //     email: req.body.email,
  //     password: req.body.password,
  //   });

  const isvalidpass = await bcrypt.compare(req.body.password, user.password);
  if (!isvalidpass) {
    return res.status(400).send("Invalid Name/email or Password ");
  }

  const token = user.generateAuthToken();
  res.cookie("token", token, { maxAge: 28800000, httpOnly: false });
  res.send("login succefull");
});

function validate(user) {
  const schema = Joi.object({
    emailorName: Joi.string().min(3).required(),
    password: Joi.string().min(5).required(),
  });
  return schema.validate(user);
}

module.exports = router;
