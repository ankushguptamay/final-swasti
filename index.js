import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";

// Routes
import authUser from "./Route/User/authUser.js";

dotenv.config({ path: resolve(process.cwd(), ".env") });

const app = express();
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Routes
app.use("/authUser", authUser);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
