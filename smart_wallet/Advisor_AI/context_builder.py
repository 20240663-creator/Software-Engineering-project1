from django.db.models import Sum
from django.utils import timezone
from decimal import Decimal


def build_financial_context(user):
    """
    Collects the user's live financial data and returns it as
    a plain-text summary to send to the AI.
    """
    lines = []

    if not hasattr(user, 'wallet'):
        return "The user has no wallet set up yet."

    wallet = user.wallet
    lines.append("=== WALLET SUMMARY ===")
    lines.append(f"Total Balance : {wallet.total_balance}")
    lines.append(f"Total Income  : {wallet.total_income}")
    lines.append(f"Total Expense : {wallet.total_expense}")

    # This month's transactions
    today       = timezone.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    transactions = wallet.transactions.filter(date__gte=month_start).order_by('-date')

    lines.append(f"\n=== THIS MONTH'S TRANSACTIONS ({today.strftime('%B %Y')}) ===")
    if transactions.exists():
        for t in transactions[:20]:
            lines.append(
                f"  [{t.type.upper()}] "
                f"{t.amount} | {t.date.strftime('%d %b')} "
                f"{'| ' + t.description if t.description else ''}"
            )
        month_income  = transactions.filter(type='income').aggregate(s=Sum('amount'))['s']  or Decimal('0')
        month_expense = transactions.filter(type='expense').aggregate(s=Sum('amount'))['s'] or Decimal('0')
        lines.append(f"  Month Income  : {month_income}")
        lines.append(f"  Month Expense : {month_expense}")
    else:
        lines.append("  No transactions this month.")

    # Active budgets
    today_date = today.date()
    budgets = wallet.budgets.filter(start_at__lte=today_date, end_at__gte=today_date)
    if budgets.exists():
        lines.append("\n=== ACTIVE BUDGETS ===")
        for b in budgets:
            status = "EXCEEDED" if b.spended > b.amount else f"{b.percentage}% used"
            lines.append(f"  {b.category.name}: spent {b.spended} / limit {b.amount} [{status}]")

    # Saving goals
    goals = wallet.saving_goals.all()
    if goals.exists():
        lines.append("\n=== SAVING GOALS ===")
        for g in goals:
            pct = round(float(g.current_amount) / float(g.target_amount) * 100, 1) if g.target_amount else 0
            lines.append(
                f"  {g.name}: saved {g.current_amount} / target {g.target_amount} "
                f"({pct}%) | deadline {g.deadline} | {g.status}"
            )

    return "\n".join(lines)
