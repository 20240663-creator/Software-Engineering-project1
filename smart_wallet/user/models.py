from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings

# Create your models here.


class WalletUser(AbstractUser):
    email = models.EmailField(unique=True)


class Wallet(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wallet'
    )
    total_balance = models.DecimalField(max_digits=12, decimal_places=2,default=0)
    total_income = models.DecimalField(max_digits=12, decimal_places=2,default=0)
    total_expense = models.DecimalField(max_digits=12, decimal_places=2,default=0)

    def __str__(self):
        return f"{self.user} -- wallet"
