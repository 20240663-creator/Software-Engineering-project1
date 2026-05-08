from . import models
from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserSerializer



class UserCreateSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        fields = ['id','email','password','username','first_name','last_name']

    def create(self, validated_data):
        user = super().create(validated_data)
        models.Wallet.objects.create(user=user)

        return user


class WalletSerializer(serializers.ModelSerializer):
    user = UserCreateSerializer(read_only=True)
    class Meta():
        model = models.Wallet
        fields = "__all__"