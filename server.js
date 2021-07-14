const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");

const mongoose = require('mongoose');

const io = require("socket.io")(server, {
  cors: {
    origin: '*',
    methods: ['POST','GET']
  }
});

const MONGOURI = "mongodb+srv://mandeep:LdZR0IEXGPje0WVV@cluster0.b8n5v.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

mongoose.connect(MONGOURI, (err) => {
  if(err){
    console.log("ERRor",err);
  }else{
    console.log('Connected to mongodb successfully!');
  }
});


//document structure
const chatSchema = new mongoose.Schema({
  name: String,
  msg: String,
  created: String
});

//for javascript, images, css files, we have public folder
app.use(express.static("public"));

//for ejs files, we have views folder
app.set("view engine", "ejs");


//render homepage
app.get("/", (req, res) => {
   res.render("homePage");
});

let id;
let Chat;


app.get('/chat', (req, res) => {
    id=uuidv4();
   res.redirect(`chat/${id}`);
});



app.get('/chat/:room', (req, res) => {
    id=req.params.room;

    Chat = mongoose.model(id, chatSchema);
  
   Chat.find({}, (err, result) => {
    if(err) return handleError(err);
    else{
       res.render("chatPage", { msgs: result, roomId: id});
    }
   });
});




io.on("connection", (socket) => {
  socket.on("join-chat", (roomId, userId, userName) => {
     socket.join(roomId);

     socket.on("chat", (message, time) => {
        let newMsg = new Chat({name:userName, msg: message, created: time});
        newMsg.save((err)=>{
          if(err) throw err;
          io.to(roomId).emit("createMessage", message, userName, time);
          socket.to(roomId).emit("notify",userName);
        });
        
      });
   });


});



server.listen(process.env.PORT || 9000);