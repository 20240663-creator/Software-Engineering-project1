from pydoc import describe
from decimal import Decimal
from django.utils import timezone
from django.utils.timezone import now
from django.shortcuts import render, redirect
from .models import Wallet_User
from transactions import models as transactions
from django.db.models import Q
from rest_framework import generics, viewsets
from rest_framework import serializers
from .serializers import *
from django.db import transaction


class Users(generics.ListCreateAPIView):
    queryset = Wallet_User.objects.all()
    serializer_class = UserSerializerRegister

class UsersEdit(generics.RetrieveUpdateDestroyAPIView):
    queryset = Wallet_User.objects.all()
    serializer_class = UserSeializer
    lookup_field = 'pk'

class Deposite(viewsets.ModelViewSet):
    queryset = transactions.Transaction.objects.filter(transaction_type='Deposit')
    serializer_class = DepositeSerializer

    def perform_create(self, serializer):
            
        with transaction.atomic():
            user_id = self.request.session.get("user_id")
            if not user_id:
                raise serializers.ValidationError("User not logged in")
            
            user = Wallet_User.objects.get(id=user_id)
            amount = serializer.validated_data['amount']

            user.total_balance += amount
            user.total_income += amount
            user.monthly_balance += amount
            user.save()
            serializer.save(sender=user,receiver=user,transaction_type='Deposit')




        

class SendMoney(generics.ListCreateAPIView):

    queryset = transactions.Transaction.objects.filter(transaction_type='send')
    serializer_class = SendSerializer

    def perform_create(self, serializer):
        with transaction.atomic():
            user_id = self.request.session.get("user_id")
            if not user_id:
                raise serializers.ValidationError("User not logged in")
            
            sender = Wallet_User.objects.get(id=user_id)
            receiver = serializer.validated_data['receiver']
            amount = serializer.validated_data['amount']

            sender.total_balance -= amount
            sender.monthly_spending += amount 
            sender.monthly_balance -= amount
            sender.total_expense += amount
            sender.save()

            receiver.total_balance += amount
            receiver.monthly_balance += amount
            receiver.total_income += amount
            receiver.save()
            
            serializer.save(sender=sender,transaction_type='send')

    
########################################

