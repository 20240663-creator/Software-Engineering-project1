// budget.js - إدارة الميزانيات

let currentBudgets = [];

// ============= العمليات الأساسية =============

// جلب جميع الميزانيات
async function fetchBudgets() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.BUDGETS}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            const budgets = await response.json();
            currentBudgets = Array.isArray(budgets) ? budgets : [];
            displayBudgets(currentBudgets);
            return currentBudgets;
        } else {
            console.error('Failed to fetch budgets:', response.status);
            showToast('Failed to load budgets', 'error');
            return [];
        }
    } catch (error) {
        console.error('Error fetching budgets:', error);
        showToast('Network error. Please check your connection.', 'error');
        return [];
    }
}

// إنشاء ميزانية جديدة
async function createBudget(budgetData) {
    const submitBtn = document.querySelector('#budgetForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
    }
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.BUDGETS}`, {
            method: 'POST',
            body: JSON.stringify({
                category: budgetData.category,
                amount: parseFloat(budgetData.amount),
                start_date: budgetData.start_date,
                end_date: budgetData.end_date,
                spent: 0
            })
        });
        
        if (response.ok) {
            const newBudget = await response.json();
            showToast('Budget created successfully! 📊', 'success');
            await fetchBudgets();
            closeBudgetModal();
            return newBudget;
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to create budget', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error creating budget:', error);
        showToast('Network error', 'error');
        return null;
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Budget';
        }
    }
}

// تحديث ميزانية
async function updateBudget(id, budgetData) {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.BUDGET_DETAIL(id)}`, {
            method: 'PUT',
            body: JSON.stringify(budgetData)
        });
        
        if (response.ok) {
            const updatedBudget = await response.json();
            showToast('Budget updated successfully!', 'success');
            await fetchBudgets();
            return updatedBudget;
        } else {
            showToast('Failed to update budget', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error updating budget:', error);
        showToast('Network error', 'error');
        return null;
    }
}

// حذف ميزانية
async function deleteBudget(id) {
    if (!confirm('Are you sure you want to delete this budget? This action cannot be undone.')) return;
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.BUDGET_DETAIL(id)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Budget deleted successfully!', 'success');
            await fetchBudgets();
            return true;
        } else {
            showToast('Failed to delete budget', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error deleting budget:', error);
        showToast('Network error', 'error');
        return false;
    }
}

// ============= عرض الميزانيات =============

function displayBudgets(budgets) {
    const budgetsList = document.getElementById('budgetsList');
    if (!budgetsList) return;
    
    if (budgets.length === 0) {
        budgetsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💰</div>
                <h3>No Budgets Yet</h3>
                <p>Create your first budget to start tracking your spending!</p>
                <button class="btn btn-primary" onclick="openBudgetModal()" style="margin-top: 1rem;">+ Create Your First Budget</button>
            </div>
        `;
        return;
    }
    
    budgetsList.innerHTML = budgets.map(budget => createBudgetCardHTML(budget)).join('');
}

function createBudgetCardHTML(budget) {
    const spent = budget.spent || 0;
    const amount = budget.amount || 0;
    const percentage = amount > 0 ? (spent / amount) * 100 : 0;
    
    let percentageClass = '';
    let percentageStatus = '';
    if (percentage >= 100) {
        percentageClass = 'danger';
        percentageStatus = 'Exceeded!';
    } else if (percentage >= 90) {
        percentageClass = 'danger';
        percentageStatus = 'Critical';
    } else if (percentage >= 75) {
        percentageClass = 'warning';
        percentageStatus = 'Warning';
    } else {
        percentageClass = 'success';
        percentageStatus = 'On Track';
    }
    
    const startDate = budget.start_date ? new Date(budget.start_date).toLocaleDateString() : 'No start date';
    const endDate = budget.end_date ? new Date(budget.end_date).toLocaleDateString() : 'No end date';
    const categoryIcon = getCategoryIcon(budget.category);
    
    return `
        <div class="budget-card" data-id="${budget.id}">
            <div class="budget-header">
                <div class="budget-title">
                    ${categoryIcon} ${escapeHtml(budget.category)}
                </div>
                <span class="budget-percentage ${percentageClass}">${Math.round(percentage)}% - ${percentageStatus}</span>
            </div>
            <div class="budget-dates" style="display: flex; justify-content: space-between; color: var(--gray); font-size: 0.75rem; margin-bottom: 1rem;">
                <span>📅 ${startDate}</span>
                <span>→</span>
                <span>📅 ${endDate}</span>
            </div>
            <div class="progress-bar" style="margin: 1rem 0;">
                <div class="progress-fill ${percentageClass}" style="width: ${Math.min(percentage, 100)}%"></div>
            </div>
            <div class="budget-stats">
                <div>
                    <div class="budget-stat-label">Spent</div>
                    <div class="budget-stat-value">$${spent.toFixed(2)}</div>
                </div>
                <div>
                    <div class="budget-stat-label">Budget</div>
                    <div class="budget-stat-value">$${amount.toFixed(2)}</div>
                </div>
                <div>
                    <div class="budget-stat-label">Remaining</div>
                    <div class="budget-stat-value $${
                        (amount - spent) < 0 ? 'text-danger' : 'text-success'
                    }">$${Math.abs(amount - spent).toFixed(2)} ${(amount - spent) < 0 ? 'over' : ''}</div>
                </div>
            </div>
            <div class="budget-actions">
                <button class="btn btn-secondary btn-sm" onclick="editBudget(${budget.id})">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteBudget(${budget.id})">🗑️ Delete</button>
            </div>
        </div>
    `;
}

function getCategoryIcon(category) {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('food')) return '🍕';
    if (categoryLower.includes('transport')) return '⛽';
    if (categoryLower.includes('entertain')) return '🎬';
    if (categoryLower.includes('shopping')) return '🛍️';
    if (categoryLower.includes('utility')) return '💡';
    if (categoryLower.includes('health')) return '🏥';
    if (categoryLower.includes('education')) return '🎓';
    if (categoryLower.includes('home') || categoryLower.includes('rent')) return '🏠';
    return '📊';
}

// ============= دوال النماذج =============

function getBudgetFormData() {
    return {
        category: document.getElementById('budgetCategory')?.value || '',
        amount: parseFloat(document.getElementById('budgetAmount')?.value || 0),
        start_date: document.getElementById('budgetStartDate')?.value || null,
        end_date: document.getElementById('budgetEndDate')?.value || null
    };
}

function openBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) modal.classList.add('active');
}

function closeBudgetModal() {
    const modal = document.getElementById('budgetModal');
    if (modal) modal.classList.remove('active');
    const form = document.getElementById('budgetForm');
    if (form) form.reset();
}

async function editBudget(id) {
    const budget = currentBudgets.find(b => b.id === id);
    if (!budget) return;
    
    const newAmount = prompt('Enter new budget amount:', budget.amount);
    if (!newAmount || isNaN(newAmount)) return;
    
    await updateBudget(id, {
        ...budget,
        amount: parseFloat(newAmount)
    });
}

// تهيئة صفحة الميزانيات
async function initBudgetsPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    await fetchBudgets();
    
    // معالج نموذج الإضافة
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = getBudgetFormData();
            if (data.category && data.amount > 0 && data.start_date && data.end_date) {
                await createBudget(data);
            } else {
                showToast('Please fill all required fields', 'warning');
            }
        });
    }
}

// تشغيل التهيئة
if (window.location.pathname.includes('budget.html')) {
    document.addEventListener('DOMContentLoaded', initBudgetsPage);
}