const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
// const mongoose = require("mongoose");
const db = require("./db/db");
const cors = require("cors");
const { Queue, Worker, RedisConnection } = require("bullmq");
const Redis = require("ioredis");
// const { createClient } = require("redis");
const { Task } = require("./db/models/Task");
require("dotenv").config();
RedisConnection.prototype.checkVersion = async function () {
  // Skip version check
};
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE"],
  },
});

app.use(cors());
app.use(express.json());
db()
  .then((res) => console.log("Db successfully connected"))
  .catch((err) => console.log(err));

// const redis = await createClient()
//   .on("error", (err) => console.log("Redis Client Error", err))
//   .connect();
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

const taskQueue = new Queue("task processing", { connection: redis });
const worker = new Worker(
  "task processing",
  async (job) => {
    const { taskId } = job?.data;
    await Task.findByIdAndUpdate(taskId, {
      status: "processing",
      processedAt: new Date(),
    });
    io.emit("taskUpdate", { taskId, status: "processing" });
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      const result = `Task ${taskId} processed at ${new Date().toISOString()}`;
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
          status: "completed",
          result: result,
        },
        { new: true },
      );
      io.emit("taskUpdate", {
        taskId,
        status: "completed",
        task: updatedTask,
        result: result,
      });
      return result;
    } catch (e) {
      await Task.findByIdAndUpdate(taskId, {
        status: "failed",
      });
      throw e;
    }
  },
  { connection: redis },
);
io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
