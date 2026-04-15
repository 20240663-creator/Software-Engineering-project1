from django.urls import path
from . import views


urlpatterns = [
    path('home/', views.view_home, name='home'),
    path('profile/', views.view_profile, name='profile'),
    path('login/', views.view_login, name='login'),
    path('register/', views.view_register, name='register'),
    path('settings/',views.view_settings, name='settings'),
    path('view_report/', views.view_report, name='view_report'),
    path('deposit/', views.view_deposit, name='deposit'),
    path('logout/', views.view_logout, name='logout'),
]