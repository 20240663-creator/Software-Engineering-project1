from django.shortcuts import render
from rest_framework import  generics
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from . import models
from . import serializer
from . import permessions
# Create your views here.




class TransactionsViewSets(ModelViewSet):
    serializer_class = serializer.TransactionSerializer
    permission_classes = [IsAuthenticated,permessions.IsOwnerOfWallet]

    def get_queryset(self):
        return models.Transaction.objects.filter(
            wallet__user=self.request.user
        )
    

class CategoryViewSets(ModelViewSet):
    serializer_class = serializer.CategorySerializer
    permission_classes = [IsAuthenticated,permessions.IsMyCategory]

    def get_queryset(self):
        return models.Category.objects.filter(
            wallet__user=self.request.user
        )
    

class BudgetViewSets(ModelViewSet):
    serializer_class = serializer.BudgetSerializer
    permission_classes = [IsAuthenticated,permessions.IsMyBudget]

    def get_queryset(self):
        return models.Budget.objects.filter(
            wallet__user=self.request.user
        )

    

    