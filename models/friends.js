const mongoose = require("mongoose");
const Joi = require("joi");

const friendSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  friends: [
    {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
      },
      friendName: {
        type: String,
        required: true
      }
    }
  ]
});

const Friends = mongoose.model("Friends", friendSchema);

exports.Friends = Friends;

