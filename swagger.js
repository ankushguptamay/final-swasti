import swaggerAutogen from "swagger-autogen";
import { globSync } from 'glob';

const swagger = swaggerAutogen();

const doc = {
  info: {
    title: "My API",
    description: "API documentation",
  },
  host: "localhost:5000", // Change this to your running server host
  schemes: ["http"],
};

const outputFile = "./swagger-output.json"; // Auto-generated file
// const routes = globSync("./Route/mainRoute.js");
const routes = ["./Route/mainRoute.js"];

swagger(outputFile, routes, doc);
