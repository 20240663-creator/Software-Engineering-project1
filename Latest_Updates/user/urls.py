from . import views
from django.urls import path
from rest_framework.routers import DefaultRouter

router = DefaultRouter()

urlpatterns=[
    path('wallets/<int:pk>/',views.WalletViewSets.as_view()),
    path('wallets/',views.WalletRead.as_view()),

] + router.urls