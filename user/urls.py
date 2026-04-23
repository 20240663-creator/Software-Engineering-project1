from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter



router = DefaultRouter()
router.register(r'deposit', views.Deposite, basename='deposit')

urlpatterns = [
    #api views
    path('users/',views.Users.as_view()),
    path('users/<int:pk>',views.UsersEdit.as_view()),
    path('',include(router.urls)),
    path('send-money/',views.SendMoney.as_view()),   
]