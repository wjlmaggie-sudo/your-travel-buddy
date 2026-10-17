# AI Travel

A responsive, buildless travel planning app with an original SVG logo, six editable trip templates, destination/date/duration/traveler controls, three budget styles, group and per-person budget breakdowns, saved trips, itinerary export, product search, local shop search, and a persistent packing list.

## Run locally

Serve `ai-travel/` with any static web server, for example `python3 -m http.server 4173 --directory ai-travel`.

## Product scope

Plans use curated templates and generic suggestions for custom destinations. All budgets and product prices are estimates in EUR. Flights are excluded. Live AI, booking, inventory and payment services are not connected. Maps and shopping searches open external Google search pages. Saved trips and packing lists use browser localStorage and stay on the current device. Images load from Unsplash, fonts from Google Fonts.

## Files

- `ai-travel/index.html` — application shell
- `ai-travel/style.css` — responsive layout
- `ai-travel/app.js` — planning, budget, search, and persistence behavior
- `ai-travel/logo.svg` — original AI Travel mountain/compass mark

## Hosting

The current private preview is hosted separately through Sites at https://ai-travel-studio-maggie.softtoast1024.chatgpt.site. This folder is the app source snapshot; GitHub pushes do not automatically redeploy that preview. The existing Lovable application remains at the repository root.
