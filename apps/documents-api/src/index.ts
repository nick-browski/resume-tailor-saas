import express from "express";
import { documentsRouter } from "./routes/documents.js";
import { HTTP_STATUS, SUCCESS_MESSAGES } from "./config/constants.js";

const DEFAULT_PORT = 8080;
const PORT = Number(process.env.PORT) || DEFAULT_PORT;

const app = express();

app.use(express.json());

app.use("/documents", documentsRouter);

// Health check endpoint
app.get("/health", (request, response) => {
  response.json({ status: SUCCESS_MESSAGES.HEALTH_CHECK });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Documents API listening on port ${PORT}`);
});
