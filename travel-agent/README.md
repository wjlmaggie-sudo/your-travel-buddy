# ✈ Travel Planner Agent (CrewAI)

A three-agent crew that turns a destination, a number of days and a budget into a
full travel plan:

| Agent | Produces |
|---|---|
| **Destination Researcher** | Best time to visit, where to stay, must-see sights, food scene, transport, customs |
| **Travel Itinerary Planner** | Day-by-day morning/afternoon/evening plan with meals and travel times |
| **Travel Budget Analyst** | Itemised costs (flights, stay, food, activities, transport) + saving tips |

The tasks run sequentially and each one receives the previous ones as context, so
the budget analyst sees the itinerary it is costing out.

## Quick start

```powershell
cd travel-agent
setup.bat                                   # venv + deps + .env
setup-ollama.bat                            # local model, no API key needed
run.bat --destination "Tokyo, Japan" --days 5 --budget 2000 --save tokyo.md
```

To use a hosted model instead, skip `setup-ollama.bat`, put a key in `.env`
(see [API keys](#api-keys)), and run `run.bat` as above.

Or run it directly:

```powershell
.\.venv\Scripts\python.exe agent.py --destination "Tokyo, Japan" --days 5 --budget 2000
```

### Options

| Flag | Default | Meaning |
|---|---|---|
| `--destination` | `Tokyo, Japan` | Where to go |
| `--days` | `7` | Trip length |
| `--budget` | `3000` | Total budget in USD |
| `--interests` | `food, culture, history` | Comma-separated interests |
| `--provider` | from `.env` | `ollama`, `gemini`, `groq`, `openrouter`, `openai` |
| `--save PATH` | – | Also write the plan to a Markdown file |

## API keys

The agent talks to **any OpenAI-compatible endpoint**. Run it fully offline with
Ollama and no key at all, or pick a hosted provider with a free tier:

| `LLM_PROVIDER` | Endpoint | Get a key |
|---|---|---|
| `ollama` | `localhost:11434/v1` | none — runs a model locally |
| `gemini` | `generativelanguage.googleapis.com/v1beta/openai/` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `groq` | `api.groq.com/openai/v1` | [console.groq.com/keys](https://console.groq.com/keys) |
| `openrouter` | `openrouter.ai/api/v1` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `openai` | `api.openai.com` | [platform.openai.com](https://platform.openai.com/api-keys) |

`.env`:

```
LLM_PROVIDER=ollama
# OPENAI_API_KEY=your-key-here   # only the remote providers need a key
```

`OPENAI_BASE_URL` and `OPENAI_MODEL` override the preset's endpoint and model.

### Running fully offline with Ollama

```powershell
setup-ollama.bat            # installs Ollama, pulls qwen2.5:3b, fixes the context size
setup-ollama.bat 7b         # ...or the better qwen2.5:7b
run.bat --destination "Tokyo, Japan" --days 5 --budget 2000
```

Ollama needs no key, and the agent talks to its OpenAI-compatible endpoint on
`localhost:11434`, so one code path serves both local and hosted models.

#### Raise Ollama's context window — do this first

Ollama defaults to a **4096-token** context window. The budget analyst receives
both earlier tasks as context, so its prompt alone runs past 4096 tokens. Ollama
then silently shifts the context mid-generation, throwing away the beginning of
the prompt, and the agent starts repeating the itinerary instead of doing its
own job. It fails without any error message.

```powershell
setx OLLAMA_CONTEXT_LENGTH 8192
# restart the Ollama server so it picks the value up
```

Confirm it took effect with `curl http://localhost:11434/api/ps` — the
`context_length` field should read `8192`, not `4096`.

#### Choosing a model

| Model | Size | Speed on 4 CPU cores | Notes |
|---|---|---|---|
| `qwen2.5:3b` | 1.9 GB | ~11 tok/s | Fast, but hallucinates details and mis-sums budgets |
| `qwen2.5:7b` | 4.7 GB | ~6 tok/s | Noticeably better reasoning and arithmetic |
| `qwen2.5:7b` on a GPU | 4.7 GB | 60+ tok/s | Best option if the machine has one |

Set the model in `.env` with `OPENAI_MODEL=qwen2.5:7b`, or per run with
`$env:OPENAI_MODEL="qwen2.5:7b"`.

## Files

```
travel-agent/
├── agent.py            # the crew - agents, tasks, CLI
├── mock_server.py      # fake OpenAI-compatible server for offline testing
├── probe_routing.py    # checks crewAI routes model ids to a custom endpoint
├── setup.bat           # create venv, install deps, seed .env
├── setup-ollama.bat    # install Ollama + a model, fix the context window
├── run.bat             # run the agent
└── .env.example        # config template
```

## Testing without a key

`mock_server.py` implements just enough of the Chat Completions API to exercise
the whole crew offline:

```powershell
# terminal 1
.\.venv\Scripts\python.exe mock_server.py --port 8765

# terminal 2
$env:OPENAI_API_KEY="dummy"
$env:OPENAI_BASE_URL="http://127.0.0.1:8765/v1"
$env:OPENAI_MODEL="gemini-2.5-flash"
.\.venv\Scripts\python.exe agent.py --destination "Tokyo, Japan" --days 5 --budget 2000
```

## Note on crewAI's model routing

crewAI picks a provider from the model string's prefix and strips one leading
`openai/` when it hands the request to its native OpenAI client. Model ids that
genuinely start with `openai/` (Groq's `openai/gpt-oss-120b`, for example) would
lose that prefix and 404. `routed_model()` in `agent.py` doubles the prefix so
crewAI unwinds it back to the right id. `probe_routing.py` verifies this for
every provider's model id — run it after changing models.
