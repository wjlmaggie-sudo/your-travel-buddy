/* ==========================================================================
 * iTravel Travel App — local server (zero dependencies, Node 18+)
 *
 * What it does:
 *   1. Serves the front end from ./public
 *   2. Proxies flight & hotel searches to the Duffel API (test mode)
 *      — the Duffel API blocks direct browser (CORS) calls, so the token
 *        and the request live only on your machine.
 *   3. Stores your Duffel test token in ./.env (created on first save)
 *
 * Run:  node server.js        (opens your browser automatically)
 *       node server.js --no-open
 * ========================================================================== */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 8787);
const HOST = "127.0.0.1"; // local only — never exposed to the network
const PUBLIC_DIR = path.join(__dirname, "public");
const ENV_PATH = path.join(__dirname, ".env");
const DUFFEL_BASE = "https://api.duffel.com";

/* ------------------------------ .env loader ------------------------------ */

function loadEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}
loadEnvFile();

let duffelToken = (process.env.DUFFEL_TOKEN || "").trim();
const TOKEN_RE = /^duffel_(test|live)_[A-Za-z0-9_\-]{8,}$/;

function saveToken(token) {
  const lines = [
    "# iTravel — Duffel API token (https://app.duffel.com -> More -> Developers -> Access tokens)",
    `DUFFEL_TOKEN=${token}`,
    "",
  ];
  fs.writeFileSync(ENV_PATH, lines.join("\n"), "utf8");
}

function tokenHint() {
  if (!duffelToken) return null;
  return duffelToken.slice(0, 13) + "…" + duffelToken.slice(-4);
}

/* --------------------------- Duffel API helper --------------------------- */

async function duffel(pathname, { method = "GET", body } = {}, timeoutMs = 65000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(DUFFEL_BASE + pathname, {
      method,
      signal: controller.signal,
      headers: {
        Authorization: "Bearer " + duffelToken,
        "Duffel-Version": "v2",
        Accept: "application/json",
        "Content-Type": "application/json",
        "Idempotency-Key": crypto.randomUUID(),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let json = null;
    try { json = await res.json(); } catch { /* empty body (e.g. 204) */ }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/* Duffel errors look like: { errors: [{ title, message, type, code }] } */
function duffelError(status, json) {
  const first = json && Array.isArray(json.errors) ? json.errors[0] : null;
  let message = first ? (first.message || first.title) : "Duffel returned HTTP " + status;
  if (status === 401) message = "Your Duffel token was rejected (401). Check it is a *test* token from the Duffel dashboard.";
  if (status === 403 && /stays|accommodation|product/i.test(message)) {
    message = "Stays access is not enabled on your Duffel account yet. Flights still work — for hotels use the Booking.com links, or request Stays access from Duffel.";
  }
  const err = new Error(message);
  err.status = status;
  err.code = first && first.code;
  return err;
}

/* --------------------------- keyless API proxy --------------------------- *
 * Some free APIs (Wikidata, Wikivoyage) don't send CORS headers, so the
 * browser cannot call them directly. This small allow-listed proxy fixes that
 * and adds a polite in-memory cache.                                    */

const PROXY_HOSTS = {
  "geocoding-api.open-meteo.com": 24 * 3600e3,   // city list is static
  "api.open-meteo.com": 10 * 60e3,               // keep weather fresh
  "www.wikidata.org": 30 * 60e3,
  "en.wikipedia.org": 30 * 60e3,
  "en.wikivoyage.org": 30 * 60e3,
  "nominatim.openstreetmap.org": 60 * 60e3,      // reverse geocoding for current location
};
const proxyCache = new Map(); // url -> { json, expires }

async function proxyFetch(searchParams) {
  const target = searchParams.get("u") || "";
  let url;
  try { url = new URL(target); } catch { throw bad("Invalid proxy URL."); }
  const ttl = PROXY_HOSTS[url.hostname];
  if (url.protocol !== "https:" || ttl === undefined) throw bad("Host not allowed for proxying.");

  const hit = proxyCache.get(url.href);
  if (hit && hit.expires > Date.now()) return hit.json;

  const res = await fetch(url, {
    headers: { "User-Agent": "iTravelApp/1.0 (local travel planner)", Accept: "application/json" },
  });
  let json = null;
  if (res.status !== 404) {
    if (!res.ok) {
      // Keep rate-limit / server errors distinguishable so the browser can retry
      // them with backoff instead of treating them as a permanent 400.
      const e = new Error(url.hostname + " returned HTTP " + res.status);
      e.status = res.status === 429 ? 429 : res.status >= 500 ? 503 : 502;
      throw e;
    }
    json = await res.json();
  }
  if (proxyCache.size > 300) proxyCache.clear();
  proxyCache.set(url.href, { json, expires: Date.now() + ttl });
  return json;
}

/* ---------------------------- input validation --------------------------- */

const IATA_RE = /^[A-Z]{3}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CABINS = new Set(["economy", "premium_economy", "business", "first"]);

function str(v, max = 80) { return typeof v === "string" && v.length <= max ? v.trim() : null; }
function int(v, min, max) {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}
function num(v, min, max) {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
function dateStr(v, label) {
  if (!v || !DATE_RE.test(v)) throw bad(label + " must be a YYYY-MM-DD date.");
  const t = Date.parse(v + "T00:00:00Z");
  if (Number.isNaN(t)) throw bad(label + " is not a real date.");
  return v;
}
function bad(message) { const e = new Error(message); e.status = 400; return e; }

const DAY = 86400000;
function assertDates(startISO, endISO, { maxDaysAhead = 330, maxNights = 99 } = {}) {
  const start = Date.parse(startISO + "T00:00:00Z");
  const today = Date.now() - (Date.now() % DAY);
  if (start < today) throw bad("Dates cannot be in the past.");
  if (start - today > maxDaysAhead * DAY) throw bad("Date is more than " + maxDaysAhead + " days away.");
  if (!endISO || endISO === startISO) return; // one-way / single date
  const end = Date.parse(endISO + "T00:00:00Z");
  if (end <= start) throw bad("Check-out / return must be after departure.");
  if (end - start > maxNights * DAY) throw bad("That's more than " + maxNights + " days.");
}

/* ------------------------------ API handlers ----------------------------- */

const routes = {
  "GET /api/status": async () => ({
    tokenPresent: Boolean(duffelToken),
    tokenHint: tokenHint(),
    mode: duffelToken.startsWith("duffel_live_") ? "live" : duffelToken ? "test" : "none",
  }),

  "GET /api/proxy": async (_body, searchParams) => proxyFetch(searchParams),

  "POST /api/token": async (body) => {
    if (body && body.action === "clear") {
      duffelToken = "";
      delete process.env.DUFFEL_TOKEN;
      if (fs.existsSync(ENV_PATH)) fs.unlinkSync(ENV_PATH);
      return { tokenPresent: false, tokenHint: null, mode: "none" };
    }
    const token = str(body && body.token, 200);
    if (!token || !TOKEN_RE.test(token)) {
      throw bad("That doesn't look like a Duffel token. Test tokens look like: duffel_test_ab12cd34…");
    }
    duffelToken = token;
    saveToken(token);
    // Verify against Duffel (listing 1 past offer request is free)
    const { status, json } = await duffel("/air/offer_requests?limit=1");
    if (status >= 400) {
      duffelToken = (process.env.DUFFEL_TOKEN || "").trim(); // keep previous
      throw duffelError(status, json);
    }
    return { tokenPresent: true, tokenHint: tokenHint(), mode: token.startsWith("duffel_live_") ? "live" : "test" };
  },

  "POST /api/search/flights": async (body) => {
    if (!duffelToken) throw bad("No Duffel token configured yet — add your test token in Settings (gear icon).");

    const origin = str(body && body.origin, 3).toUpperCase();
    const destination = str(body && body.destination, 3).toUpperCase();
    if (!IATA_RE.test(origin || "")) throw bad("Origin must be a 3-letter IATA code (e.g. JFK, LON, CDG).");
    if (!IATA_RE.test(destination || "")) throw bad("Destination must be a 3-letter IATA code (e.g. TOK, PAR, NYC).");
    if (origin === destination) throw bad("Origin and destination must differ.");

    const departureDate = dateStr(body.departureDate, "Departure date");
    const returnDate = body.returnDate ? dateStr(body.returnDate, "Return date") : null;
    const adults = int(body.adults, 1, 8) || 1;
    const cabin = CABINS.has(body.cabin) ? body.cabin : "economy";
    assertDates(departureDate, returnDate, { maxDaysAhead: 330, maxNights: 60 });

    const slices = [{ origin, destination, departure_date: departureDate }];
    if (returnDate) slices.push({ origin: destination, destination: origin, departure_date: returnDate });

    const payload = {
      data: {
        slices,
        passengers: Array.from({ length: adults }, () => ({ type: "adult" })),
        cabin_class: cabin,
      },
    };

    // supplier_timeout keeps Duffel responding before our own 65s ceiling
    const { status, json } = await duffel(
      "/air/offer_requests?return_offers=true&supplier_timeout=25000",
      { method: "POST", body: payload },
      60000
    );
    if (status >= 400) throw duffelError(status, json);
    const offers = (json.data && json.data.offers) || [];
    return { offers, liveMode: Boolean(json.data && json.data.live_mode) };
  },

  "POST /api/search/hotels": async (body) => {
    if (!duffelToken) throw bad("No Duffel token configured yet — add your test token in Settings (gear icon).");

    const latitude = num(body && body.latitude, -90, 90);
    const longitude = num(body && body.longitude, -180, 180);
    if (latitude === null || longitude === null) throw bad("Hotel search needs the destination's coordinates.");
    const radius = int(body.radiusKm, 1, 50) || 5;
    const adults = int(body.adults, 1, 12) || 2;
    const rooms = int(body.rooms, 1, 8) || 1;
    const checkInDate = dateStr(body.checkIn, "Check-in date");
    const checkOutDate = dateStr(body.checkOut, "Check-out date");
    assertDates(checkInDate, checkOutDate);

    const payload = {
      data: {
        rooms,
        location: { radius, geographic_coordinates: { latitude, longitude } },
        guests: Array.from({ length: adults }, () => ({ type: "adult" })),
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
      },
    };

    const { status, json } = await duffel("/stays/search", { method: "POST", body: payload }, 60000);
    if (status >= 400) throw duffelError(status, json);
    return { results: (json.data && json.data.results) || [] };
  },
};

/* ------------------------------ static files ----------------------------- */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function serveStatic(reqPath, res) {
  let rel = decodeURIComponent(reqPath.split("?")[0]);
  if (rel === "/" || rel === "") rel = "/index.html";
  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== PUBLIC_DIR) {
    return send(res, 403, { error: "Forbidden" });
  }
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, { error: "Not found" });
    res.writeHead(200, { "Content-Type": MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

/* -------------------------------- server --------------------------------- */

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 64 * 1024) { reject(bad("Request too large.")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(bad("Invalid JSON body.")); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url || "/";
  let parsed;
  try { parsed = new URL(url, "http://localhost"); } catch { return send(res, 400, { error: "Bad URL" }); }
  const key = req.method + " " + parsed.pathname;

  if (key.startsWith("GET /api/") || key.startsWith("POST /api/")) {
    try {
      const handler = routes[key];
      if (!handler) return send(res, 404, { error: "Unknown API route" });
      const body = req.method === "POST" ? await readBody(req) : null;
      send(res, 200, await handler(body, parsed.searchParams));
    } catch (err) {
      send(res, err.status || 500, { error: err.message || "Server error" });
    }
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { error: "Method not allowed" });
  serveStatic(url, res);
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}`;
  console.log("\n  ✈  iTravel is running at  " + url);
  console.log("     Flights & hotels (Duffel test API): add your free test token in Settings after opening the app.");
  console.log("     Stop the server with Ctrl+C.\n");
  if (!process.argv.includes("--no-open")) openBrowser(url);
});

function openBrowser(url) {
  const { spawn } = require("child_process");
  try {
    if (process.platform === "win32") spawn("cmd", ["/c", "start", "", url], { detached: true, stdio: "ignore" }).unref();
    else if (process.platform === "darwin") spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    else spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
  } catch { /* browser opening is best-effort */ }
}
