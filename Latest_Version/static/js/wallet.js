// wallet.js - Core wallet functionality and financial operations

// ============= Wallet Core Functions =============

// Load wallet balance and basic financial data
async function loadWalletData() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Get user data first
        const userData = await fetchUserProfile();
        if (userData) {
            updateWelcomeMessage(userData.username);
        }

        // Load wallet statistics
        await Promise.all([
            loadWalletBalance(),
            loadRecentTransactions(),
            loadActiveGoals()
        ]);

    } catch (error) {
        console.error('Error loading wallet data:', error);
        showToast('Failed to load wallet data', 'error');
    }
}

// Load wallet balance
async function loadWalletBalance() {
    try {
        // This would be your actual API endpoint
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/wallet/balance/`);
        
        if (response.ok) {
            const data = await response.json();
            updateBalanceDisplay(data);
        } else {
            // Use demo data for now
            const demoData = {
                total_balance: 7000,
                monthly_income: 4500,
                monthly_expense: 1500,
                savings_progress: 65
            };
            updateBalanceDisplay(demoData);
        }
    } catch (error) {
        console.error('Error loading balance:', error);
        // Fallback to demo data
        const demoData = {
            total_balance: 7000,
            monthly_income: 4500,
            monthly_expense: 1500,
            savings_progress: 65
        };
        updateBalanceDisplay(demoData);
    }
}

// Update balance display on dashboard
function updateBalanceDisplay(data) {
    const elements = {
        totalBalance: document.getElementById('totalBalance'),
        totalIncome: document.getElementById('totalIncome'),
        totalExpense: document.getElementById('totalExpense'),
        savingsProgress: document.getElementById('savingsProgress')
    };

    if (elements.totalBalance) {
        elements.totalBalance.textContent = `$${data.total_balance?.toFixed(2) || '0.00'}`;
    }
    if (elements.totalIncome) {
        elements.totalIncome.textContent = `$${data.monthly_income?.toFixed(2) || '0.00'}`;
    }
    if (elements.totalExpense) {
        elements.totalExpense.textContent = `$${data.monthly_expense?.toFixed(2) || '0.00'}`;
    }
    if (elements.savingsProgress) {
        elements.savingsProgress.textContent = `${data.savings_progress || 0}%`;
    }
}

// Update welcome message
function updateWelcomeMessage(username) {
    const welcomeElement = document.getElementById('welcomeMessage');
    if (welcomeElement) {
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';
        
        welcomeElement.textContent = `${greeting}, ${username || 'User'}! 👋`;
    }
}

// Load recent transactions
async function loadRecentTransactions() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/transactions/recent/`);
        
        if (response.ok) {
            const transactions = await response.json();
            updateTransactionDisplay(transactions);
        } else {
            // Demo transactions
            const demoTransactions = [
                {
                    id: 1,
                    description: 'Grocery Store',
                    amount: -85.50,
                    date: '2026-05-05',
                    category: 'Food'
                },
                {
                    id: 2,
                    description: 'Salary Deposit',
                    amount: 3500.00,
                    date: '2026-05-01',
                    category: 'Income'
                },
                {
                    id: 3,
                    description: 'Electric Bill',
                    amount: -120.00,
                    date: '2026-05-03',
                    category: 'Utilities'
                }
            ];
            updateTransactionDisplay(demoTransactions);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
    }
}

// Update transaction display
function updateTransactionDisplay(transactions) {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    if (!transactions || transactions.length === 0) {
        container.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">💰</div>
                <div class="activity-details">
                    <div class="activity-title">No transactions yet</div>
                    <div class="activity-time">Start by adding one</div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = transactions.slice(0, 5).map(transaction => `
        <div class="activity-item">
            <div class="activity-icon">${getCategoryIcon(transaction.category)}</div>
            <div class="activity-details">
                <div class="activity-title">${transaction.description}</div>
                <div class="activity-time">${formatDate(transaction.date)}</div>
            </div>
            <div class="activity-amount ${transaction.amount >= 0 ? 'amount-positive' : 'amount-negative'}">
                ${transaction.amount >= 0 ? '+' : '-'}$${Math.abs(transaction.amount).toFixed(2)}
            </div>
        </div>
    `).join('');
}

// Load active savings goals
async function loadActiveGoals() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/goals/active/`);
        
        if (response.ok) {
            const goals = await response.json();
            updateGoalsDisplay(goals);
        } else {
            // Demo goals
            const demoGoals = [
                {
                    id: 1,
                    title: 'Emergency Fund',
                    target: 10000,
                    current: 6500,
                    deadline: '2026-12-31'
                },
                {
                    id: 2,
                    title: 'Vacation',
                    target: 3000,
                    current: 1200,
                    deadline: '2026-08-15'
                }
            ];
            updateGoalsDisplay(demoGoals);
        }
    } catch (error) {
        console.error('Error loading goals:', error);
    }
}

// Update goals display
function updateGoalsDisplay(goals) {
    const container = document.getElementById('activeGoals');
    if (!container) return;

    if (!goals || goals.length === 0) {
        container.innerHTML = `
            <div class="activity-item">
                <div class="activity-icon">🎯</div>
                <div class="activity-details">
                    <div class="activity-title">No active goals</div>
                    <div class="activity-time">Create a goal to start saving</div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = goals.slice(0, 3).map(goal => {
        const progress = (goal.current / goal.target) * 100;
        return `
            <div class="activity-item">
                <div class="activity-icon">🎯</div>
                <div class="activity-details">
                    <div class="activity-title">${goal.title}</div>
                    <div class="activity-time">${progress.toFixed(1)}% complete</div>
                </div>
                <div class="activity-amount amount-positive">
                    $${goal.current.toFixed(2)}
                </div>
            </div>
        `;
    }).join('');
}

// ============= Utility Functions =============

// Get category icon
function getCategoryIcon(category) {
    const icons = {
        'Food': '🍔',
        'Transport': '🚗',
        'Shopping': '🛍️',
        'Entertainment': '🎮',
        'Utilities': '💡',
        'Healthcare': '🏥',
        'Income': '💰',
        'Transfer': '💸',
        'Savings': '🏦'
    };
    return icons[category] || '💰';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
}

// Initialize wallet when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWalletData);
} else {
    loadWalletData();
}

// Auto-refresh data every 30 seconds
setInterval(() => {
    if (document.visibilityState === 'visible') {
        loadWalletBalance();
    }
}, 30000);
