import cors from "cors";
import "dotenv/config";
import express from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { connectDb } from "./db.js";
import { employeeRouter } from "./routes/employees.js";
import { generateRouter } from "./routes/generate.js";
import { seedEmployees } from "./seed.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bluntd-api" });
});

app.get("/api", (_req, res) => {
  res.json({
    message: "Bluntd API is running",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/employees", employeeRouter);
app.use("/api/generate", generateRouter);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({ error: error.message });
    return;
  }

  if (error instanceof Error) {
    res.status(400).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: "Unexpected server error" });
});

async function start() {
  await connectDb();
  await seedEmployees();

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

start().catch((error: unknown) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
