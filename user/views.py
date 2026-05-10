from decimal import Decimal
from django.utils import timezone
from django.contrib.auth import authenticate, get_user_model, login, logout
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from transactions import models as transactions_models
from django.db.models import Q 
from django.db.models.aggregates import Sum
from . import models
from Latest_Version.Notifications_v2 import models as notification_models


User = get_user_model()


def _get_current_user(request):
    """Get the currently authenticated user from request or session."""
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
    """
    Displays the main dashboard.

    Shows:
    - Wallet balance
    - Recent transactions
    - Saving goals summary
    """

    user = _get_current_user(request)
    if not user:
        return redirect('login')

    try:
        wallet = user.wallet
    except models.Wallet.DoesNotExist:
        return redirect('deposit')

    user.total_balance = wallet.total_balance
    user.total_income = wallet.total_income
    user.total_expense = wallet.total_expense
    user.saving_goals = Decimal('0')

    transaction = transactions_models.Transaction.objects.filter(Q (wallet=wallet) | Q(reciever=wallet)).order_by('-date')
    saving_gaols = transactions_models.SavingGoals.objects.filter(wallet=wallet).aggregate(total_saving=Sum('current_amount'))['total_saving'] or 0
    context = {
        'user': user,
        'wallet': wallet,
        'transaction': transaction,
        'saving_goals': saving_gaols,
    }
    return render(request, 'index.html', context)

@login_required
def view_profile(request):
    """
    Displays user profile information.
    """
    user = _get_current_user(request)
    if not user:
        return redirect('login')
    
    user.created_at = user.date_joined
    user.updated_at = user.date_joined
    
    return render(request, 'profile.html', {'user': user})


def view_login(request):
    """
    Handles user authentication.

    Validates email and password.
    Creates session upon successful login.
    """

    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        user = None

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
    """
    Handles user registration.

    - Validates input
    - Creates new user
    - Automatically creates wallet
    """

    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        name = request.POST.get('name', '').strip()
        password = request.POST.get('password', '')
        confirm = request.POST.get('password_confirm')

        if confirm != password:
            return render(request,'register.html',{'error' : 'password is not matching'})

        if not email or not password:
            return render(request, 'register.html', {'error': 'Email and password are required.'})

        if User.objects.filter(email=email).exists():
            return render(request, 'register.html', {'error': 'This email is already registered.'})
        
        
        
        username = name
        user = User.objects.create_user(username=username, email=email, password=password)
        if name:
            user.first_name = name
            user.save()
        
        # Create wallet for the new user
        models.Wallet.objects.create(
            user=user,
            total_balance=0,
            total_income=0,
            total_expense=0,
            send_limit=3
        )

        return redirect('login')

    return render(request, 'register.html')


def view_intro(request):
    return render(request, 'intro.html')


@login_required
def view_report(request):
    """
    Displays all user transactions as a financial report.
    """
    user = _get_current_user(request)
    if not user:
        return redirect('login')
    
    try:
        wallet = user.wallet
    except models.Wallet.DoesNotExist:
        return redirect('login')
    
    # Map wallet data to user for template compatibility
    user.total_balance = wallet.total_balance
    user.total_income = wallet.total_income
    user.total_expense = wallet.total_expense
    
    transaction = transactions_models.Transaction.objects.filter(wallet=wallet).order_by('-date')
    
    return render(request, 'view_report.html', {
        'user': user,
        'wallet': wallet,
        'transaction': transaction
    })


@login_required
def view_deposit(request):
    """
    Handles deposit transactions.

    - Validates amount
    - Updates wallet balance
    - Creates income transaction
    - Sends notification
    """

    """Handle deposit transactions to user wallet."""
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
            wallet.total_income += new_amount
            wallet.save()
        except Exception as e:
            context['error'] = 'Invalid amount provided.'
            return render(request, 'deposit.html', context)

        context['method'] = request.POST.get('method', '')
        context['account'] = request.POST.get('account', '')
        context['description'] = request.POST.get('description', '')
        
        transactions_models.Transaction.objects.create(
            wallet=wallet,
            reciever=wallet,
            amount=new_amount,
            fee=0,
            description=request.POST.get('description', ''),
            type='income',
        )

        notification_models.Notification.objects.create(
            user=user,
            type='DEPOSIT',
            message=f"💰 You received a deposit {new_amount}."
        )
        context['success'] = 'Deposit successful!'
        return render(request, 'deposit.html', context)

    return render(request, 'deposit.html', {'user': user, 'wallet': wallet})



def view_logout(request):
    """
    Logs out user and clears session.
    """
    logout(request)
    if 'user_id' in request.session:
        del request.session['user_id']
    return redirect('login')


@login_required
def profile_edit(request):
    if request.method == "POST":
        user = request.user
        user.first_name = request.POST.get("first_name")
        user.email = request.POST.get("email")
        user.save()
        return redirect("profile")

