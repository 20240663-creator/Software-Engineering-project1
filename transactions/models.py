from django.db import models

# Create your models here.

class Transaction(models.Model):

    sender = models.ForeignKey(
        'user.Wallet_User',
        on_delete=models.CASCADE,
        related_name='sent_transactions'
    )

    receiver = models.ForeignKey(
        'user.Wallet_User',
        on_delete=models.CASCADE,
        related_name='received_transactions',
        null=True,
        blank=True,

    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)

    fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    transaction_type = models.CharField(
        max_length=20,
        choices=[
            ('send', 'Send'),
            ('request', 'Request'),
            ('receive', 'Receive'),
            ('Deposit', 'Deposit'),
        ]
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('success', 'Success'),
            ('rejected', 'Rejected'),
        ],
        default='pending'
    )

    description = models.TextField(blank=True)

    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} → {self.receiver} ({self.amount})"
