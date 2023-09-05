import mongoose from "mongoose";

// import { MongoMemoryServer } from "mongodb-memory-server";

// const conn = mongoose.connect('mongodb://localhost:27017/mydb')
// .then(()=>{
//     console.log('Connected to MongoDB');
// }).catch((error)=>{
//    console.log("Database Connection error");
// })

async function conn() {
  const connection = await mongoose
    .connect("mongodb://127.0.0.1:27017/mydb")
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.log("Database Connection error");
    });
    // console.log(connection);
    return connection;
}

// async function connect(){
//    const mongod = await MongoMemoryServer.create();
//    const getUri = mongod.getUri();

// //    console.log(getUri);
//     const db = await mongoose.connect(getUri);
//     console.log("Database Connected");
//     return db;
// }

export default conn;
