"use strict";
const fs = require("fs");
const path = require("path");
const dir = __dirname;

function edit(name, fn) {
  const p = path.join(dir, name);
  const before = fs.readFileSync(p, "utf8");
  const after = fn(before);
  fs.writeFileSync(p, after);
  console.log(name, before === after ? "(unchanged)" : "updated");
}

/* 1. Story table: sprint numbers 1-5 -> timeboxes I1-I5 */
edit("part2.js", (s) =>
  s.replace(/^(\s*\["E\d[^\n]*), "([1-5])"\],$/gm, '$1, "I$2"],')
);

/* 2. Generic sprint wording outside the deliberate Scrum comparison */
const wording = [
  ["Daily build notes; sprint review", "Daily build notes; timebox review"],
  ["hosting needs a hardening sprint", "hosting needs a hardening timebox"],
  ["reviewed at each sprint review (always", "reviewed at each timebox review (always"],
  ["tracked against the 22-day baseline in Section 14", "tracked against the 22 effort-day baseline in Section 14"],
  ["[\"S2 \\u2013 Major\", \"A primary journey fails with no workaround\", \"Same sprint\"]", "[\"S2 \\u2013 Major\", \"A primary journey fails with no workaround\", \"Same timebox\"]"],
  ["[\"S3 \\u2013 Minor\", \"Journey works but output is wrong or confusing\", \"Next sprint\"]", "[\"S3 \\u2013 Minor\", \"Journey works but output is wrong or confusing\", \"Next timebox\"]"],
  ["delivered in Sprint 4", "delivered in timebox I4"],
  ["instrumentation should have been in Sprint 1", "instrumentation should have been in timebox I1"],
  ["Bars are aligned to the five one-week sprints; testing overlaps the final development sprint by design.", "Bars are aligned to the five one-week timeboxes; testing overlaps the final development timebox by design."],
  ["Week        05-09   12-16   19-23   26-30   02-03", "Week        06-09   12-16   19-23   26-30   02-06"],
];
for (const name of ["part1.js", "part3.js", "part4.js", "part5.js"]) {
  edit(name, (s) => {
    for (const [a, b] of wording) s = s.split(a).join(b);
    return s;
  });
}

/* 3. Re-date the Gantt task rows */
const gantt = {
  T01: ["06 Oct", "06 Oct"],
  T02: ["06 Oct", "07 Oct"],
  T03: ["07 Oct", "08 Oct"],
  T04: ["08 Oct", "09 Oct"],
  T05: ["09 Oct", "09 Oct"],
  T06: ["12 Oct", "12 Oct"],
  T07: ["13 Oct", "14 Oct"],
  T08: ["15 Oct", "16 Oct"],
  T09: ["19 Oct", "19 Oct"],
  T10: ["20 Oct", "22 Oct"],
  T11: ["23 Oct", "23 Oct"],
  T12: ["26 Oct", "28 Oct"],
  T13: ["28 Oct", "29 Oct"],
  T14: ["29 Oct", "30 Oct"],
  T15: ["30 Oct", "30 Oct"],
  T16: ["02 Nov", "04 Nov"],
  T17: ["04 Nov", "04 Nov"],
  T18: ["05 Nov", "05 Nov"],
  T19: ["06 Nov", "06 Nov"],
};
edit("part4.js", (s) =>
  s.replace(/^(\s*\["(T\d\d)", "[^"]*", "[^"]*", )"[^"]*", "[^"]*"(, "[^"]*", "[^"]*"\],)$/gm, (m, pre, id, post) => {
    const d = gantt[id];
    return d ? `${pre}"${d[0]}", "${d[1]}"${post}` : m;
  })
);

/* 4. Resource line wording */
edit("part5.js", (s) =>
  s.split("132 hours (22 days \\u00d7 6 h)").join("132 hours (22 effort days \\u00d7 6 h)")
);
