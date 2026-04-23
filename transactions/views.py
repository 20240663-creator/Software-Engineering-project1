from django.utils import timezone
from django.shortcuts import render, redirect
from django.db.models import Q
from rest_framework import generics
from user.models import Wallet_User
from . import models as trans_models
from .serializers import *
from user import models as user_models

# Create your views here.


class TransactionsList(generics.ListAPIView):
    queryset = trans_models.Transaction.objects.all()
    serializer_class = TransactionSerializer




########################