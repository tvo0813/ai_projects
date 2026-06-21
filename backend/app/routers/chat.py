from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from ..config import settings
from ..routers.menu import _menu_db

router = APIRouter(prefix="/api/chat", tags=["chat"])


class Message(BaseModel):
    role: str   # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


def _build_menu_context() -> str:
    lines = []
    for item in _menu_db.values():
        if not item.is_available:
            continue
        line = f"- {item.name} (${item.price:.2f}, {item.category})"
        if item.tags:
            line += f" [tags: {', '.join(item.tags)}]"
        if item.config_json:
            opts = "; ".join(f"{k}: {', '.join(v)}" for k, v in item.config_json.items())
            line += f" [options: {opts}]"
        lines.append(line)
    return "\n".join(lines)


SYSTEM_PROMPT = """You are a drink-picking assistant for {store_name}. Your only job is to help customers choose a drink and customize it.

STRICT RULES — follow every one, no exceptions:
1. ONLY talk about drinks on the menu below. Never discuss anything else.
2. Do NOT mention ingredients, what something is made of, or how it is prepared. If asked, say "I'm not able to share that, but I can help you pick the perfect drink!"
3. ONLY help customers: pick a drink based on their mood or preference, choose a size, choose toppings or customization options (milk type, size, toppings, etc.).
4. If someone asks about anything outside of picking drinks or customizing — food, current events, general knowledge, other stores, or anything not on the menu — respond only with: "I can only help you pick a drink from our menu! What are you in the mood for?"
5. When recommending drinks, always list multiple options (at least 3) with their name and price. Format each as "Drink Name — $X.XX". Never recommend just one drink.
6. Keep replies short, warm, and focused. No lengthy explanations. Just help them decide.
7. If someone asks about dairy-free, non-dairy, vegan milk, or any milk/dairy question — always let them know they can substitute any milk with oat milk for an extra charge.

Current menu:
{menu}"""


@router.post("/")
def chat(req: ChatRequest):
    if not req.messages or req.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="Last message must be from user.")

    try:
        from openai import OpenAI
        client = OpenAI(
            base_url=f"{settings.OLLAMA_BASE_URL}/v1",
            api_key="ollama",  # Ollama doesn't need a real key
        )

        system = SYSTEM_PROMPT.format(
            store_name=settings.STORE_NAME,
            menu=_build_menu_context(),
        )

        response = client.chat.completions.create(
            model=settings.OLLAMA_MODEL,
            max_tokens=512,
            messages=[
                {"role": "system", "content": system},
                *[{"role": m.role, "content": m.content} for m in req.messages],
            ],
        )

        return {"reply": response.choices[0].message.content}

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
