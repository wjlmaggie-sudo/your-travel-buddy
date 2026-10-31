# Destination discovery chat

The planner's **Not sure where? Chat with Travel Buddy** action opens a focused inline conversation instead of displaying another crowded form. Guests can enter rough days, a warmth preference and an activity, answer a follow-up, refine a preference, choose a rough date, or restart. Choosing a destination transfers destination, duration and the closest supported activity category to the existing editable planner. Group, budget, dates, departure and existing child details remain intact. Family discovery also selects the existing Family persona without inventing child counts or ages.

This version is a **free, local guided matcher, not an LLM chatbot**. No API key, provider calls, new dependency or permanent chat history is used. It currently covers Tenerife, Funchal/Madeira and Lisbon, with official visitor source links. Seasonal warmth filters are broad editorial guidance, not live temperature forecasts; dates remain editable and the existing Weather section supplies forecasts when available. Flight length and departure feasibility are not inferred. Unsupported activities get an explicit no-match explanation, not invented attractions, prices or availability. Selection is only a draft change, not a booking or automatic paid search.

The engine and component are separate modules for future collection expansion or an optional server-side model. Existing live flight/hotel searches and their free allowance protections remain unchanged. Regression checks cover multi-turn preference retention, season filtering, unsupported requests, selection into the existing guest hotel flow, family persona, date changes, reset, and preservation of group/budget.

Visitor references checked 30 October 2026:
- https://www.hellocanaryislands.com/tenerife/
- https://visitmadeira.com/en/
- https://oceanario.pt/en/
