"""
Mock OpenAI-compatible server for testing the travel agent without an API key.

Implements just enough of the Chat Completions API for crewAI's native OpenAI
provider, and returns a canned, task-aware response so the whole crew
(research -> planning -> budget) can be exercised offline.

Usage:
    python mock_server.py --port 8765
    # then, in another shell:
    OPENAI_API_KEY=dummy OPENAI_BASE_URL=http://127.0.0.1:8765/v1 \
      OPENAI_MODEL=mock-model python agent.py --destination "Tokyo, Japan"
"""

import argparse
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

RESEARCH_REPLY = """TOKYO DESTINATION BRIEF

Best time to visit: March-May (cherry blossom) and October-November (autumn foliage).
Peak season is late March and early November - book 3-4 months ahead.

Neighborhoods to stay in:
- Shinjuku: best for first-timers, huge food scene, JR + metro hub, slightly chaotic.
- Shibuya: young, trendy, great nightlife, excellent transport links.
- Asakusa: budget-friendly, retains old-Tokyo Edo atmosphere, near Senso-ji.
- Ginza: upscale, high-end shopping and dining, quieter at night.

Must-see attractions:
- Senso-ji Temple and Nakamise-dori shopping street (Asakusa)
- Meiji Shrine and Yoyogi Park (Harajuku)
- Tokyo Skytree (summer for unobstructed views)
- Shibuya Crossing and Hachiko statue
- Tsukiji Outer Market for breakfast food
- teamLab Planets for immersive digital art

Local food scene:
- Ramen: Afuri (Ebisu) for tonkotsu, Hayashi (Ginza) for light shoyu.
- Sushi: Sushi Dai in Toyosu for the market experience; conveyor-belt sushi for cheap eats.
- Izakaya: Any lantern-lit alley in Shinjuku Golden Gai.
- Specialty: Monjayaki at Tomodabira, okonomiyaki in Tsukishima.

Transportation tips:
- Buy a Suica/Pasmo IC card; tap in and out, works on all trains and most buses.
- Avoid the metro during 08:00-09:30 and 17:30-19:00.
- Airport Limousine Bus from Narita is faster and cheaper than the train.
- For Mt. Fuji day trip: express bus to Kawaguchiko (~1h45) beats the train.

Cultural customs:
- Remove shoes indoors. Don't tip. Speak quietly on trains and phones.
- Bow, don't handshake. Business cards received with two hands.
- No tipping, no littering; trash bins are scarce, carry a plastic bag."""


PLANNING_REPLY = """5-DAY TOKYO ITINERARY (Budget: $2000)

DAY 1 - Asakusa & Ueno (old Tokyo)
- Morning: Senso-ji Temple (opens 06:00, go early). Nakamise-dori for souvenirs.
  Walk 10 min to Kappabashi - the knife and kitchenware street.
- Afternoon: Ueno Park and the Tokyo National Museum (closed Mondays).
- Evening: dinner at Asakusa Menchi - kushikatsu, ~$15. Drinks at Hoppy Street.
- Travel: 20 min by metro (Ginza line Asakusa -> Ueno).

DAY 2 - Shibuya & Harajuku
- Morning: Meiji Shrine (free, opens 05:00) through the forest path.
- Afternoon: Harajuku Takeshita Street and Omotesando cafes - Lunch at Afuri ramen
  (~$12). Kiddy Land for vintage toys.
- Evening: Shibuya Crossing, then dinner in Shibuya Nonbei Yokocho (~$25).
  Shibuya Sky observation deck at sunset (book ahead, ~$20).
- Travel: 10 min walk between Harajuku and Shibuya.

DAY 3 - Tsukiji, Ginza & TeamLab
- Morning: Tsukiji Outer Market breakfast - tuna bowls and tamagoyaki, ~$20.
- Afternoon: Ginza shopping and the Kabuki-za district. Art Aquarium Museum.
- Evening: teamLab Planets (Koto, ~$35, book timed ticket) - allow 2 hours.
  Dinner in Odaiba with a view of Rainbow Bridge.
- Travel: 25 min metro to Toyosu/Odaiba.

DAY 4 - Meiji Shrine side trip + Shimokitazawa
- Morning: free time for Yoyogi Park, Harajuku market, or Aoyama.
- Afternoon: Shimokitazawa - vintage shops, indie coffee, live music street.
- Evening: dinner at Kagurazaka Ishikawa Annex (~$35), then izakaya hopping.
- Travel: 35 min train to Shimokitazawa.

DAY 5 - Mt. Fuji or TeamLab alternative & departure
- Morning: day trip to Kawaguchiko for a Fuji view (bus from Shinjuku, ~$12 each way).
  Lake Kawaguchi and the Oishi Park lakeside path.
- Afternoon: return to Tokyo, last-minute shopping in Ginza, collect luggage.
- Evening: dinner near Shinjuku Station before departure.
- Travel: bus 1h45 each way; or skip Fuji and do Tokyo Skytree + Sumida river cruise.

TOTAL ESTIMATED ACTIVITY TIME: 3 major attractions per day, 1-1.5h travel between them,
leaving 2-3 hours of slack for meals, rest and getting lost (which is the point)."""


BUDGET_REPLY = """BUDGET BREAKDOWN - 5 days, Tokyo, Japan ($2000 total)

Flights (estimate): $900
- Round-trip economy, 4-6 weeks out. $800-1,200 typical for US West Coast.
  Note: excludes bags and seat fees (~$90).

Accommodation: $600
- 4 nights in a mid-range business hotel or clean hostel with a private room,
  $120-160/night in Shinjuku/Asakusa. Hostel dorms: $35-50/night.

Food: $300
- $60/day for 5 days. Breakfast $8-12 (convenience store or street food),
  lunch $12-18, dinner $25-35. Cooked tourist spots add $10-20 per meal.

Activities & admissions: $120
- teamLab Planets $35, Shibuya Sky $20, Tokyo Skytree $25, temples/museums $10-20.
  Meiji Shrine and most parks are free.

Transportation: $80
- Suica/Pasmo IC card $15, metro + bus day passes $7-9/day, airport bus $35
  round trip, inter-city day trips $20-30.

CONTINGENCY: $0 — THE BUDGET IS TIGHT.

Total: $2,000 exactly, with no margin for a single missed train, a lost
wallet, or a higher-than-expected ticket price.

Suggested adjustments to create breathing room:
1. Cut flights to $750 by flying mid-week and booking 8+ weeks ahead (-$150).
2. Drop teamLab Planets (-$35) in favor of free parks and museums.
3. Stay in a hostel dorm at $40/night for 4 nights (-$320).
4. Cap dinner at $20 by using konbini and food halls (-$75).
5. Skip Shibuya Sky - the free Shibuya Crossing and Shibuya Sky-free
   observation at Roppongi Hills is nearly as good (-$20).

Recommended move: switch to a $1,600 core plan and keep $400 as a true
contingency. A trip with a $400 buffer survives a missed reservation;
a trip with a $0 buffer does not."""


def _reply_for(messages: list[dict]) -> str:
    """Pick a canned reply based on which crew task is asking."""
    blob = " ".join(str(m.get("content", "")) for m in messages).lower()

    if "budget breakdown" in blob or "total budget" in blob:
        return BUDGET_REPLY
    if "day-by-day" in blob or "itinerary" in blob and "morning" in blob:
        return PLANNING_REPLY
    if "research" in blob or "must-see attractions" in blob:
        return RESEARCH_REPLY
    return RESEARCH_REPLY


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except ConnectionResetError:
            # The OpenAI SDK closes keep-alive connections abruptly; harmless.
            self.close_connection = True

    def log_message(self, fmt, *args):  # quieter output
        print(f"[mock] {fmt % args}", flush=True)

    def do_GET(self):
        if self.path.rstrip("/") in ("/v1/models", "/models"):
            body = {
                "object": "list",
                "data": [{"id": "mock-model", "object": "model", "created": 0, "owned_by": "mock"}],
            }
            self._send(200, body)
        else:
            self._send(404, {"error": {"message": "not found", "type": "invalid_request_error"}})

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {}

        messages = payload.get("messages", [])
        content = _reply_for(messages)
        print(f"[mock] model={payload.get('model')} messages={len(messages)} -> {len(content)} chars", flush=True)

        body = {
            "id": "chatcmpl-mock",
            "object": "chat.completion",
            "created": int(time.time()),
            "model": payload.get("model", "mock-model"),
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": content},
                    "finish_reason": "stop",
                }
            ],
            "usage": {"prompt_tokens": 100, "completion_tokens": 200, "total_tokens": 300},
        }
        self._send(200, body)

    def _send(self, status: int, body: dict):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main():
    parser = argparse.ArgumentParser(description="Mock OpenAI-compatible server")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"[mock] listening on http://127.0.0.1:{args.port}/v1")
    server.serve_forever()


if __name__ == "__main__":
    main()
