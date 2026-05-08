from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display  = ['id', 'user', 'type', 'message', 'is_read', 'timestamp']
    list_filter   = ['type', 'is_read']
    search_fields = ['user__username', 'message']
    ordering      = ['-timestamp']
