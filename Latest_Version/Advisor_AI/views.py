import requests

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods

from .models import AdvisorChat
from .context_builder import build_financial_context


# =========================
# AI (Ollama Local)
# =========================

def call_ai(user_message, financial_context):
    """
    Calls local Ollama model and returns response.
    Make sure Ollama is running:
    ollama run llama3
    """

    prompt = f"""
You are a senior financial advisor AI.

Rules:
- Be precise and short
- Always mention numbers when available
- Give risk level (Low / Medium / High)
- Give a small suggestion to fix the problem

Financial Data:
{financial_context}

User Question:
{user_message}

Answer in this format:
1. Conclusion
2. Reason
3. Risk Level
4. Suggestion
"""

    try:
        response = requests.post(
            "http://127.0.0.1:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )

        response.raise_for_status()

        data = response.json()

        return data.get("response", "")

    except requests.exceptions.RequestException as e:
        print("OLLAMA ERROR:", e)
        raise Exception("Ollama service is unavailable. Make sure it's running.")


# =========================
# Advisor View
# =========================

@login_required
@require_http_methods(["GET", "POST"])
def view_advisor(request):
    user = request.user
    history = AdvisorChat.objects.filter(user=user).order_by("-id")

    context = {
        "history": history,
        "error": None,
        "latest": None
    }

    if request.method == "POST":
        user_message = request.POST.get("message", "").strip()

        if not user_message:
            context["error"] = "Please enter a question."
            return render(request, "advisor.html", context)

        # Build financial context from your system
        financial_context = build_financial_context(user)

        try:
            ai_response = call_ai(user_message, financial_context)

            chat = AdvisorChat.objects.create(
                user=user,
                user_message=user_message,
                ai_response=ai_response,
            )

            context["latest"] = chat
            context["history"] = AdvisorChat.objects.filter(user=user).order_by("-id")

        except Exception as e:
            print("AI ERROR:", e)
            context["error"] = "AI service is unavailable right now."

    return render(request, "advisor.html", context)


# =========================
# Delete Chat
# =========================

@login_required
def delete_chat(request, chat_id):
    if request.method == "POST":
        AdvisorChat.objects.filter(
            id=chat_id,
            user=request.user
        ).delete()

    return redirect("advisor")