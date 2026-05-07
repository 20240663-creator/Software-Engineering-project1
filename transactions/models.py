from django.db import models
from django.conf import settings
from user import models as user_models

# Create your models here.


class Category(models.Model):
    wallet = models.ForeignKey('user.Wallet', on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=255)

    class Meta:
        unique_together = ('wallet', 'name')

    def __str__(self):
        return f"{self.name}"


class Transaction(models.Model):
    TYPE_CHOICES = [
        ('income' , 'Income'),
        ('expense', 'Expense'),
        ('saving' , 'Saving'),
        ('send'   , 'Sending')
    ]
    reciever = models.ForeignKey('user.Wallet',
        on_delete=models.CASCADE,
        null = True,
        blank = True)
    fee = models.DecimalField(max_digits=10,decimal_places=2,default=0)
    wallet = models.ForeignKey('user.Wallet', on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    date = models.DateTimeField(auto_now_add=True)
    description = models.TextField(null=True, blank=True)
    budget = models.ForeignKey(
    'Budget',
    on_delete=models.CASCADE,
    related_name='transactions',
    null=True,
    blank=True
    )
    saving_goals = models.ForeignKey('SavingGoals'
        ,on_delete=models.CASCADE
        ,related_name='transactions'
        ,null=True
        ,blank=True)

    def __str__(self):
        return f"{self.date} --> {self.wallet}"


class Budget(models.Model):
    wallet = models.ForeignKey('user.Wallet', on_delete=models.CASCADE, related_name='budgets')

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='budgets'
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    spended = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    start_at = models.DateField()
    end_at = models.DateField()
    percentage = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.category.name}"


class SavingGoals(models.Model):
    choices = [
        ('in_progress','In_progress'),
        ('complete','Complete')
    ]
    wallet = models.ForeignKey('user.Wallet', on_delete=models.CASCADE, related_name='saving_goals')
    name = models.CharField(max_length=255)
    target_amount = models.DecimalField(max_digits=10,decimal_places=2)
    current_amount = models.DecimalField(max_digits=10,decimal_places=2,default=0)
    deadline = models.DateField()
    status = models.CharField(max_length=255,choices=choices, default='in_progress')

    def __str__(self):
        return f"{self.name}"
    