from . import serializer
from . import permessions
from . import models
from django.shortcuts import render
from rest_framework import generics
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated


# Create your views here.

class WalletRead(generics.ListAPIView):
    query = models.Wallet.objects.all()
    serializer_class = serializer.WalletSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.is_staff:
            return self.query
        return self.query.filter(user=self.request.user)
    


class WalletViewSets(generics.RetrieveUpdateDestroyAPIView):
    queryset = models.Wallet.objects.all()
    serializer_class = serializer.WalletSerializer         
    permission_classes = [IsAuthenticated, permessions.PermetionViewUsers]