from multiprocessing.reduction import register
from . import models

from django.contrib import admin

# Register your models here.
admin.site.register(models.Wallet_User)
