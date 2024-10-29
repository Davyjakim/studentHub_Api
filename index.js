const express = require("express");
const cors = require("cors");
const http = require("http");
const cookieParser = require("cookie-parser");
require(`dotenv`).config({ path: `./config/.env` });
const config = require("config");

const client_url= 'http://localhost:3000'

const corsOptions = {
  origin: client_url, 
  credentials: true,
};

const app = express();
app.use(cors(corsOptions)); 
app.use(express.json()); 
app.use(cookieParser(config.get("jwtPrivateKey")));
const Chatserver = http.createServer(app);



require("./routes/chatconfig")(Chatserver,client_url);


require("./startup/db")();
require("./startup/routes")(app);
console.log(config.get('environment'))
const port = process.env.PORT || 4000;
Chatserver.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
