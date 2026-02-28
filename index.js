(async () => {
require("dotenv").config();
var connectDB = require("./MDB/connect.js");
await connectDB();
var db = await require('./MDB/db.js');
global.db = db;

const express = require('express');
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.set('view engine', 'ejs');

let v = 0;

app.get("/", async(req, res) => {
    let viee = await db.get("view");

    if(isNaN(viee)){
        db.set("view", 1);
        viee = 0;
    }

    viee++;

    db.set("view", viee);
    
    console.log(viee);
    res.render("index", {"v": viee});
});

app.get("/video", (req, res) => {
    res.render("video");
});


server.listen(port, "0.0.0.0", ()=> {
    console.log(`Server is Live ✅ on port ${port} 💻`);
});
})();