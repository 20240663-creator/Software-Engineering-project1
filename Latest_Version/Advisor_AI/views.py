import requests

from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.views.decorators.http import require_http_methods

from .models import AdvisorChat
from .context_builder import build_financial_context


# =========================
# AI (Groq API)
# =========================

GROQ_API_KEY = "YOUR_GROQ_API_KEY"

def call_ai(user_message, financial_context):
    """
    Calls Groq API and returns AI response
    """

    prompt = f"""
You are a friendly financial advisor.

Use ONLY the data below:

{financial_context}

User question:
{user_message}

Answer clearly, briefly, and based only on the data.
"""

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.1-8b-instant",
                "messages": [
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "temperature": 0.3
            },
            timeout=30
        )

        response.raise_for_status()

        data = response.json()

        return data["choices"][0]["message"]["content"]

    except Exception as e:
        raise Exception(f"Groq API error: {str(e)}")


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