const mongoose = require("mongoose");

const icd9ProcedureSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
  },
  {
    timestamps: false,
    collection: "icd9",
  }
);

module.exports = mongoose.model("Icd9Procedure", icd9ProcedureSchema);
