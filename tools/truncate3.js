"use strict";
const fs = require("fs");
const path = require("path");
const p = path.join(__dirname, "part3.js");
let s = fs.readFileSync(p, "utf8");
const marker = "  /* ================= 12. SCRUM ================= */";
const i = s.indexOf(marker);
if (i < 0) {
  console.log("marker not found");
  process.exit(0);
}
s = s.slice(0, i).replace(/\s+$/, "") + "\n\n  return out.join(\"\");\n};\n";
fs.writeFileSync(p, s);
console.log("truncated part3.js to", s.length, "chars");
