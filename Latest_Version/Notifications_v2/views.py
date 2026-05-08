from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from .models import Notification


@login_required
def view_notifications(request):
    """Display all notifications for the current user, unread first."""
    notifications = Notification.objects.filter(user=request.user).order_by('is_read', '-timestamp')
    unread_count  = notifications.filter(is_read=False).count()

    return render(request, 'notifications.html', {
        'notifications': notifications,
        'unread_count':  unread_count,
    })


@login_required
def mark_read(request, notification_id):
    """Mark a single notification as read, then go back to notifications page."""
    notification = get_object_or_404(Notification, id=notification_id, user=request.user)
    notification.is_read = True
    notification.save()
    return redirect('notifications')


@login_required
def mark_all_read(request):
    """Mark all notifications as read."""
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return redirect('notifications')


@login_required
def delete_notification(request, notification_id):
    """Delete a single notification."""
    notification = get_object_or_404(Notification, id=notification_id, user=request.user)
    notification.delete()
    return redirect('notifications')


# ── Helper used by other apps to create notifications ────────────────────────

def create_notification(user, notif_type, message):
    """
    Call this from anywhere in the project to create a notification.

    Example:
        from notifications.views import create_notification
        create_notification(request.user, 'BUDGET_EXCEEDED', 'You exceeded your Food budget!')
    """
    Notification.objects.create(
        user    = user,
        type    = notif_type,
        message = message,
    )
