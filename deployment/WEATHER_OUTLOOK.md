# 15-day weather outlook — 31 October 2026

Weather continues to use the real Open-Meteo geocoding and forecast APIs. The existing request already asked for 16 days; the old UI filtered that response to trip dates only. The dedicated Weather section now defaults to a **15-day outlook**, covering today plus 14 days in the destination timezone. **My travel dates** preserves the existing trip-specific filter. Switching views and Celsius/Fahrenheit reuses cached data; **Refresh forecast** explicitly fetches a new response. Current temperature remains separate from daily highs/lows and trip predictions.

Cards show daily highs/lows, condition icons and precipitation probability where returned. Days 8–15 have a longer-range estimate label and an uncertainty note. Partial responses and null readings remain visible as unavailable, never invented. Trips outside the forecast range keep their no-forecast explanation even though the current outlook is available. Location choice, retry, attribution and document scrolling remain in place.

A real Lisbon request on 31 October returned 16 days in Europe/Lisbon; the 15-day display covers 31 October–14 November 2026. Ten weather tests passed, covering the provider request, 15-day cap, estimate labels, unavailable future-trip dates, units, caching and daily itinerary weather. TypeScript and changed-file lint checks passed.

Open-Meteo's public API requires no key for the non-commercial prototype. Its free hosted service is for non-commercial use within provider limits; commercial hosting requires reviewing the provider's current plan. No paid service, provider key or new dependency was introduced.

References checked 31 October 2026:
- https://open-meteo.com/en/docs (up to 16 forecast days, daily variables, timezone)
- https://open-meteo.com/ (free non-commercial allowance)
