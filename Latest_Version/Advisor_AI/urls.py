from django.urls import path
from . import views

urlpatterns = [
    path('',                      views.view_advisor, name='advisor'),
    path('delete/<int:chat_id>/', views.delete_chat,  name='advisor_delete'),
]
