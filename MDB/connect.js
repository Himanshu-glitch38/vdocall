const mongoose = require("mongoose"); 
mongoose.set('strictQuery', false);

async function connectMDB() {
  return new Promise((res) => {
    mongoose.connect(process.env["MONGO"], {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log(`Connected MongoDB`);
      res(true);
    })
    .catch((err) => {
      console.log(err);
      res(false); // Optionally reject the promise on error
    });
  });
}

module.exports = connectMDB;
