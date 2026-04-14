from django.utils import timezone
from django.shortcuts import render, redirect
from django.db.models import Q
from user.models import Wallet_User
from . import models as trans_models
from user import models as user_models

# Create your views here.


def view_transaction(request):
    user_id = request.session.get('user_id')
    user = Wallet_User.objects.get(id=user_id)
    transactions = trans_models.Transaction.objects.filter(    Q(sender=user) | Q(receiver=user)).order_by('-date')
    return render(request,'transaction.html',{'transactions':transactions, 'user':user})


def view_send(request):
    user_id = request.session.get('user_id')
    user = Wallet_User.objects.get(id=user_id)
    context = {'user': user}
    context['sends'] = trans_models.Transaction.objects.all().filter(sender=user,transaction_type='send').order_by('-date')[:3]

    if request.method == 'POST':
        rec_name = request.POST.get('recipient', '').strip()
        rec_email = request.POST.get('recipient_email', '').strip()
        amount_value = request.POST.get('amount', '').strip()
        purpose = request.POST.get('purpose', '').strip()
        description = request.POST.get('description', '').strip()

        print(rec_name, rec_email, amount_value, purpose)

        if not rec_name or not rec_email or not amount_value or not purpose:
            context['error'] = 'Please fill in all required fields.'
            #
            print("...")
            return render(request, 'send_money.html', context)

        try:
            amount = float(amount_value)
        except (TypeError, ValueError):
            context['error'] = 'Enter a valid amount.'
            return render(request, 'send_money.html', context)

        if amount <= 0:
            context['error'] = 'Amount must be greater than zero.'
            return render(request, 'send_money.html', context)

        if amount > float(user.total_balance):
            context['error'] = 'Insufficient balance.'
            return render(request, 'send_money.html', context)

        recipient = Wallet_User.objects.filter(name=rec_name, email=rec_email).first()
        if not recipient:
            context['error'] = 'Recipient not found.'
            #
            print("Recipient not found")
            return render(request, 'send_money.html', context)

        if recipient.id == user.id:
            context['error'] = 'You cannot send money to yourself.'
            print("You cannot send money to yourself.")
            return render(request, 'send_money.html', context)


        user.total_balance = float(user.total_balance) - amount
        recipient.total_balance = float(recipient.total_balance) + amount
        user.monthly_spending = float(user.monthly_spending) + amount
        user.save()
        recipient.save()

        recipient_type = 'contact' if '@' in rec_email else 'bank'
        trans_models.Transaction.objects.create(
            sender=user,
            receiver=recipient,
            amount=amount,
            description=description,
            transaction_type='send',
            date=timezone.now(),
            status='Success',
        )

        context['success'] = 'Transfer completed successfully.'
        context['user'] = Wallet_User.objects.get(id=user_id)
        return render(request, 'send_money.html', context)

    return render(request, 'send_money.html', context)

def view_request(request):
    return render(request,'request_money.html')