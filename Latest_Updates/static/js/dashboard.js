// dashboard.js - الصفحة الرئيسية والإحصائيات

// تحميل بيانات المستخدم والإحصائيات
async function loadDashboardData() {
    // التحقق من المصادقة
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    // جلب بيانات المستخدم
    const userData = await fetchUserProfile();
    if (userData) {
        // تحديث اسم المستخدم في الصفحة
        const welcomeElement = document.querySelector('#user-home-welcome h1');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome back, ${userData.username || 'User'}! 👋`;
        }
    }
    
    // تحميل الإحصائيات (هذه بيانات تجريبية، استبدلها بـ API حقيقي)
    loadStatistics();
}

// تحميل الإحصائيات
async function loadStatistics() {
    // هنا يمكنك جلب البيانات من الـ API
    // مثال: /api/statistics/
    
    // بيانات تجريبية
    const stats = {
        total_balance: 7000,
        total_income: 4500,
        total_expense: 1500,
        savings_goal: 5000
    };
    
    // تحديث الواجهة
    const cards = document.querySelectorAll('.card-value');
    if (cards.length >= 4) {
        cards[0].textContent = `$${stats.total_balance}`;
        cards[1].textContent = `$${stats.total_income}`;
        cards[2].textContent = `$${stats.total_expense}`;
        cards[3].textContent = `$${stats.savings_goal}`;
    }
}

// تحميل أحدث المعاملات
async function loadRecentTransactions() {
    try {
        // استبدل هذا ب endpoint حقيقي للمعاملات
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}/api/transactions/recent/`);
        
        if (response.ok) {
            const transactions = await response.json();
            updateTransactionList(transactions);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        // عرض معاملات تجريبية
        const demoTransactions = [
            { date: 'May 1, 2026', description: 'Grocery shopping', amount: -50, type: 'expense' },
            { date: 'Apr 30, 2026', description: 'Salary deposit', amount: 4500, type: 'income' }
        ];
        updateTransactionList(demoTransactions);
    }
}

// تحديث قائمة المعاملات
function updateTransactionList(transactions) {
    const transactionList = document.querySelector('.transaction-list');
    if (!transactionList) return;
    
    if (!transactions || transactions.length === 0) {
        transactionList.innerHTML = '<li>No transactions yet.</li>';
        return;
    }
    
    transactionList.innerHTML = transactions.map(t => `
        <li class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-date">${t.date}</div>
                <div class="transaction-desc">${t.description}</div>
            </div>
            <div class="transaction-amount ${t.amount < 0 ? 'negative' : 'positive'}">
                ${t.amount < 0 ? '-' : '+'}$${Math.abs(t.amount)}
            </div>
        </li>
    `).join('');
}

// تحديث الإحصائيات في الوقت الفعلي
async function updateRealTimeStats() {
    setInterval(async () => {
        await loadStatistics();
    }, 30000); // كل 30 ثانية
}

// تهيئة صفحة الرئيسية
async function initDashboard() {
    await loadDashboardData();
    await loadRecentTransactions();
    updateRealTimeStats();
}

// تشغيل التهيئة عندما تكون الصفحة جاهزة
if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
    document.addEventListener('DOMContentLoaded', initDashboard);
}

// إضافة أنماط إضافية للمعاملات
const dashboardStyles = document.createElement('style');
dashboardStyles.textContent = `
    .transaction-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid #eee;
    }
    
    .transaction-info {
        flex: 1;
    }
    
    .transaction-date {
        font-size: 12px;
        color: #666;
    }
    
    .transaction-desc {
        font-weight: 500;
    }
    
    .transaction-amount {
        font-weight: bold;
        font-size: 16px;
    }
    
    .transaction-amount.positive {
        color: #4CAF50;
    }
    
    .transaction-amount.negative {
        color: #f44336;
    }
`;
document.head.appendChild(dashboardStyles);