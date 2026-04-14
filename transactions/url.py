from django.urls import path
from . import views

urlpatterns = [
    path('transaction/',views.view_transaction,name='transactions'),
    path('send/',views.view_send,name='send_money'),
    path('request/',views.view_request,name='request_money'),
]