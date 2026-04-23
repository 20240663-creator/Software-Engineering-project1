from rest_framework import serializers
from .models import Wallet_User
from transactions import models as transactions


class UserSerializerRegister(serializers.ModelSerializer):

    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Wallet_User
        fields = ['name', 'email', 'password', 'confirm_password']

    def validate(self, data):

        if self.instance is None:

            if Wallet_User.objects.filter(email=data['email']).exists():
                raise serializers.ValidationError({
                    "email": "Email already exists"
                })

            if 'confirm_password' not in data:
                raise serializers.ValidationError({
                    "confirm_password": "This field is required"
                })

            if data['password'] != data['confirm_password']:
                raise serializers.ValidationError({
                    "confirm_password": "Passwords do not match"
                })

        return data


    def create(self, validated_data):

        validated_data.pop('confirm_password')

        return super().create(validated_data)
    

class UserSeializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet_User
        exclude=['created_at','currently_month','currently_year']
        
class DepositeSerializer(serializers.ModelSerializer):
    class Meta:
        model = transactions.Transaction
        fields = "__all__"

class SendSerializer(serializers.ModelSerializer):
    class Meta:
        model = transactions.Transaction
        fields = "__all__"
    
    def validate(self, data):
        user_id = self.context['request'].session.get("user_id")
        user = Wallet_User.objects.get(id=user_id)
        amount = data['amount']
        receiver = data['receiver']


        if receiver.id == user.id:
            raise serializers.ValidationError("You cannot send money to yourself")

        if user.total_balance < amount:
            raise serializers.ValidationError("Insufficient balance")

        return data

    
        
    