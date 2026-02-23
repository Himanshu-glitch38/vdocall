(async() => {
  const mongoose = require('mongoose');
  const { Schema, model } = mongoose;

let dbData = {};

const scma = new Schema({
  id: { type: String, unique: true, required: true },
  value: {
    type: Schema.Types.Mixed,
  }
});

const objScma = new Schema({
  id: { type: String, unique: true, required: true },
  arrayValue: {
    type: Schema.Types.Mixed,
  }
});

objScma.index({ arrayValue: 1 }, { unique: true });

var rawMngoDB = {
  test: model("data_kv", scma),
  objModel: model("data", objScma),
};


async function saveToCache(){
  return new Promise(async(res) => {
let kodj = await rawMngoDB?.test?.find();
  await kodj.forEach(data => {
if(!data.id){
  return;
}
    if(!dbData[data.id]){
    dbData[data.id] = {};  
    }
if(data.value){
 dbData[data.id].value = data.value; 
}
  });
    
    let kodjObj = await rawMngoDB?.objModel?.find();
  await kodjObj.forEach(data => {
if(!data.id){
  return;
}
    if(!dbData[data.id]){
    dbData[data.id] = {};  
    }
if(data.arrayValue){
 dbData[data.id].arrayValue = data.arrayValue; 
}
  });
    res(true);
  });
}

 // await saveToCache();

module.exports = new Promise(async(res) => {
  await saveToCache();
  
  res({
async set(key, val) {
  if(!key || !val){ return `provide a ${key? "value" : "key" }`}

  if(!dbData[key]){
    dbData[key] = {};
  }
  dbData[key].value = val;
             await rawMngoDB?.test?.updateOne({ id: key }, {
                $set: {
                  value: val
                }
              }, { upsert: true }).catch(e => { console.log(e); return false; });
  return true;
},
        async push(key, arry) {
  if(!key){
    return `provide a key`
  }
       try{
         if(!dbData[key]){
           dbData[key] = {};
         }
         if(!dbData[key] || !dbData[key].arrayValue){
          dbData[key].arrayValue = [];
          }
          if(!Array.isArray(dbData[key].arrayValue)){
            console.log("not an array");
          return "err... Not An Array";
          }
          if(!(dbData[key].arrayValue).includes(arry)){
         (dbData[key].arrayValue).push(arry);   
          }
        }catch(i){console.log(i);}
          console.log(dbData);
    await rawMngoDB?.objModel?.updateOne({ id: key }, {
                $addToSet: {
                  arrayValue: arry
                }
              }, { upsert: true }).catch(e => { console.log(e) });
  },

        async pull(key, valToRemove) {
  if (!key || valToRemove === undefined) {
    return `Provide a key and value to remove.`;
  }
try {  
  console.log("pull req, to remove ↓");
console.log(valToRemove);
  if(!dbData[key].arrayValue || !(dbData[key].arrayValue).includes(valToRemove)){
    console.log('not found');
    return false;   
  };
dbData[key].arrayValue = (dbData[key].arrayValue).filter(i => i !== valToRemove);
}catch (e) { console.log(e); };
  try {
    await rawMngoDB?.objModel?.updateOne({ id: key }, {
      $pull: {
        arrayValue: valToRemove
      }
    });

    return true;
  } catch (error) {
    console.log(error);
    return false;
  }
},

  async get(key) {
  if(!key){
    return `provide a key`
  }

    if(dbData[key]){
      var r = dbData[key].value;
    }else{
      var r = null;
    }
  if(!r){  return null;  }else{ return r }  
   },
  
  async getArray(key) {
  if(!key){
    return `provide a key`
  }
    if(!dbData[key]){
     return []; 
    }
    if(!dbData[key].arrayValue){
    return [];
    }
  var r = dbData[key].arrayValue;  
if(!r){  return [];  }else{ return r }
  },

  async all() {
var r = dbData;
if(!r){  return null;  }else{ return r }
  },

  async delete(key) {
    try {
 var r = dbData[key];
    if(!r) return `${key} not found`;
    delete dbData[key];
await rawMngoDB?.test.deleteOne({ id: key });
await rawMngoDB?.objModel.deleteOne({ id: key });
    return true;
      } catch (er){
      console.log(er);
      return false;
      }
  },

  async deleteAll(pass) {
    if(pass == "dbdhgfhfghfddsfgjhkfdvhtygb"){
await rawMngoDB?.test?.deleteMany()
return true;
    }else{
      return false;
    }
  }
  });
  });
  })();