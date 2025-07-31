const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "failed"],
    default: "pending",
  },
  result: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
});

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;
