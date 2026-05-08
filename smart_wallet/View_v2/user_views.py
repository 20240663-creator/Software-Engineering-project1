from decimal import Decimal
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.db.models import Sum, Q
from django.db.models.functions import TruncMonth, TruncWeek
from transactions import models as transactions_models
from . import models


User = get_user_model()


def _get_current_user(request):
    user = request.user if request.user.is_authenticated else None
    if not user:
        user_id = request.session.get('user_id')
        if user_id:
            user = User.objects.filter(id=user_id).first()
    if user and not user.first_name:
        user.first_name = user.username
    return user


@login_required
def view_home(request):
    user = _get_current_user(request)
    if not user:
        return redirect('login')
    try:
        wallet = user.wallet
    except models.Wallet.DoesNotExist:
        return redirect('deposit')

    user.total_balance = wallet.total_balance
    user.total_income  = wallet.total_income
    user.total_expense = wallet.total_expense
    user.saving_goals  = Decimal('0')

    transaction  = transactions_models.Transaction.objects.filter(
        Q(wallet=wallet) | Q(reciever=wallet)
    ).order_by('-date')[:3]

    saving_goals = transactions_models.SavingGoals.objects.filter(wallet=wallet).aggregate(
        total_saving=Sum('target_amount')
    )['total_saving'] or 0

    context = {
        'user': user, 'wallet': wallet,
        'transaction': transaction, 'saving_goals': saving_goals,
    }
    return render(request, 'index.html', context)


@login_required
def view_profile(request):
    user = _get_current_user(request)
    if not user:
        return redirect('login')
    user.created_at = user.date_joined
    user.updated_at = user.date_joined
    return render(request, 'profile.html', {'user': user})


def view_login(request):
    if request.method == 'POST':
        email    = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        user     = None

        if email and password:
            user = authenticate(request, username=email, password=password)
            if user is None:
                try:
                    stored_user = User.objects.get(email=email)
                    user = authenticate(request, username=stored_user.username, password=password)
                except User.DoesNotExist:
                    user = None

        if user is not None:
            login(request, user)
            request.session['user_id'] = user.id
            return redirect('home')

        return render(request, 'login.html', {'error': 'Invalid email or password.'})
    return render(request, 'login.html')


def view_register(request):
    if request.method == 'POST':
        email    = request.POST.get('email', '').strip()
        name     = request.POST.get('name', '').strip()
        password = request.POST.get('password', '')

        if not email or not password:
            return render(request, 'register.html', {'error': 'Email and password are required.'})
        if User.objects.filter(email=email).exists():
            return render(request, 'register.html', {'error': 'This email is already registered.'})

        user = User.objects.create_user(username=email, email=email, password=password)
        if name:
            user.first_name = name
            user.save()

        models.Wallet.objects.create(
            user=user, total_balance=0, total_income=0, total_expense=0, send_limit=3
        )
        return redirect('login')
    return render(request, 'register.html')


def view_intro(request):
    return render(request, 'intro.html')


def view_settings(request):
    return render(request, 'settings.html')


@login_required
def view_report(request):
    """
    US #7 — View Reports and Analytics.
    Supports date range filter and group_by (month/week).
    Passes chart data and insights to the template.
    """
    user = _get_current_user(request)
    if not user:
        return redirect('login')
    try:
        wallet = user.wallet
    except models.Wallet.DoesNotExist:
        return redirect('login')

    # ── Date range ────────────────────────────────────────────────────────
    today           = timezone.now().date()
    first_of_month  = today.replace(day=1)

    raw_start  = request.GET.get('start_date')
    raw_end    = request.GET.get('end_date')
    group_by   = request.GET.get('group_by', 'month')

    start_date = parse_date(raw_start) if raw_start else first_of_month
    end_date   = parse_date(raw_end)   if raw_end   else today

    if not start_date:
        start_date = first_of_month
    if not end_date:
        end_date = today

    # ── Base queryset ─────────────────────────────────────────────────────
    qs = transactions_models.Transaction.objects.filter(
        wallet=wallet,
        date__date__gte=start_date,
        date__date__lte=end_date
    )

    context = {
        'user': user, 'wallet': wallet,
        'start_date': str(start_date), 'end_date': str(end_date),
        'group_by': group_by,
    }

    if not qs.exists():
        context['no_data'] = True
        return render(request, 'view_report.html', context)

    # ── Summary ───────────────────────────────────────────────────────────
    income_qs  = qs.filter(type='income')
    expense_qs = qs.filter(type='expense')

    total_income   = income_qs.aggregate(t=Sum('amount'))['t']  or Decimal('0')
    total_expense  = expense_qs.aggregate(t=Sum('amount'))['t'] or Decimal('0')
    net_balance    = total_income - total_expense
    transaction_count = qs.count()

    # ── Expense by category (pie chart) ──────────────────────────────────
    cat_totals = (
        expense_qs
        .values('budget__category__name')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )

    expense_by_category = []
    for row in cat_totals:
        cat_name = row['budget__category__name'] or 'Uncategorized'
        pct = round(float(row['total']) / float(total_expense) * 100, 1) if total_expense else 0
        expense_by_category.append({
            'category':   cat_name,
            'total':      float(row['total']),
            'percentage': pct,
        })

    # ── Income vs Expense over time (bar chart) ───────────────────────────
    trunc_fn = TruncWeek if group_by == 'week' else TruncMonth

    def fmt(d):
        if not d:
            return ''
        return str(d.date()) if group_by == 'week' else d.strftime('%Y-%m')

    income_grouped  = income_qs.annotate(period=trunc_fn('date')).values('period').annotate(income=Sum('amount')).order_by('period')
    expense_grouped = expense_qs.annotate(period=trunc_fn('date')).values('period').annotate(expense=Sum('amount')).order_by('period')

    period_map = {}
    for row in income_grouped:
        key = fmt(row['period'])
        period_map.setdefault(key, {'period': key, 'income': 0, 'expense': 0})
        period_map[key]['income'] = float(row['income'])
    for row in expense_grouped:
        key = fmt(row['period'])
        period_map.setdefault(key, {'period': key, 'income': 0, 'expense': 0})
        period_map[key]['expense'] = float(row['expense'])

    income_vs_expense = sorted(period_map.values(), key=lambda x: x['period'])

    # ── Insights ──────────────────────────────────────────────────────────
    insights = []
    if expense_by_category:
        top = expense_by_category[0]
        insights.append(f"Your top spending category is {top['category']} ({top['percentage']}% of expenses).")
    if total_expense > total_income:
        over = float(total_expense - total_income)
        insights.append(f"You spent {over:.2f} more than you earned this period. Consider reviewing your expenses.")
    elif total_income > 0:
        saved_pct = round((float(total_income - total_expense) / float(total_income)) * 100, 1)
        if saved_pct > 0:
            insights.append(f"Great job! You saved {saved_pct}% of your income this period.")
    if len(expense_by_category) > 1:
        second = expense_by_category[1]
        insights.append(f"{second['category']} is your second largest expense at {second['percentage']}% of spending.")

    context.update({
        'no_data':             False,
        'total_income':        total_income,
        'total_expense':       total_expense,
        'net_balance':         net_balance,
        'transaction_count':   transaction_count,
        'expense_by_category': expense_by_category,
        'income_vs_expense':   income_vs_expense,
        'insights':            insights,
    })
    return render(request, 'view_report.html', context)


@login_required
def view_deposit(request):
    user = _get_current_user(request)
    if not user:
        return redirect('login')
    try:
        wallet = user.wallet
    except models.Wallet.DoesNotExist:
        return redirect('login')

    if request.method == 'POST':
        context = {'user': user, 'wallet': wallet}
        try:
            new_amount = Decimal(request.POST.get('amount', '0'))
            if new_amount <= 0:
                context['error'] = 'Amount must be greater than zero.'
                return render(request, 'deposit.html', context)
            wallet.total_balance += new_amount
            wallet.total_income  += new_amount
            wallet.save()
        except Exception:
            context['error'] = 'Invalid amount provided.'
            return render(request, 'deposit.html', context)

        transactions_models.Transaction.objects.create(
            wallet=wallet, reciever=wallet,
            amount=new_amount, fee=0,
            description=request.POST.get('description', ''),
            type='income',
        )
        context['success'] = 'Deposit successful!'
        return render(request, 'deposit.html', context)

    return render(request, 'deposit.html', {'user': user, 'wallet': wallet})


def view_logout(request):
    logout(request)
    if 'user_id' in request.session:
        del request.session['user_id']
    return redirect('login')
