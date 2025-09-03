const express = require("express");
const dotenv = require("dotenv");
const { default: mongoose } = require("mongoose");
const cors = require("cors");
const memberRoutes = require("./Routes/memberRoutes");
const {otpRoutes} = require("./Routes/otpRoutes");
const app = express();

dotenv.config();
const port = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGO_URL;

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("DB IS CONNECTED");
  } catch (err) {
    console.log("DB connection failed:", err);
    process.exit(1);
  }
}

connectDB();


app.use(express.json());
app.use(cors());
app.use(memberRoutes);
app.use(otpRoutes);


app.listen(port, () => {
  console.log(`server is running...
PORT:http://localhost:${port}`);
});
