const bcrypt = require("bcrypt");
const { User, validate } = require("../models/User");
const express = require("express");
const { auth } = require("../middleware/auth");
const { Friends } = require("../models/friends");
const { Messages } = require("../models/message");
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { error } = validate(req.body);
  if (error) {
    return res.status(400).send(error.message);
  }

  try {
    let user = await User.findOne({
      $or: [{ email: req.body.email }, { name: req.body.name }],
    });
    if (user) {
      if (user.email === req.body.email) {
        return res.status(400).send("User with the same email already exists.");
      }
      if (user.name === req.body.name) {
        return res.status(400).send("User with this name already exists.");
      }
    }

    // Create a new user instance
    user = new User({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      profilePicture: "",
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    // Save the user to the database
    await user.save();
    res.status(200).send("Signup successful and emails sent.");
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/getme", auth, (req, res) => {
  const user = req.user;
  res.status(200).send(user);
});
// get users except me 
router.get("/getUsers", auth, async (req, res) => {
  const current_user = await User.findById(req.user._id);
  const friendIds = current_user.friends.map(friend => friend.id)
  try {
    const users = await User.find({ _id: { $ne: current_user._id, $nin: friendIds } }).select("-password -friends");
    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({ error: "Error fetching users" });
  }
});
router.put("/addFriend/:fname", auth, async (req, res) => {
  try {
    const Fname = req.params.fname;

    let user = await User.findById(req.user._id);
    const friendAccount = await User.findOne({ name: Fname });
    const isAlrFriends = user.friends.find((f) => f.friendName === Fname);
    if (isAlrFriends) return res.status(400).send("your are already friends");

    // Create a unique ChatRoom identifier using XOR operation on user IDs
    const userIdNumber = parseInt(user._id.toString().slice(-7), 16);
    const friendIdNumber = parseInt(friendAccount._id.toString().slice(-7), 16);
    const chatRoomId = userIdNumber ^ friendIdNumber;

    user.friends.push({
      id: friendAccount._id,
      ChatRoom: chatRoomId,
      friendName: friendAccount.name,
      profilePicture: friendAccount.profilePicture,
    });
    friendAccount.friends.push({
      id: user._id,
      ChatRoom: chatRoomId,
      friendName: user.name,
      profilePicture: user.profilePicture,
    });

    //creating a chat room for both freinds
    await new Messages({
      chatRoom: chatRoomId,
      messagelist: [],
      timeRoomCreation: new Date(),
    }).save();
    // Save the updated user
    await user.save();
    await friendAccount.save();

    res.status(200).send("Friend added successfully.");
  } catch (error) {
    console.log(error);
  }
});
router.get("/getFriends", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const friends = user.friends;
    
    // Use `map` to create an array of promises
    const promises = friends.map(async (fr) => {
      const messages = await Messages.findOne({ chatRoom: fr.ChatRoom });
      const unreadMessage= messages.messagelist.filter(Urm=> Urm.isRead===false)
      return { friend: fr, chatList: messages.messagelist, unreadMessages:unreadMessage };
    });
    
    // Wait for all promises to resolve
    const resolvedResults = await Promise.all(promises);
  
    // Send the resolved results in the response
    res.status(200).send(resolvedResults);
  } catch (error) {
    console.log(error.message);
  }
});



module.exports = router;
