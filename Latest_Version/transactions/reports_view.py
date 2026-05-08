from django.db.models import Sum, Count
from django.db.models.functions import TruncMonth, TruncWeek
from django.utils.dateparse import parse_date
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Transaction, Category


class ReportsView(APIView):
    """
    US #7 — View Reports and Analytics

    GET /transactions/reports/

    Query params:
        start_date  (YYYY-MM-DD)  — defaults to first day of current month
        end_date    (YYYY-MM-DD)  — defaults to today
        group_by    week | month  — how to group the income vs expense bar chart (default: month)

    Response:
    {
        "period": { "start_date": "...", "end_date": "..." },
        "summary": {
            "total_income": ...,
            "total_expense": ...,
            "net_balance": ...
        },
        "expense_by_category": [          ← pie chart data
            { "category": "Food", "total": 200.00, "percentage": 40.0 },
            ...
        ],
        "income_vs_expense": [            ← bar chart data
            { "period": "2025-01", "income": 3000.00, "expense": 1500.00 },
            ...
        ],
        "insights": [                     ← key insight messages
            "Your top spending category is Food (40.0% of expenses).",
            ...
        ]
    }
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if not hasattr(user, 'wallet'):
            return Response(
                {"detail": "User has no wallet."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Date range ──────────────────────────────────────────────────────
        today = timezone.now().date()
        first_of_month = today.replace(day=1)

        raw_start = request.query_params.get('start_date')
        raw_end   = request.query_params.get('end_date')
        group_by  = request.query_params.get('group_by', 'month')

        start_date = parse_date(raw_start) if raw_start else first_of_month
        end_date   = parse_date(raw_end)   if raw_end   else today

        if not start_date or not end_date:
            return Response(
                {"detail": "Invalid date format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if start_date > end_date:
            return Response(
                {"detail": "start_date must be before end_date."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Base queryset ────────────────────────────────────────────────────
        wallet = user.wallet
        qs = Transaction.objects.filter(
            wallet=wallet,
            date__date__gte=start_date,
            date__date__lte=end_date
        )

        if not qs.exists():
            return Response({
                "period": {"start_date": str(start_date), "end_date": str(end_date)},
                "detail": "No transaction data available for this period.",
                "summary": {"total_income": 0, "total_expense": 0, "net_balance": 0},
                "expense_by_category": [],
                "income_vs_expense": [],
                "insights": []
            }, status=status.HTTP_200_OK)

        # ── Summary ──────────────────────────────────────────────────────────
        income_qs  = qs.filter(type='income')
        expense_qs = qs.filter(type='expense')

        total_income  = income_qs.aggregate(t=Sum('amount'))['t'] or 0
        total_expense = expense_qs.aggregate(t=Sum('amount'))['t'] or 0
        net_balance   = total_income - total_expense

        # ── Expense by category (pie chart) ──────────────────────────────────
        category_totals = (
            expense_qs
            .values('category__name')
            .annotate(total=Sum('amount'))
            .order_by('-total')
        )

        expense_by_category = []
        for row in category_totals:
            pct = round(float(row['total']) / float(total_expense) * 100, 1) if total_expense else 0
            expense_by_category.append({
                "category": row['category__name'],
                "total": float(row['total']),
                "percentage": pct
            })

        # ── Income vs Expense over time (bar chart) ──────────────────────────
        if group_by == 'week':
            trunc_fn = TruncWeek
            fmt = lambda d: str(d.date()) if d else None
        else:
            trunc_fn = TruncMonth
            fmt = lambda d: d.strftime('%Y-%m') if d else None

        income_grouped = (
            income_qs
            .annotate(period=trunc_fn('date'))
            .values('period')
            .annotate(income=Sum('amount'))
            .order_by('period')
        )
        expense_grouped = (
            expense_qs
            .annotate(period=trunc_fn('date'))
            .values('period')
            .annotate(expense=Sum('amount'))
            .order_by('period')
        )

        # merge into a dict keyed by period label
        period_map = {}
        for row in income_grouped:
            key = fmt(row['period'])
            period_map.setdefault(key, {"period": key, "income": 0, "expense": 0})
            period_map[key]['income'] = float(row['income'])
        for row in expense_grouped:
            key = fmt(row['period'])
            period_map.setdefault(key, {"period": key, "income": 0, "expense": 0})
            period_map[key]['expense'] = float(row['expense'])

        income_vs_expense = sorted(period_map.values(), key=lambda x: x['period'] or '')

        # ── Insights ─────────────────────────────────────────────────────────
        insights = []

        if expense_by_category:
            top = expense_by_category[0]
            insights.append(
                f"Your top spending category is {top['category']} "
                f"({top['percentage']}% of expenses)."
            )

        if total_expense > total_income:
            overspend = float(total_expense) - float(total_income)
            insights.append(
                f"You spent {overspend:.2f} more than you earned this period. "
                f"Consider reviewing your expenses."
            )
        elif total_income > 0:
            saved_pct = round((float(total_income - total_expense) / float(total_income)) * 100, 1)
            if saved_pct > 0:
                insights.append(
                    f"Great job! You saved {saved_pct}% of your income this period."
                )

        if len(expense_by_category) > 1:
            second = expense_by_category[1]
            insights.append(
                f"{second['category']} is your second largest expense "
                f"at {second['percentage']}% of total spending."
            )

        return Response({
            "period": {
                "start_date": str(start_date),
                "end_date":   str(end_date)
            },
            "summary": {
                "total_income":  float(total_income),
                "total_expense": float(total_expense),
                "net_balance":   float(net_balance)
            },
            "expense_by_category": expense_by_category,
            "income_vs_expense":   income_vs_expense,
            "insights":            insights
        }, status=status.HTTP_200_OK)
