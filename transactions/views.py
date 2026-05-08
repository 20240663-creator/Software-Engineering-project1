from decimal import Decimal
from django.utils import timezone
from django.shortcuts import get_object_or_404, render, redirect
from django.db.models import Q
from django.db.models.aggregates import Sum, Count
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from . import models as trans_models
from Latest_Version.Notifications_v2 import models as notification_models
from user import models as user_models
from django.utils import timezone
from django.shortcuts import get_object_or_404

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

        notification_models.Notification.objects.create(
            user=user_models.WalletUser.objects.get(email=rec_email),
            type='SEND_MONEY',
            message=f"{user.first_name} sent you {amount}"
        )
        notification_models.Notification.objects.create(
                user=user,
                type='GOAL_COMPLETE',
                message=f"you sent to {rec_name} {amount}"
            )
        context['success'] = 'Transfer completed successfully.'
        context['wallet'] = wallet
        return render(request, 'send_money.html', context)

    return render(request, 'send_money.html', context)


@login_required
def view_request(request):
    """Display request money form."""
    return render(request, 'request_money.html')


@login_required
def view_categories(request):
    user = request.user
    categories = trans_models.Category.objects.filter(wallet=user.wallet)
    context = {'cat' : categories}
    context['total_categories'] = trans_models.Category.objects.filter(wallet=request.user.wallet).count()
    wallet = user.wallet


    if request.method == 'POST':
        if 'add_category' in request.POST:

            wallet = user.wallet
            name = request.POST.get('name')
            if trans_models.Category.objects.filter(name=name,wallet=wallet).exists():
                return render(request,'categories.html',{'error' : 'Category is alredy exists'})
            trans_models.Category.objects.create(
                wallet=wallet,
                name=name,
            )
            context['total_categories'] = trans_models.Category.objects.filter(wallet=request.user.wallet).count()
            context['with_budgets'] = trans_models.Budget.objects.filter(
                wallet=wallet,
            ).aggregate(total=Count('id'))['total'] or 0
            context['cat_transactions'] = trans_models.Transaction.objects.filter(
                wallet=wallet,
                type='expense').aggregate(total=Count('id'))['total'] or 0
            return render(request,'categories.html',context)
        
        elif 'delete_category' in request.POST:
            trans_models.Category.objects.filter(
                id=request.POST.get('category_id')
            ).delete()
            context['total_categories'] = trans_models.Category.objects.filter(wallet=request.user.wallet).count()
            context['with_budgets'] = trans_models.Budget.objects.filter(
                wallet=wallet,
            ).aggregate(total=Count('id'))['total'] or 0
            context['cat_transactions'] = trans_models.Transaction.objects.filter(
                wallet=wallet,
                type='expense').aggregate(total=Count('id'))['total'] or 0
            return render(request,'categories.html',context)
        
    context['with_budgets'] = trans_models.Budget.objects.filter(
            wallet=wallet,
        ).aggregate(total=Count('id'))['total'] or 0
    context['cat_transactions'] = trans_models.Transaction.objects.filter(
            wallet=wallet,
            type='expense').aggregate(total=Count('id'))['total'] or 0

    return render(request,'categories.html',context)


@login_required
def view_budget(request):
    user = request.user
    wallet = user.wallet

    categories = trans_models.Category.objects.filter(wallet=wallet)
    budgets = trans_models.Budget.objects.filter(wallet=wallet)

    total_percantage = budgets.aggregate(
            total=Sum('percentage')
        )['total'] or 0
    
    num_of_budgets = budgets.aggregate(
            total=Count('id')
        )['total'] or 0
    
    try:
        percentage = total_percantage / num_of_budgets or 0
    except:
        percentage = 0

    total_spent = budgets.aggregate(
            total=Sum('spended')
        )['total'] or 0

    total_remaining = budgets.aggregate(
            total=Sum('remaining')
        )['total'] or 0
    context = {
        'categories': categories,
        'budgets': budgets,
        'editing_budget': None,
        'total_spent':total_spent,
        'total_remaining':total_remaining,
        'total_percentage' : percentage
    }

    # ================= EDIT MODE (GET) =================
    edit_id = request.GET.get('edit_id')
    if edit_id:
        context['editing_budget'] = trans_models.Budget.objects.get(id=edit_id)

    # ================= POST =================
    if request.method == 'POST':

        # -------- CREATE / UPDATE --------
        if 'create-budget' in request.POST:

            budget_id = request.POST.get('budget_id')
            category_id = request.POST.get('category_id')
            amount = request.POST.get('amount')
            start_at = request.POST.get('start_at')
            end_at = request.POST.get('end_at')

            category_obj = trans_models.Category.objects.get(id=category_id)

            if start_at > end_at:
                context['message'] = 'Dates are not valid'
                return render(request, 'budget.html', context)

            # UPDATE
            if budget_id:
                budget = trans_models.Budget.objects.get(id=budget_id, wallet=wallet)

                budget.category = category_obj
                budget.amount = Decimal(amount)
                budget.start_at = start_at
                budget.end_at = end_at

                budget.remaining = Decimal(budget.amount) - Decimal(budget.spended)

                if budget.amount > 0:
                    budget.percentage = (Decimal(budget.spended) / Decimal(budget.amount)) * 100
                else:
                    budget.percentage = 0

                budget.save()
            # CREATE
            else:
                if trans_models.Budget.objects.filter(wallet=wallet, category=category_obj, status='in_progress').exists():
                    context['message'] = 'Budget already exists for this category'
                    return render(request, 'budget.html', context)

                trans_models.Budget.objects.create(
                    wallet=wallet,
                    category=category_obj,
                    amount=amount,
                    spended=0,
                    start_at=start_at,
                    end_at=end_at,
                    percentage=0,
                    remaining=amount
                )

            return redirect('budget')

    return render(request, 'budget.html', context)

@login_required
def delete_budget(request, id):
    user = request.user
    wallet = user.wallet

    budget = get_object_or_404(trans_models.Budget, id=id, wallet=wallet)
    budget.delete()

    return redirect('budget')

@login_required
def view_add_transaction(request):
    today = timezone.now().date()
    user=request.user
    active_bugets = trans_models.Budget.objects.filter(wallet=user.wallet,status='active')
    
    for budget in active_bugets:
        if budget.end_at < today:
            budget.status='expired'
            budget.save()
    
    active_bugets = trans_models.Budget.objects.filter(wallet=user.wallet,status='active')

    context = {'active_budgets' : active_bugets}
    context['active_savings_goals'] = trans_models.SavingGoals.objects.filter(wallet=user.wallet,status='in_progress')
    
    
    if request.method == 'POST':
        amount = Decimal(request.POST.get('amount'))
        type = request.POST.get('transaction_type')

        if amount > user.wallet.total_balance:
            return render(request,'add_transaction',{'message' : 'No enough money'})
        
        if type == 'expense':
            budget_id = request.POST.get('budget_id')
            budget=trans_models.Budget.objects.get(id=budget_id)

            trans_models.Transaction.objects.create(
                wallet=user.wallet,
                amount=amount,
                description=request.POST.get('description'),
                budget=budget,
                type='expense'
            )
            budget.spended += amount
            budget.remaining -= amount
            budget.percentage = int((budget.spended / budget.amount) * 100)
            user.wallet.total_balance -= amount
            user.wallet.total_expense += amount
            user.wallet.save()
            budget.save()
            
            if budget.percentage >= 80 and budget.percentage <= 100:
                notification_models.Notification.objects.create(
                    user=user,
                    type='BUDGET_ALERT',
                    message=f"🚨 You’ve reached {budget.percentage}% of your budget. Review your spending.",
                )
            
            if budget.percentage > 100:
                notification_models.Notification.objects.create(
                    user=user,
                    type='BUDGET_EXCEEDED',
                    message=f"🚨 You’ve reached {budget.percentage}% of your budget {budget.category.name}. Review your spending.",
                )

            return redirect('add_transaction')
        
        elif type == 'saving':
            savings_id = request.POST.get('savings_goal_id')
            saving = trans_models.SavingGoals.objects.get(id=savings_id,status='in_progress')

            if amount + saving.current_amount > saving.target_amount:
                return render(request,'add_transaction.html',{'message' : 'Exceed the target of this goal'})

            trans_models.Transaction.objects.create(
                wallet=user.wallet,
                amount=amount,
                description=request.POST.get('description'),
                saving_goals=saving,
                type='expense'

            )
            saving.current_amount += amount
            saving.remaining -= amount
            saving.percentage = (saving.current_amount / saving.target_amount) * 100
            if saving.current_amount == saving.target_amount:
                saving.status = 'complete'
                notification_models.Notification.objects.create(
                    user=user,
                    type='GOAL_COMPLETE',
                    message = "🎉 Congratulations! You’ve completed your saving goal."
                )

            saving.save()
            user.wallet.total_balance -= amount
            user.wallet.total_expense += amount
            user.wallet.save()
            return redirect('add_transaction')

    return render(request,'add_transaction.html',context)


@login_required
def view_saving_goals(request):
    user = request.user
    wallet = user.wallet

    savings_goals = trans_models.SavingGoals.objects.filter(wallet=wallet).order_by('-id')

    context = {
        'savings_goals': savings_goals,
        'editing_goal': None
    }

    # stats
    context['active_goals_count'] = savings_goals.filter(status='in_progress').aggregate(total=Count('id'))['total'] or 0
    context['completed_goals_count'] = savings_goals.filter(status='complete').aggregate(total=Count('id'))['total'] or 0
    context['total_target_amount'] = savings_goals.filter(status='in_progress').aggregate(total=Sum('target_amount'))['total'] or 0
    context['total_saved_amount'] = savings_goals.filter(status='in_progress').aggregate(total=Sum('current_amount'))['total'] or 0

    # ================= EDIT MODE (GET) =================
    edit_id = request.GET.get('edit_id')
    if edit_id:
        context['editing_goal'] = trans_models.SavingGoals.objects.get(id=edit_id, wallet=wallet)

    # ================= POST =================
    if request.method == 'POST':

        goal_id = request.POST.get('goal_id')
        goal_name = request.POST.get('name')
        target_amount = request.POST.get('target_amount')
        deadline = request.POST.get('deadline')
        status = request.POST.get('status', 'in_progress')

        # UPDATE
        if goal_id:
            goal = get_object_or_404(
                trans_models.SavingGoals,
                id=goal_id,
                wallet=wallet,
                status='in_progress'
            )

            goal.name = goal_name
            goal.target_amount = Decimal(target_amount)
            goal.deadline = deadline

            if status == 'in_progress':
                goal.status = 'in_progress'

            goal.save()

        # CREATE
        else:
            if trans_models.SavingGoals.objects.filter(wallet=wallet, name=goal_name, status='in_progress').exists():
                return render(request, 'saving-goals.html', context)

            trans_models.SavingGoals.objects.create(
                wallet=wallet,
                name=goal_name,
                target_amount=target_amount,
                deadline=deadline,
                remaining=target_amount,
                status='in_progress'
            )

        return redirect('saving_goals')

    return render(request, 'saving-goals.html', context)


@login_required
def saving_delete(request, id):
    user = request.user
    wallet = user.wallet

    goal = get_object_or_404(trans_models.SavingGoals, id=id, wallet=wallet)
    wallet.total_balance += goal.current_amount
    wallet.total_expense -= goal.current_amount
    wallet.save()
    goal.delete()

    return redirect('saving_goals')


