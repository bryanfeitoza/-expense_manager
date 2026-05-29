import json
import random
from typing import Any

import httpx

from app.config import settings

AI_API_URL = settings.AI_API_URL
AI_API_KEY = settings.AI_API_KEY
AI_MODEL = settings.AI_MODEL

SYSTEM_PROMPTS = {
    "classify": "Você é um classificador de gastos. Analise a descrição e determine a categoria, tipo (receita/despesa) e tags relevantes. Responda APENAS com JSON.",
    "analyze_spending": "Você é um analista financeiro. Analise os gastos do usuário e forneça insights sobre padrões de consumo.",
    "anomalies": "Você é um analista financeiro. Detecte transações anômalas ou suspeitas nos dados fornecidos.",
    "predict_budget": "Você é um consultor financeiro. Com base no histórico de gastos, sugira um orçamento para o próximo mês.",
    "tips": "Você é um consultor financeiro. Forneça dicas personalizadas de economia com base nos hábitos de gastos do usuário.",
    "chat": "Você é um assistente financeiro pessoal. Responda perguntas sobre finanças e ajude o usuário a gerenciar seus gastos.",
}


async def _call_ai_api(messages: list[dict], temperature: float = 0.7) -> dict[str, Any] | None:
    if not AI_API_KEY or AI_API_KEY == "sua-chave-aqui":
        return None

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{AI_API_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {AI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": AI_MODEL,
                "messages": messages,
                "temperature": temperature,
            },
        )
        response.raise_for_status()
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        try:
            return json.loads(content)
        except (json.JSONDecodeError, KeyError, IndexError):
            return {"response": content}


def _fallback_classify(description: str) -> dict:
    categories = {
        "alimentação": ["restaurante", "mercado", "supermercado", "comida", "lanche", "pizza", " ifood", "shopper", "compras"],
        "transporte": ["uber", "99", "taxi", "ônibus", "metrô", "gasolina", "combustível", "pedágio"],
        "moradia": ["aluguel", "condomínio", "água", "luz", "energia", "gás", "internet"],
        "saúde": ["farmácia", "médico", "dentista", "plano de saúde", "hospital", "exame"],
        "educação": ["curso", "faculdade", "escola", "livro", "material"],
        "lazer": ["cinema", "show", "viagem", "jogo", "streaming", "netflix", "spotify"],
        "salário": ["salário", "pagamento", "recebimento", "depósito", "freela", "pro labore"],
        "investimentos": ["investimento", "ações", "renda fixa", "cdb", "tesouro"],
    }

    desc_lower = description.lower()
    for cat, keywords in categories.items():
        for kw in keywords:
            if kw in desc_lower:
                is_receita = cat in ("salário", "investimentos")
                return {
                    "category": cat,
                    "type": "receita" if is_receita else "despesa",
                    "tags": [kw],
                }

    return {
        "category": "outros",
        "type": "despesa",
        "tags": [],
    }


def _fallback_analyze_spending(transactions: list[dict]) -> dict:
    total = sum(t.get("amount", 0) for t in transactions)
    count = len(transactions)
    return {
        "insights": [
            f"Você registrou {count} transações no período.",
            f"Total movimentado: R$ {total:.2f}",
            "Continue monitorando seus gastos para melhores resultados financeiros.",
        ],
        "summary": {
            "total": round(total, 2),
            "count": count,
        },
    }


def _fallback_anomalies(transactions: list[dict]) -> dict:
    anomalies = []
    if transactions:
        amounts = [t.get("amount", 0) for t in transactions]
        mean = sum(amounts) / len(amounts) if amounts else 0
        std = (sum((a - mean) ** 2 for a in amounts) / len(amounts)) ** 0.5 if amounts else 0
        threshold = mean + 2 * std

        for t in transactions:
            if t.get("amount", 0) > threshold:
                anomalies.append({
                    "transaction_id": str(t.get("id", "")),
                    "amount": t.get("amount", 0),
                    "description": t.get("description", ""),
                    "reason": f"Valor {t.get('amount', 0):.2f} acima do threshold {threshold:.2f}",
                })

    return {
        "anomalies": anomalies,
        "mean": round(mean, 2) if transactions else 0,
        "threshold": round(threshold, 2) if transactions else 0,
    }


def _fallback_predict_budget(transactions: list[dict]) -> dict:
    categories = {}
    for t in transactions:
        cat = t.get("category", "outros")
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += t.get("amount", 0)

    return {
        "budget": {cat: round(amount * 1.1, 2) for cat, amount in categories.items()},
        "total_budget": round(sum(categories.values()) * 1.1, 2),
        "message": "Orçamento sugerido com base no histórico (10% de margem).",
    }


def _fallback_tips(transactions: list[dict]) -> dict:
    return {
        "tips": [
            "Crie um fundo de emergência com 3-6 meses de despesas.",
            "Revise assinaturas e serviços recorrentes.",
            "Defina metas de economia mensais realistas.",
        ],
    }


def _fallback_chat(message: str) -> dict:
    responses = [
        "Ótima pergunta! Para melhor gerenciar seus gastos, sugiro categorizar todas as despesas.",
        "Lembre-se de revisar seu orçamento mensalmente.",
        "Uma boa prática é separar 20% da sua renda para investimentos.",
        "Tente manter seus gastos fixos abaixo de 50% da sua renda.",
    ]
    return {"response": random.choice(responses)}


FALLBACKS = {
    "classify": _fallback_classify,
    "analyze_spending": _fallback_analyze_spending,
    "anomalies": _fallback_anomalies,
    "predict_budget": _fallback_predict_budget,
    "tips": _fallback_tips,
    "chat": _fallback_chat,
}


async def classify(description: str) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["classify"]},
        {
            "role": "user",
            "content": f"Classifique: '{description}'. Responda JSON com: category, type (receita/despesa), tags (array).",
        },
    ]

    result = await _call_ai_api(messages, temperature=0.3)
    if result:
        return result
    return _fallback_classify(description)


async def analyze_spending(transactions: list[dict]) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["analyze_spending"]},
        {
            "role": "user",
            "content": f"Analise estes gastos: {json.dumps(transactions, ensure_ascii=False, default=str)}",
        },
    ]

    result = await _call_ai_api(messages)
    if result:
        return result
    return _fallback_analyze_spending(transactions)


async def detect_anomalies(transactions: list[dict]) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["anomalies"]},
        {
            "role": "user",
            "content": f"Detecte anomalias: {json.dumps(transactions, ensure_ascii=False, default=str)}",
        },
    ]

    result = await _call_ai_api(messages)
    if result:
        return result
    return _fallback_anomalies(transactions)


async def predict_budget(transactions: list[dict]) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["predict_budget"]},
        {
            "role": "user",
            "content": f"Histórico: {json.dumps(transactions, ensure_ascii=False, default=str)}",
        },
    ]

    result = await _call_ai_api(messages)
    if result:
        return result
    return _fallback_predict_budget(transactions)


async def get_tips(transactions: list[dict]) -> dict[str, Any]:
    messages = [
        {"role": "system", "content": SYSTEM_PROMPTS["tips"]},
        {
            "role": "user",
            "content": f"Dicas para: {json.dumps(transactions, ensure_ascii=False, default=str)}",
        },
    ]

    result = await _call_ai_api(messages)
    if result:
        return result
    return _fallback_tips(transactions)


async def chat(messages: list[dict]) -> dict[str, Any]:
    system_msg = {"role": "system", "content": SYSTEM_PROMPTS["chat"]}
    full_messages = [system_msg] + messages

    result = await _call_ai_api(full_messages)
    if result:
        return result

    last_user_msg = ""
    for m in reversed(messages):
        if m["role"] == "user":
            last_user_msg = m["content"]
            break

    return _fallback_chat(last_user_msg)
