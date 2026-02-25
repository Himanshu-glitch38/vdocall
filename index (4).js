(async() => {
  var connectDB = require("./db/connect.js");
    await connectDB();
      var db = await require('./db/db.js');
        global.db = db;
  global.askAI = require("./ask.ai.js");
  let asked = await askAI("hi");
  console.log(asked);
  console.log(await db.getArray("channel.data"));

 require('./external bot global chat.js');
})();