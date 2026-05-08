from rest_framework import serializers
from user import serializer as user_serializer
from . import models


class SavingGoalsSerializer(serializers.ModelSerializer):
    class Meta():
        model = models.SavingGoals
        fields = "__all__"

    

class TransactionSerializer(serializers.ModelSerializer):
    wallet = user_serializer.WalletSerializer(read_only=True)
    reciever = user_serializer.WalletSerializer(read_only=True)
    
    saving_goals = serializers.SlugRelatedField(
    queryset=models.SavingGoals.objects.all(),
    slug_field='name',
    required=False,
    allow_null=True
)

    saving_goals_details = SavingGoalsSerializer(
        source='saving_goals',
        read_only=True
    )
    class Meta():
        model = models.Transaction
        fields = ['id','wallet','reciever','amount','type','description','date','budget','saving_goals','saving_goals_details','fee']
        

    def validate(self, data):
        user = self.context['request'].user
        reciever = data.get('reciever')

        if not hasattr(user, 'wallet'):
            raise serializers.ValidationError("User has no wallet")

        wallet = user.wallet
        amount = data.get('amount')
        transaction_type = data.get('type')

        if transaction_type == 'send' and not reciever:
            raise serializers.ValidationError("You shoud detrmine the reciever")
        
        if transaction_type == 'send' and reciever == wallet:
            raise serializers.ValidationError("You can not send money to yourself")

        if transaction_type != 'income' and amount > wallet.total_balance:
            raise serializers.ValidationError("Not enough money")

        return data
    
    def create(self, validated_data):
        return models.Transaction.objects.create(**validated_data)
        


class CategorySerializer(serializers.ModelSerializer):
    wallet = user_serializer.WalletSerializer(read_only=True)
    class Meta():
        model = models.Category
        fields = "__all__"

    def validate(self, data):
        wallet = self.context['request'].user.wallet           
        name = data['name']


        if models.Category.objects.filter(wallet=wallet, name=name).exists():
            raise serializers.ValidationError("Category already exists in this wallet")

        return data


class BudgetSerializer(serializers.ModelSerializer):
    class Meta():
        model = models.Budget
        fields = "__all__"
        extra_kwargs = {
            "wallet": {"read_only": True}
        }


    def validate(self, data):
        user = self.context['request'].user
        wallet = user.wallet

        category = data['category']

        if category.wallet != wallet:
            raise serializers.ValidationError("Invalid category for this wallet")

        return data
    
    def create(self, validated_data):
        validated_data.pop('wallet', None)  
        user = self.context['request'].user
        wallet = user.wallet


        return models.Budget.objects.create(
            wallet=wallet,
            **validated_data
        )


