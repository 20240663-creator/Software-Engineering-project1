from django.contrib import admin
from . import models

# Register your models here.


admin.site.register(models.Transaction)
admin.site.register(models.SavingGoals)
admin.site.register(models.Category)
admin.site.register(models.Budget)
