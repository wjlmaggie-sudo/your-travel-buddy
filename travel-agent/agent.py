"""
Travel Planner Agent using CrewAI.

Multi-agent crew that creates personalized travel itineraries:
- Destination Researcher: gathers destination info
- Activity Planner: creates day-by-day activities
- Budget Analyst: estimates costs

Usage:
    python agent.py --destination "Tokyo, Japan" --days 5 --budget 2000

Configuration lives in .env (see .env.example). Any OpenAI-compatible endpoint
works: OpenAI, Google AI Studio, Groq, OpenRouter, Ollama, LM Studio, ...
"""

import argparse
import os
import sys

from crewai import Agent, Crew, LLM, Process, Task
from crewai.crews.crew_output import CrewOutput
from dotenv import load_dotenv

load_dotenv()

# The console on Windows defaults to cp1252 and cannot encode the emoji used
# in the output below. Force UTF-8 so printing does not blow up mid-run.
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")


# Ready-made presets for OpenAI-compatible endpoints.
# `base_url` is what the OpenAI SDK talks to; `model` is the id that endpoint
# serves. Override either one with OPENAI_BASE_URL / OPENAI_MODEL.
PROVIDERS = {
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "model": "gemini-2.5-flash",
        "label": "Google AI Studio (free tier, no card)",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1",
        "model": "llama-3.3-70b-versatile",
        "label": "Groq (free tier, no card)",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1",
        "model": "meta-llama/llama-3.3-70b-instruct:free",
        "label": "OpenRouter (free models)",
    },
    "ollama": {
        "base_url": "http://localhost:11434/v1",
        "model": "qwen2.5:3b",
        "label": "Ollama (local, no key needed)",
    },
    "openai": {
        "base_url": None,
        "model": "gpt-4o-mini",
        "label": "OpenAI (paid)",
    },
}

# Providers that serve locally and therefore need no credentials.
KEYLESS_PROVIDERS = {"ollama"}


def routed_model(model: str) -> str:
    """Return the model string crewAI needs to reach a custom endpoint.

    crewAI routes a model string by its provider prefix, and its native OpenAI
    provider strips one leading "openai/". A custom endpoint therefore needs
    the prefix added, but providers whose model ids legitimately start with
    "openai/" (Groq, OpenRouter) need that prefix preserved - so it is doubled
    here and unwound by crewAI.
    """
    if model.startswith("openai/"):
        return "openai/" + model
    return f"openai/{model}"


def build_llm() -> LLM:
    """Build the LLM from the environment.

    LLM_PROVIDER selects a preset (see PROVIDERS). OPENAI_BASE_URL and
    OPENAI_MODEL override the preset's endpoint and model.
    """
    provider = os.getenv("LLM_PROVIDER", "gemini").strip().lower()
    preset = PROVIDERS.get(provider, PROVIDERS["gemini"])

    base_url = os.getenv("OPENAI_BASE_URL") or preset["base_url"]
    model = os.getenv("OPENAI_MODEL") or preset["model"]
    temperature = float(os.getenv("LLM_TEMPERATURE", "0.4"))

    kwargs: dict[str, object] = {"model": model, "temperature": temperature}
    if base_url:
        # Force the native OpenAI provider against our own endpoint, and keep
        # crewAI from falling back to the Responses API on a 404.
        kwargs["base_url"] = base_url
        kwargs["custom_openai"] = True
        kwargs["model"] = routed_model(model)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key and provider in KEYLESS_PROVIDERS:
        # Ollama ignores the key but the OpenAI SDK insists on sending one.
        api_key = "ollama"
    if api_key:
        kwargs["api_key"] = api_key

    return LLM(**kwargs)


def require_api_key() -> None:
    """Fail early with an actionable message instead of a stack trace mid-crew."""
    provider = os.getenv("LLM_PROVIDER", "gemini").strip().lower()
    if provider in KEYLESS_PROVIDERS:
        return

    key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if key and "your-key-here" not in key:
        return

    lines = [
        "",
        "[!] No API key found. Create travel-agent/.env with:",
        "",
        "    LLM_PROVIDER=gemini",
        "    OPENAI_API_KEY=your-key-here",
        "",
        "Then get a free key at https://aistudio.google.com/apikey",
        "",
        "Available providers (set LLM_PROVIDER):",
    ]
    for name, spec in PROVIDERS.items():
        lines.append(f"    {name:11} {spec['label']}")
    lines.append("")
    print("\n".join(lines), file=sys.stderr)
    sys.exit(1)


def build_travel_crew(destination: str, days: int, budget: float, interests: str) -> CrewOutput:
    llm = build_llm()

    researcher = Agent(
        role="Destination Researcher",
        goal=f"Research {destination} and provide key travel insights",
        backstory="Expert travel journalist who has visited 100+ countries. Knows the best hidden gems and practical tips.",
        llm=llm,
        verbose=False,
    )

    planner = Agent(
        role="Travel Itinerary Planner",
        goal=f"Create a detailed {days}-day itinerary for {destination}",
        backstory="Luxury travel consultant with 15 years of experience crafting personalized itineraries.",
        llm=llm,
        verbose=False,
    )

    budget_analyst = Agent(
        role="Travel Budget Analyst",
        goal=f"Estimate realistic costs for the trip within ${budget} budget",
        backstory="Financial travel advisor who helps travelers maximize experiences within budget.",
        llm=llm,
        verbose=False,
    )

    research_task = Task(
        description=f"""Research {destination} for a {days}-day trip.
Cover: best time to visit, neighborhoods to stay in, must-see attractions,
local food scene, transportation tips, and cultural customs to know.
Traveler interests: {interests}""",
        agent=researcher,
        expected_output="Destination brief with key areas, attractions, food, and practical tips",
    )

    planning_task = Task(
        description=f"""Create a {days}-day itinerary for {destination}.
Budget: ${budget} total. Interests: {interests}.
Include morning/afternoon/evening activities, specific restaurant recommendations,
and travel time between locations. Make it achievable and enjoyable.
Focus on the day-by-day plan only - a separate agent handles the budget.""",
        agent=planner,
        expected_output=f"Day-by-day {days}-day itinerary with activities, meals, and timing",
        context=[research_task],
    )

    budget_task = Task(
        description=f"""Provide a budget breakdown for the {days}-day {destination} trip.
Total budget: ${budget}. Include: flights (estimate), accommodation, food, activities,
transportation.

Output ONLY the budget breakdown - a cost table with one line per category, the daily
average, and the total for the whole trip. Then state the final total and compare it
against the ${budget} budget. If the total is over budget, say so explicitly in the
first line of a "Verdict" section and list concrete adjustments that would bring it
within budget. If it is under budget, say that too.

Do NOT repeat or summarise the itinerary, the attraction list, or the day-by-day plan.""",
        agent=budget_analyst,
        expected_output=(
            "Itemized budget breakdown with daily averages and money-saving tips, "
            f"plus an explicit verdict comparing the total to the ${budget} budget"
        ),
        context=[research_task, planning_task],
    )

    crew = Crew(
        agents=[researcher, planner, budget_analyst],
        tasks=[research_task, planning_task, budget_task],
        process=Process.sequential,
        verbose=False,
        # Keeps crewAI from pausing on a telemetry consent prompt mid-run.
        tracing=False,
    )

    return crew.kickoff()


SECTIONS = ("🔍 DESTINATION BRIEF", "🗺️  TRAVEL ITINERARY", "💰 BUDGET BREAKDOWN")


def main():
    parser = argparse.ArgumentParser(description="Travel Planner Agent")
    parser.add_argument("--destination", default="Tokyo, Japan", help="Travel destination")
    parser.add_argument("--days", type=int, default=7, help="Number of days")
    parser.add_argument("--budget", type=float, default=3000, help="Total budget in USD")
    parser.add_argument("--interests", default="food, culture, history", help="Traveler interests")
    parser.add_argument(
        "--provider",
        choices=sorted(PROVIDERS),
        help="Override LLM_PROVIDER for this run",
    )
    parser.add_argument("--save", metavar="PATH", help="Also write the itinerary to this file")
    args = parser.parse_args()

    if args.provider:
        os.environ["LLM_PROVIDER"] = args.provider

    require_api_key()

    print(f"\n✈️  Planning {args.days}-day trip to {args.destination} (Budget: ${args.budget})\n")
    result = build_travel_crew(args.destination, args.days, args.budget, args.interests)

    # crew.kickoff() only returns the last task's output, so pull each task's
    # output off the result to show the whole deliverable set.
    outputs = [t.raw for t in (result.tasks_output or []) if t.raw]
    if not outputs:
        outputs = [result.raw or str(result)]

    markdown = [
        f"# {args.days}-Day Trip to {args.destination}",
        "",
        f"**Budget:** ${args.budget}  ",
        f"**Interests:** {args.interests}",
        "",
    ]

    for title, body in zip(SECTIONS, outputs):
        print("=" * 60)
        print(title)
        print("=" * 60)
        print(body)
        print()
        markdown += [f"## {title}", "", body, ""]

    if args.save:
        with open(args.save, "w", encoding="utf-8") as f:
            f.write("\n".join(markdown))
        print(f"💾 Saved to {args.save}")


if __name__ == "__main__":
    main()
