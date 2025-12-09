import cookieParser from "cookie-parser";
import express from "express";
import { connect } from "mongoose";
import cors from "cors";
import { cityRoute } from "./api/cityRoute.js";
import { adminRoute } from "./api/adminRoute.js";
const port = 5004;

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173", // your frontend URL
    credentials: true, // allow cookies / credentials
  })
);
app.use(cookieParser());

app.use("/city-api/citizen", cityRoute); //citizen related operations
app.use("/city-api/admin", adminRoute); //admin related operations like assigning worker and marking as completed

async function ConnectDB() {
  try {
    //connection to database.
    await connect("mongodb://localhost:27017/SmartCommunity");
    console.log("Connection Success ✅");
    app.listen(port, () => {
      console.log("Server Activated Upon Port Number : ", port);
    });
  } catch (err) {
    console.log("Error in Connecting Database 🔴");
  }
}

ConnectDB();
