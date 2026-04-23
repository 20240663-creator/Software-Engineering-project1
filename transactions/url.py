from django.urls import path
from . import views

urlpatterns = [

    #api views
    path('transactions/', views.TransactionsList.as_view()),
]