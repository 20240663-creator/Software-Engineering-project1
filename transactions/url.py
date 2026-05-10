from django.urls import path
from . import views

urlpatterns = [
    path('transaction/',views.view_transaction,name='transactions'),
    path('send/',views.view_send,name='send_money'),
    path('categories/',views.view_categories,name='categories'),
    path('budgets/',views.view_budget,name='budget'),
    path('budget/delete/<int:id>/', views.delete_budget, name='delete_budget'),
    path('add_ransaction/',views.view_add_transaction,name='add_transaction'),
    path('saving-goals/', views.view_saving_goals, name='saving_goals'),
    path('saving-goals/edit/<int:id>/', views.view_saving_goals, name='saving_goal_edit'),
    path('saving-goals/delete/<int:id>/', views.saving_delete, name='saving_goal_delete'),
]