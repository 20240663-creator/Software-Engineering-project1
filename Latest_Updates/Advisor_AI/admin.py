from django.contrib import admin
from .models import AdvisorChat


@admin.register(AdvisorChat)
class AdvisorChatAdmin(admin.ModelAdmin):
    list_display    = ['id', 'user', 'short_msg', 'created_at']
    search_fields   = ['user__username', 'user_message']
    readonly_fields = ['user', 'user_message', 'ai_response', 'created_at']
    ordering        = ['-created_at']

    def short_msg(self, obj):
        return obj.user_message[:80]
    short_msg.short_description = 'Question'
