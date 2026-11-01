# iPhone companion and final-budget validation

Validated on 1 November 2026, starting from the current maintained Travel Buddy
source (`0628d2b`). The final website and iPhone bundle share the same budget
calculation and review component.

## Automated checks

- **70 test files passed; 300 tests passed; no skipped tests.**
- The run included `RUN_PUBLIC_DISCOVERY_LIVE=1`, so the public geographic and
  historical-temperature integration was exercised, not skipped.
- `tsc --noEmit` passed.
- Scoped ESLint checks for the new app, offline storage, final-budget and discovery
  implementation passed with no errors or warnings.
- Production iPhone web bundle, iOS plugin synchronization, GitHub Pages build
  and the original Lovable server build passed.
- iOS project, Info.plist and Filesystem privacy declaration passed `plutil -lint`.

The browser simulator is now pinned to jsdom 30.1.3. Profiling found that jsdom
20 repeatedly traversed the entire itinerary while resolving form labels. The
original 13 guest-workspace tests passed in 6.82 seconds after updating it; their
assertions and time limits were retained.

Final regression command:

```sh
RUN_PUBLIC_DISCOVERY_LIVE=1 pnpm exec vitest run --maxWorkers=1
```

## Budget evidence

The shared calculation tests cover scoped flight and rental selections, room-night,
person-night and whole-stay quotes, entered extras, optional flights, one-day trips,
expired trip scopes/currencies, demo prices, over-budget selections, exact-cent
splits, edited remaining costs and offline budget snapshots.

One checked calculation uses group flights of 400 EUR, two hotel rooms for three
nights at 100 EUR per room-night plus 10 EUR extras, a 120 EUR rental, and 290.10 EUR
in remaining operating estimates. The group total is **1,420.10 EUR**, with selected
costs of 1,130 EUR and estimates of 290.10 EUR. No flight or hotel allowance is
charged again. The equal split is one share of 473.36 EUR and two of 473.37 EUR.

In both browser previews, a three-day, two-person Lisbon plan with a 900 EUR budget
and its default allowances totalled 900 EUR. Replacing the food estimate of 198 EUR
with 200.01 EUR updated both platforms to **902.01 EUR**, showing **2.01 EUR over
budget**. Downloading the app itinerary retained that same final-budget snapshot
and the previously completed activity. This example contains allowances, not
confirmed reservations or a guaranteed checkout price.

## Browser and adapter checks

- The phone setup flow, final-budget review, edits and offline-plan handoff were
  exercised through the browser UI at narrow phone dimensions.
- The website final-budget review produced the same edited total as the app.
- A real browser request for three cultural days in Germany returned Berlin,
  Hamburg and Munich with Wikipedia activity references and Open-Meteo weather.
- Mocked native-bridge tests cover itinerary sharing without private references,
  destination-timezone reminder scheduling/cancellation, permission denial,
  invalid/past times, PDF file sharing, auth callback validation/listener cleanup
  and native handling of maps/provider links.

## Still required before an iPhone release

This Mac has Apple Command Line Tools but no Xcode application. No native Swift
compile, simulator/device run, signed IPA, TestFlight build or App Store submission
has been performed. Browser previews and mocked plugin tests do not replace those
checks.

The deployed flight and hotel services rejected the installed app's
`capacitor://localhost` origin during read-only preflight checks. Exact-origin
support is prepared in source but still needs backend deployment. The email
callback scheme also needs to be allowed in the account backend. Existing website
origins and provider quota rules are preserved.

Use [the iPhone build and feature guide](IPHONE_APP.md) to finish signing, backend
configuration and device tests. Paid API activation, Google billing, purchases and
real bookings were not part of validation.
