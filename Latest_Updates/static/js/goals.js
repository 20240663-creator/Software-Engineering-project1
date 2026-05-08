// saving_goals.js - إدارة أهداف التوفير

let currentGoals = [];
let currentGoalIdForContribute = null;

// ============= العمليات الأساسية =============

// جلب جميع الأهداف
async function fetchSavingGoals() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.SAVING_GOALS}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            const goals = await response.json();
            currentGoals = Array.isArray(goals) ? goals : [];
            displaySavingGoals(currentGoals);
            updateGoalsStatistics(currentGoals);
            return currentGoals;
        } else {
            console.error('Failed to fetch goals:', response.status);
            showToast('Failed to load saving goals', 'error');
            return [];
        }
    } catch (error) {
        console.error('Error fetching saving goals:', error);
        showToast('Network error. Please check your connection.', 'error');
        return [];
    }
}

// إنشاء هدف جديد
async function createSavingGoal(goalData) {
    const submitBtn = document.querySelector('#goalForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
    }
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.SAVING_GOALS}`, {
            method: 'POST',
            body: JSON.stringify({
                name: goalData.name,
                target_amount: parseFloat(goalData.target_amount),
                target_date: goalData.target_date,
                current_amount: 0
            })
        });
        
        if (response.ok) {
            const newGoal = await response.json();
            showToast('Saving goal created successfully! 🎯', 'success');
            await fetchSavingGoals();
            closeGoalModal();
            return newGoal;
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to create goal', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error creating goal:', error);
        showToast('Network error', 'error');
        return null;
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Goal';
        }
    }
}

// تحديث هدف
async function updateSavingGoal(id, goalData) {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.SAVING_GOAL_DETAIL(id)}`, {
            method: 'PUT',
            body: JSON.stringify(goalData)
        });
        
        if (response.ok) {
            const updatedGoal = await response.json();
            showToast('Goal updated successfully!', 'success');
            await fetchSavingGoals();
            return updatedGoal;
        } else {
            showToast('Failed to update goal', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error updating goal:', error);
        showToast('Network error', 'error');
        return null;
    }
}

// حذف هدف
async function deleteSavingGoal(id) {
    if (!confirm('Are you sure you want to delete this saving goal? This action cannot be undone.')) return;
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.SAVING_GOAL_DETAIL(id)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Goal deleted successfully!', 'success');
            await fetchSavingGoals();
            return true;
        } else {
            showToast('Failed to delete goal', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error deleting goal:', error);
        showToast('Network error', 'error');
        return false;
    }
}

// المساهمة في هدف
async function contributeToGoal(goalId, amount) {
    if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'warning');
        return false;
    }
    
    try {
        // جلب الهدف الحالي
        const goal = currentGoals.find(g => g.id === goalId);
        if (!goal) return false;
        
        const newAmount = (goal.current_amount || 0) + amount;
        
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.SAVING_GOAL_DETAIL(goalId)}`, {
            method: 'PATCH',
            body: JSON.stringify({
                current_amount: newAmount
            })
        });
        
        if (response.ok) {
            showToast(`Added $${amount.toFixed(2)} to your goal! 🎉`, 'success');
            await fetchSavingGoals();
            return true;
        } else {
            showToast('Failed to add contribution', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error contributing:', error);
        showToast('Network error', 'error');
        return false;
    }
}

// ============= عرض الأهداف =============

function displaySavingGoals(goals) {
    const activeGoals = goals.filter(g => (g.current_amount || 0) < (g.target_amount || 0));
    const completedGoals = goals.filter(g => (g.current_amount || 0) >= (g.target_amount || 0));
    
    const goalsList = document.getElementById('goalsList');
    if (!goalsList) return;
    
    if (goals.length === 0) {
        goalsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🎯</div>
                <h3>No Saving Goals Yet</h3>
                <p>Create your first saving goal to start tracking your progress!</p>
                <button class="btn btn-primary" onclick="openGoalModal()" style="margin-top: 1rem;">+ Create Your First Goal</button>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    if (activeGoals.length > 0) {
        html += `<h2 style="margin: 2rem 0 1rem 0;">📌 Active Goals</h2>`;
        activeGoals.forEach(goal => {
            html += createGoalCardHTML(goal);
        });
    }
    
    if (completedGoals.length > 0) {
        html += `<h2 style="margin: 2rem 0 1rem 0;">✅ Completed Goals</h2>`;
        completedGoals.forEach(goal => {
            html += createGoalCardHTML(goal);
        });
    }
    
    goalsList.innerHTML = html;
}

function createGoalCardHTML(goal) {
    const current = goal.current_amount || 0;
    const target = goal.target_amount || 0;
    const percentage = target > 0 ? (current / target) * 100 : 0;
    const isCompleted = percentage >= 100;
    const icon = getGoalIcon(goal.name);
    const targetDate = new Date(goal.target_date).toLocaleDateString() || 'No deadline';
    
    return `
        <div class="goal-card" data-id="${goal.id}">
            <div class="goal-header">
                <div>
                    <div class="goal-title">${icon} ${escapeHtml(goal.name)}</div>
                </div>
                <span class="goal-status ${isCompleted ? 'completed' : 'active'}">
                    ${isCompleted ? '✓ Completed' : 'In Progress'}
                </span>
            </div>
            <div class="goal-progress">
                <div class="progress-info" style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span class="progress-text">Progress</span>
                    <span class="progress-percentage">${Math.round(percentage)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
            </div>
            <div class="goal-stats">
                <div>
                    <div class="budget-stat-label">Saved</div>
                    <div class="budget-stat-value">$${current.toFixed(2)}</div>
                </div>
                <div>
                    <div class="budget-stat-label">Target</div>
                    <div class="budget-stat-value">$${target.toFixed(2)}</div>
                </div>
                <div>
                    <div class="budget-stat-label">Remaining</div>
                    <div class="budget-stat-value">$${(target - current).toFixed(2)}</div>
                </div>
                <div>
                    <div class="budget-stat-label">Deadline</div>
                    <div class="budget-stat-value">${targetDate}</div>
                </div>
            </div>
            <div class="goal-actions">
                ${!isCompleted ? `<button class="btn btn-success btn-sm" onclick="openContributeModal(${goal.id})">💰 Contribute</button>` : ''}
                <button class="btn btn-secondary btn-sm" onclick="editGoal(${goal.id})">✏️ Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteSavingGoal(${goal.id})">🗑️ Delete</button>
            </div>
        </div>
    `;
}

function getGoalIcon(name) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('vacation')) return '🏖️';
    if (nameLower.includes('house') || nameLower.includes('home')) return '🏠';
    if (nameLower.includes('car')) return '🚗';
    if (nameLower.includes('emergency')) return '🚨';
    if (nameLower.includes('education')) return '🎓';
    if (nameLower.includes('retirement')) return '👴';
    if (nameLower.includes('wedding')) return '💍';
    return '🎯';
}

// تحديث الإحصائيات
function updateGoalsStatistics(goals) {
    const totalSaved = goals.reduce((sum, g) => sum + (g.current_amount || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + (g.target_amount || 0), 0);
    const completedCount = goals.filter(g => (g.current_amount || 0) >= (g.target_amount || 0)).length;
    const activeCount = goals.filter(g => (g.current_amount || 0) < (g.target_amount || 0)).length;
    
    const totalSavedEl = document.getElementById('totalSaved');
    const totalTargetEl = document.getElementById('totalTarget');
    const completedCountEl = document.getElementById('completedCount');
    const activeCountEl = document.getElementById('activeCount');
    
    if (totalSavedEl) totalSavedEl.textContent = `$${totalSaved.toFixed(2)}`;
    if (totalTargetEl) totalTargetEl.textContent = `$${totalTarget.toFixed(2)}`;
    if (completedCountEl) completedCountEl.textContent = completedCount;
    if (activeCountEl) activeCountEl.textContent = activeCount;
}

// ============= دوال النماذج والحوارات =============

function getGoalFormData() {
    return {
        name: document.getElementById('goalName')?.value || '',
        target_amount: parseFloat(document.getElementById('goalTarget')?.value || 0),
        target_date: document.getElementById('goalDate')?.value || null
    };
}

function openGoalModal() {
    const modal = document.getElementById('goalModal');
    if (modal) modal.classList.add('active');
}

function closeGoalModal() {
    const modal = document.getElementById('goalModal');
    if (modal) modal.classList.remove('active');
    const form = document.getElementById('goalForm');
    if (form) form.reset();
}

function openContributeModal(goalId) {
    currentGoalIdForContribute = goalId;
    const modal = document.getElementById('contributeModal');
    if (modal) modal.classList.add('active');
}

function closeContributeModal() {
    const modal = document.getElementById('contributeModal');
    if (modal) modal.classList.remove('active');
    const amountInput = document.getElementById('contributeAmount');
    if (amountInput) amountInput.value = '';
    currentGoalIdForContribute = null;
}

async function submitContribution() {
    const amount = parseFloat(document.getElementById('contributeAmount')?.value || 0);
    if (amount > 0 && currentGoalIdForContribute) {
        await contributeToGoal(currentGoalIdForContribute, amount);
        closeContributeModal();
    } else {
        showToast('Please enter a valid amount', 'warning');
    }
}

async function editGoal(id) {
    const goal = currentGoals.find(g => g.id === id);
    if (!goal) return;
    
    const newName = prompt('Enter new goal name:', goal.name);
    if (!newName) return;
    
    const newTarget = prompt('Enter new target amount:', goal.target_amount);
    if (!newTarget || isNaN(newTarget)) return;
    
    await updateSavingGoal(id, {
        name: newName,
        target_amount: parseFloat(newTarget)
    });
}

// تهيئة صفحة الأهداف
async function initSavingGoalsPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    await fetchSavingGoals();
    
    // معالج نموذج الإضافة
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = getGoalFormData();
            if (data.name && data.target_amount > 0 && data.target_date) {
                await createSavingGoal(data);
            } else {
                showToast('Please fill all required fields', 'warning');
            }
        });
    }
}

// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// تشغيل التهيئة
if (window.location.pathname.includes('saving_goals.html')) {
    document.addEventListener('DOMContentLoaded', initSavingGoalsPage);
}