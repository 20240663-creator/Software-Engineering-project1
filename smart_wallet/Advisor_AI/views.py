import os
import requests

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect

from .models import AdvisorChat
from .context_builder import build_financial_context


ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_MODEL   = "claude-sonnet-4-20250514"

SYSTEM_PROMPT = """
You are a friendly, smart, and concise personal financial advisor embedded inside
a budgeting app called Smart Wallet.

You will be given a real-time summary of the user's financial data: their wallet
balance, this month's transactions, active budgets, and saving goals.

Your job is to answer the user's financial question based ONLY on their actual data.
Be specific — mention real numbers from their data. Be encouraging but honest.
Keep your answer under 150 words. Use simple language, no jargon.
Do not make up data that is not in the summary.

If the user asks something unrelated to personal finance, politely redirect them.
"""


def call_claude(user_message, financial_context):
    """Calls the Anthropic API and returns the AI's text reply."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")

    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }

    full_message = (
        f"Here is my current financial data:\n\n"
        f"{financial_context}\n\n"
        f"My question: {user_message}"
    )

    payload = {
        "model":      ANTHROPIC_MODEL,
        "max_tokens": 400,
        "system":     SYSTEM_PROMPT,
        "messages":   [{"role": "user", "content": full_message}],
    }

    response = requests.post(ANTHROPIC_API_URL, json=payload, headers=headers, timeout=30)

    if response.status_code != 200:
        raise Exception(f"API error {response.status_code}: {response.text}")

    return response.json()["content"][0]["text"]


@login_required
def view_advisor(request):
    """
    GET  → show the advisor chat page with history
    POST → send a question to Claude and show the answer
    """
    user    = request.user
    history = AdvisorChat.objects.filter(user=user)
    context = {'history': history, 'error': None, 'latest': None}

    if request.method == 'POST':
        user_message = request.POST.get('message', '').strip()

        if not user_message:
            context['error'] = 'Please enter a question.'
            return render(request, 'advisor.html', context)

        financial_context = build_financial_context(user)

        try:
            ai_response = call_claude(user_message, financial_context)
        except Exception as e:
            context['error'] = f'AI service is unavailable right now. Please try again later.'
            return render(request, 'advisor.html', context)

        chat = AdvisorChat.objects.create(
            user         = user,
            user_message = user_message,
            ai_response  = ai_response,
        )

        context['latest']  = chat
        context['history'] = AdvisorChat.objects.filter(user=user)

    return render(request, 'advisor.html', context)


@login_required
def delete_chat(request, chat_id):
    """Delete a single chat history item."""
    AdvisorChat.objects.filter(id=chat_id, user=request.user).delete()
    return redirect('advisor')
