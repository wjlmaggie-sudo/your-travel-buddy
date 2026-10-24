# One combined Travel Buddy release

On 24 October 2026, Pages had been overwritten by an artifact from branch commit
`67e41b3`. That branch contained newer flight-city defaults but did not contain
main's optional-place recommendations, hotel room guidance, or removal of the room
selector. The flight change is now merged with those main features. Other remote
feature/team branches were already ancestors of the combined source.

The combined product retains guest planning, Business/Family/Budget personas and
child age ranges, itinerary edits, extra places with add-to-day, maps/stories/PDF,
live flight and hotel search interfaces, room setup guidance, currency, weather,
local shopping, account saves, and connected budget handling. Existing provider
limits still apply; Google Hotels live prices support one room, child age ranges
are not converted to exact ages, and routes require a separately configured API.
No paid service or new credentials were activated by this merge.

The combined checks also found and fixed a form regression: after cancelling a
rebuild and returning to the overview, reopening the form replaced pending inputs
with the old simulation. Reopening now preserves those draft inputs until an
explicit rebuild is confirmed.

After creating a plan, **Browse more places** opens Attractions & Activities and
expands the additional recommendation list. The same list remains accessible in
saved itineraries and draft suggestions. Only available directory entries outside
the current itinerary are listed; adding a stop does not book it or change the
budget allowance automatically.

## Publishing

1. Fetch GitHub main and merge the latest changes normally; never force-push.
2. Commit and push the combined source to GitHub main.
3. Build Pages from that clean commit using the existing public frontend configuration.
4. Run `node scripts/publish-pages.mjs`.
5. Check the published `release.json` sourceCommit against GitHub main and verify
   the generated JS asset matches the build.

The publisher now rejects a checkout that differs from current GitHub main, a
dirty source tree, or an artifact built before the current commit. The finalizer
writes only a public commit identifier, build time and clean/dirty flag into
`release.json`. These checks stop an older branch from removing recently merged
features through a later manual publication. They do not synchronize other
checkouts: collaborators must pull/merge main before building their next release.

Guard checks: `node --test scripts/test/pages-release.test.mjs`.
