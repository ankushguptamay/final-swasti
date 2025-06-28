import dotenv from "dotenv";
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import { addBrevoEmail, addUserSlug, connectDB } from "./Util/mongoConnection.js";
import { createServer } from "node:http";
import cors from "cors";
import multer from "multer";
import routes from "./Route/mainRoute.js";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";

// Load Swagger
const swaggerFile = JSON.parse(
  readFileSync(new URL("./swagger-output.json", import.meta.url))
);

const app = express();
const server = createServer(app);

(async () => {
  // Connect to database
  await connectDB(process.env.MONGO_URI);
  // await addUserSlug();
  // await addBrevoEmail();
})();

// Cors options
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
// Swasgger Api Documentation routes
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));
// All Routes
app.use(routes);

app.get("/", (req, res) => {
  res.send("Welcome to Swasti!");
});

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size should not exceed 1.5 MB.",
      });
    } // Too many files uploaded (for .array())
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message:
          "Unexpected file upload. Please check file field name or upload limit.",
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  } else if (err) {
    return res.status(400).json({ success: false, message: err });
  }
  next();
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
