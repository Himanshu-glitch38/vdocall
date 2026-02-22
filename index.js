// create a basic express server
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

let v = 0;

app.get("/", (req, res) => {
    v++;
    console.log(v);
    res.send("ok. working");
});

app.listen(port, "0.0.0.0", ()=> {
    console.log("app is live" + port);
});