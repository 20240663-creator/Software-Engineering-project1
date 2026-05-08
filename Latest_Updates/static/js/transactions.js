// transactions.js - إدارة المعاملات المالية

let currentTransactions = [];

// ============= العمليات الأساسية =============

// جلب جميع المعاملات
async function fetchTransactions() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.TRANSACTIONS}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            const transactions = await response.json();
            currentTransactions = Array.isArray(transactions) ? transactions : [];
            displayTransactions(currentTransactions);
            return currentTransactions;
        } else {
            console.error('Failed to fetch transactions:', response.status);
            return [];
        }
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return [];
    }
}

// إنشاء معاملة جديدة
async function createTransaction(transactionData) {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.TRANSACTIONS}`, {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        
        if (response.ok) {
            const newTransaction = await response.json();
            showToast('Transaction recorded successfully!', 'success');
            await fetchTransactions();
            await updateWalletBalance();
            return newTransaction;
        } else {
            showToast('Failed to create transaction', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        showToast('Network error', 'error');
        return null;
    }
}

// حذف معاملة
async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.TRANSACTION_DETAIL(id)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Transaction deleted successfully!', 'success');
            await fetchTransactions();
            await updateWalletBalance();
            return true;
        } else {
            showToast('Failed to delete transaction', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showToast('Network error', 'error');
        return false;
    }
}

// إرسال أموال
async function sendMoney(data) {
    const submitBtn = document.querySelector('#sendMoneyForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
    }
    
    const transactionData = {
        amount: -Math.abs(data.amount),
        type: 'expense',
        description: data.description || `Payment to ${data.recipient}`,
        category: 'Transfer',
        status: 'completed',
        recipient: data.recipient,
        recipient_email: data.recipient_email
    };
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.TRANSACTIONS}`, {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        
        if (response.ok) {
            showToast(`$${data.amount} sent to ${data.recipient}! 💸`, 'success');
            await fetchTransactions();
            await updateWalletBalance();
            resetSendForm();
            showSuccessModal(data);
            return true;
        } else {
            const error = await response.json();
            showToast(error.message || 'Transfer failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error sending money:', error);
        showToast('Network error', 'error');
        return false;
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Money';
        }
    }
}

// إيداع أموال
async function depositMoney(data) {
    const submitBtn = document.querySelector('#depositForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Processing...';
    }
    
    const transactionData = {
        amount: Math.abs(data.amount),
        type: 'income',
        description: data.description || 'Deposit',
        category: 'Deposit',
        status: 'completed',
        payment_method: data.payment_method
    };
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.TRANSACTIONS}`, {
            method: 'POST',
            body: JSON.stringify(transactionData)
        });
        
        if (response.ok) {
            showToast(`$${data.amount} deposited successfully! 🏦`, 'success');
            await fetchTransactions();
            await updateWalletBalance();
            resetDepositForm();
            return true;
        } else {
            const error = await response.json();
            showToast(error.message || 'Deposit failed', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error depositing money:', error);
        showToast('Network error', 'error');
        return false;
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Deposit Money';
        }
    }
}

// ============= عرض المعاملات =============

function displayTransactions(transactions) {
    const tableBody = document.querySelector('.transaction-table tbody');
    if (!tableBody) return;
    
    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">No transactions found yet. Start by making a transaction.</td>
            </tr>
        `;
        return;
    }
    
    const sortedTransactions = [...transactions].sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    tableBody.innerHTML = sortedTransactions.map(t => createTransactionRow(t)).join('');
}

function createTransactionRow(transaction) {
    const amount = transaction.amount || 0;
    const isExpense = amount < 0;
    const absAmount = Math.abs(amount);
    const date = new Date(transaction.date).toLocaleDateString();
    const status = transaction.status || 'completed';
    
    let statusClass = '';
    if (status === 'completed') statusClass = 'badge-success';
    else if (status === 'pending') statusClass = 'badge-warning';
    else statusClass = 'badge-danger';
    
    return `
        <tr data-id="${transaction.id}">
            <td>${date}</td>
            <td><span class="badge ${statusClass}">${status}</span></td>
            <td>${escapeHtml(transaction.type || 'transaction')}</td>
            <td class="${isExpense ? 'amount-negative' : 'amount-positive'}">
                ${isExpense ? '-' : '+'}$${absAmount.toFixed(2)}
            </td>
            <td>${transaction.description || '-'}</td>
        </tr>
    `;
}

// ============= دوال مساعدة =============

function resetSendForm() {
    const form = document.getElementById('sendMoneyForm');
    if (form) form.reset();
}

function resetDepositForm() {
    const form = document.getElementById('depositForm');
    if (form) form.reset();
}

function showSuccessModal(data) {
    const modal = document.getElementById('successModal');
    const details = document.getElementById('successDetails');
    
    if (modal && details) {
        details.innerHTML = `
            <p><strong>Amount:</strong> $${data.amount.toFixed(2)}</p>
            <p><strong>Recipient:</strong> ${escapeHtml(data.recipient)}</p>
            <p><strong>Transaction ID:</strong> #${Math.floor(Math.random() * 1000000)}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        `;
        modal.classList.add('active');
        
        // Auto close after 3 seconds
        setTimeout(() => {
            closeModal('successModal');
        }, 3000);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

async function updateWalletBalance() {
    const wallet = await fetchUserWallet();
    if (wallet) {
        const balanceElements = document.querySelectorAll('.stats-value');
        balanceElements.forEach(el => {
            if (el.closest('.stat-card') || el.id === 'availableBalance') {
                el.textContent = `$${(wallet.balance || 0).toFixed(2)}`;
            }
        });
    }
}

// ============= تحميل التحويلات الأخيرة =============

async function loadRecentTransfers() {
    const transfersList = document.querySelector('.transfers-list');
    if (!transfersList) return;
    
    try {
        const transactions = await fetchTransactions();
        const recentSends = transactions
            .filter(t => t.amount < 0)
            .slice(0, 5);
        
        if (recentSends.length === 0) {
            transfersList.innerHTML = '<div class="empty-state">No recent transfers</div>';
            return;
        }
        
        transfersList.innerHTML = recentSends.map(t => `
            <div class="transfer-item">
                <div class="transfer-info">
                    <div class="transfer-recipient">${escapeHtml(t.recipient || 'Unknown')}</div>
                    <div class="transfer-date">${new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div class="transfer-amount">- $${Math.abs(t.amount).toFixed(2)}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading transfers:', error);
    }
}

// ============= معالجات النماذج =============

if (document.getElementById('sendMoneyForm')) {
    document.getElementById('sendMoneyForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            recipient: document.getElementById('recipientName')?.value,
            recipient_email: document.getElementById('recipientEmail')?.value,
            amount: parseFloat(document.getElementById('amount')?.value || 0),
            purpose: document.getElementById('purpose')?.value,
            description: document.getElementById('description')?.value
        };
        
        if (data.amount > 0 && data.recipient && data.recipient_email) {
            await sendMoney(data);
        } else {
            showToast('Please fill all required fields', 'warning');
        }
    });
}

if (document.getElementById('depositForm')) {
    document.getElementById('depositForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            amount: parseFloat(document.getElementById('amount')?.value || 0),
            payment_method: document.getElementById('paymentMethod')?.value,
            account_number: document.getElementById('accountNumber')?.value,
            description: document.getElementById('description')?.value
        };
        
        if (data.amount > 0 && data.payment_method && data.account_number) {
            await depositMoney(data);
        } else {
            showToast('Please fill all required fields', 'warning');
        }
    });
}

// تهيئة الصفحات
if (window.location.pathname.includes('transaction.html') || window.location.pathname.includes('transactions.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        await fetchTransactions();
    });
}

if (window.location.pathname.includes('send_money.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        await updateWalletBalance();
        await loadRecentTransfers();
    });
}

if (window.location.pathname.includes('deposit.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        await updateWalletBalance();
    });
}

// Helper function
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions for global use
window.closeModal = closeModal;
window.deleteTransaction = deleteTransaction;



// *****************


// Display recent transfers
        async function displayRecentTransfers() {
            const container = document.getElementById('recentTransfersList');
            try {
                const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.TRANSACTIONS}`, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    const transactions = await response.json();
                    const sends = transactions.filter(t => t.amount < 0).slice(0, 5);
                    
                    if (sends.length === 0) {
                        container.innerHTML = '<div class="empty-state">No recent transfers</div>';
                        return;
                    }
                    
                    container.innerHTML = sends.map(t => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-bottom: 1px solid #e5e7eb;">
                            <div>
                                <div style="font-weight: 600;">${t.recipient || 'Unknown'}</div>
                                <div style="font-size: 0.75rem; color: var(--gray);">${new Date(t.date).toLocaleDateString()}</div>
                            </div>
                            <div style="color: var(--danger); font-weight: 600;">-$${Math.abs(t.amount).toFixed(2)}</div>
                        </div>
                    `).join('');
                }
            } catch (error) {
                console.error('Error loading transfers:', error);
                container.innerHTML = '<div class="empty-state">Failed to load transfers</div>';
            }
        }
        
        document.addEventListener('DOMContentLoaded', async () => {
            if (!isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }
            await updateWalletBalance();
            await displayRecentTransfers();
        });
        
        window.closeModal = closeModal;



        // **************

        let allTransactions = [];
        
        // Calculate and update stats
        function updateTransactionStats(transactions) {
            const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const netBalance = totalIncome - totalExpenses;
            
            document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
            document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
            document.getElementById('netBalance').textContent = `$${netBalance.toFixed(2)}`;
            document.getElementById('transactionCount').textContent = transactions.length;
        }
        
        // Filter functionality
        function setupFilters() {
            const filterBtns = document.querySelectorAll('.filter-btn');
            const searchInput = document.getElementById('searchInput');
            
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    applyFilters();
                });
            });
            
            searchInput.addEventListener('input', () => applyFilters());
        }
        
        function applyFilters() {
            const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            
            let filtered = [...allTransactions];
            
            // Apply type filter
            if (activeFilter === 'income') {
                filtered = filtered.filter(t => t.amount > 0);
            } else if (activeFilter === 'expense') {
                filtered = filtered.filter(t => t.amount < 0);
            } else if (activeFilter === 'this-month') {
                const now = new Date();
                const thisMonth = now.getMonth();
                const thisYear = now.getFullYear();
                filtered = filtered.filter(t => {
                    const date = new Date(t.date);
                    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
                });
            }
            
            // Apply search filter
            if (searchTerm) {
                filtered = filtered.filter(t => 
                    (t.description || '').toLowerCase().includes(searchTerm) ||
                    (t.category || '').toLowerCase().includes(searchTerm)
                );
            }
            
            displayTransactions(filtered);
            updateTransactionStats(filtered);
        }
        
        // Override displayTransactions to store all transactions
        const originalDisplayTransactions = window.displayTransactions;
        window.displayTransactions = function(transactions) {
            allTransactions = transactions;
            if (originalDisplayTransactions) {
                originalDisplayTransactions(transactions);
            } else {
                const tableBody = document.getElementById('transactionsTableBody');
                if (!tableBody) return;
                
                if (!transactions || transactions.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="6" class="empty-state">No transactions found.</td></tr>';
                    return;
                }
                
                const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
                tableBody.innerHTML = sorted.map(t => {
                    const amount = t.amount || 0;
                    const isExpense = amount < 0;
                    return `
                        <tr>
                            <td>${new Date(t.date).toLocaleDateString()}</td>
                            <td><span class="badge badge-success">completed</span></td>
                            <td><span class="transaction-category">${t.category || 'Uncategorized'}</span></td>
                            <td class="${isExpense ? 'amount-negative' : 'amount-positive'}">
                                ${isExpense ? '-' : '+'}$${Math.abs(amount).toFixed(2)}
                            </td>
                            <td>${t.description || '-'}</td>
                            <td>
                                <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${t.id})">🗑️</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            }
            updateTransactionStats(transactions);
        };
        
        // Modal functions
        function openTransactionModal() {
            document.getElementById('transactionModal').classList.add('active');
            document.getElementById('transactionDate').valueAsDate = new Date();
        }
        
        function closeTransactionModal() {
            document.getElementById('transactionModal').classList.remove('active');
            document.getElementById('transactionForm').reset();
        }
        
        // Handle form submission
        document.getElementById('transactionForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const type = document.getElementById('transactionType').value;
            let amount = parseFloat(document.getElementById('transactionAmount').value);
            
            if (type === 'expense') {
                amount = -Math.abs(amount);
            } else {
                amount = Math.abs(amount);
            }
            
            const transactionData = {
                amount: amount,
                type: type,
                category: document.getElementById('transactionCategory').value,
                date: document.getElementById('transactionDate').value,
                description: document.getElementById('transactionDescription').value,
                status: 'completed'
            };
            
            await createTransaction(transactionData);
            closeTransactionModal();
            applyFilters();
        });
        
        // Initialize page
        document.addEventListener('DOMContentLoaded', async () => {
            if (!isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }
            
            await fetchTransactions();
            setupFilters();
            applyFilters();
        });
        
        window.openTransactionModal = openTransactionModal;
        window.closeTransactionModal = closeTransactionModal;










