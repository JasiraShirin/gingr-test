from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAssigneeOrCreatorOrReadOnly(BasePermission):
    """Anyone authenticated can read; only the assignee or creator can modify."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.method == "DELETE":
            return obj.created_by == request.user
        return obj.assigned_to == request.user or obj.created_by == request.user
