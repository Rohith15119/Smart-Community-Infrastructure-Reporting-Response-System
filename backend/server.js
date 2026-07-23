import cookieParser from "cookie-parser";
import express from "express";
import { connect } from "mongoose";
import cors from "cors";
import { cityRoute } from "./api/cityRoute.js";
import { adminRoute } from "./api/adminRoute.js";

const port = process.env.PORT || 5004;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://rohith123:rohith123@cluster1.a2ei2ew.mongodb.net/?appName=Cluster1";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
app.use(express.json());

// Dynamic CORS configuration allowing localhost and production frontend origins
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        origin === CLIENT_URL ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all origins in fallback mode or set specific strict origins
    },
    credentials: true, // allow cookies / credentials
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).send("Smart Community Infrastructure API is running 🚀");
});

app.use("/city-api/citizen", cityRoute); //citizen related operations
app.use("/city-api/admin", adminRoute); //admin related operations like assigning worker and marking as completed

async function ConnectDB() {
  try {
    //connection to database.
    await connect(MONGODB_URI);
    console.log("Connection Success ✅");
    app.listen(port, () => {
      console.log("Server Activated Upon Port Number : ", port);
    });
  } catch (err) {
    console.log("Error in Connecting Database 🔴", err);
  }
}

ConnectDB();

