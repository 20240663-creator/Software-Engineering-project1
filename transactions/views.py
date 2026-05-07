from decimal import Decimal
from django.utils import timezone
from django.shortcuts import render, redirect
from django.db.models import Q
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from . import models as trans_models
from user import models as user_models

User = get_user_model()

@login_required
def _get_current_user(request):
    """Get the currently authenticated user from request or session."""
    user = request.user if request.user.is_authenticated else None
    if not user:
        user_id = request.session.get('user_id')
        if user_id:
            user = User.objects.filter(id=user_id).first()
    return user

@login_required
def view_transaction(request):
    """Display all transactions for the current user."""
    user = _get_current_user(request)
    if not user:
        return redirect('login')
    
    try:
        wallet = user.wallet
    except user_models.Wallet.DoesNotExist:
        return redirect('login')
    
    transactions = trans_models.Transaction.objects.filter(Q(wallet=wallet) | Q(reciever=wallet)).order_by('-date')
    return render(request, 'transaction.html', {
        'transactions': transactions, 
        'user': user,
        'wallet': wallet,
        'total_balance': wallet.total_balance
    })

@login_required
def view_send(request):
    """Handle sending money to another user."""
    user = _get_current_user(request)
    if not user:
        return redirect('login')
    
    try:
        wallet = user.wallet
    except user_models.Wallet.DoesNotExist:
        return redirect('login')
    
    context = {'user': user, 'wallet': wallet}
    context['sends'] = trans_models.Transaction.objects.filter(wallet=wallet, type='send').order_by('-date')[:3]

    if request.method == 'POST':
        rec_name = request.POST.get('recipient', '').strip()
        rec_email = request.POST.get('recipient_email', '').strip()
        amount_value = request.POST.get('amount', '').strip()
        purpose = request.POST.get('purpose', '').strip()
        description = request.POST.get('description', '').strip()

        if not rec_name or not rec_email or not amount_value or not purpose:
            context['error'] = 'Please fill in all required fields.'
            return render(request, 'send_money.html', context)

        try:
            amount = Decimal(amount_value)
        except (TypeError, ValueError):
            context['error'] = 'Enter a valid amount.'
            return render(request, 'send_money.html', context)

        if amount <= 0:
            context['error'] = 'Amount must be greater than zero.'
            return render(request, 'send_money.html', context)

        if amount > wallet.total_balance:
            context['error'] = 'Insufficient balance.'
            return render(request, 'send_money.html', context)

        # Find recipient by first_name/last_name or email
        recipient = User.objects.filter(
            Q(first_name=rec_name, email=rec_email) |
            Q(last_name=rec_name, email=rec_email) |
            Q(username=rec_name, email=rec_email)
        ).first()
        
        if not recipient:
            context['error'] = 'Recipient not found.'
            return render(request, 'send_money.html', context)

        if recipient.id == user.id:
            context['error'] = 'You cannot send money to yourself.'
            return render(request, 'send_money.html', context)

        try:
            recipient_wallet = recipient.wallet
        except user_models.Wallet.DoesNotExist:
            context['error'] = 'Recipient wallet not found.'
            return render(request, 'send_money.html', context)

        # Update sender wallet balance
        wallet.total_balance -= amount
        wallet.total_expense += amount
        wallet.save()
        
        # Update recipient wallet balance
        recipient_wallet.total_balance += amount
        recipient_wallet.total_income += amount
        recipient_wallet.save()

        if wallet.send_limit == 0:
            fee = 5.00
            wallet.total_balance -= 5
            wallet.total_expense += 5
            wallet.save()
            
        else:
            fee = 0
            wallet.send_limit -= 1
            wallet.save()

        # Create transaction using correct Transaction model fields
        trans_models.Transaction.objects.create(
            wallet=wallet,
            reciever=recipient_wallet,
            amount=amount + Decimal(fee),
            description=description,
            type='send',
            fee=fee,
        )

        context['success'] = 'Transfer completed successfully.'
        context['wallet'] = wallet
        return render(request, 'send_money.html', context)

    return render(request, 'send_money.html', context)


@login_required
def view_request(request):
    """Display request money form."""
    return render(request, 'request_money.html')
