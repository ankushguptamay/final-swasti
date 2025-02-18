import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import { connectDB } from "./Util/mongoConnection.js";
import { createServer } from "node:http";
import cors from "cors";

// Routes
import admin from "./Route/Admin/authAdmin.js";
import authUser from "./Route/User/authUser.js";
import instructor from "./Route/User/Instructor/index.js";
import learner from "./Route/User/Learner/index.js";

const app = express();
const server = createServer(app);

// Connect to database
connectDB(process.env.MONGO_URI);
// Cors options
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Routes
app.use("/api/auth", authUser);
// 1.Instructor
app.use("/api/instructor", instructor);
// 2.User
app.use("/api/user", learner);
// 3.User
app.use("/api/admin", admin);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
