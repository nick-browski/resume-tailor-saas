import express from "express";
import cors from "cors";
import { documentsRouter } from "./routes/documents.js";
import {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  CORS_CONFIG,
} from "./config/constants.js";

const DEFAULT_PORT = 8080;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || CORS_CONFIG.DEFAULT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

app.use("/documents", documentsRouter);

// Health check endpoint
app.get("/health", (request, response) => {
  response.json({ status: SUCCESS_MESSAGES.HEALTH_CHECK });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Documents API listening on port ${PORT}`);
});
