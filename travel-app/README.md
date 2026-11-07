# ✈ iTravel — Travel Explorer

Search any city or country and get **everything you need to plan a trip** on one page:

| Tab | Data | API | Key needed? |
|---|---|---|---|
| Overview | Description, country facts, live weather + 7-day forecast | Wikipedia · Wikidata · Open-Meteo | **No** |
| Highlights | Top things to see & do | Wikivoyage | **No** |
| Food & Drink | Local restaurants & bars from the travel guide | Wikivoyage | **No** |
| Flights | Live flight offers (price, stops, duration, baggage) | **Duffel** (test mode) | Free token |
| Hotels | Live stay availability near the destination | **Duffel Stays** (test mode) | Free token |
| Cars | Prefilled car-rental comparison searches | Kayak / Discovercars / Rentalcars deep links | **No** |

> **Note on flights:** Amadeus shut down its free self-service API portal on 17 July 2026, so Duffel's free **test mode** is used instead. Test mode returns realistic *synthetic* airline offers — perfect for development. Nothing can be booked or charged.

## Quick start

```powershell
cd travel-app
node server.js
```

This starts the app at **http://127.0.0.1:8787** and opens your browser. (On Windows you can also just double-click `start.bat`.)

## Enable flight & hotel search (2 minutes, free)

1. Sign up at **[app.duffel.com/join](https://app.duffel.com/join)** — no credit card needed.
2. In the dashboard: **More → Developers → Access tokens**.
3. Create a **test** token.
4. Open the app, click the **⚙ gear icon**, paste the token, **Save & verify**.

The token is stored in `travel-app/.env` (never leaves your machine; the `.env` file is not committed anywhere). Everything else — destination search, weather, country facts, highlights, food — works with **zero keys** immediately.

## Project layout

```
travel-app/
├── server.js          # Zero-dependency Node server: static files + Duffel proxy + token storage
├── public/
│   └── index.html     # The whole front end (no build step, no frameworks)
├── .env               # Created when you save your Duffel token (DUFFEL_TOKEN=duffel_test_…)
├── .env.example       # Template
└── start.bat          # Windows launcher
```

## Why a local server?

The Duffel API doesn't allow direct browser (CORS) calls and your token must never be shipped to the browser. `server.js` proxies just two Duffel calls (`/api/search/flights`, `/api/search/hotels`), validates every field, and binds to `127.0.0.1` only.

It also hosts a tiny allow-listed, cached proxy (`/api/proxy`) for the **keyless** data sources that send no CORS headers (Wikidata, Wikipedia, Wikivoyage, Open-Meteo). Only those five hostnames can be reached through it, so the endpoint can't be used as an open relay.

## Configuration

- `PORT=8787` environment variable to change the port.
- `node server.js --no-open` to skip launching the browser.
- Stays (hotels) may return a 403 until Duffel enables Stays on your account — flights are unaffected, and the Hotels tab falls back to guide picks + Booking.com links automatically.
