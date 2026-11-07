"use strict";
const fs = require("fs");
const path = require("path");

const dir = __dirname;
const files = ["part1.js", "part2.js", "part3.js", "part3b.js", "part4.js", "part5.js", "docxkit.js"];

const pairs = [
  /* brand */
  ["iTravel", "AiTravel", "all"],
  ["ITRAVEL", "AITRAVEL", "all"],

  /* cover + charter dates / delivery model */
  ["[\"Document version\", \"1.0 (baseline)\"]", "[\"Document version\", \"1.1 (baseline + MoSCoW revision)\"]", "part1.js"],
  ["[\"Document date\", \"03 November 2026\"]", "[\"Document date\", \"06 November 2026\"]", "part1.js"],
  ["Single-developer, agile (Scrum-lite), 5 one-week sprints", "Single-developer, MoSCoW agile (DSDM), 5 one-week timeboxes", "part1.js"],
  ["[\"Start date\", \"05 October 2026\"]", "[\"Start date\", \"06 October 2026\"]", "part1.js"],
  ["[\"End date\", \"03 November 2026\"]", "[\"End date\", \"06 November 2026\"]", "part1.js"],
  ["22 working days (\\u2248 4.5 calendar weeks), 5 sprints", "24 working days (\\u2248 4.6 calendar weeks), 5 one-week timeboxes", "part1.js"],
  ["Incremental, sprint-based; single-page app + zero-dependency Node.js server", "Incremental, MoSCoW-prioritised timeboxes; single-page app + zero-dependency Node.js server", "part1.js"],
  ["12. Scrum Plan", "12. MoSCoW Agile Plan", "part1.js"],
  ["[\"CO-07\", \"Single developer, 22 working days\", \"Scope frozen after Sprint 3; changes via CR only\"]",
   "[\"CO-07\", \"Single developer, 24 working days (22 effort days + 2 buffer)\", \"Must set frozen after timebox I3; changes via CR only\"]", "part1.js"],

  /* requirements engineering / stories */
  ["iterative backlog refinement at the start of every sprint", "iterative backlog refinement at the start of every timebox", "part2.js"],
  ["Epics are ordered by user value. Sprint numbers map to the schedule in Section 12.3. Story points use a Fibonacci scale; velocity is tracked in Section 12.6.",
   "Epics are ordered by user value. Timebox numbers (I1\\u2013I5) map to the schedule in Section 12.5. Story points use a Fibonacci scale for relative sizing only; there is no velocity-based forecasting.", "part2.js"],
  ["[\"Epic\", \"Story\", \"As a \\u2026 I want \\u2026 so that \\u2026\", \"Pri\", \"Pts\", \"Sprint\"]",
   "[\"Epic\", \"Story\", \"As a \\u2026 I want \\u2026 so that \\u2026\", \"Pri\", \"Pts\", \"Timebox\"]", "part2.js"],
  ["sprint \\u2192 test \\u2192 acceptance evidence", "timebox \\u2192 test \\u2192 acceptance evidence", "part2.js"],

  /* solution architecture */
  ["Hosting needs a hardening sprint", "Hosting needs a hardening timebox", "part3.js"],
  ["Tabs: Overview \\u00b7 Highlights \\u00b7 Food & Drink \\u00b7 iTravel \\u00b7      \\u2502", "Tabs: Overview \\u00b7 Highlights \\u00b7 Food & Drink \\u00b7 AiTravel \\u00b7      \\u2502", "part3.js"],

  /* risk */
  ["Scope frozen after S3; changes require CR-xx and re-estimation", "Must set frozen after timebox I3; changes require CR-xx and re-estimation", "part4.js"],

  /* KPI / release / deployment */
  ["reviewed at each sprint review", "reviewed at each timebox review", "part4.js"],
  ["**Freeze scope** at the end of Sprint 4; only defect fixes enter Sprint 5.", "**Freeze scope** at the end of timebox I4; only defect fixes enter timebox I5.", "part5.js"],

  /* change log + closure */
  ["[\"0.9\", \"02 Nov 2026\", \"Dev\", \"Branding, responsive pass, regression fixes\"]",
   "[\"0.9\", \"05 Nov 2026\", \"Dev\", \"Branding, responsive pass, regression fixes\"]", "part5.js"],
  ["[\"1.0\", \"03 Nov 2026\", \"PMO\", \"Release baseline and this PM document\"]",
   "[\"1.0\", \"06 Nov 2026\", \"PMO\", \"Release baseline and PM document\"],\n        [\"1.1\", \"06 Nov 2026\", \"PMO\", \"MoSCoW Agile replaces Scrum; dates set to 06 Oct \\u2013 06 Nov 2026; AiTravel rename\"]", "part5.js"],
  ["the project is closed at version 1.0", "the product is released at version 1.0 and this document is at version 1.1", "part5.js"],
  ["AiTravel Booking System v1.0 is accepted as complete", "AiTravel Booking System v1.0 is accepted as complete", "part5.js"],

  /* docx metadata */
  ["project management, iTravel, travel booking, AI", "project management, AiTravel, travel booking, AI", "docxkit.js"],
  ["<Application>iTravel PMO</Application>", "<Application>AiTravel PMO</Application>", "docxkit.js"],
];

let report = [];
for (const name of files) {
  const p = path.join(dir, name);
  let s = fs.readFileSync(p, "utf8");
  let n = 0;
  for (const [from, to, where] of pairs) {
    if (where !== "all" && where !== name) continue;
    const parts = s.split(from);
    const hits = parts.length - 1;
    if (hits > 0) {
      s = parts.join(to);
      n += hits;
      report.push(`${name}: ${hits}x  ${from.slice(0, 60)}`);
    }
  }
  fs.writeFileSync(p, s);
  if (n === 0) report.push(`${name}: (no changes)`);
}
console.log(report.join("\n"));
