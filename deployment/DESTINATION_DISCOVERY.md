# Destination discovery chat

The dedicated **Travel Chatbot** navigation section opens a focused conversation. The planner's **Not sure where? Chat with Travel Buddy** action opens that same section. The chat stays mounted while users switch sections, retaining the current conversation without nested scrolling. Guests can enter rough days, a warmth preference and an activity, answer a follow-up, refine a preference, choose a rough date, or restart. Choosing a destination transfers destination, duration and the closest supported activity category to the existing editable planner. Unspecified group, budget, dates, departure and child details stay intact; explicitly understood details replace the corresponding draft fields after selection. Family discovery also selects the existing Family persona without inventing child counts or ages.

This version is a **free, local guided matcher, not an LLM chatbot**. No API key, provider calls, new dependency or permanent chat history is used. It currently covers Tenerife, Funchal/Madeira and Lisbon, with official visitor source links. Seasonal warmth filters are broad editorial guidance, not live temperature forecasts; dates remain editable and the existing Weather section supplies forecasts when available. Flight length and departure feasibility are not inferred. Unsupported activities get an explicit no-match explanation, not invented attractions, prices or availability. Selection is only a draft change, not a booking or automatic paid search.

The engine and component are separate modules for future collection expansion or an optional server-side model. Existing live flight/hotel searches and their free allowance protections remain unchanged. Regression checks cover multi-turn preference retention, season filtering, unsupported requests, selection into the existing guest hotel flow, family persona, date changes, reset, and preservation of group/budget.

Visitor references checked 30 October 2026:
- https://www.hellocanaryislands.com/tenerife/
- https://visitmadeira.com/en/
- https://oceanario.pt/en/

## Structured understanding upgrade — 31 October 2026

Supported messages now extract multiple details in one turn: days/weeks/nights, weather preference, multiple supported activities, excluded activities, departure city, ISO dates or explicit day-month-year dates, adults, children and exact ages, group size, EUR/USD/GBP budgets and per-person budgets. Number words are recognized. Follow-up corrections retain previous details. Nights convert to days plus one. Children with missing ages cause a follow-up; no ages are fabricated. Per-person budgets require a known group before conversion. A **What I understood** card exposes the extracted details, which carry into the existing editable planner only after a destination is selected. Existing unspecified details stay intact. The saved-trip chat starts a new draft without altering the saved trip.

Warmth and activity matching remain curated heuristics over three destinations, not semantic understanding of every possible request. Budget is carried into the trip form, not treated as a verified destination quote or proof that travel is affordable. Destination cards do not promise live weather, transport availability or prices.

The owner explicitly chose **Keep it strictly free**. No paid AI backend is enabled, no credentials are requested in the frontend, and no provider calls were introduced. The live website and live model inference are different: the website is deployed on GitHub Pages; unrestricted model chat would need a separately hosted model/provider. Optional local open-model inference requires downloads and hardware and would not automatically serve public visitors. OpenAI hosted API usage is billed separately; no such connection has been activated. Documentation: https://developers.openai.com/api/docs/pricing .
