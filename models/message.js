const mongoose = require("mongoose");
const Joi = require("joi");

const MessageSchema = new mongoose.Schema({
  chatRoom: { type: Number, required: true, unique: true },
  messagelist: [
    {
      SentBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      ReceivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      content: { type: String, required: true, minlength: 1 },
      isAudio:{type:Boolean , required:true},
      duration:{type:Number},
      isRead:{type:Boolean},
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  timeRoomCreation: {
    type: Date
  }
});

const Messages = mongoose.model("Messages", MessageSchema);

function validate(message) {
  const schema = Joi.object({
    content: Joi.min(1).required(),
  });

  return schema.validate(message);
}

exports.Messages = Messages;
exports.validate = validate;
