/* Sections: cover, TOC, 1-5 */
"use strict";
const { B, table: T } = require("./docxkit");

module.exports = function () {
  const out = [];

  /* ---------------- cover ---------------- */
  out.push(B.title("AiTravel Booking System"));
  out.push(B.subtitle("Detailed Project Management Document"));
  out.push(B.p("AI-assisted travel planning and booking platform", { align: "center", style: "Small" }));
  out.push(B.spacer(240));
  out.push(
    T(
      [
        ["Field", "Detail"],
        ["Project name", "AiTravel Booking System"],
        ["Project code", "AITRAVEL-PM-001"],
        ["Document version", "1.1 (baseline + MoSCoW revision)"],
        ["Document date", "06 November 2026"],
        ["Project manager", "Lead Developer / Product Owner"],
        ["Document owner", "AiTravel Project Management Office (PMO)"],
        ["Delivery model", "Single-developer, MoSCoW agile (DSDM), 5 one-week timeboxes"],
        ["Current status", "MVP released to local environment (127.0.0.1:8787)"],
        ["Classification", "Internal – project documentation"],
      ],
      { widths: [26, 74] }
    )
  );
  out.push(B.spacer(200));
  out.push(B.note("Scope of this document: the 20 sections requested by the project sponsor. Figures marked \u201cestimate\u201d or \u201cassumption\u201d are planning values, not audited results. Where a capability is designed but not yet built, it is labelled \u201ctarget state\u201d."));
  out.push(B.pageBreak());

  /* ---------------- TOC ---------------- */
  out.push(B.h1("Contents"));
  const toc = [
    "1. Project Charter",
    "2. Executive Summary",
    "3. Business Case",
    "4. Stakeholder Register",
    "5. Project Scope",
    "6. Requirements Engineering",
    "7. Functional Requirements",
    "8. Non-Functional Requirements",
    "9. User Stories & Backlog",
    "10. Solution Architecture",
    "11. AI Architecture",
    "12. MoSCoW Agile Plan",
    "13. Work Breakdown Structure (WBS)",
    "14. Gantt Chart Template",
    "15. Risk Register",
    "16. KPI Dashboard",
    "17. Budget & Cost Tracking",
    "18. Testing Strategy",
    "19. Deployment Plan",
    "20. Change Log & Sign-off",
    "Appendix A. Module & File Inventory",
    "Appendix B. API Reference",
    "Appendix C. Data Source & Licence Register",
    "Appendix D. Glossary",
  ];
  toc.forEach((t) => out.push(B.p(t, { after: 80 })));
  out.push(B.pageBreak());

  /* ================= 1. CHARTER ================= */
  out.push(B.h1("1. Project Charter"));

  out.push(B.h2("1.1 Charter summary"));
  out.push(
    T(
      [
        ["Charter element", "Detail"],
        ["Project name", "AiTravel Booking System"],
        ["Project manager", "Lead Developer / Product Owner (self-directed project)"],
        ["Start date", "06 October 2026"],
        ["End date", "06 November 2026"],
        ["Duration", "24 working days (\u2248 4.6 calendar weeks), 5 one-week timeboxes"],
        ["Budget", "\u00a30 cash spend; \u00a35,940 notional internal effort (132 hours)"],
        ["Sponsor / owner", "Project owner (product decision authority)"],
        ["Primary users", "Independent leisure travellers, business travellers, families planning 2\u201314 night trips"],
        ["Delivery model", "Incremental, MoSCoW-prioritised timeboxes; single-page app + zero-dependency Node.js server"],
        ["Authorisation", "Approved for build and local release by the project owner"],
      ],
      { widths: [26, 74] }
    )
  );

  out.push(B.h2("1.2 Project objectives"));
  const objectives = [
    "**O1 \u2013 Unify trip research.** Deliver one interface where a traveller can search any city or country and see weather, highlights, food, accommodation and transport options without switching sites.",
    "**O2 \u2013 Make planning weather-aware.** Generate itineraries that deliberately schedule indoor activities on wet or extreme days and outdoor activities on clear, mild days.",
    "**O3 \u2013 Personalise by traveller type.** Provide distinct recommendations, stay shortlists and budget bands for Budget, Business and Family travellers, and allow side-by-side comparison.",
    "**O4 \u2013 Keep the barrier to entry at zero.** Operate every content feature without an API key; require only a free Duffel test token for live flight and hotel search.",
    "**O5 \u2013 Convert research into action.** Place bookable or searchable offers (Duffel, Booking.com, Kayak, DiscoverCars, Rentalcars) next to the recommendations that motivate them.",
    "**O6 \u2013 Ship a maintainable, zero-build codebase.** No bundler, no framework, no runtime dependencies; one HTML file, one server file, documented in a README.",
  ];
  objectives.forEach((o) => out.push(B.bullet(o)));

  out.push(B.h2("1.3 Success criteria"));
  out.push(
    T(
      [
        ["#", "Success criterion", "Target", "Evidence / verification"],
        ["SC-1", "Destination coverage", "\u2265 90% of searched cities resolve to a guide and a forecast", "Manual test set of 25 cities across 6 continents"],
        ["SC-2", "Feature completeness", "7 of 7 primary tabs functional", "Tab-by-tab UAT checklist"],
        ["SC-3", "Keyless operation", "100% of content tabs work with no token configured", "Test with empty .env and cleared settings"],
        ["SC-4", "Planner output", "3 traveller types \u00d7 3\u201314 nights generated in < 300 ms", "Browser performance marks"],
        ["SC-5", "Reliability", "0 uncaught console errors on the 12-scenario regression set", "Browser console capture"],
        ["SC-6", "Graceful degradation", "Every failing integration shows a usable fallback, never a blank panel", "Fault injection (block host, revoke token)"],
        ["SC-7", "Responsiveness", "No horizontal scrolling at 360 px, 768 px and 1440 px", "Device toolbar screenshots"],
        ["SC-8", "Documentation", "README covers setup, token, data sources, limitations", "Document review"],
      ],
      { widths: [8, 30, 32, 30] }
    )
  );

  out.push(B.h2("1.4 High-level deliverables"));
  out.push(B.bullet("**D1** \u2013 Front-end application: `public/index.html` (markup, theme, all client logic)."));
  out.push(B.bullet("**D2** \u2013 Back-end service: `server.js` (static hosting, Duffel proxy, keyless API proxy, token storage)."));
  out.push(B.bullet("**D3** \u2013 Launcher and configuration: `start.bat`, `.env.example`."));
  out.push(B.bullet("**D4** \u2013 Operational documentation: `README.md`."));
  out.push(B.bullet("**D5** \u2013 Project management baseline: this document."));

  out.push(B.h2("1.5 Charter authorisation"));
  out.push(B.p("The project owner authorises the work described in Sections 1\u20135 within the stated constraints. Any change that alters scope, introduces paid infrastructure, or exposes the service beyond localhost requires a formal change request (Section 20)."));
  out.push(B.pageBreak());

  /* ================= 2. EXECUTIVE SUMMARY ================= */
  out.push(B.h1("2. Executive Summary"));

  out.push(B.h2("2.1 Business problem"));
  out.push(B.p("Planning a short leisure trip is a research project in itself. A traveller typically opens a flight meta-search site, a hotel site, a weather service, a destination guide and two or three map or review sites. Each source uses different date formats, different place names and different assumptions about what \u201cgood weather\u201d means. The result is high cognitive load, duplicated data entry and decision fatigue."));
  out.push(B.p("Three specific gaps drive the problem:"));
  out.push(B.bullet("**Weather is disconnected from decisions.** Forecasts are read on a separate site, then mentally translated into \u201cwhich day should I do the walking tour?\u201d. Nothing in the booking flow performs that translation."));
  out.push(B.bullet("**Generic recommendations ignore who is travelling.** A hostel-heavy itinerary is wrong for a business traveller with a 09:00 meeting; a museum-first itinerary is wrong for a family with a four-year-old. Most tools personalise only by price."));
  out.push(B.bullet("**Free APIs are gated or fragmented.** Travel APIs have consolidated behind commercial contracts (Amadeus retired its self-service tier in July 2026), so small builders either pay or ship static demo data."));

  out.push(B.h2("2.2 Proposed AI solution"));
  out.push(B.p("AiTravel is a single-page travel workspace that resolves a destination once and then reuses it across every module: weather, guide content, flights, hotels and cars. On top of that shared context sits an AiTravel Planner that behaves like a lightweight travel agent."));
  out.push(B.p("**What the \u201cAI\u201d is today.** The planner is a deterministic decision engine, not a large language model. It classifies traveller intent from the selected persona, scores accommodation candidates with a weighted heuristic, maps each forecast day to an indoor/outdoor activity mix, sequences days to avoid backtracking, and estimates a budget from per-category bands. The Weather Advisor chatbot performs keyword-and-intent matching over a curated destination knowledge base and hands the chosen destination to the planner."));
  out.push(B.p("**Why deterministic first.** It is free, offline-capable, auditable, sub-300 ms, never hallucinates a place that does not exist, and requires no key. Section 11 defines the target LLM + retrieval architecture that can replace the composer later without changing the product surface."));

  out.push(B.h2("2.3 Expected benefits"));
  out.push(
    T(
      [
        ["Benefit", "Type", "Baseline (today)", "Target with AiTravel", "How measured"],
        ["Research time per trip", "Efficiency", "45\u201360 min across 6\u20139 sites (assumption)", "8\u201312 min in one workspace", "Task timing in moderated test"],
        ["Tabs/sites needed to reach a decision", "Efficiency", "6\u20139", "1", "Session walkthrough"],
        ["Weather-related itinerary rework", "Quality", "Re-planning after arrival", "Plan already matches forecast", "% of days with a weather-appropriate primary activity"],
        ["Recommendation relevance", "Quality", "Generic top-10 lists", "Persona-scored shortlist with rationale", "Rubric review, 1\u20135 scale"],
        ["Barrier to first value", "Access", "Sign-up or key required", "Zero keys for content; one free token for booking", "Cold-start test on a clean machine"],
        ["Affiliate/booking click-through", "Revenue", "Not instrumented", "Instrumented deep links per module", "Outbound click events"],
      ],
      { widths: [24, 12, 24, 22, 18] }
    )
  );

  out.push(B.h2("2.4 Strategic alignment"));
  out.push(
    T(
      [
        ["Strategic theme", "How AiTravel contributes"],
        ["Consumer-first, low-friction products", "No account, no key, no build step; value within two clicks of opening the page."],
        ["Open-data leverage", "Wikivoyage, Wikipedia, Wikidata, Open-Meteo and Nominatim supply the content layer at zero licence cost."],
        ["AI with guardrails", "Deterministic reasoning is used where trust matters (prices, places); generative AI is a designed, evaluated upgrade path, not an unreviewed dependency."],
        ["Cost discipline", "Zero-cash architecture; no server, no database, no paid tier required to demonstrate the full journey."],
        ["Reusable platform", "Server-side proxy, cache and token vault are generic and can host future modules (trains, events, insurance)."],
      ],
      { widths: [32, 68] }
    )
  );
  out.push(B.pageBreak());

  /* ================= 3. BUSINESS CASE ================= */
  out.push(B.h1("3. Business Case"));

  out.push(B.h2("3.1 Current state"));
  out.push(B.p("Before AiTravel, the planning workflow for a typical 4-night city break looked like this: choose dates in a flight search; repeat the search in a hotel site; open a weather site and manually compare the 7-day forecast against the dates; open a destination guide and copy three or four attractions into notes; repeat for restaurants; finally, open a car-rental site. Each step re-enters the destination and dates."));
  out.push(B.bullet("**Fragmentation:** 6\u20139 browser tabs; destination and dates re-entered 4\u20136 times."));
  out.push(B.bullet("**No weather linkage:** the forecast is observed, not applied. Rainy-day alternatives are improvised after arrival."));
  out.push(B.bullet("**Weak personalisation:** price is the only common filter; trip purpose and party composition are ignored."));
  out.push(B.bullet("**Abandonment risk:** every additional site is a chance to lose the traveller to a competitor or to abandon the trip."));

  out.push(B.h2("3.2 Future state"));
  out.push(B.p("With AiTravel, the same traveller opens one page, types a city, and receives a destination briefing (weather, country facts, highlights, food) before deciding to plan. The planner then produces a day-by-day itinerary that respects the forecast, a shortlist of stays scored for the selected persona, and a transparent budget range. Booking actions sit in context: Duffel offers where a token is configured, and pre-filled deep links everywhere else."));

  out.push(B.h2("3.3 Options considered"));
  out.push(
    T(
      [
        ["Option", "Description", "Cost", "Risk", "Decision"],
        ["A. Status quo", "Keep using separate consumer sites", "\u00a30", "Time cost, no differentiation", "Rejected"],
        ["B. Commercial API stack", "Amadeus/Sabre + hotel aggregator + paid LLM", "\u00a3300\u2013\u00a31,500 / month + build", "Vendor lock-in, contracts, compliance", "Deferred (scale option)"],
        ["C. Keyless build (chosen)", "Open data + Duffel test mode + optional LLM later", "\u00a30 cash", "Lower data depth, API rate limits", "Selected"],
      ],
      { widths: [22, 32, 16, 20, 10] }
    )
  );

  out.push(B.h2("3.4 ROI assumptions"));
  out.push(B.p("All figures below are planning assumptions for a future hosted pilot, not realised revenue. They are stated explicitly so they can be challenged and replaced with measured data."));
  out.push(
    T(
      [
        ["#", "Assumption", "Value", "Basis"],
        ["A1", "Median research time saved per trip", "35 minutes", "60 min baseline \u2192 25 min target"],
        ["A2", "Value of traveller time", "\u00a318 / hour", "Conservative consumer leisure rate"],
        ["A3", "Monthly sessions in pilot", "2,000", "Marketing assumption for a niche launch"],
        ["A4", "Outbound booking click rate", "12%", "Typical travel content affiliate range (8\u201315%)"],
        ["A5", "Conversion of outbound click to booking", "3%", "Assumption pending affiliate reporting"],
        ["A6", "Average commission per booking", "\u00a314", "Assumption across flights/hotels/cars"],
        ["A7", "Hosting cost at pilot scale", "\u00a345 / month", "2 vCPU / 2 GB managed instance + CDN"],
        ["A8", "LLM cost per generated plan (future)", "\u00a30.006", "3k input + 800 output tokens at mid-tier pricing"],
      ],
      { widths: [7, 38, 20, 35] }
    )
  );

  out.push(B.h2("3.5 Business value"));
  out.push(B.p("**Quantified pilot scenario (monthly):** 2,000 sessions \u00d7 12% outbound click rate = 240 outbound clicks; 240 \u00d7 3% conversion = 7.2 bookings; 7.2 \u00d7 \u00a314 = \u00a3101 commission. Against \u00a345 hosting plus (if LLM generation is enabled for 30% of sessions) 600 \u00d7 \u00a30.006 = \u00a33.60, the pilot is contribution-positive at a modest margin. The stronger value is strategic: owned demand, first-party intent data, and a reusable platform."));
  out.push(B.p("**Traveller value:** the 35 minutes saved per trip is worth roughly \u00a310.50 at A2 \u2014 small in cash, but the real gain is decision confidence: the itinerary is already matched to the forecast and to the traveller's constraints."));
  out.push(B.p("**Cost avoidance:** the chosen architecture removes build-time spend on bundlers, frameworks, databases and paid APIs. The entire MVP runs from a single Node.js process with no external runtime dependency."));

  out.push(B.h2("3.6 Recommendation"));
  out.push(B.p("Proceed with Option C for the MVP, instrument outbound clicks immediately, and treat Option B as a Phase 3 decision gated on measured demand. Add an LLM composer only after the deterministic baseline is instrumented, so that quality and cost changes are measurable against a fixed control."));
  out.push(B.pageBreak());

  /* ================= 4. STAKEHOLDERS ================= */
  out.push(B.h1("4. Stakeholder Register"));
  out.push(
    T(
      [
        ["ID", "Stakeholder", "Role", "Interest", "Influence", "Communication plan"],
        ["SH-01", "Project owner / sponsor", "Funds and accepts the product; final decision authority", "High \u2013 outcome, cost, brand", "High", "Weekly demo + written status; decision log within 24 h"],
        ["SH-02", "Lead developer", "Architecture, build, test, release", "High \u2013 technical quality", "High", "Daily build notes; timebox review"],
        ["SH-03", "Leisure traveller (primary persona)", "End user planning 2\u20137 night city/beach trips", "High \u2013 speed, price, inspiration", "Medium", "Usability sessions; in-app feedback link (planned)"],
        ["SH-04", "Business traveller (secondary persona)", "End user planning meetings with limited downtime", "Medium \u2013 efficiency, centrality", "Medium", "Persona review of planner output"],
        ["SH-05", "Family traveller (secondary persona)", "End user planning with children", "Medium \u2013 safety, pacing, facilities", "Medium", "Persona review of planner output"],
        ["SH-06", "Duffel (API provider)", "Supplies flight and stay inventory in test mode", "Low \u2013 platform compliance", "High", "Terms-of-service watch; version header pinned; error monitoring"],
        ["SH-07", "Open-Meteo", "Weather and geocoding", "Low", "Medium", "Attribution in footer; cache TTL 10 min"],
        ["SH-08", "Wikimedia (Wikivoyage / Wikipedia / Wikidata)", "Destination content and country facts", "Low", "Medium", "Attribution + CC BY-SA notice; polite request pacing"],
        ["SH-09", "OpenStreetMap / Nominatim", "Reverse geocoding for current location", "Low", "Medium", "User-Agent identification, 1 req/s ceiling, 60 min cache"],
        ["SH-10", "Future hosting/ops provider", "Runs the service if promoted beyond localhost", "Low (now)", "Medium (later)", "Architecture handover pack; runbook"],
      ],
      { widths: [7, 19, 22, 17, 10, 25] }
    )
  );
  out.push(B.h2("4.1 Power / interest positioning"));
  out.push(B.bullet("**Manage closely (high power, high interest):** SH-01, SH-02 \u2014 weekly review, explicit go/no-go decisions."));
  out.push(B.bullet("**Keep satisfied (high power, lower interest):** SH-06 \u2014 compliance monitoring, no direct engagement needed until commercial terms are discussed."));
  out.push(B.bullet("**Keep informed (low power, high interest):** SH-03, SH-04, SH-05 \u2014 usability input and persona validation."));
  out.push(B.bullet("**Monitor:** SH-07 to SH-10 \u2014 policy changes, rate limits and licence terms."));
  out.push(B.h2("4.2 Escalation path"));
  out.push(B.p("Technical blocker \u2192 Lead developer resolves or documents workaround \u2192 if it affects scope, cost or release date, raise a change request \u2192 Project owner decides within two working days. API policy breaches are treated as severity-1 and stop the release."));
  out.push(B.pageBreak());

  /* ================= 5. SCOPE ================= */
  out.push(B.h1("5. Project Scope"));

  out.push(B.h2("5.1 In scope"));
  out.push(
    T(
      [
        ["Scope area", "Included capability"],
        ["Discovery & search", "Free-text city/country search with autocomplete, keyboard navigation, saved last destination, browser geolocation resolved to a named place"],
        ["Destination briefing", "Current conditions, 7-day forecast, country facts (capital, currency, languages, population, calling code, driving side, flag)"],
        ["Guide content", "Wikivoyage See / Do / Eat / Drink / Sleep listings with district subpage aggregation, price/address/phone/URL extraction, Wikipedia summary"],
        ["AiTravel Planner", "Budget / Business / Family personas, 2\u201314 nights, weather-aware day plans, stay shortlist with scoring rationale, budget bands, three-way comparison"],
        ["Flights", "Duffel Air offer requests: IATA origin/destination, cabin, 1\u20138 adults, one-way or return, price-sorted offers"],
        ["Hotels", "Duffel Stays search by coordinates and radius, plus Wikivoyage sleep picks and Booking.com/Kayak fallback links"],
        ["Cars", "Pre-filled deep links to Kayak, DiscoverCars and Rentalcars for destination and dates"],
        ["Advisor", "Weather Advisor chatbot: 6 intent categories, curated knowledge base, hand-off into the planner"],
        ["Settings & security", "Duffel token save / verify / clear, status indicator, .env persistence, localhost binding, allow-listed proxy"],
        ["Documentation", "README, start script, .env template, this PM baseline"],
      ],
      { widths: [24, 76] }
    )
  );

  out.push(B.h2("5.2 Out of scope"));
  out.push(B.bullet("Payment capture, ticketing, cancellation and refunds \u2014 the product links out or uses Duffel test inventory only."));
  out.push(B.bullet("User accounts, authentication, profiles and cross-device sync."));
  out.push(B.bullet("Native iOS/Android applications."));
  out.push(B.bullet("Server-side database or data warehouse; persistence is limited to `localStorage` and an in-memory cache."));
  out.push(B.bullet("Multi-language UI and localisation beyond `accept-language=en` on upstream calls."));
  out.push(B.bullet("Public hosting, TLS termination, WAF and DDoS protection."));
  out.push(B.bullet("Real-time seat maps, fare rules, ancillaries and loyalty programme integration."));
  out.push(B.bullet("Automated content moderation, user-generated reviews and social features."));

  out.push(B.h2("5.3 Assumptions"));
  out.push(
    T(
      [
        ["ID", "Assumption", "Impact if false"],
        ["AS-01", "The user runs the app locally on Node.js 18+ on Windows, macOS or Linux", "Launcher and paths need rework"],
        ["AS-02", "Upstream free APIs remain available under their current terms", "Content modules degrade to deep links"],
        ["AS-03", "Wikivoyage keeps the `{{see}}`/`{{eat}}` listing template syntax", "Parser needs a new adapter"],
        ["AS-04", "A Duffel test token is optional for the demonstration journey", "Booking tabs show setup guidance instead of offers"],
        ["AS-05", "Browser geolocation is granted by the user", "App falls back to the saved or default destination"],
        ["AS-06", "English place names are sufficient for search and guides", "Non-English destinations resolve less reliably"],
        ["AS-07", "One developer maintains the codebase", "Review, bus-factor and release cadence risk"],
      ],
      { widths: [9, 53, 38] }
    )
  );

  out.push(B.h2("5.4 Constraints"));
  out.push(
    T(
      [
        ["ID", "Constraint", "Consequence for design"],
        ["CO-01", "No build step or package manager", "Single HTML file; no JSX, no bundling; ES2017+ only"],
        ["CO-02", "No server-side secret except the Duffel token", "All other integrations are keyless and proxied, not credentialed"],
        ["CO-03", "Localhost-only binding (127.0.0.1)", "No TLS, no auth, no multi-tenant concerns; also no remote access"],
        ["CO-04", "Zero cash budget", "Free tiers only; no paid maps, no paid LLM in v1.0"],
        ["CO-05", "No database", "State is ephemeral; cache is in-memory and lost on restart"],
        ["CO-06", "Upstream rate limits and CORS", "Server-side cache with TTL; request pacing; single allow-list"],
        ["CO-07", "Single developer, 24 working days (22 effort days + 2 buffer)", "Must set frozen after timebox I3; changes via CR only"],
        ["CO-08", "Third-party content licensing", "Attribution required; no re-hosting of Wikimedia content"],
      ],
      { widths: [9, 40, 51] }
    )
  );

  out.push(B.h2("5.5 Scope boundaries and interfaces"));
  out.push(B.p("AiTravel owns the presentation layer, the planning logic, the proxy and the token vault. It does not own inventory, pricing, availability, payment or fulfilment; those remain with Duffel and the linked providers. Any feature that would require AiTravel to hold inventory or funds is outside the boundary and requires a new business case."));
  out.push(B.pageBreak());

  return out.join("");
};
