from django.db import models
from typing import Any

# Create your models here.
class Wallet_User (models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    password = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    monthly_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_balance = models.DecimalField(max_digits=10, decimal_places=2, default = 0)
    saving_goals = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monthly_spending = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    last_month = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    currently_month = models.IntegerField(default=0)
    currently_year = models.IntegerField(default=0)

    def __init__(self, *args: Any, **kwargs: Any):
        super().__init__(*args, **kwargs)
        self.amount = None

    def __str__(self):
        return self.name

