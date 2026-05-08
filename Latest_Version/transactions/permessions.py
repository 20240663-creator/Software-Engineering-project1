from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_staff)
    

class IsOwnerBase(permissions.BasePermission):
    def is_owner(self, request, obj):
        return obj.wallet.user == request.user

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return True
        return self.is_owner(request, obj)



class IsOwnerOfWallet(IsOwnerBase):
    pass

class IsMyCategory(IsOwnerBase):
    pass

class IsMyBudget(IsOwnerBase):
    pass

class IsMySaving(IsOwnerBase):
    pass