from django.urls import path
from . import views

urlpatterns = [
    path('',                              views.view_notifications,  name='notifications'),
    path('mark-read/<int:notification_id>/', views.mark_read,        name='mark_read'),
    path('mark-all-read/',                views.mark_all_read,       name='mark_all_read'),
    path('delete/<int:notification_id>/', views.delete_notification, name='delete_notification'),
]
