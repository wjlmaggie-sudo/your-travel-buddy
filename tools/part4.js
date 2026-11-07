/* Sections 13-16 */
"use strict";
const { B, table: T } = require("./docxkit");

module.exports = function () {
  const out = [];

  /* ================= 13. WBS ================= */
  out.push(B.h1("13. Work Breakdown Structure (WBS)"));
  out.push(B.p("Effort is expressed in person-days for a single developer. The five level-1 phases match the requested structure: initiation, planning, development, testing, deployment."));
  out.push(
    T(
      [
        ["WBS", "Work package", "Phase", "Deliverable", "Effort (days)"],
        ["1.0", "Initiation", "1", "\u2013", "2.0"],
        ["1.1", "Define problem, personas and success criteria", "1", "Charter, success criteria", "0.5"],
        ["1.2", "Feasibility spikes on candidate APIs (cost, licence, CORS, limits)", "1", "Source shortlist", "1.0"],
        ["1.3", "Select booking provider; document decision", "1", "ADR-003", "0.5"],
        ["2.0", "Planning", "2", "\u2013", "3.0"],
        ["2.1", "Architecture and data-flow design", "2", "Section 10 diagrams", "1.0"],
        ["2.2", "Backlog, acceptance criteria and estimation", "2", "Section 9", "1.0"],
        ["2.3", "Risk, test and release planning", "2", "Sections 15, 18, 19", "1.0"],
        ["3.0", "Development", "3", "\u2013", "11.0"],
        ["3.1", "Server: static hosting, routing, error envelope", "3", "server.js v0.1", "1.0"],
        ["3.2", "Server: allow-listed proxy and cache", "3", "proxy route", "1.0"],
        ["3.3", "Server: Duffel token vault and validation", "3", "token route, .env", "1.0"],
        ["3.4", "Client: theme, shell, tabs, search", "3", "index.html v0.2", "1.5"],
        ["3.5", "Client: weather and country briefing", "3", "Overview tab", "1.0"],
        ["3.6", "Client: Wikivoyage parser and district aggregation", "3", "Highlights, Food tabs", "2.0"],
        ["3.7", "Client: flights and hotels modules", "3", "Flights, Hotels tabs", "1.5"],
        ["3.8", "Client: car-rental deep links", "3", "Cars tab", "0.5"],
        ["3.9", "Client: AiTravel Planner engine and UI", "3", "Planner tab", "2.0"],
        ["3.10", "Client: Weather Advisor chatbot", "3", "Chat panel", "1.0"],
        ["3.11", "Client: reverse geocoding and destination restore", "3", "Boot flow", "0.5"],
        ["4.0", "Testing", "4", "\u2013", "4.0"],
        ["4.1", "Unit-level checks of parsers, scoring and validation", "4", "Manual test notes", "1.0"],
        ["4.2", "Integration tests per upstream API", "4", "Integration matrix", "1.0"],
        ["4.3", "End-to-end regression across 12 scenarios", "4", "Regression checklist", "1.0"],
        ["4.4", "Responsive, keyboard and console-error pass", "4", "UAT sign-off", "1.0"],
        ["5.0", "Deployment", "5", "\u2013", "2.0"],
        ["5.1", "Launcher, .env template, README", "5", "start.bat, README", "0.5"],
        ["5.2", "Release checklist, smoke test and rollback note", "5", "Release record", "0.5"],
        ["5.3", "Project management baseline and handover", "5", "This document", "1.0"],
        ["", "Total", "", "", "22.0"],
      ],
      { widths: [7, 53, 8, 20, 12] }
    )
  );
  out.push(B.p("**Capacity:** the plan consumes 22 of the 24 working days; the two unallocated days are contingency and were used for regression testing rather than new scope. This matches the MoSCoW effort model in Section 12.10."));
  out.push(B.p("**Critical path:** 1.2 \u2192 2.1 \u2192 3.1 \u2192 3.2 \u2192 3.4 \u2192 3.6 \u2192 3.9 \u2192 4.3 \u2192 5.3. The Wikivoyage parser (3.6) carried the greatest uncertainty and was scheduled immediately after the shell so that its risk was retired early."));
  out.push(B.pageBreak());

  /* ================= 14. GANTT ================= */
  out.push(B.h1("14. Gantt Chart Template"));
  out.push(B.p("Dates are the actual baseline for v1.0. Dependencies use finish-to-start unless marked. The template can be reused for v1.1 by shifting all dates by the release delta."));
  out.push(
    T(
      [
        ["ID", "Task", "Owner", "Start", "Finish", "Dep.", "% done"],
        ["T01", "Charter, personas, success criteria", "PO", "06 Oct", "06 Oct", "\u2013", "100"],
        ["T02", "API feasibility spikes and selection", "Dev", "06 Oct", "07 Oct", "T01", "100"],
        ["T03", "Architecture and data-flow design", "Dev", "07 Oct", "08 Oct", "T02", "100"],
        ["T04", "Backlog and acceptance criteria", "PO", "08 Oct", "09 Oct", "T03", "100"],
        ["T05", "Server shell, routing, error envelope", "Dev", "09 Oct", "09 Oct", "T03", "100"],
        ["T06", "Allow-listed proxy and cache", "Dev", "12 Oct", "12 Oct", "T05", "100"],
        ["T07", "Search, weather, country briefing", "Dev", "13 Oct", "14 Oct", "T06", "100"],
        ["T08", "Wikivoyage parser + district fallback", "Dev", "15 Oct", "16 Oct", "T07", "100"],
        ["T09", "Duffel token vault and validation", "Dev", "19 Oct", "19 Oct", "T05", "100"],
        ["T10", "Flights and hotels modules", "Dev", "20 Oct", "22 Oct", "T09", "100"],
        ["T11", "Car-rental deep links", "Dev", "23 Oct", "23 Oct", "T07", "100"],
        ["T12", "Planner engine (personas, weather mapping)", "Dev", "26 Oct", "28 Oct", "T08, T10", "100"],
        ["T13", "Planner UI, budget, comparison", "Dev", "28 Oct", "29 Oct", "T12", "100"],
        ["T14", "Weather Advisor chatbot", "Dev", "29 Oct", "30 Oct", "T12", "100"],
        ["T15", "Reverse geocoding + destination restore", "Dev", "30 Oct", "30 Oct", "T07", "100"],
        ["T16", "Integration and regression testing", "Dev/QA", "02 Nov", "04 Nov", "T13, T14", "100"],
        ["T17", "Responsive and keyboard pass", "Dev", "04 Nov", "04 Nov", "T16", "100"],
        ["T18", "README, launcher, release notes", "Dev", "05 Nov", "05 Nov", "T16", "100"],
        ["T19", "PM baseline and handover", "PMO", "06 Nov", "06 Nov", "T18", "100"],
      ],
      { widths: [6, 40, 10, 10, 10, 12, 12] }
    )
  );

  out.push(B.h2("14.1 Timeline view (weeks)"));
  const g = [
    "Week        06-09   12-16   19-23   26-30   02-06",
    "Initiation  █████",
    "Planning    █████",
    "Server      █████   ███",
    "Search      █████   ███",
    "Guides              █████",
    "Booking                     █████",
    "Planner                             █████",
    "Advisor                             █████",
    "Testing                             █████   ███",
    "Release                                     ███",
  ];
  g.forEach((l) => out.push(B.mono(l)));
  out.push(B.p(""));
  out.push(B.caption("Figure 14.1 \u2013 Baseline schedule. Bars are aligned to the five one-week timeboxes; testing overlaps the final development timebox by design."));
  out.push(B.pageBreak());

  /* ================= 15. RISK ================= */
  out.push(B.h1("15. Risk Register"));
  out.push(B.p("Score = probability \u00d7 impact on a 1\u20135 scale (P\u00d7I). Anything \u2265 12 is escalated to the project owner. AI-specific risks are included because the planner produces recommendations that a traveller may act on."));
  out.push(
    T(
      [
        ["ID", "Risk", "P", "I", "Score", "Mitigation", "Owner", "Status"],
        ["R-01", "Duffel changes endpoints or retires test mode", "3", "4", "12", "Version pinned; adapter isolated in `duffel()`; deep-link fallbacks for every booking surface", "Dev", "Open \u2013 monitored"],
        ["R-02", "Duffel Stays access is not enabled on the account", "3", "3", "9", "Detect 403 on the stays product and fall back to Wikivoyage sleep picks + Booking/Kayak links", "Dev", "Mitigated"],
        ["R-03", "Free API rate limiting (Wikimedia, Nominatim)", "3", "3", "9", "Server cache (30\u201360 min), concurrency capped at 3, retry with backoff, single User-Agent", "Dev", "Mitigated"],
        ["R-04", "Wikivoyage template or section layout changes", "3", "3", "9", "Brace-counted parser, section-range stack, district fallback, graceful empty state", "Dev", "Open \u2013 monitored"],
        ["R-05", "CORS blocks a newly added source", "2", "3", "6", "All egress goes through the allow-listed proxy", "Dev", "Mitigated"],
        ["R-06", "Planner recommends a place that does not exist", "1", "5", "5", "Recommendations are drawn only from parsed listings; no generative model in v1.0", "Dev", "Controlled"],
        ["R-07", "Planner gives poor advice for extreme weather", "2", "4", "8", "Explicit extreme-heat/cold rules; indoor alternatives always available; advisory disclaimer", "Dev", "Partially mitigated"],
        ["R-08", "Chatbot intent misfires on ambiguous phrasing", "3", "2", "6", "Ordered precedence rules, explicit fallback menu, 6-category coverage test", "Dev", "Mitigated"],
        ["R-09", "Token leakage to the browser or logs", "1", "5", "5", "Token never returned; masked hint only; no request-body logging; localhost binding", "Dev", "Controlled"],
        ["R-10", "SSRF via the proxy parameter", "1", "5", "5", "HTTPS-only, hostname allow-list, no redirects followed, no user-supplied headers", "Dev", "Controlled"],
        ["R-11", "Stale response overwrites a newer destination", "2", "3", "6", "Monotonic request id checked before every state commit", "Dev", "Mitigated"],
        ["R-12", "Single developer unavailable (bus factor 1)", "2", "5", "10", "README and this document encode setup, architecture and decisions; code kept dependency-free", "PO", "Open \u2013 accepted"],
        ["R-13", "Scope creep from ad-hoc feature requests", "3", "3", "9", "Must set frozen after timebox I3; changes require CR-xx and re-estimation", "PO", "Mitigated"],
        ["R-14", "Content licence breach (Wikimedia reuse)", "1", "4", "4", "Attribution in footer, links to source, no bulk re-hosting", "Dev", "Mitigated"],
        ["R-15", "Future LLM hallucination or prompt injection", "3", "5", "15", "Not in v1.0. For Phase B+: citation gate, schema validation, injection stripping, deterministic fallback", "Dev", "Future \u2013 planned"],
        ["R-16", "Future LLM cost overrun", "3", "3", "9", "Token ceiling per session, 24 h response cache, monthly budget alarm", "PO", "Future \u2013 planned"],
        ["R-17", "Accessibility non-conformance", "3", "2", "6", "Keyboard pass done; axe audit and WCAG 2.1 AA review scheduled for v1.1", "Dev", "Open"],
      ],
      { widths: [6, 29, 5, 5, 6, 33, 6, 10] }
    )
  );
  out.push(B.h2("15.1 Risk appetite and thresholds"));
  out.push(B.bullet("**Do not ship** if R-09, R-10 or a groundedness failure is open \u2014 these are release blockers."));
  out.push(B.bullet("**Ship with disclosure** if R-02 or R-07 is open: the fallback is visible and explained in the UI."));
  out.push(B.bullet("**Accept and monitor** R-12 given the single-developer constraint; documentation is the mitigation."));
  out.push(B.pageBreak());

  /* ================= 16. KPI ================= */
  out.push(B.h1("16. KPI Dashboard"));
  out.push(B.p("KPIs are split into business, technical and AI quality. Each has a target, a measurement method and a review cadence. Values in the \u201ccurrent\u201d column are observations from local testing, not production telemetry."));

  out.push(B.h2("16.1 Business KPIs"));
  out.push(
    T(
      [
        ["KPI", "Definition", "Target", "Current", "Source", "Cadence"],
        ["Time to first plan", "Median time from landing to a generated itinerary", "< 3 min", "~90 s (manual)", "Task timing", "Per release"],
        ["Research consolidation", "Distinct external sites needed for a decision", "1", "1 for content, 2\u20134 for booking", "Walkthrough", "Per release"],
        ["Planner completion rate", "% of planner starts that produce a plan", "\u2265 80%", "Not instrumented", "Client event", "Weekly (post-launch)"],
        ["Outbound click rate", "Booking/affiliate clicks per session", "\u2265 12%", "Not instrumented", "Client event", "Weekly (post-launch)"],
        ["Return usage", "% of users returning within 30 days", "\u2265 25%", "No accounts \u2013 proxy metric needed", "Local storage / analytics", "Monthly"],
        ["Persona coverage", "% of plans generated for each persona", "Within 60/20/20", "Not instrumented", "Client event", "Monthly"],
        ["Support questions", "Repeat questions about setup or token", "< 5% of sessions", "Low (single user)", "Issue log", "Monthly"],
      ],
      { widths: [18, 30, 12, 16, 14, 10] }
    )
  );

  out.push(B.h2("16.2 Technical KPIs"));
  out.push(
    T(
      [
        ["KPI", "Target", "Current", "Measurement"],
        ["Page first contentful paint (localhost)", "< 1.0 s", "\u2248 0.4 s", "Chrome performance panel"],
        ["Cached proxy latency", "< 150 ms", "\u2248 5\u201320 ms", "Server timing"],
        ["Uncached weather latency (p95)", "< 2.5 s", "\u2248 0.8\u20131.6 s", "Sample of 10 cities"],
        ["Planner render", "< 300 ms", "\u2248 20\u201360 ms", "performance.now()"],
        ["Console errors on regression set", "0", "0", "Browser console capture"],
        ["Proxy cache hit rate", "> 60% in a session", "Higher after first navigation", "Cache counters (to add)"],
        ["Upstream error rate", "< 2%", "< 1% observed", "Server log"],
        ["Cold start to listening", "< 1 s", "\u2248 100 ms", "Startup log"],
        ["Payload size", "< 250 KB", "\u2248 96 KB HTML", "File size"],
      ],
      { widths: [34, 18, 24, 24] }
    )
  );

  out.push(B.h2("16.3 AI KPIs (current deterministic engine)"));
  out.push(
    T(
      [
        ["KPI", "Target", "Current", "Method"],
        ["Intent classification accuracy", "\u2265 90% on 40 utterances", "100% on the 18-utterance smoke set", "Golden-set script"],
        ["Recommendation relevance", "\u2265 4.0 / 5", "Not formally rated", "Two-reviewer rubric on 10 plans"],
        ["Weather suitability of scheduled activities", "100% of wet days indoor-primary", "100% by rule construction", "Automated assertion on plan object"],
        ["Fabricated places", "0", "0 (closed vocabulary)", "Citation check against listings"],
        ["Plan generation latency", "< 300 ms", "\u2248 20\u201360 ms", "Instrumented timing"],
        ["Fallback rate (no intent match)", "< 15%", "Not measured", "Chat event log"],
        ["Cost per plan", "\u00a30 in v1.0", "\u00a30", "Token accounting (Phase B+)"],
      ],
      { widths: [32, 24, 24, 20] }
    )
  );

  out.push(B.h2("16.4 Reporting"));
  out.push(B.p("A one-page dashboard is reviewed at each timebox review: four business counters, four technical counters and three AI-quality counters. Until client-side events are added, business and AI counters are gathered manually from the regression run; the instrumentation backlog item is US-31 (add event capture) and is a prerequisite for the hosted pilot."));
  out.push(B.pageBreak());

  return out.join("");
};
