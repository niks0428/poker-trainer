import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY_FILE = os.path.join(os.path.dirname(__file__), "api_key.txt")

def get_client():
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key and os.path.exists(API_KEY_FILE):
        key = open(API_KEY_FILE).read().strip()
    if not key:
        raise HTTPException(status_code=500, detail="No Anthropic API key configured. Add it to backend/api_key.txt")
    return anthropic.Anthropic(api_key=key)


class AdviceRequest(BaseModel):
    hole_cards: list[str]        # e.g. ["Ah", "Kd"]
    board_cards: list[str]       # 0-5 cards
    position: str                # BTN, CO, MP, UTG, SB, BB
    pot_size: float
    stack_size: float
    bet_to_call: float
    num_opponents: int
    street: str                  # preflop, flop, turn, river
    notes: str = ""


class LessonRequest(BaseModel):
    topic: str
    question: str = ""


ADVICE_SYSTEM = """You are a world-class poker coach specializing in No-Limit Texas Hold'em GTO strategy.
Given a hand situation, provide concise, actionable advice. Structure your response as JSON with these fields:
{
  "action": "fold|call|raise|check",
  "sizing": "e.g. 2.5x or 66% pot or check",
  "reasoning": "2-3 sentence explanation",
  "equity_estimate": "rough % against likely villain range",
  "key_factors": ["factor1", "factor2", "factor3"],
  "common_mistake": "what most players do wrong here"
}
Be direct and GTO-focused. Mention pot odds, position, and ranges where relevant."""

LESSON_SYSTEM = """You are a world-class poker coach. Explain poker concepts clearly with concrete examples.
Use markdown formatting. Include hand examples with card notation (e.g. A♠K♥). Keep responses focused and practical."""


@app.post("/advice")
async def get_advice(req: AdviceRequest):
    client = get_client()
    hole = " ".join(req.hole_cards)
    board = " ".join(req.board_cards) if req.board_cards else "none yet (preflop)"
    pot_odds = round((req.bet_to_call / (req.pot_size + req.bet_to_call)) * 100, 1) if req.bet_to_call > 0 else 0

    prompt = f"""Hand situation:
- Hero hole cards: {hole}
- Board: {board}
- Street: {req.street}
- Position: {req.position}
- Pot size: ${req.pot_size}
- Hero stack: ${req.stack_size}
- Bet to call: ${req.bet_to_call} ({pot_odds}% pot odds)
- Number of opponents: {req.num_opponents}
{f"- Notes: {req.notes}" if req.notes else ""}

What is the GTO optimal play? Respond with valid JSON only."""

    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=600,
        system=ADVICE_SYSTEM,
        messages=[{"role": "user", "content": prompt}]
    )
    text = msg.content[0].text.strip()
    try:
        data = json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}") + 1
        data = json.loads(text[start:end]) if start >= 0 else {"action": "unknown", "reasoning": text}
    return data


@app.post("/lesson")
async def get_lesson(req: LessonRequest):
    client = get_client()
    content = f"Topic: {req.topic}"
    if req.question:
        content += f"\nQuestion: {req.question}"
    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=800,
        system=LESSON_SYSTEM,
        messages=[{"role": "user", "content": content}]
    )
    return {"content": msg.content[0].text}


@app.get("/health")
async def health():
    return {"status": "ok"}
