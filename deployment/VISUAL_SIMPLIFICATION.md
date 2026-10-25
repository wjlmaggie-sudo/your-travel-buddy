# Visual simplification — 25 October 2026

The homepage, trip planner, rentals, hotels, attractions, additional place list, shopping and travel tools retain the existing warm design and document scrolling. The larger homepage photograph reuses the locally bundled, credited CC0 asset. No new package, paid service or credential was introduced.

## Changes

- Rental API normalization now preserves the actual `car.image_url` supplied by Rentalcars through Scrappa, plus the supplied luggage count. Only credential-free HTTPS images on rcstatic.com are accepted. Images show a representative model; the exact car is not guaranteed. Older saved choices without photos remain compatible.
- Security deposit now comes from the top-level `deposit.amount` when its currency matches. The provider's `price.deposit` means the upfront rental payment and must not be presented as the security hold.
- Rental cards use reserved photo areas, scannable seat/transmission/bag details, prominent whole-rental prices and expandable rental conditions. Three options are shown first; showing additional cached results makes no additional API request. Times and currency stay editable in an optional disclosure with current values visible in its summary.
- Hotels use larger consistent photo areas, including a stable unavailable-photo state. Existing recommendations, selection and budget logic are retained.
- Attractions and additional recommendations reuse the same licensed place-photo logic as the daily itinerary, including credits. Historical descriptions and visiting rationale are available in details rather than filling every initial card.
- The trip overview includes a credited destination preview, preferring a place already named in the itinerary. Planner/persona text is shorter, persona choices have icons, detailed budget assumptions are expandable, and shopping has common search shortcuts. An unambiguous single shopping destination loads stores directly; multiple matching locations still require a user choice.
- Currency and weather use the shared card treatment. Image errors and loading use reserved aspect ratios; no automatic scroll or nested normal-content scroll area was introduced.
- Selected car photos are embedded into PDF exports when the public image is accessible, using the existing offline image embedder.

## Verification

Tests verify real provider photo normalization, URL rejection, security-deposit semantics, image rendering, trip selection and existing main flows. Mocked tests are not live inventory verification. Live verification must check the deployed function and visible provider photos separately. Search quotas and private key storage remain unchanged.

Live backend verification returned HTTP 200, twelve priced offers and twelve provider photos for BER, 1–4 December 2026, age 35, DE residence and EUR. The example security hold is 750 EUR, distinct from the 167.21 EUR rental payment. Full regression suite: 60 files, 232 tests passed; final overview/PDF checks are run after the destination preview addition.
