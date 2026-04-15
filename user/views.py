from pydoc import describe
from decimal import Decimal
from django.utils import timezone
from django.utils.timezone import now
from django.db.models import Sum
from django.shortcuts import render, redirect
from .models import Wallet_User
from transactions import models as transactions
from django.db.models import Q


def view_home(request):
    today = now()
    user_id = request.session.get('user_id')
    user = Wallet_User.objects.get(id=user_id)

    if int(today.month) != user.currently_month or int(today.year) != user.currently_year:
        user.currently_month = int(today.month)
        user.last_month = user.monthly_spending
        user.currently_year = today.year
        user.monthly_spending = 0
        user.save()

    transaction = transactions.Transaction.objects.filter(Q(sender=user) | Q(receiver=user)).order_by('-date')[:3]
    context = {'user': user, 'transaction': transaction}
    if user.last_month != 0:
        context['spend_pre'] = round(((user.total_balance - user.last_month) / user.last_month) * 100,2)
    else:
        context['spend_pre'] = 0

    if user.total_balance != 0:
        context['monthly_spend'] = round(user.monthly_spending / user.total_balance * 100,2)
    else:
        context['monthly_spend'] = 0
    return render(request, 'index.html',context)


def view_profile(request):

    user_id = request.session.get("user_id")
    if user_id:
        user = Wallet_User.objects.get(id=user_id)
        return render(request, 'profile.html', {'user': user})

    return redirect("login")


def view_login(request):
    if request.method == "POST":
        email = request.POST.get("email")
        password = request.POST.get("password")
        if Wallet_User.objects.filter(email = email, password = password).exists():
            user = Wallet_User.objects.get(email = email, password = password)
            request.session["user_id"] = user.id
            return redirect('home')
        else:
            return render(request, 'login.html')
    else:
        return render(request, 'login.html')
def view_register(request):
    if request.method == "POST":
        if Wallet_User.objects.filter(email = request.POST.get("email")):
            return render(request,'register.html')
        else:
            name = request.POST.get("name")
            email = request.POST.get("email")
            password = request.POST.get("password")
            Wallet_User.objects.create(
                email = email,
                name = name,
                password = password,
            )
            return redirect('login')
    return render(request, 'register.html')


def view_intro(request):
    return render(request, 'intro.html')

def view_settings(request):
    return render(request, 'settings.html')

def view_report(request):
    user_id = request.session.get("user_id")
    user_info = Wallet_User.objects.get(id=user_id)
    transaction = transactions.Transaction.objects.filter(Q(sender=user_info) | Q(receiver=user_info)).order_by('-date')[:3]
    return render(request,'view_report.html',{'user':user_info,'transaction':transaction})

def view_deposit(request):
    user_id = request.session.get('user_id')
    user = Wallet_User.objects.get(id=user_id)
    if request.method == 'POST':
        context = {'user': user}
        try:
            new_amount = Decimal(request.POST.get("amount"))
            if new_amount > 0:
                user.total_balance += new_amount
                user.save()
        except:
            return redirect('deposit')
        context['method'] = request.POST.get("method")
        context['account'] = request.POST.get("account")
        context['description'] = request.POST.get("description")
        transactions.Transaction.objects.create(
            sender = user,
            receiver = user,
            amount = new_amount,
            fee = 0,
            description = request.POST.get("description"),
            date=timezone.now(),
            status = 'success',
            transaction_type = 'Deposit',
        )

        return render(request, 'deposit.html', context)

    return render(request, 'deposit.html',{'user':user})


def view_logout(request):
    # Clear the session
    if 'user_id' in request.session:
        del request.session['user_id']
    return redirect('login')

