const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const bugSchema = new Schema(
  {
    bugTitle: { type: String, required: true },
    bugDescription: { type: String, required: true },
    bugSeverity: { type: String, required: true },
    bugResolved: { type: Boolean, required: false },
  },
  {
    timestamps: true,
  }
);

const Bug = mongoose.model("Bug", bugSchema);

module.exports = Bug;
