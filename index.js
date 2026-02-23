const express = require('express');
require("dotenv").config();
require("./MDB/mongo.connect.js");
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

let v = 0;

app.get("/", (req, res) => {
    v++;
    console.log(v);
    res.render("index", {v});
});

app.get("/video", (req, res) => {
    res.render("video");
});


app.listen(port, "0.0.0.0", ()=> {
    console.log("app is live" + port);
});

console.log(process.env);