/* Sections 10-12 */
"use strict";
const { B, table: T } = require("./docxkit");

module.exports = function () {
  const out = [];

  /* ================= 10. SOLUTION ARCHITECTURE ================= */
  out.push(B.h1("10. Solution Architecture"));

  out.push(B.h2("10.1 System context"));
  out.push(B.p("The system is a two-tier application: a browser client and a single Node.js process. The process serves the static client and acts as the only egress point to third parties. This keeps the browser free of CORS problems and keeps the one secret (the Duffel token) off the client entirely."));
  const diagram = [
    "┌──────────────────────────────────────────────────────────────┐",
    "│  Browser (single-page app, public/index.html)                │",
    "│  Tabs: Overview · Highlights · Food & Drink · AiTravel ·      │",
    "│        Flights · Hotels · Cars        Chat: Weather Advisor  │",
    "└───────────────┬──────────────────────────────┬───────────────┘",
    "                │ same-origin fetch            │ localStorage",
    "                ▼                              ▼",
    "┌──────────────────────────────────────────────────────────────┐",
    "│  Node.js server (127.0.0.1:8787, zero dependencies)          │",
    "│  /api/status   /api/token   /api/proxy                       │",
    "│  /api/search/flights        /api/search/hotels               │",
    "│  static file server   ·   allow-listed proxy   ·   cache     │",
    "└───┬───────────────┬───────────────┬───────────────┬──────────┘",
    "    │ Bearer token  │ keyless       │ keyless       │ keyless",
    "    ▼               ▼               ▼               ▼",
    " Duffel          Open-Meteo      Wikimedia        Nominatim",
    " Air + Stays     weather/geo     WD/WP/WV         reverse geo",
  ];
  diagram.forEach((l) => out.push(B.mono(l)));

  out.push(B.h2("10.2 Frontend"));
  out.push(
    T(
      [
        ["Concern", "Implementation"],
        ["Structure", "One HTML file: theme block, markup, then a single classic script. No modules, no bundler, no transpile."],
        ["Rendering", "Template strings injected into `#panel` per tab; explicit escape helper for every interpolated value."],
        ["State", "A single `state` object (place, weather, country, wiki, wv, tab, serverStatus, reqId). Tab renders are pure functions of it."],
        ["Routing", "In-page tab state; no history API. Destination is encoded in `localStorage`, not the URL."],
        ["Async model", "`fetch` with retry wrapper; `Promise.allSettled` for parallel module loads; request-id guard against stale commits."],
        ["Styling", "CSS custom properties, radial-gradient background, glass panels, responsive grid; no preprocessor."],
        ["Accessibility", "Semantic buttons, labels, focus-visible outlines, keyboard handling on the search suggestion list."],
      ],
      { widths: [20, 80] }
    )
  );

  out.push(B.h2("10.3 Backend"));
  out.push(
    T(
      [
        ["Route", "Method", "Responsibility", "Validation"],
        ["/api/status", "GET", "Report token presence, masked hint and mode", "None (no secret returned)"],
        ["/api/token", "POST", "Save, verify or clear the Duffel token", "Regex `duffel_(test|live)_\u2026`, live verification call"],
        ["/api/proxy", "GET", "Fetch allow-listed keyless APIs and cache JSON", "HTTPS + hostname allow-list + TTL"],
        ["/api/search/flights", "POST", "Build and forward a Duffel offer request", "IATA, ISO dates, pax 1\u20138, cabin enum"],
        ["/api/search/hotels", "POST", "Forward a Duffel Stays search", "Lat/lon bounds, radius 1\u201350 km, rooms, guests, dates"],
        ["/*", "GET", "Serve `public/` with MIME mapping", "Path normalisation, traversal guard"],
      ],
      { widths: [22, 8, 44, 26] }
    )
  );
  out.push(B.p("**Server characteristics:** ~370 lines, four built-in modules only (`http`, `fs`, `path`, `crypto`), 65 s outbound ceiling with `AbortController`, 64 KB request-body cap, and a 300-entry cache eviction policy. Startup is instantaneous and there is no build or install step."));

  out.push(B.h2("10.4 AI services"));
  out.push(B.p("In v1.0 the \u201cAI service\u201d is in-process logic in the client, not a remote model. Three engines cooperate: an intent matcher for the advisor, a persona scorer for stays and activities, and a constraint-based day composer for the itinerary. Section 11 specifies the target architecture in which a hosted LLM performs narration and reasoning over retrieved evidence."));

  out.push(B.h2("10.5 Data layer"));
  out.push(
    T(
      [
        ["Store", "Contents", "Lifetime", "Notes"],
        ["`localStorage[itravel:place]`", "Last selected destination object", "Until cleared", "Storage key retained from the original build; legacy `voyago:place` key still read once for migration"],
        ["Server in-memory cache", "JSON responses keyed by full upstream URL", "TTL per host; lost on restart", "Capped at 300 entries, then cleared"],
        ["`.env` file", "Duffel token only", "Persistent", "Written on save, deleted on clear"],
        ["Duffel API", "Inventory, offers, availability", "Transient", "No local persistence of offers"],
      ],
      { widths: [26, 34, 20, 20] }
    )
  );
  out.push(B.p("**Deliberate absence of a database.** For a single-user local tool, a database adds install friction, migration risk and a second secret surface without adding capability. The upgrade path is PostgreSQL with pgvector when plans must be saved and shared (Section 11.5)."));

  out.push(B.h2("10.6 Integrations"));
  out.push(
    T(
      [
        ["Integration", "Host", "Auth", "Purpose", "Cache TTL"],
        ["Open-Meteo Geocoding", "geocoding-api.open-meteo.com", "None", "Place search", "24 h"],
        ["Open-Meteo Forecast", "api.open-meteo.com", "None", "Current + 7-day weather", "10 min"],
        ["Wikidata", "www.wikidata.org", "None", "Country facts, labels, flags", "30 min"],
        ["Wikipedia", "en.wikipedia.org", "None", "Destination summary", "30 min"],
        ["Wikivoyage", "en.wikivoyage.org", "None", "See/Do/Eat/Drink/Sleep listings", "30 min"],
        ["Nominatim", "nominatim.openstreetmap.org", "None", "Reverse geocoding", "60 min"],
        ["Duffel Air", "api.duffel.com", "Bearer (test)", "Flight offers", "None"],
        ["Duffel Stays", "api.duffel.com", "Bearer (test)", "Hotel availability", "None"],
        ["Booking / Kayak / DiscoverCars / Rentalcars", "External sites", "None", "Fallback booking deep links", "N/A"],
      ],
      { widths: [22, 24, 13, 27, 14] }
    )
  );

  out.push(B.h2("10.7 Architecture decisions"));
  out.push(
    T(
      [
        ["ID", "Decision", "Rationale", "Consequence"],
        ["ADR-001", "Zero-dependency Node.js server", "No install step, no supply-chain surface, instant start", "Hand-written routing, validation and caching"],
        ["ADR-002", "Single-file frontend", "Deployable by copying two files; no build pipeline to rot", "Large file; refactor to modules when it exceeds ~3k lines"],
        ["ADR-003", "Duffel over Amadeus", "Amadeus self-service was retired in July 2026; Duffel offers a free test mode", "Test inventory only; Stays access may be gated"],
        ["ADR-004", "Server-side proxy for keyless APIs", "Wikidata/Wikivoyage omit CORS headers; browser cannot call them directly", "Server becomes a single egress and a cache point"],
        ["ADR-005", "Deterministic planner instead of an LLM", "Zero cost, zero hallucination, sub-300 ms, fully auditable", "Less fluent narration; LLM is a later, measured upgrade"],
        ["ADR-006", "localhost binding", "No auth, no TLS, no account model required", "Not remotely accessible; hosting needs a hardening timebox"],
      ],
      { widths: [9, 24, 38, 29] }
    )
  );

  out.push(B.h2("10.8 Known technical debt"));
  out.push(B.bullet("The single HTML file is approaching the size where a split into `app.js` / `theme.css` would improve reviewability."));
  out.push(B.bullet("No automated test suite; regression coverage is a manual 12-scenario script."));
  out.push(B.bullet("No CSP header; inline event handlers remain in generated markup."));
  out.push(B.bullet("Cache is unbounded per key (only total count is capped) and has no stampede protection."));
  out.push(B.bullet("Error messages are English-only and not localised."));
  out.push(B.pageBreak());

  /* ================= 11. AI ARCHITECTURE ================= */
  out.push(B.h1("11. AI Architecture"));
  out.push(B.note("This section separates what is implemented (11.1\u201311.2) from the designed target state (11.3\u201311.9). The v1.0 release contains no LLM, no embeddings and no vector database. Presenting otherwise would misrepresent the system."));

  out.push(B.h2("11.1 Implemented pipeline (v1.0)"));
  out.push(B.p("The planner and advisor share a five-stage deterministic pipeline:"));
  out.push(B.num("**Normalise** \u2013 lowercase, strip punctuation, expand common synonyms (e.g. \u201csnowboarding\u201d \u2192 skiing intent).", 1));
  out.push(B.num("**Classify** \u2013 match against an ordered rule table of intent keywords; first match wins, with explicit precedence (skiing before generic winter, \u201cwinter sun\u201d before generic sun).", 2));
  out.push(B.num("**Retrieve** \u2013 select candidate activities and stays from the parsed Wikivoyage corpus for the current destination.", 3));
  out.push(B.num("**Score and filter** \u2013 apply persona weights, weather suitability and deduplication; keep the top N.", 4));
  out.push(B.num("**Compose** \u2013 allocate activities to forecast days, keep indoor options on poor-weather days, and render rationale text plus budget bands.", 5));
  out.push(B.p("Because every step is deterministic, the same inputs always produce the same plan, which makes regression testing meaningful and makes the output explainable line by line."));

  out.push(B.h2("11.2 AI components"));
  out.push(
    T(
      [
        ["Component", "Input", "Logic", "Output"],
        ["Intent classifier", "Free-text chat message", "Ordered keyword/rule match across 6 categories plus fallback", "Intent label + explanation"],
        ["Destination knowledge base", "Static curated array", "12 destinations with country, climate tags, temperature, condition, description", "Ranked suggestion cards"],
        ["Weather suitability mapper", "WMO code, max/min temperature", "Maps code families to clear/cloudy/rain/snow/storm; flags extreme heat or cold", "Indoor / outdoor / flexible classification"],
        ["Activity classifier", "Listing title + description", "Keyword families for indoor (museum, gallery, cathedral\u2026) and outdoor (park, beach, trail\u2026)", "Activity tag"],
        ["Stay scorer", "Listing text, price string, persona", "Weighted additive score: property type, location cues, price band, family/business terms", "0\u2013n score + rationale"],
        ["Day composer", "Forecast days, scored activities, nights", "Greedy allocation by weather fit, no repeat categories on consecutive days, arrival/departure softening", "Day-by-day itinerary"],
        ["Budget estimator", "Persona, nights, stay price band", "Per-category ranges (transport, stay, food, activities) with stated assumptions", "Low\u2013high total"],
        ["Response renderer", "Structured plan object", "HTML templates with escaping", "Cards, tables, print view"],
      ],
      { widths: [20, 20, 44, 16] }
    )
  );

  out.push(B.h2("11.3 LLM layer (target state)"));
  out.push(B.p("The LLM is introduced as a **narrator and reasoner**, never as the source of truth for prices, availability or opening hours. Retrieved facts stay authoritative; the model only sequences, explains and personalises them."));
  out.push(
    T(
      [
        ["Concern", "Design"],
        ["Provider abstraction", "A single `generatePlan()` interface with adapters for one hosted provider and one local runtime (e.g. Ollama) so the product is not locked in"],
        ["Model tiering", "Small model (fast, cheap) for chat intent and short summaries; larger model only for full multi-day plan narration"],
        ["Context budget", "Cap retrieved evidence at ~6k tokens; summarise listings to title + 40 words before injection"],
        ["Structured output", "JSON schema enforced (days[], activities[], stay, budget, citations[]); reject and retry on schema violation"],
        ["Determinism", "temperature 0.2 for plans, 0.6 for inspiration chat; fixed seed where supported"],
        ["Fallback", "On timeout, quota or schema failure, return the deterministic v1.0 plan unchanged"],
        ["Cost guard", "Per-session token ceiling and a hard monthly budget; cache identical destination+persona+dates requests for 24 h"],
      ],
      { widths: [24, 76] }
    )
  );

  out.push(B.h2("11.4 Retrieval-augmented generation (RAG)"));
  out.push(B.p("RAG grounds the model in licensed, citable destination content instead of its parametric memory. The pipeline is offline-first: content is ingested once per destination, versioned, and retrieved at planning time."));
  out.push(B.num("**Ingest** \u2013 fetch Wikivoyage wikitext (already parsed in v1.0) and split by section: See, Do, Eat, Drink, Sleep, Understand, Get in.", 1));
  out.push(B.num("**Chunk** \u2013 one listing per chunk (title, cleaned description, address, price, coordinates, source URL, revision id); fall back to 400-token windows for prose sections with 60-token overlap.", 2));
  out.push(B.num("**Enrich** \u2013 attach metadata: destination QID, section, indoor/outdoor tag, price band, family suitability, last-seen timestamp.", 3));
  out.push(B.num("**Embed** \u2013 768\u20131536 dimension embeddings from a low-cost model; store vectors alongside the chunk and its metadata.", 4));
  out.push(B.num("**Retrieve** \u2013 hybrid search: BM25 keyword score + vector cosine, fused with reciprocal rank fusion; filter by destination and section before ranking.", 5));
  out.push(B.num("**Ground** \u2013 inject the top 8\u201312 chunks with explicit IDs into the prompt; require the model to cite IDs, and post-validate that every cited ID exists in the retrieved set.", 6));

  out.push(B.h2("11.5 Vector database"));
  out.push(
    T(
      [
        ["Option", "When to use", "Trade-off"],
        ["pgvector on PostgreSQL", "Recommended for the first hosted release", "One database for plans, users and vectors; needs a managed Postgres"],
        ["SQLite + sqlite-vec", "Single-node pilot or offline desktop build", "Zero operations, but no concurrent writers at scale"],
        ["Qdrant / Weaviate", "> 1 M chunks or heavy filtering needs", "Best recall and filtering, extra service to operate"],
      ],
      { widths: [24, 38, 38] }
    )
  );
  out.push(B.p("**Proposed schema:** `chunks(id, destination_qid, section, title, body, url, revision, indoor, price_band, embedding vector(1536), updated_at)` with an HNSW index on `embedding` and a b-tree on `destination_qid`. Chunk IDs are stable hashes of `(page title, revision, listing name)` so re-ingestion is idempotent."));

  out.push(B.h2("11.6 Prompt design"));
  out.push(B.p("System prompt skeleton (target state):"));
  out.push(B.mono("You are the AiTravel planner. Build a {nights}-night plan for a {persona}"));
  out.push(B.mono("traveller in {destination}. Use ONLY the supplied evidence blocks E1..En."));
  out.push(B.mono("Rules: (1) never invent a place, price or opening time; (2) put indoor"));
  out.push(B.mono("activities on days with rain, storms or extreme heat; (3) keep travel time"));
  out.push(B.mono("between consecutive activities under 30 minutes; (4) one anchor activity"));
  out.push(B.mono("plus two supporting activities per day; (5) cite evidence IDs for every"));
  out.push(B.mono("named place; (6) if evidence is insufficient, say so and propose fewer days."));
  out.push(B.mono("Return JSON matching the provided schema. No prose outside JSON."));
  out.push(B.p("Design choices: explicit refusal path (\u201cinsufficient evidence\u201d) instead of invention; citations required per named place; persona and weather passed as structured fields rather than prose; few-shot examples limited to one compact itinerary to control token cost."));

  out.push(B.h2("11.7 Evaluation and monitoring"));
  out.push(
    T(
      [
        ["Layer", "Metric", "Method", "Threshold"],
        ["Intent", "Classification accuracy", "40-utterance golden set, held out", "\u2265 90%"],
        ["Retrieval", "Recall@10 for known listings", "Labelled query set per city", "\u2265 85%"],
        ["Groundedness", "% of named places present in retrieved evidence", "Automated citation check", "100% (hard gate)"],
        ["Relevance", "Human rubric 1\u20135", "Two reviewers, 20 plans", "\u2265 4.0 mean"],
        ["Safety", "Unsafe or fabricated advice rate", "Reviewer audit + pattern scan", "0 tolerated"],
        ["Latency", "Plan generation p95", "Instrumented timing", "< 6 s"],
        ["Cost", "Cost per generated plan", "Token accounting", "< \u00a30.02"],
        ["Drift", "Weekly metric delta", "Automated nightly eval on fixed set", "< 5% degradation"],
      ],
      { widths: [16, 30, 34, 20] }
    )
  );
  out.push(B.p("Operational monitoring: log request id, persona, destination, token counts, latency and citation-check result \u2014 never the free-text prompt or any user identifier. Alert on groundedness failure, schema-retry rate above 5%, or spend above 80% of budget."));

  out.push(B.h2("11.8 Responsible AI"));
  out.push(B.bullet("**Disclosure:** the UI labels generated plans as machine-generated and shows the evidence sources used."));
  out.push(B.bullet("**Human control:** the traveller can swap any suggested activity; the plan is a draft, not a booking."));
  out.push(B.bullet("**No invented inventory:** prices and availability come from Duffel or links, never from the model."));
  out.push(B.bullet("**Bias:** persona rules are explicit and reviewable; evaluation samples include families, solo travellers and accessibility needs."));
  out.push(B.bullet("**Data rights:** retrieval uses CC BY-SA content with attribution; no user text is used for training."));
  out.push(B.bullet("**Prompt injection:** retrieved content is untrusted; it is delimited, stripped of instruction-like patterns, and never concatenated into the system prompt."));

  out.push(B.h2("11.9 AI roadmap"));
  out.push(
    T(
      [
        ["Phase", "Capability", "Entry condition"],
        ["A (done)", "Deterministic persona planner + rule-based advisor", "v1.0 released"],
        ["B", "LLM narration over existing parsed listings (no RAG)", "Hosted pilot with measured demand"],
        ["C", "Vector store + hybrid retrieval + citation gate", "> 50 destinations with clean parsed content"],
        ["D", "Conversational refinement (\u201cmake day 2 cheaper\u201d)", "Groundedness gate stable for 4 weeks"],
        ["E", "Personalised ranking from opt-in behaviour", "Privacy review and consent design"],
      ],
      { widths: [12, 58, 30] }
    )
  );
  out.push(B.pageBreak());

  return out.join("");
};
