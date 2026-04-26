from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views


router = DefaultRouter()
router.register('transactions', views.TransactionsViewSets,basename='transactions')
router.register('categories',views.CategoryViewSets,basename='categories')
router.register('budgets',views.BudgetViewSets,basename='budgets')

urlpatterns=[
   
]

urlpatterns += router.urls