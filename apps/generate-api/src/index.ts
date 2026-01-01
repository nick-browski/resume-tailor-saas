import express from "express";
import { generateRouter } from "./routes/generate.js";
import { SUCCESS_MESSAGES } from "./config/constants.js";

const DEFAULT_PORT = 8081;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const app = express();

app.use(express.json());

app.use("/documents", generateRouter);

// Health check endpoint
app.get("/health", (request, response) => {
  response.json({ status: SUCCESS_MESSAGES.HEALTH_CHECK });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Generate API listening on port ${PORT}`);
});
