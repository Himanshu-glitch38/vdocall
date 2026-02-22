const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

let v = 0;

app.get("/", (req, res) => {
    v++;
    console.log(v);
    res.render("index", {v});
});

app.listen(port, "0.0.0.0", ()=> {
    console.log("app is live" + port);
});