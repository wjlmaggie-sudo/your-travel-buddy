"use strict";
const fs = require("fs");
const path = require("path");
const { build } = require("./docxkit");

const body = [
  require("./part1"),
  require("./part2"),
  require("./part3"),
  require("./part3b"),
  require("./part4"),
  require("./part5"),
]
  .map((fn) => fn())
  .join("");

const out = path.join(__dirname, "..", "AiTravel_Project_Management_Document.docx");
const buf = build(body, {
  title: "AiTravel Booking System - Detailed Project Management Document",
  subject: "Project management baseline for the AiTravel travel planning and booking platform (MoSCoW agile)",
  author: "AiTravel PMO",
  date: "2026-11-06",
});
fs.writeFileSync(out, buf);
console.log("wrote", out, buf.length, "bytes");
