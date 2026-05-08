let allNotifications = [];
        
        // Sample notifications data
        const sampleNotifications = [
            {
                id: 1,
                title: "Budget Alert",
                message: "You've reached 85% of your Food budget this month",
                time: "2 hours ago",
                type: "budget",
                read: false,
                icon: "📊"
            },
            {
                id: 2,
                title: "Goal Progress",
                message: "Congratulations! You're 50% closer to your Vacation Fund goal",
                time: "1 day ago",
                type: "goal",
                read: false,
                icon: "🎯"
            },
            {
                id: 3,
                title: "Transaction Complete",
                message: "Your deposit of $500.00 has been processed successfully",
                time: "2 days ago",
                type: "transaction",
                read: true,
                icon: "💰"
            },
            {
                id: 4,
                title: "Goal Completed!",
                message: "Amazing! You've achieved your Emergency Fund goal of $3,000",
                time: "3 days ago",
                type: "goal",
                read: false,
                icon: "🏆"
            },
            {
                id: 5,
                title: "Budget Warning",
                message: "Entertainment budget is at 90%. Consider reducing spending",
                time: "5 days ago",
                type: "budget",
                read: true,
                icon: "⚠️"
            },
            {
                id: 6,
                title: "Welcome to Smart Wallet!",
                message: "Thank you for joining. Start managing your finances today!",
                time: "1 week ago",
                type: "general",
                read: true,
                icon: "👋"
            }
        ];
        
        function loadNotifications() {
            // Load from localStorage or use sample data
            const saved = localStorage.getItem('smart_wallet_notifications');
            if (saved) {
                allNotifications = JSON.parse(saved);
            } else {
                allNotifications = sampleNotifications;
                saveNotifications();
            }
            displayNotifications();
        }
        
        function saveNotifications() {
            localStorage.setItem('smart_wallet_notifications', JSON.stringify(allNotifications));
        }
        
        function displayNotifications() {
            const activeFilter = document.querySelector('.filter-tab.active').dataset.filter;
            let filtered = [...allNotifications];
            
            if (activeFilter === 'unread') {
                filtered = filtered.filter(n => !n.read);
            } else if (activeFilter !== 'all') {
                filtered = filtered.filter(n => n.type === activeFilter);
            }
            
            const container = document.getElementById('notificationsList');
            
            if (filtered.length === 0) {
                container.innerHTML = `
                    <div class="empty-notifications">
                        <div class="empty-notifications-icon">🔔</div>
                        <h3>No notifications</h3>
                        <p>You're all caught up!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = filtered.map(notification => `
                <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                    <div class="notification-icon">${notification.icon}</div>
                    <div class="notification-content">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${notification.time}</div>
                    </div>
                    <div class="notification-actions">
                        ${!notification.read ? `<button class="notification-btn" onclick="markAsRead(${notification.id})" title="Mark as read">📖</button>` : ''}
                        <button class="notification-btn" onclick="deleteNotification(${notification.id})" title="Delete">🗑️</button>
                    </div>
                </div>
            `).join('');
        }
        
        function markAsRead(id) {
            const notification = allNotifications.find(n => n.id === id);
            if (notification) {
                notification.read = true;
                saveNotifications();
                displayNotifications();
                showToast('Marked as read', 'success');
            }
        }
        
        function markAllAsRead() {
            allNotifications.forEach(n => n.read = true);
            saveNotifications();
            displayNotifications();
            showToast('All notifications marked as read', 'success');
        }
        
        function deleteNotification(id) {
            allNotifications = allNotifications.filter(n => n.id !== id);
            saveNotifications();
            displayNotifications();
            showToast('Notification deleted', 'success');
        }
        
        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                displayNotifications();
            });
        });
        
        // Add new notification (called from other pages)
        function addNotification(title, message, type = 'general') {
            const newNotification = {
                id: Date.now(),
                title: title,
                message: message,
                time: 'Just now',
                type: type,
                read: false,
                icon: getIconForType(type)
            };
            allNotifications.unshift(newNotification);
            saveNotifications();
            displayNotifications();
        }
        
        function getIconForType(type) {
            const icons = {
                budget: '📊',
                goal: '🎯',
                transaction: '💰',
                general: '📌'
            };
            return icons[type] || '🔔';
        }
        
        // Check for budget alerts (called from budget.js)
        window.checkBudgetAlerts = function(budgets) {
            budgets.forEach(budget => {
                const spent = budget.spent || 0;
                const amount = budget.amount || 0;
                const percentage = amount > 0 ? (spent / amount) * 100 : 0;
                
                if (percentage >= 85 && percentage < 100) {
                    addNotification(
                        'Budget Alert',
                        `You've reached ${Math.round(percentage)}% of your ${budget.category} budget`,
                        'budget'
                    );
                } else if (percentage >= 100) {
                    addNotification(
                        'Budget Exceeded',
                        `You've exceeded your ${budget.category} budget by $${(spent - amount).toFixed(2)}`,
                        'budget'
                    );
                }
            });
        };
        
        // Check for goal progress (called from saving_goals.js)
        window.checkGoalAlerts = function(goals) {
            goals.forEach(goal => {
                const current = goal.current_amount || 0;
                const target = goal.target_amount || 0;
                const percentage = target > 0 ? (current / target) * 100 : 0;
                
                if (percentage >= 100) {
                    addNotification(
                        'Goal Completed! 🎉',
                        `Congratulations! You've achieved your "${goal.name}" goal!`,
                        'goal'
                    );
                } else if (percentage >= 50 && percentage < 55) {
                    addNotification(
                        'Halfway There!',
                        `You're 50% closer to your "${goal.name}" goal. Keep going!`,
                        'goal'
                    );
                }
            });
        };
        
        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
            if (!isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }
            loadNotifications();
        });
        
        // Export functions for global use
        window.markAsRead = markAsRead;
        window.markAllAsRead = markAllAsRead;
        window.deleteNotification = deleteNotification;
        window.addNotification = addNotification;