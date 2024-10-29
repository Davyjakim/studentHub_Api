const mongoose = require("mongoose");
const Joi = require("joi");
const config = require("config");
const jwt = require("jsonwebtoken");

// define the shape of the User in the database
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
    minlength: 3,
    maxlength: 50,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
    match: /@/,
    require: true,
    minlength: 5,
  },
  password: {
    type: String,
    require: true,
    minlength: 5,
  },
  
  isAdmin: { type: Boolean, default: false },
  profilePicture: { data: Buffer, contentType: String },
  friends: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      ChatRoom: {
        type: Number,
        required: true,
      },
      friendName: {
        type: String,
        required: true,
      },
      profilePicture: { data: Buffer, contentType: String },
    },
  ],
});

UserSchema.methods.generateAuthToken = function () {
  return (token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      isAdmin: this.isAdmin,
      profilePicture: this.profilePicture,
    },
    config.get("jwtPrivateKey")
  ));
};
const User = mongoose.model("Users", UserSchema);

function validate(user) {
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(5).required(),
  });
  return schema.validate(user);
}

exports.User = User;
exports.validate = validate;
