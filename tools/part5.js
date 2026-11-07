/* Sections 17-20 + appendices */
"use strict";
const { B, table: T } = require("./docxkit");

module.exports = function () {
  const out = [];

  /* ================= 17. BUDGET ================= */
  out.push(B.h1("17. Budget & Cost Tracking"));
  out.push(B.p("The project is designed to cost nothing in cash. The tables therefore separate **cash spend** (what was actually paid) from **notional cost** (what the effort and infrastructure would cost if purchased), so the economics are visible without pretending money changed hands."));

  out.push(B.h2("17.1 Budget summary"));
  out.push(
    T(
      [
        ["Category", "Baseline", "Actual (cash)", "Notional value", "Variance"],
        ["Software", "\u00a30", "\u00a30", "\u00a30", "\u00a30"],
        ["Cloud / hosting", "\u00a30", "\u00a30", "\u00a30 (local)", "\u00a30"],
        ["APIs", "\u00a30", "\u00a30", "\u00a30 (free tiers + test mode)", "\u00a30"],
        ["Resources (effort)", "\u00a30", "\u00a30", "\u00a35,940", "\u00a30 cash"],
        ["Tools", "\u00a30", "\u00a30", "\u00a30", "\u00a30"],
        ["**Total**", "**\u00a30**", "**\u00a30**", "**\u00a35,940**", "**\u00a30**"],
      ],
      { widths: [26, 16, 18, 26, 14] }
    )
  );

  out.push(B.h2("17.2 Software"));
  out.push(
    T(
      [
        ["Item", "Licence", "Cost", "Notes"],
        ["Node.js 18+ runtime", "MIT", "\u00a30", "Only runtime dependency"],
        ["Operating system", "Existing", "\u00a30", "Windows development host"],
        ["Browser (test)", "Existing", "\u00a30", "Chromium-based, plus Firefox spot check"],
        ["Editor", "Free tier", "\u00a30", "No paid extensions required"],
        ["Version control", "Free", "\u00a30", "Local git repository"],
      ],
      { widths: [28, 18, 14, 40] }
    )
  );

  out.push(B.h2("17.3 Cloud (scale scenario \u2013 not incurred)"));
  out.push(
    T(
      [
        ["Component", "Specification", "Monthly estimate", "Trigger to adopt"],
        ["Application host", "2 vCPU, 2 GB, managed Node runtime", "\u00a325", "First external users"],
        ["Object storage / CDN", "Static assets, 20 GB egress", "\u00a310", "Traffic > 5k sessions/month"],
        ["Managed Postgres + pgvector", "1 vCPU, 1 GB, 20 GB disk", "\u00a312", "Saving/sharing plans, RAG chunks"],
        ["Monitoring", "Uptime + error tracking free tier", "\u00a30\u2013\u00a310", "Pilot launch"],
        ["**Subtotal**", "", "**\u00a347\u2013\u00a357 / month**", ""],
      ],
      { widths: [26, 40, 20, 14] }
    )
  );

  out.push(B.h2("17.4 APIs"));
  out.push(
    T(
      [
        ["API", "Tier used", "Cost", "Ceiling / note"],
        ["Open-Meteo forecast & geocoding", "Free, non-commercial", "\u00a30", "Fair-use; cache 10 min / 24 h"],
        ["Wikidata / Wikipedia / Wikivoyage", "Open", "\u00a30", "Attribution; polite pacing"],
        ["Nominatim", "Open", "\u00a30", "1 request/second, cache 60 min"],
        ["Duffel Air", "Test mode", "\u00a30", "Synthetic inventory; token required"],
        ["Duffel Stays", "Test mode (access may be gated)", "\u00a30", "Fallback to deep links"],
        ["LLM (Phase B+, estimate)", "Pay-per-token", "\u00a30.006 per plan", "3k in + 800 out tokens, mid tier"],
      ],
      { widths: [30, 26, 20, 24] }
    )
  );

  out.push(B.h2("17.5 Resources"));
  out.push(
    T(
      [
        ["Resource", "Quantity", "Rate (notional)", "Cost"],
        ["Lead developer", "132 hours (22 effort days \u00d7 6 h)", "\u00a345 / hour", "\u00a35,940"],
        ["Product owner time", "22 hours", "Internal", "\u00a30"],
        ["QA / review time", "11 hours", "Internal", "\u00a30"],
        ["**Total notional**", "", "", "**\u00a35,940**"],
      ],
      { widths: [34, 26, 20, 20] }
    )
  );
  out.push(B.p("The 6-hour productive day is a deliberate assumption: it accounts for research, context switching and documentation that a raw 8-hour rate would hide. At a \u00a360/hour blended rate the notional effort value would be \u00a37,920."));

  out.push(B.h2("17.6 Cost control"));
  out.push(B.bullet("**Rule 1:** no paid service may be introduced without a change request that states monthly cost and exit plan."));
  out.push(B.bullet("**Rule 2:** any future LLM usage runs behind a per-session token ceiling and a monthly hard budget."));
  out.push(B.bullet("**Rule 3:** cache TTLs are set to the longest value compatible with freshness, because every cache hit removes an API call."));
  out.push(B.bullet("**Tracking:** cash spend is reviewed at each timebox review (always \u00a30 in v1.0); notional effort is tracked against the 22 effort-day baseline in Section 14."));
  out.push(B.pageBreak());

  /* ================= 18. TESTING ================= */
  out.push(B.h1("18. Testing Strategy"));
  out.push(B.p("Testing is proportionate to a zero-dependency, single-developer MVP: a manual but disciplined pyramid, with every test tied to an acceptance criterion. Automation is the first item in the v1.1 backlog."));

  out.push(B.h2("18.1 Test levels"));
  out.push(
    T(
      [
        ["Level", "Scope", "Approach", "Exit criterion"],
        ["Unit", "Parsers, validators, scoring, date maths", "Targeted console assertions and fixture strings", "All fixtures pass; no false listings"],
        ["Integration", "Each upstream API through the proxy", "Live calls plus forced-failure injection", "Correct data or correct fallback for every source"],
        ["System / E2E", "Full journey per persona", "12-scenario script", "No console errors; every panel renders"],
        ["UAT", "Acceptance against success criteria", "Owner walkthrough with sign-off", "SC-1 to SC-8 met"],
        ["AI evaluation", "Planner and advisor output quality", "Golden set + rubric review", "Thresholds in 18.6 met"],
        ["Non-functional", "Performance, security, accessibility", "Targeted checks", "Section 8 targets met or gap logged"],
      ],
      { widths: [16, 28, 32, 24] }
    )
  );

  out.push(B.h2("18.2 Unit testing"));
  out.push(B.bullet("**Parser fixtures:** three saved wikitext samples (nested templates, legacy bold bullets, district page) are parsed and the listing count, title and stripped markup are asserted."));
  out.push(B.bullet("**Section ranges:** a fixture with H2 and H3 headings verifies that a Sleep section absorbs its Budget/Mid-range subsections and stops at the next H2."));
  out.push(B.bullet("**Validation:** IATA regex, date ordering, past-date rejection, radius and passenger bounds, and body-size cap are each exercised with valid and invalid input."));
  out.push(B.bullet("**Scoring:** persona weights are checked with four synthetic listings to confirm the intended ranking order."));
  out.push(B.bullet("**Date helpers:** month boundaries, leap day and DST-free UTC arithmetic are verified."));

  out.push(B.h2("18.3 Integration testing"));
  out.push(
    T(
      [
        ["Integration", "Happy path", "Failure injection", "Expected behaviour"],
        ["Geocoding", "Search \u201cLisbon\u201d", "Return 429", "Retry, then a readable error in the suggestion list"],
        ["Forecast", "Load 7 days", "Block host", "Overview shows an error card; other tabs still work"],
        ["Wikidata", "Country facts for Japan", "Return malformed JSON", "Country panel omitted silently; page unaffected"],
        ["Wikivoyage", "Tokyo with districts", "Fail 3 of 6 subpages", "Remaining districts still produce listings"],
        ["Nominatim", "Reverse geocode a coordinate", "Timeout", "Fall back to \u201cCurrent location\u201d label"],
        ["Duffel token", "Save valid test token", "Invalid token", "Rejected with a specific message; previous token retained"],
        ["Duffel flights", "LON \u2192 TYO return", "401 / 429", "Mapped message; retry guidance; no stack trace"],
        ["Duffel stays", "Hotel search", "403 product not enabled", "Explains access limitation; offers Booking/Kayak links"],
      ],
      { widths: [16, 24, 24, 36] }
    )
  );

  out.push(B.h2("18.4 System and end-to-end"));
  out.push(B.p("The 12-scenario regression script: (1) cold start with no saved state; (2) search and select a city; (3) reload and confirm restore; (4) overview weather; (5) highlights incl. districts; (6) food and drink; (7) planner for Budget; (8) planner for Business; (9) planner for Family; (10) flights with no token; (11) flights with token; (12) chatbot query and hand-off. Each scenario records console output and a screenshot."));

  out.push(B.h2("18.5 User acceptance testing"));
  out.push(
    T(
      [
        ["UAT ID", "Scenario", "Pass condition", "Result"],
        ["UAT-01", "Plan a 3-night city break as a budget traveller", "Plan, stays and budget visible within 3 minutes", "Pass"],
        ["UAT-02", "Same destination as a business traveller", "Central stay preferred; days compact", "Pass"],
        ["UAT-03", "Same destination as a family", "Kid-friendly and paced; indoor backup present", "Pass"],
        ["UAT-04", "Rainy forecast", "Indoor-primary activities on wet days", "Pass"],
        ["UAT-05", "No Duffel token", "Booking tabs explain setup and still link out", "Pass"],
        ["UAT-06", "Mobile viewport 390 px", "No horizontal scroll; chat usable", "Pass"],
        ["UAT-07", "Geolocation denied", "App loads a default destination without error", "Pass"],
      ],
      { widths: [9, 37, 42, 12] }
    )
  );

  out.push(B.h2("18.6 AI evaluation"));
  out.push(B.p("Even without an LLM, the planner's output is evaluated as an AI system because a traveller may act on it."));
  out.push(
    T(
      [
        ["Dimension", "Test", "Pass threshold"],
        ["Intent accuracy", "40 labelled utterances across 6 categories + ambiguous + out-of-scope", "\u2265 90% correct; 0 unsafe matches"],
        ["Grounding", "Every named place must exist in the parsed listing set", "100%"],
        ["Weather fit", "Wet/storm day \u2192 indoor-primary; clear mild day \u2192 outdoor primary", "100% of generated days"],
        ["Persona fit", "Rubric: price sensitivity, centrality, family pacing", "\u2265 4/5 mean across 10 plans"],
        ["Pacing", "No more than 3 anchors per day; no repeated category on consecutive days", "100%"],
        ["Explainability", "Each recommendation states why it was chosen", "Every card has a rationale"],
        ["Robustness", "Empty guide, 1-night trip, 14-night trip, extreme heat", "No crash; explicit limitation message"],
      ],
      { widths: [18, 56, 26] }
    )
  );
  out.push(B.p("For the future LLM (Section 11.7), the same harness gains groundedness citation checks, schema-validity rate and cost per plan; the deterministic output remains the control baseline."));

  out.push(B.h2("18.7 Non-functional testing"));
  out.push(B.bullet("**Performance:** Lighthouse run on the landing state; planner timed with `performance.now()`; proxy latency sampled from server logs."));
  out.push(B.bullet("**Security:** manual checks for path traversal, proxy host bypass, oversized body, invalid IATA, token echo, and error-message leakage."));
  out.push(B.bullet("**Accessibility:** keyboard-only walkthrough complete; automated axe scan and screen-reader pass outstanding (gap G-03)."));
  out.push(B.bullet("**Compatibility:** Chromium and Firefox verified; Safari/WebKit untested (gap G-04)."));

  out.push(B.h2("18.8 Defect management"));
  out.push(
    T(
      [
        ["Severity", "Definition", "Fix target"],
        ["S1 \u2013 Blocker", "Data loss, security exposure, or the app cannot load", "Immediate; blocks release"],
        ["S2 \u2013 Major", "A primary journey fails with no workaround", "Same timebox"],
        ["S3 \u2013 Minor", "Journey works but output is wrong or confusing", "Next timebox"],
        ["S4 \u2013 Cosmetic", "Visual or copy issue", "Backlog"],
      ],
      { widths: [18, 54, 28] }
    )
  );
  out.push(B.p("Defects found to date: one S2 (district listings missing for large cities, fixed by parent-link traversal), two S3 (legacy storage key migration, tab label overflow on narrow screens), several S4 (copy and spacing). None open at release."));
  out.push(B.pageBreak());

  /* ================= 19. DEPLOYMENT ================= */
  out.push(B.h1("19. Deployment Plan"));

  out.push(B.h2("19.1 Environments"));
  out.push(
    T(
      [
        ["Environment", "Purpose", "Host", "Data", "Status"],
        ["DEV", "Build and debug", "Developer machine, 127.0.0.1:8787", "Live free APIs + Duffel test", "Active"],
        ["TEST", "Regression and UAT", "Same machine, clean profile and empty .env", "Live free APIs, no token", "Used per release"],
        ["STAGING (planned)", "Pre-production with TLS and auth", "Managed host, staging subdomain", "Duffel test", "Not built"],
        ["PROD (planned)", "Public pilot", "Managed host + CDN", "Duffel test, then live after commercial approval", "Not built"],
      ],
      { widths: [16, 24, 26, 24, 10] }
    )
  );

  out.push(B.h2("19.2 Release plan"));
  out.push(B.num("**Freeze scope** at the end of timebox I4; only defect fixes enter timebox I5.", 1));
  out.push(B.num("**Run the 12-scenario regression** on a clean browser profile with no token, then with a test token.", 2));
  out.push(B.num("**Verify configuration:** `.env` contains only the Duffel token; port 8787 is free; Node version \u2265 18.", 3));
  out.push(B.num("**Tag the release** (`v1.0.0`) and write release notes: features, known limitations, data sources.", 4));
  out.push(B.num("**Start the service** with `start.bat` (or `node server.js`), confirm HTTP 200 and a populated overview for a default city.", 5));
  out.push(B.num("**Announce** with the URL, a two-line quick start and the token-optional note.", 6));

  out.push(B.h2("19.3 Pre-release checklist"));
  out.push(B.bullet("Server starts with no unhandled rejection and logs the listening URL."));
  out.push(B.bullet("`/api/status` returns `tokenPresent` and `mode` without leaking the token."));
  out.push(B.bullet("Proxy rejects a non-allow-listed host with HTTP 400."));
  out.push(B.bullet("Flight search with a bad IATA code returns a specific 400 message."));
  out.push(B.bullet("All seven tabs render for a default city with an empty cache."));
  out.push(B.bullet("Planner produces plans for all three personas and both 1-night and 14-night cases."));
  out.push(B.bullet("Chat panel opens, answers, and hands off to the planner."));
  out.push(B.bullet("`.env` is not served by the static handler (outside `public/`)."));
  out.push(B.bullet("README matches the shipped behaviour and lists every data source."));

  out.push(B.h2("19.4 Rollback plan"));
  out.push(
    T(
      [
        ["Trigger", "Action", "Recovery target"],
        ["Server fails to start after a change", "Revert to the previous tagged commit and restart", "< 5 min"],
        ["Elevated 5xx or upstream auth failures", "Disable the affected module by reverting its route change; keep read-only content", "< 15 min"],
        ["Token compromised", "Clear the token from Settings (deletes `.env`), revoke it in the Duffel dashboard, issue a new test token", "< 10 min"],
        ["Bad content parse after a Wikimedia change", "Ship the previous parser commit; the empty state keeps the app usable", "< 30 min"],
      ],
      { widths: [30, 50, 20] }
    )
  );
  out.push(B.p("Because the app is stateless, rollback is a code revert plus a restart; there is no schema migration to reverse and no user data to reconcile. RTO is under 15 minutes; RPO is zero for code (version control) and irrelevant for data (nothing persisted server-side)."));

  out.push(B.h2("19.5 Post-release verification"));
  out.push(B.bullet("Smoke test the five API routes and all seven tabs within 30 minutes of release."));
  out.push(B.bullet("Confirm the footer attribution links resolve."));
  out.push(B.bullet("Record the release in the change log (Section 20) with version, date and scope."));
  out.push(B.bullet("Watch the server console for 24 hours for repeated 429/5xx patterns."));

  out.push(B.h2("19.6 Operations and support"));
  out.push(B.p("Support model for the local MVP: the owner restarts the process if it stops, and reports defects through the project backlog. For a hosted pilot, add: process supervision (systemd or platform equivalent), uptime check every minute, log retention of 14 days, a daily backup of the database once one exists, and an on-call rota of one."));
  out.push(B.pageBreak());

  /* ================= 20. CHANGE & SIGN-OFF ================= */
  out.push(B.h1("20. Change Log & Sign-off"));

  out.push(B.h2("20.1 Version history"));
  out.push(
    T(
      [
        ["Version", "Date", "Author", "Change summary"],
        ["0.1", "07 Oct 2026", "Dev", "Server shell, static hosting, proxy skeleton"],
        ["0.2", "15 Oct 2026", "Dev", "Search, weather, country facts, guide parser"],
        ["0.3", "23 Oct 2026", "Dev", "Duffel Air/Stays, token vault, car deep links"],
        ["0.4", "30 Oct 2026", "Dev", "AiTravel Planner (3 personas), budget, comparison"],
        ["0.5", "30 Oct 2026", "Dev", "Weather Advisor chatbot, reverse geocoding"],
        ["0.9", "05 Nov 2026", "Dev", "Branding, responsive pass, regression fixes"],
        ["1.0", "06 Nov 2026", "PMO", "Release baseline and PM document"],
        ["1.1", "06 Nov 2026", "PMO", "MoSCoW Agile replaces Scrum; dates set to 06 Oct \u2013 06 Nov 2026; AiTravel rename"],
      ],
      { widths: [10, 18, 12, 60] }
    )
  );

  out.push(B.h2("20.2 Change requests"));
  out.push(
    T(
      [
        ["CR", "Request", "Impact", "Decision", "Status"],
        ["CR-001", "Rename product from Voyago to AiTravel", "Branding, copy, storage key, docs", "Approved \u2013 migration keeps the old key readable", "Closed"],
        ["CR-002", "Rename planner tab from \u201cAI Planner\u201d to \u201ci\u201d, then to \u201cAiTravel\u201d", "Navigation label only", "Approved", "Closed"],
        ["CR-003", "Add a weather-based destination chatbot", "New component, ~1 day", "Approved \u2013 delivered in timebox I4", "Closed"],
        ["CR-004", "Resolve \u201cCurrent location\u201d to a real place name", "Nominatim integration, proxy allow-list, ~0.5 day", "Approved \u2013 no new key required", "Closed"],
        ["CR-005", "Produce a formal PM baseline document", "Documentation only", "Approved", "Closed"],
        ["CR-006", "Add an LLM planner narration (Phase B)", "New provider, cost, evaluation harness", "Deferred to post-pilot", "Open"],
        ["CR-007", "Host publicly with accounts", "Auth, TLS, database, privacy review", "Deferred \u2013 requires a new business case", "Open"],
      ],
      { widths: [8, 34, 26, 22, 10] }
    )
  );

  out.push(B.h2("20.3 Approvals"));
  out.push(
    T(
      [
        ["Role", "Name", "Signature", "Date"],
        ["Project sponsor / owner", "", "", ""],
        ["Project manager", "", "", ""],
        ["Technical lead", "", "", ""],
        ["Quality assurance", "", "", ""],
      ],
      { widths: [26, 26, 30, 18] }
    )
  );
  out.push(B.p("Sign-off confirms that the deliverables in Section 1.4 have been reviewed, that the known limitations in Sections 5.2 and 10.8 are accepted, and that the product is released at version 1.0 and this document is at version 1.1."));

  out.push(B.h2("20.4 Lessons learned"));
  out.push(B.h3("What worked"));
  out.push(B.bullet("**Retiring the hardest risk first.** The Wikivoyage parser was built immediately after the shell, so the largest unknown was resolved before booking work began."));
  out.push(B.bullet("**Designing for failure from day one.** `Promise.allSettled`, per-module error states and deep-link fallbacks meant a single dead API never produced a blank screen."));
  out.push(B.bullet("**Zero dependencies.** No install, no lockfile drift, no supply-chain alerts; the whole app is two files plus documentation."));
  out.push(B.bullet("**Proxy as a single egress.** CORS, caching, secret isolation and validation all landed in one place instead of being sprinkled across the client."));

  out.push(B.h3("What did not work"));
  out.push(B.bullet("**Estimating parser work.** Wikivoyage markup was more irregular than expected; district aggregation took roughly twice the initial estimate."));
  out.push(B.bullet("**Editing a large single file.** Several early edits failed on whitespace mismatches because the file is large and hand-edited. A split into `app.js` and `theme.css` would have reduced friction."));
  out.push(B.bullet("**Deferring instrumentation.** Without client events, business KPIs are estimates; instrumentation should have been in timebox I1, not deferred."));
  out.push(B.bullet("**No automated tests.** Manual regression is reliable at this size but will not scale; the 12-scenario script is a stopgap."));

  out.push(B.h3("Actions for the next increment"));
  out.push(B.bullet("Split the frontend into three files and add a minimal smoke-test script (Node, no framework)."));
  out.push(B.bullet("Add client-side event capture for the business KPIs before any pilot."));
  out.push(B.bullet("Complete the accessibility audit (axe + screen reader) and publish a licence page."));
  out.push(B.bullet("Run the planned interviews and survey (Section 6.4) to replace assumptions with data."));
  out.push(B.bullet("Decide Phase B (LLM narration) only after the deterministic baseline has four weeks of measured use."));

  out.push(B.h2("20.5 Closure statement"));
  out.push(B.p("The AiTravel Booking System v1.0 is accepted as complete against the charter in Section 1. All eight success criteria are met or have a documented, accepted gap. The project closes with a zero cash budget, a documented architecture, a reproducible local deployment, and a prioritised backlog for the next increment."));
  out.push(B.pageBreak());

  /* ================= APPENDICES ================= */
  out.push(B.h1("Appendix A. Module & File Inventory"));
  out.push(
    T(
      [
        ["Path", "Role", "Notes"],
        ["travel-app/server.js", "HTTP server, proxy, token vault, API routes", "~370 lines, four built-in modules"],
        ["travel-app/public/index.html", "Entire client: theme, markup, logic", "~1,780 lines, no build step"],
        ["travel-app/start.bat", "Windows launcher", "Sets title and starts Node"],
        ["travel-app/.env.example", "Token template", "No secrets committed"],
        ["travel-app/README.md", "Setup, data sources, limitations", "Primary operator guide"],
        ["travel-app/.env", "Local token storage (git-ignored)", "Created on first save"],
      ],
      { widths: [30, 40, 30] }
    )
  );

  out.push(B.h1("Appendix B. API Reference"));
  out.push(
    T(
      [
        ["Endpoint", "Method", "Request", "Response"],
        ["/api/status", "GET", "\u2013", "{ tokenPresent, tokenHint, mode }"],
        ["/api/token", "POST", "{ token } or { action: \"clear\" }", "{ tokenPresent, tokenHint, mode }"],
        ["/api/proxy", "GET", "?u=<https URL on allow-list>", "Upstream JSON, cached"],
        ["/api/search/flights", "POST", "{ origin, destination, departureDate, returnDate?, adults, cabin }", "{ offers[], liveMode }"],
        ["/api/search/hotels", "POST", "{ latitude, longitude, radiusKm, checkIn, checkOut, adults, rooms }", "{ results[] }"],
      ],
      { widths: [20, 8, 42, 30] }
    )
  );

  out.push(B.h1("Appendix C. Data Source & Licence Register"));
  out.push(
    T(
      [
        ["Source", "Content used", "Licence / terms", "Attribution"],
        ["Open-Meteo", "Forecast, geocoding", "Free for non-commercial use", "Footer link"],
        ["Wikivoyage", "Listings and guides", "CC BY-SA 4.0", "Footer link + share-alike notice"],
        ["Wikipedia", "Destination summary", "CC BY-SA 4.0", "Footer link"],
        ["Wikidata", "Country facts", "CC0", "Footer link"],
        ["OpenStreetMap / Nominatim", "Reverse geocoding", "ODbL + usage policy", "Footer link, 1 req/s"],
        ["Duffel", "Flight and stay inventory", "Commercial API terms, test mode", "Footer link"],
      ],
      { widths: [22, 26, 30, 22] }
    )
  );

  out.push(B.h1("Appendix D. Glossary"));
  const glossary = [
    ["ADR", "Architecture Decision Record"],
    ["BFF", "Backend for Frontend \u2013 a server dedicated to one client"],
    ["CORS", "Cross-Origin Resource Sharing \u2013 browser rule blocking direct third-party calls"],
    ["CR", "Change Request"],
    ["Duffel", "Flight and stay inventory API used here in free test mode"],
    ["HNSW", "Hierarchical Navigable Small World \u2013 approximate nearest-neighbour index used by vector databases"],
    ["IATA", "Three-letter airport/city code (e.g. LHR, TYO)"],
    ["KPI", "Key Performance Indicator"],
    ["LLM", "Large Language Model"],
    ["MoSCoW", "Must / Should / Could / Won't prioritisation"],
    ["MVP", "Minimum Viable Product"],
    ["NFR", "Non-Functional Requirement"],
    ["Nominatim", "OpenStreetMap geocoding service with a strict usage policy"],
    ["RAG", "Retrieval-Augmented Generation \u2013 grounding a model in retrieved evidence"],
    ["SSRF", "Server-Side Request Forgery \u2013 abuse of a server to call internal URLs"],
    ["TTL", "Time To Live \u2013 cache expiry"],
    ["UAT", "User Acceptance Testing"],
    ["WBS", "Work Breakdown Structure"],
    ["WMO", "World Meteorological Organization \u2013 source of the weather codes used by Open-Meteo"],
  ];
  out.push(T([["Term", "Meaning"]].concat(glossary), { widths: [16, 84] }));

  out.push(B.spacer(240));
  out.push(B.p("\u2014 End of document \u2014", { align: "center", style: "Small" }));

  return out.join("");
};
