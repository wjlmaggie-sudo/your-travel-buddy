# Travel Buddy for iPhone

The iPhone app is built from the maintained application, not the retired AI Travel
redirect. Work started from `main` commit `0628d2b` (verified against GitHub on
1 November 2026). Source changes are on `codex/iphone-companion`.

## App design

The iPhone target has its own layout while sharing the planner's data and features:

- Bottom navigation: Today, Plan & explore, My trips.
- Three short setup screens: destination, dates/group, budget.
- Compact planning navigation: Plan, Discover, Itinerary, Tools.
- Tools sheet: flights, hotels, car rental, shopping, currency, weather.
- A compact trip overview puts **Follow this plan** before secondary actions.
- Today places the next stop and its **Go there / Done** controls before the day
  selector. Details, spending, exports and less frequent actions open on demand.
- The existing cream/terracotta/forest palette and logo are retained. iOS safe
  areas, larger touch controls and 16px form text are included.

## Feature coverage

| Feature | iPhone implementation |
| --- | --- |
| Trip destination, departure, dates, duration, group size | Shared planner; phone setup flow |
| Budget presets, currencies, interests, family/business/budget personas, child ages | Shared preferences and calculations |
| Final budget after selecting offers | Shared website/app review with group total, per-person average, exact split, itemized selections, remaining estimates, missing selections and over-budget amount; included in PDF and offline trip copies |
| Destination discovery and travel chatbot | Current worldwide directory and preference matching; existing city-input limitations remain |
| Flights, hotels, family room recommendations, car rental | Existing integrations and selections; native backend origin change prepared, not deployed |
| Attractions, activities, restaurants, stories, photos, maps and alternatives | Existing itinerary tools; remote media/maps require a connection |
| Transport choices | Apple Maps walking/transit/driving directions; existing transport comparison integration remains subject to its provider setup |
| Weather and currency calculator | Existing live tools; require a connection |
| Shops, product searches and packing | Existing shopping tools; offline packing checklist added |
| Account, saved trips, templates, cloud expenses | Existing Supabase account and authenticated routes, no account/database migration |
| PDF export | Existing full-plan PDF; native file/share sheet integration added |
| Follow the plan | Explicit device download for guest or account trips; all days available locally |
| Stop progress | Done, skipped, undo and activity editing work locally |
| Travel essentials | Selected offers identified as selections; users can add addresses and reservation references |
| On-the-go spending | Exact-cent device-only entries alongside the last downloaded cloud expense totals |
| Share itinerary | Native share sheet; private references, notes and expenses excluded |
| Reminders | User-requested local reminder 15 minutes before the next stop; trip timezone must be checked |

The free local-template planner remains the default. This work does not activate
a paid AI provider, Google billing, real bookings, purchases or payments.

## Build and preview

Core/CLI/iOS are pinned to Capacitor **8.6.0**, the npm registry release checked at
implementation time. Plugins are pinned separately in `package.json` and lockfiles.
The native app bundles `dist-native` locally; `capacitor.config.ts` has no remote
`server.url`. The existing website and Lovable server targets are retained.

Requirements: Node 22.22.2+ or Node 24.15+ (tested with 24.22.1), pnpm, and macOS
with Xcode 26+ for a native build. The current test suite pins jsdom 30.1.3; the old
jsdom 20 label lookup caused large itinerary tests to time out. The original
semantic assertions and test time limits are retained.

```sh
pnpm install --frozen-lockfile
pnpm run dev:ios
# Browser preview: http://127.0.0.1:4180/

pnpm run build:ios
pnpm exec cap sync ios
pnpm run ios:open
```

The existing ignored `.env` and `.env.production.local` contain public build
configuration. Never add private provider keys or service-role keys to an app
bundle. `build:ios` validates the public account configuration before building.
The development preview may not have production-only endpoint variables; build
and use `preview:ios` when checking the production configuration.

`ios/App/App.xcodeproj` is generated with Swift Package Manager and includes the
native plugins, app icon, branded launch images, authentication URL scheme and
Filesystem privacy reason. No CocoaPods installation is required.

In Xcode select a signing team, choose a unique bundle identifier if the current
`com.yourtravelbuddy.app` is unavailable, select an iPhone simulator/device and Run.
If changing the identifier, update the authentication scheme in `Info.plist`,
`src/lib/native-app.ts` and the auth backend redirect allowlist together.

## Backend work before live iPhone search

Read-only OPTIONS checks on 1 November 2026 returned **403** from the deployed
flight and hotel endpoints for `Origin: capacitor://localhost`. No provider search
quota was consumed by those checks.

The following function sources now use `_shared/app-origins.ts` to retain their
configured exact origins and add `capacitor://localhost`:

- `search-flights`
- `search-hotels-live`
- `search-cars`
- `search-hotels` (legacy/sandbox)
- `transport-routes` (prepared integration; still requires its existing activation)

Deploy the functions used by the current production app through the existing
owner-managed Supabase project, including the new shared file. Existing quota,
authentication and provider-key handling remain intact. Keep the currently
enabled JWT verification settings. Repeat OPTIONS checks for the native origin
after deployment, then verify actual results from an installed app. Do not add a
wildcard CORS origin or move provider credentials to the phone.

The main account backend must allow the exact email callback URL
`com.yourtravelbuddy.app://auth/callback` for new account confirmations. Existing
password sign-in uses the same accounts. Test both warm and cold app launches
from confirmation links on an iPhone; callback registration is prepared locally.

## Offline behaviour and privacy

Tapping Follow this plan saves a versioned, validated device copy (up to 20 trips).
It contains all stops, text notes, packing, selected-offer descriptions and the
last downloaded spending totals. Guest plans do not require sign-in.

Local progress, schedule edits, extra reservation details, packing and new
expenses survive reopening the app. They do **not** automatically sync to another
device. Device expenses are labelled separately and never silently uploaded or
counted as cloud expenses. Re-downloading a saved trip replaces activity text and
times but keeps matching activity progress, added essentials, packing, personal
notes and device expenses. Source activity IDs are used for account plans.

Signing out removes account copies and cancels their reminders. Changing accounts
removes other accounts' copies. Guest copies remain until explicitly removed.
Removing a copy also removes its device-only notes and expenses. This is local app
storage, not an encrypted document vault; do not enter passwords or card details.

The share action includes itinerary stops and their dates/times/locations only.
The PDF is a separate full-plan export and can include the data already shown by
the existing exporter; review it before sharing.

Live search, cloud edits, fresh weather/rates, remote photos and online map tiles
need internet. Apple Maps offline areas must be downloaded separately. No offline
maps or live route times are claimed by this app.
On the website, device copies work while the page remains open; reopening the
website needs a connection. The installed iPhone app bundles its screens locally
and can reopen a downloaded trip without a connection.

Trip times initially use the device timezone, shown explicitly. Change to the
destination timezone in Essentials before scheduling a reminder. Reminders use
the specified IANA timezone, reject nonexistent DST times and past reminders, and
are cancelled after schedule/progress/timezone changes or re-downloading a trip.
Set the reminder again after changes. One pending next-stop reminder per trip is
supported; delivery remains subject to iOS notification permissions/settings.

## Final budget on both platforms

Choose **Final budget** in website navigation, **Review final budget** on a plan,
or **Tools → Final budget** in the app. The same `finalTripBudget` calculation and
review component serve guest plans and connected account trips. The budget is
also saved with a newly downloaded offline itinerary under Spending and included
in the full PDF export.

The group total includes scoped selected return-flight prices, accommodation for
all rooms/nights including entered extras, selected rental prices and the remaining
activities/food/transport/shopping estimates. A selection replaces its allowance;
it is never charged in addition to that allowance. Mismatched or demo offers are
identified and cannot count as completed real selections. Group totals reconcile
in integer cents; the exact per-person split accounts for remainder cents.

The selected car cost is additional to local-transport estimates. That allowance
may still be needed for fuel, parking, transfers or public transport; it can be
edited explicitly. Product browsing and attraction reference prices do not
silently add unverified charges. **Apply costs to final budget** replaces the
four remaining category estimates together. Recorded actual expenses remain a
separate ledger so they are not added again to selected planned costs.

The final view is a complete trip estimate, not a single checkout price across
unrelated providers. Unknown provider extras, changing availability and final
checkout totals must still be confirmed. Missing flight/stay selections remain
visible beside their allowances. Legacy saved trips can enable connected planning
explicitly before using this review; their original budgets are not rewritten.

Public discovery now identifies browser requests with `Api-User-Agent`, sends
Wikimedia requests sequentially and retries a short HTTP 429 backoff at most once.
Longer provider backoffs remain visible errors, with no background retry loop or
fabricated destination fallback. These changes follow the
[MediaWiki API request guidance](https://www.mediawiki.org/wiki/API:Etiquette).

## Validation and remaining release steps

See [the validation record](IPHONE_VALIDATION.md) for the 300 passing automated
checks, browser evidence and the distinction between tested code and pending
native device verification.

Run:

```sh
pnpm exec tsc --noEmit
pnpm run test -- --maxWorkers=1
pnpm run build:ios
pnpm exec cap sync ios
pnpm run build:pages
pnpm run build
```

Browser preview and JavaScript tests do not verify WKWebView or iOS plugin
behaviour. This Mac currently has Command Line Tools but **no Xcode**, so native
compilation, simulator/device runs and an installable signed build remain pending.

Before TestFlight/App Store distribution: finish the backend checks above, test
sign-in, links, PDF/share sheets, reminders, airplane-mode relaunch, small iPhones,
keyboard, VoiceOver and Dynamic Type in Xcode/on a real device. Confirm the final
bundle ID, signing, privacy/support URLs, account deletion flow, App Store privacy
disclosures and screenshots. App Store approval has not been requested or claimed.

Reference requirements: [Capacitor environment setup](https://capacitorjs.com/docs/getting-started/environment-setup),
[iOS workflow](https://capacitorjs.com/docs/ios),
[Filesystem privacy declaration](https://capacitorjs.com/docs/apis/filesystem).
