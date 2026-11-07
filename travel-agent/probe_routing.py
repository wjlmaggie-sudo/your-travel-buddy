"""Verify the doubled-prefix trick preserves model ids that start with 'openai/'."""
import sys

sys.stdout.reconfigure(encoding="utf-8")
from crewai import LLM


def routed_model(model: str) -> str:
    if model.startswith("openai/"):
        return "openai/" + model
    return f"openai/{model}"


CASES = [
    "gemini-2.5-flash",
    "llama-3.3-70b-versatile",
    "qwen/qwen3-32b",
    "openai/gpt-oss-120b",
    "meta-llama/llama-3.3-70b-instruct:free",
]

for model in CASES:
    sent = routed_model(model)
    obj = LLM(
        model=sent,
        base_url="http://127.0.0.1:8765/v1",
        api_key="x",
        temperature=0.4,
        custom_openai=True,
    )
    got = getattr(obj, "model", None)
    status = "OK " if got == model else "BAD"
    print(f"{status} want={model:42} sent={sent:48} got={got}")
