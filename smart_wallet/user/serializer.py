from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserSerializer



class UserCreateSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        fields = ['id','email','password','username','first_name','last_name']