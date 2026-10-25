# UI review and verification — 18 October 2026

## Problems found

- `TravelPlanner` focused a distant result heading after generation, causing the window to scroll.
- Different-height views shared the main document. Hiding a long view could clamp the document scroll position and move the navigation.
- The full budget dashboard repeated above every view; Currency and Weather appeared in multiple unrelated contexts.
- Photo components returned `null` while loading or after failure, then inserted a large image later. The map failure message also collapsed a reserved map area.
- Guest Save immediately navigated to an authenticated page without explaining registration; unsaved simulations only lived in component memory.

## Implementation

- Reuse the existing planner, recommendations, quote entry, maps, directory, weather and currency logic inside modular `TravelWorkspace` / `WorkspacePanel` components.
- Fix the workspace footprint; give each mounted view its own scroll area and disable scroll anchoring inside it. Keep desktop navigation beside the views and a stable compact selector on mobile. State and scroll offsets are retained independently.
- Remove result focus/automatic scrolling. Use a live announcement for generated plans, compact live budget feedback and an in-app confirmation for replacing edits.
- Show full budget detail in Overview; show one itinerary day at a time. Keep editable quote and estimate tools available without placing every form in the main view.
- Move Currency and Weather to dedicated cards and on-demand data loading. Reserve forecast/result and media space. Respect reduced-motion preferences for the subtle view fade.
- Store only tab-session guest simulations; keep the explicit account-save handoff separate. Request sign-in only for Save, with an option to continue exploring. Existing authenticated saved trips and personal data remain protected.
- Bundle the credited CC0 hero photo locally. No new dependencies, paid services, provider keys or frontend secrets.

## Verification scope

Tests cover guest planning without auth calls; sign-in prompt/cancel and save handoff; signed-in save continuation; same-tab simulation restore and preserved edits; flight/hotel cost updates and demo provenance; mounted panel scroll retention; conversion requests and swaps; forecast date/unit handling and reserved result space; existing planning, directory, logistics and deployment checks.

Browser checks cover document height/scroll before and after generation, feature switching and tool data loading; per-view scroll restoration; guest exploration and optional Save prompt; actual exchange/weather requests; desktop/mobile overflow, saved-trip compatibility and the published Pages artifact. Viewport offsets caused by browser automation scrolling a target into view are distinguished from application-triggered scrolling.

The final dialog check also caught a 12 px horizontal contraction from combining a stable root scrollbar gutter with the modal library's extra body margin. A scoped `@supports (scrollbar-gutter: stable)` rule removes the redundant margin while retaining modal scroll locking. Dialog closing restores focus with `preventScroll: true`.

## Single-page scrolling update — 25 October 2026

The earlier fixed-height workspace and independent panel scrolling above have been replaced at the user's request. The active workspace panel, additional place recommendations and weather results now grow with their content and use the document scrollbar. Mounted sections still retain edits when switching views. Desktop section navigation stays visible on sufficiently tall screens without its own scrollbar; mobile uses the existing compact selector. Standard modal and selection-menu scrolling remains scoped to temporary overlays.

Verification now checks preserved edits rather than independent panel scroll offsets, plus desktop/mobile document scrolling and overflow.
