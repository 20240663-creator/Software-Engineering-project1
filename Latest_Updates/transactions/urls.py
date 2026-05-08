from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .reports_view import ReportsView


router = DefaultRouter()
router.register('transactions', views.TransactionsViewSets,basename='transactions')
router.register('categories',views.CategoryViewSets,basename='categories')
router.register('budgets',views.BudgetViewSets,basename='budgets')
router.register('saving_goals',views.SavingGoalsViewSets,basename='saving_goals')


urlpatterns = [
    path('reports/', ReportsView.as_view(), name='reports'),
]

urlpatterns += router.urls
