from rest_framework import serializers
from . import models




class TransactionSerializer(serializers.ModelSerializer):
    class Meta():
        model = models.Transaction
        fields = "__all__"

class CategorySerializer(serializers.ModelSerializer):
    class Meta():
        model = models.Category
        fields = "__all__"


class BudgetSerializer(serializers.ModelSerializer):
    class Meta():
        model = models.Budget
        fields = "__all__"


    def validate(self, data):
        user = self.context['request'].user
        wallet = user.wallet

        category = data['category']

        if category.wallet != wallet:
            raise serializers.ValidationError("Invalid category for this wallet")

        return data
    
    def create(self, validated_data):
        user = self.context['request'].user
        wallet = user.wallet

        return models.Budget.objects.create(
            wallet=wallet,
            **validated_data
        )
