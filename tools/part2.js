/* Sections 6-9 */
"use strict";
const { B, table: T } = require("./docxkit");

module.exports = function () {
  const out = [];

  /* ================= 6. REQUIREMENTS ENGINEERING ================= */
  out.push(B.h1("6. Requirements Engineering"));

  out.push(B.h2("6.1 Approach and evidence base"));
  out.push(B.p("Requirements were derived from six sources rather than a single workshop: (1) discovery sessions with the project owner acting as sponsor and proxy for the target user; (2) a competitive teardown of six travel products; (3) technical feasibility spikes against each candidate API; (4) iterative backlog refinement at the start of every timebox; (5) heuristic evaluation of each build against Nielsen's ten usability heuristics; (6) defect-driven requirements discovered during regression testing."));
  out.push(B.note("Transparency note: no formal end-user interviews, surveys or usability lab sessions were executed before v1.0. The interview and survey instruments below are documented as the planned research programme for the hosted pilot. Requirements in Section 7 are traceable to owner discovery, competitor gaps and feasibility spikes \u2014 not to a statistically valid user sample."));

  out.push(B.h2("6.2 Stakeholder interviews (discovery sessions)"));
  out.push(
    T(
      [
        ["Session", "Participant", "Theme explored", "Requirement generated"],
        ["DS-01", "Project owner", "Why existing tools fail on a weekend trip", "FR-01 unified search, FR-03 weather briefing"],
        ["DS-02", "Project owner (business travel hat)", "Needs of a 2-night work trip", "FR-12 persona planner, FR-13 budget bands"],
        ["DS-03", "Project owner (family hat)", "Travelling with a young child", "FR-12 kid-friendly activity mapping, FR-14 stay shortlist"],
        ["DS-04", "Developer feasibility review", "Which sources are keyless and reliable", "FR-07 district fallback, NFR-S-04 allow-list"],
        ["DS-05", "Developer feasibility review", "What breaks when an API is down", "FR-19 error states, NFR-A-02 partial rendering"],
      ],
      { widths: [10, 24, 34, 32] }
    )
  );

  out.push(B.h2("6.3 Workshops"));
  out.push(
    T(
      [
        ["Workshop", "Objective", "Output artefact", "Status"],
        ["WS-01 Product framing", "Agree personas, journey and non-goals", "Persona one-pager, journey map", "Complete"],
        ["WS-02 Data source selection", "Compare candidate APIs on cost, licence, CORS, limits", "Decision record ADR-001\u2013ADR-004", "Complete"],
        ["WS-03 Planning logic design", "Define weather\u2192activity mapping and stay scoring weights", "Scoring rules in Section 11.2", "Complete"],
        ["WS-04 Test design", "Turn acceptance criteria into a regression script", "12-scenario checklist", "Complete"],
        ["WS-05 Pilot research design", "Plan interviews, survey and usability test for scale-up", "Instruments in 6.4\u20136.5", "Planned"],
      ],
      { widths: [18, 36, 32, 14] }
    )
  );

  out.push(B.h2("6.4 Surveys (planned instrument)"));
  out.push(B.p("Target: n = 60 respondents recruited from travel forums and personal network; 12 questions; 5 minutes; mix of Likert, ranking and one open question. Screening question: has planned a trip of 2+ nights in the last 12 months."));
  out.push(
    T(
      [
        ["#", "Question", "Type", "Decision it informs"],
        ["Q1", "How many websites do you typically use to plan a trip?", "Numeric", "Baseline for SC benefit claim"],
        ["Q2", "Which task takes the longest?", "Ranking", "Module priority"],
        ["Q3", "Do you check the weather before choosing activities?", "Likert", "Value of weather-aware planning"],
        ["Q4", "How often does rain disrupt your plan?", "Likert", "Weight of indoor alternatives"],
        ["Q5", "What matters most when choosing a stay?", "Ranking", "Stay scoring weights"],
        ["Q6", "Which traveller type best describes your last trip?", "Single choice", "Persona split"],
        ["Q7", "Would you trust an automatically generated itinerary?", "Likert", "Human-in-the-loop design"],
        ["Q8", "What would make you abandon a travel site?", "Multi-select", "Friction backlog"],
        ["Q9", "Do you book through comparison sites or direct?", "Single choice", "Affiliate vs direct links"],
        ["Q10", "How much time would you pay to save?", "Numeric", "ROI assumption A1/A2"],
        ["Q11", "Which currency and units do you expect?", "Single choice", "Localisation backlog"],
        ["Q12", "Anything else we should know?", "Open", "Discovery for v2"],
      ],
      { widths: [7, 45, 18, 30] }
    )
  );

  out.push(B.h2("6.5 Competitor analysis"));
  out.push(
    T(
      [
        ["Product", "Strength", "Gap AiTravel exploits"],
        ["Google Flights", "Best-in-class fare search and date grid", "No itinerary, no weather reasoning, no integrated guide"],
        ["Kayak", "Broad inventory and car/hotel bundling", "Overwhelming UI; planning is left entirely to the user"],
        ["Booking.com", "Deep stay inventory and reviews", "Destination content is thin; no trip-level plan"],
        ["Tripadvisor", "Large review corpus and guides", "Ad-heavy; recommendations not weather- or persona-scored"],
        ["Wikivoyage", "Free, deep, community-maintained guides", "No weather, no booking, dated presentation"],
        ["TripIt / Wanderlog", "Itinerary organisation and collaboration", "Requires manual entry; little live data or weather logic"],
      ],
      { widths: [18, 40, 42] }
    )
  );
  out.push(B.p("**Positioning:** AiTravel competes on the seam between research and decision \u2014 the moment where a traveller has a destination and dates but not a plan. It does not attempt to beat Google Flights on fare search or Booking.com on inventory; it consumes comparable live data and adds weather-aware, persona-aware sequencing."));

  out.push(B.h2("6.6 Traceability"));
  out.push(B.p("Each requirement carries an ID (FR-xx / NFR-xx) that is referenced by at least one user story (US-xx) and one test (TS-xx in Section 18). The chain is: objective \u2192 requirement \u2192 story \u2192 timebox \u2192 test \u2192 acceptance evidence. Requirements without a story are parked in the backlog; stories without a requirement are rejected at refinement."));
  out.push(B.pageBreak());

  /* ================= 7. FUNCTIONAL REQUIREMENTS ================= */
  out.push(B.h1("7. Functional Requirements"));
  out.push(B.p("Priority uses MoSCoW: **M** = must have for v1.0, **S** = should have, **C** = could have (backlog)."));
  out.push(
    T(
      [
        ["ID", "Description", "Pri", "Acceptance criteria"],
        ["FR-01", "Search any city or country by free text with autocomplete", "M", "Typing \u2265 2 characters returns \u2264 6 geocoded matches showing place, region and country; arrow keys and Enter select; Escape closes"],
        ["FR-02", "Resolve the user's current position to a named place", "M", "On permission grant, latitude/longitude are reverse-geocoded to city + country; on denial the app loads the saved or default destination without blocking"],
        ["FR-03", "Show current weather and a 7-day forecast for the destination", "M", "Displays temperature, apparent temperature, wind, humidity and condition; 7 daily cards with min/max and icon"],
        ["FR-04", "Show country facts for the destination", "S", "Capital, currency, languages, population, calling code, driving side and flag render when Wikidata resolves; panel stays usable when it does not"],
        ["FR-05", "List See/Do highlights from Wikivoyage", "M", "\u2265 8 listings for a major city, including listings held in district subpages; each shows title, description and, where present, address/price/hours"],
        ["FR-06", "List Eat/Drink recommendations", "M", "\u2265 6 listings for a major city with price and address where the source provides them"],
        ["FR-07", "Aggregate district subpages for large cities", "S", "Parent-page links are preferred and ordered as authored; up to 6 subpages fetched with concurrency 3; failures on one district do not empty the tab"],
        ["FR-08", "Search flights by IATA codes, dates, passengers and cabin", "M", "Valid input returns price-sorted offers with carrier, departure/arrival, duration and stop count; invalid IATA/date returns a specific message"],
        ["FR-09", "Search hotels by destination coordinates and dates", "M", "Returns stays with name, rating, price and address, or an explanatory fallback when Stays access is unavailable"],
        ["FR-10", "Provide car-rental deep links pre-filled with destination and dates", "M", "Three providers open with correct location and pickup/drop-off dates; dates stay valid when changed"],
        ["FR-11", "Manage the Duffel token from the UI", "M", "Save validates the token server-side and persists to .env; the browser never receives the token, only a masked hint; clear removes it"],
        ["FR-12", "Generate a weather-aware itinerary for a chosen persona", "M", "Budget/Business/Family \u00d7 2\u201314 nights produces a day-by-day plan; wet or extreme days contain indoor-primary activities; clear mild days contain outdoor-primary activities"],
        ["FR-13", "Estimate a trip budget with visible assumptions", "M", "Shows per-category ranges (transport, stay, food, activities) and the total; assumptions are stated in the UI"],
        ["FR-14", "Shortlist accommodation scored for the persona", "M", "Top 3 stays with a one-line rationale each; score reflects price band, property type and location cues"],
        ["FR-15", "Compare all three personas side by side", "S", "One view shows budget band, stay choice and activity emphasis for Budget, Business and Family"],
        ["FR-16", "Answer weather-based destination questions in chat", "M", "\u2265 6 intent categories return 4 recommendations with temperature, condition and a planning link"],
        ["FR-17", "Hand off from chat to planner", "S", "Clicking \u201cPlan trip to X\u201d closes the panel, loads X and opens the planner tab"],
        ["FR-18", "Show configuration status", "S", "Settings indicator shows configured/unconfigured; /api/status reports token presence and mode without leaking the token"],
        ["FR-19", "Provide loading, empty and error states everywhere", "M", "No panel is blank; each failure names the cause and offers a next action or fallback link"],
        ["FR-20", "Print or export the generated plan", "C", "Print view renders itinerary and budget without navigation chrome"],
        ["FR-21", "Restore the last destination", "S", "Reload returns the previously selected place; legacy storage key still honoured"],
        ["FR-22", "Keyboard and screen-reader basics", "S", "All interactive controls reachable by Tab; visible focus ring; images have alt text; contrast \u2265 4.5:1 for body text"],
        ["FR-23", "Responsive layout", "M", "360\u20131440 px with no horizontal scroll; tabs scroll horizontally on small screens"],
        ["FR-24", "Attribute data sources and licences", "M", "Footer links to Open-Meteo, Wikidata, Wikivoyage, Wikipedia; CC BY-SA notice for Wikimedia content"],
      ],
      { widths: [8, 34, 6, 52] }
    )
  );
  out.push(B.pageBreak());

  /* ================= 8. NON-FUNCTIONAL ================= */
  out.push(B.h1("8. Non-Functional Requirements"));

  out.push(B.h2("8.1 Performance"));
  out.push(
    T(
      [
        ["ID", "Requirement", "Target", "Verification"],
        ["NFR-P-01", "First contentful paint on localhost", "< 1.0 s on a warm cache", "Chrome performance panel, 3 runs"],
        ["NFR-P-02", "Cached proxy response", "< 150 ms server time", "Server timing log"],
        ["NFR-P-03", "Uncached weather response", "< 2.5 s p95", "10-city sample"],
        ["NFR-P-04", "Planner generation", "< 300 ms for 14 nights", "performance.now() around render"],
        ["NFR-P-05", "Initial payload", "< 250 KB uncompressed HTML", "File size check"],
        ["NFR-P-06", "Interaction responsiveness", "< 100 ms for tab switch", "Manual timing"],
      ],
      { widths: [12, 34, 30, 24] }
    )
  );

  out.push(B.h2("8.2 Security"));
  out.push(
    T(
      [
        ["ID", "Control", "Implementation", "Residual gap"],
        ["NFR-S-01", "Network exposure", "Server binds 127.0.0.1 only; no 0.0.0.0 listener", "None for local use"],
        ["NFR-S-02", "Secret handling", "Duffel token stored in .env on disk; returned to browser only as a masked hint", "Plaintext at rest on the developer machine"],
        ["NFR-S-03", "Input validation", "IATA regex, ISO date validation, numeric bounds, enum whitelists, 64 KB body cap", "No schema library; validation is hand-written"],
        ["NFR-S-04", "SSRF protection", "Proxy accepts an https URL only if the hostname is on a fixed allow-list with a TTL", "DNS rebinding not separately mitigated"],
        ["NFR-S-05", "Path traversal", "Static paths normalised and constrained to PUBLIC_DIR", "None known"],
        ["NFR-S-06", "Error disclosure", "Upstream errors mapped to user-safe messages; stack traces not returned", "Detailed errors remain in server console"],
        ["NFR-S-07", "Transport", "HTTPS to all upstreams", "Local HTTP only between browser and server"],
        ["NFR-S-08", "Content security", "No inline third-party scripts; all content escaped before insertion", "No CSP header (documented gap)"],
      ],
      { widths: [11, 20, 43, 26] }
    )
  );

  out.push(B.h2("8.3 Scalability"));
  out.push(B.bullet("**Current:** single Node.js process, stateless request handling, in-memory cache capped at 300 entries with per-host TTLs (10 min weather, 30 min Wikimedia, 60 min Nominatim, 24 h geocoding)."));
  out.push(B.bullet("**Horizontal:** the process holds no session state, so N instances behind a load balancer work without sticky sessions; the cache simply becomes per-instance."));
  out.push(B.bullet("**Vertical:** static files are read from disk per request; adding an in-process LRU or `send`-style caching would remove repeated reads at higher traffic."));
  out.push(B.bullet("**Limit:** Duffel offer requests are the expensive operation (up to 25 s supplier timeout). At scale these should move to a queue with per-user rate limiting."));
  out.push(B.bullet("**Data growth:** the curated chatbot knowledge base is a static array; beyond roughly 200 destinations it should move to a searchable index (Section 11.5)."));

  out.push(B.h2("8.4 Availability and resilience"));
  out.push(
    T(
      [
        ["ID", "Requirement", "Mechanism"],
        ["NFR-A-01", "Partial failure must not blank the page", "Promise.allSettled across weather, country and wiki loads; each module renders independently"],
        ["NFR-A-02", "Transient upstream errors are retried", "Up to 3 attempts for weather, 2 for others; exponential-ish backoff at 500 ms \u00d7 attempt"],
        ["NFR-A-03", "Rate limits are respected", "429 and 5xx surface as retryable; district fetches limited to 3 concurrent"],
        ["NFR-A-04", "Stale requests cannot overwrite fresh data", "Monotonic request id compared before every commit"],
        ["NFR-A-05", "Missing token degrades, not breaks", "Booking tabs show setup guidance plus external deep links"],
        ["NFR-A-06", "Upstream outage is explained", "Error copy names the failing source and suggests a retry"],
      ],
      { widths: [12, 40, 48] }
    )
  );

  out.push(B.h2("8.5 Compliance and accessibility"));
  out.push(B.bullet("**API terms:** Duffel version header pinned (`Duffel-Version: v2`); test mode only for this release; no card data handled."));
  out.push(B.bullet("**Content licensing:** Wikivoyage and Wikipedia text is CC BY-SA 4.0 and must be attributed with a link; Wikidata is CC0. The footer implements attribution; a fuller licence page is a v1.1 item."));
  out.push(B.bullet("**Nominatim policy:** maximum 1 request per second, identifying User-Agent, results cached 60 minutes, no bulk geocoding. Current usage is interactive and complies."));
  out.push(B.bullet("**Privacy:** no accounts and no server-side PII. The only persisted user data is the last destination in `localStorage` on the user's own device. Location is used transiently and never stored server-side."));
  out.push(B.bullet("**Accessibility:** keyboard navigation and focus styles exist; automated axe audit and a full WCAG 2.1 AA conformance pass are outstanding (see Section 18.7)."));
  out.push(B.pageBreak());

  /* ================= 9. STORIES ================= */
  out.push(B.h1("9. User Stories & Backlog"));
  out.push(B.p("Epics are ordered by user value. Timebox numbers (I1\u2013I5) map to the schedule in Section 12.5. Story points use a Fibonacci scale for relative sizing only; there is no velocity-based forecasting."));
  out.push(
    T(
      [
        ["Epic", "Story", "As a \u2026 I want \u2026 so that \u2026", "Pri", "Pts", "Timebox"],
        ["E1 Discovery", "US-01", "traveller \u2013 to type a city and pick the right match \u2013 I start from the correct place", "M", "3", "I1"],
        ["E1 Discovery", "US-02", "traveller \u2013 to use my current location \u2013 I skip typing and see where I am", "S", "3", "I4"],
        ["E1 Discovery", "US-03", "returning traveller \u2013 to find my last destination \u2013 I can continue planning", "S", "2", "I4"],
        ["E2 Briefing", "US-04", "traveller \u2013 to see current weather and a 7-day forecast \u2013 I can choose suitable dates", "M", "3", "I2"],
        ["E2 Briefing", "US-05", "traveller \u2013 to see country essentials \u2013 I know about currency, language and phone codes", "S", "3", "I2"],
        ["E3 Guides", "US-06", "traveller \u2013 to browse See/Do highlights \u2013 I know what is worth my time", "M", "5", "I2"],
        ["E3 Guides", "US-07", "traveller \u2013 to browse Eat/Drink picks \u2013 I can plan meals", "M", "3", "I2"],
        ["E3 Guides", "US-08", "traveller \u2013 to see big-city districts \u2013 I get listings the parent page omits", "S", "5", "I2"],
        ["E4 Booking", "US-09", "traveller \u2013 to search flights by IATA and dates \u2013 I can compare real offers", "M", "8", "I3"],
        ["E4 Booking", "US-10", "traveller \u2013 to search hotels near my destination \u2013 I can compare stays", "M", "8", "I3"],
        ["E4 Booking", "US-11", "traveller \u2013 to get car-rental links pre-filled \u2013 I do not retype dates", "M", "2", "I3"],
        ["E4 Booking", "US-12", "traveller without a token \u2013 to get booking links anyway \u2013 the app is still useful", "M", "3", "I3"],
        ["E5 Planner", "US-13", "budget traveller \u2013 to get a cheap, high-value plan \u2013 I do not overspend", "M", "5", "I4"],
        ["E5 Planner", "US-14", "business traveller \u2013 to stay central with efficient days \u2013 I make my meetings", "M", "5", "I4"],
        ["E5 Planner", "US-15", "family traveller \u2013 to get kid-friendly, well-paced days \u2013 everyone copes", "M", "5", "I4"],
        ["E5 Planner", "US-16", "traveller \u2013 to see indoor options on rainy days \u2013 the plan survives weather", "M", "8", "I4"],
        ["E5 Planner", "US-17", "traveller \u2013 to see a budget range with assumptions \u2013 I can judge affordability", "M", "5", "I4"],
        ["E5 Planner", "US-18", "traveller \u2013 to compare the three personas \u2013 I can pick the right style", "S", "3", "I4"],
        ["E5 Planner", "US-19", "traveller \u2013 to print or export the plan \u2013 I can use it offline", "C", "2", "I5"],
        ["E6 Advisor", "US-20", "traveller \u2013 to ask for warm/sunny/ski/city options \u2013 I get inspiration", "M", "5", "I4"],
        ["E6 Advisor", "US-21", "traveller \u2013 to jump from a suggestion into a plan \u2013 I act immediately", "S", "2", "I4"],
        ["E7 Trust", "US-22", "owner \u2013 to connect a Duffel token safely \u2013 live data works without exposing secrets", "M", "5", "I3"],
        ["E7 Trust", "US-23", "traveller \u2013 to understand why data is missing \u2013 I am never stuck on a blank screen", "M", "3", "I5"],
        ["E7 Trust", "US-24", "traveller \u2013 to use the app on my phone \u2013 it works on a small screen", "M", "3", "I5"],
      ],
      { widths: [12, 8, 44, 6, 6, 8] }
    )
  );

  out.push(B.h2("9.1 Backlog beyond v1.0"));
  out.push(B.bullet("**US-25** Multi-day weather confidence bands (show uncertainty, not a single icon)."));
  out.push(B.bullet("**US-26** Save and share a plan via a short link."));
  out.push(B.bullet("**US-27** Real LLM narration of the itinerary with citations to the source listings."));
  out.push(B.bullet("**US-28** Price alerts on a saved route."));
  out.push(B.bullet("**US-29** Currency conversion and unit localisation."));
  out.push(B.bullet("**US-30** Railway and coach options as a lower-carbon alternative."));
  out.push(B.pageBreak());

  return out.join("");
};
