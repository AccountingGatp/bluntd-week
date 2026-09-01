import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer: MongoMemoryServer | undefined;

export async function connectDb() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (uri) {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
    return;
  }

  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/bluntd", {
      serverSelectionTimeoutMS: 1500,
    });
    console.log("Connected to local MongoDB");
    return;
  } catch {
    console.log("No local MongoDB found. Starting embedded MongoDB...");
  }

  const dbPath = path.join(process.cwd(), "data", "mongo");
  fs.mkdirSync(dbPath, { recursive: true });

  memoryServer = await MongoMemoryServer.create({
    instance: {
      dbName: "bluntd",
      dbPath,
      storageEngine: "wiredTiger",
    },
  });

  await mongoose.connect(memoryServer.getUri());
  console.log(`Connected to embedded MongoDB at ${dbPath}`);
}
