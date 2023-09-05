import express from "express";
import cors from "cors";
import morgan from "morgan";
import conn from "./database/conn.js";
import router from "./router/route.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));
app.disable("x-powered-by");

const port = 4000;

app.get("/", (req, res) => {
  res.status(201).json("home get request");
});

app.use("/api",router);

conn()
  .then(() => {
    try {
      app.listen(port, () => {
        console.log("server is running");
      });
    } catch {
      console.log("Database not connected...!");
    }
  })
  .catch((err) => {
    console.log("Invalid Database Connection");
  });
