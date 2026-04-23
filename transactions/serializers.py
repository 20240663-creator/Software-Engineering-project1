from rest_framework import serializers
from user import models as user_mod
from . models import *



class WalletUserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = user_mod.Wallet_User
        fields = ['id', 'name']


class TransactionSerializer(serializers.ModelSerializer):
    sender = WalletUserMiniSerializer(read_only=True)
    receiver = WalletUserMiniSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = "__all__"