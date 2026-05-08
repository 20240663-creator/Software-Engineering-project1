from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        ('BUDGET_ALERT',    'Budget Alert'),
        ('BUDGET_EXCEEDED', 'Budget Exceeded'),
        ('GOAL_COMPLETE',   'Goal Complete'),
        ('GOAL_PROGRESS',   'Goal Progress'),
        ('SEND_MONEY',      'Send Money'),
        ('DEPOSIT',         'Deposit'),
        ('GENERAL',         'General'),
    ]

    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    type      = models.CharField(max_length=50, choices=TYPE_CHOICES, default='GENERAL')
    message   = models.CharField(max_length=255)
    is_read   = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.type}] {self.user} — {self.message[:50]}"
