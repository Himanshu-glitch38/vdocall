(async () => {
/** db ki jarurat nahi hai abhi..
    require("dotenv").config();
var connectDB = require("./MDB/connect.js");
await connectDB();
var db = await require('./MDB/db.js');
global.db = db;
*/

const express = require('express'),
    http = require("http"),
    { Server } = require("socket.io"),
    path = require("path"),
    app = express(),
    port = process.env.PORT || 3000,
    server = http.createServer(app),
    io = new Server(server);

    // public folder setup
    app.use(express.static(path.join(__dirname, "public")));
    app.set('view engine', 'ejs');

    global.currentActiveUsers = 0;
    require("./socket.io.js")(io);
    

    app.get("/", async(req, res) => {
        res.render("index");
    });

    app.get("/chat", async(req, res) => {
        res.render("vidChat");
    });

    app.get('/stat/getActiveUserCount', async(req, res) => {
        res.json({
            current: currentActiveUsers,
        });
    });

    
    /*
app.get("/stat", async(req, res) => {
    let viee = await db.get("view");

    if(isNaN(viee)){
        db.set("view", 1);
        viee = 0;
    }

    viee++;

    db.set("view", viee);
    
    console.log(viee);
    res.render("stat", {"v": viee});
});

app.get("/video", (req, res) => {
    res.render("video");
});*/


server.listen(port, "0.0.0.0", ()=> {
    console.log(`Server is Live ✅ on port ${port} 💻`);
});
})();
