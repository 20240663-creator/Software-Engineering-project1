// categories.js - إدارة التصنيفات

let currentCategories = [];

// ============= العمليات الأساسية =============

// جلب جميع التصنيفات
async function fetchCategories() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.CATEGORIES}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            const categories = await response.json();
            currentCategories = Array.isArray(categories) ? categories : [];
            displayCategories(currentCategories);
            return currentCategories;
        } else {
            console.error('Failed to fetch categories:', response.status);
            showToast('Failed to load categories', 'error');
            return [];
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        showToast('Network error. Please check your connection.', 'error');
        return [];
    }
}

// إنشاء تصنيف جديد
async function createCategory(categoryData) {
    const submitBtn = document.querySelector('#categoryForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating...';
    }
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.CATEGORIES}`, {
            method: 'POST',
            body: JSON.stringify({
                name: categoryData.name,
                icon: categoryData.icon || null
            })
        });
        
        if (response.ok) {
            const newCategory = await response.json();
            showToast('Category created successfully! 📁', 'success');
            await fetchCategories();
            closeCategoryModal();
            return newCategory;
        } else {
            const error = await response.json();
            showToast(error.message || 'Failed to create category', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error creating category:', error);
        showToast('Network error', 'error');
        return null;
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Category';
        }
    }
}

// تحديث تصنيف
async function updateCategory(id, categoryData) {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.CATEGORY_DETAIL(id)}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
            const updatedCategory = await response.json();
            showToast('Category updated successfully!', 'success');
            await fetchCategories();
            return updatedCategory;
        } else {
            showToast('Failed to update category', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error updating category:', error);
        showToast('Network error', 'error');
        return null;
    }
}

// حذف تصنيف
async function deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category? This may affect existing transactions.')) return;
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.CATEGORY_DETAIL(id)}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Category deleted successfully!', 'success');
            await fetchCategories();
            return true;
        } else {
            showToast('Failed to delete category', 'error');
            return false;
        }
    } catch (error) {
        console.error('Error deleting category:', error);
        showToast('Network error', 'error');
        return false;
    }
}

// ============= عرض التصنيفات =============

function displayCategories(categories) {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    if (categories.length === 0) {
        categoriesGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center;">
                <div class="empty-state-icon">📁</div>
                <h3>No Categories Yet</h3>
                <p>Create categories to organize your transactions!</p>
                <button class="btn btn-primary" onclick="openCategoryModal()" style="margin-top: 1rem;">+ Create Your First Category</button>
            </div>
        `;
        return;
    }
    
    categoriesGrid.innerHTML = categories.map(cat => createCategoryCardHTML(cat)).join('');
}

function createCategoryCardHTML(category) {
    const spent = category.total_spent || 0;
    const transactionCount = category.transaction_count || 0;
    const icon = category.icon || getAutoCategoryIcon(category.name);
    
    return `
        <div class="category-card" data-id="${category.id}">
            <div class="category-icon">${icon}</div>
            <div class="category-name">${escapeHtml(category.name)}</div>
            <div class="category-stats">
                <div class="stat">
                    <div class="stat-label">Total Spent</div>
                    <div class="stat-value">$${spent.toFixed(2)}</div>
                </div>
                <div class="stat">
                    <div class="stat-label">Transactions</div>
                    <div class="stat-value">${transactionCount}</div>
                </div>
            </div>
            <div class="category-actions">
                <button class="category-btn edit-btn" onclick="editCategory(${category.id})">✏️ Edit</button>
                <button class="category-btn delete-btn" onclick="deleteCategory(${category.id})">🗑️ Delete</button>
            </div>
        </div>
    `;
}

function getAutoCategoryIcon(name) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('food')) return '🍕';
    if (nameLower.includes('transport')) return '⛽';
    if (nameLower.includes('entertain')) return '🎬';
    if (nameLower.includes('shopping')) return '🛍️';
    if (nameLower.includes('utility')) return '💡';
    if (nameLower.includes('health')) return '🏥';
    if (nameLower.includes('education')) return '🎓';
    if (nameLower.includes('home')) return '🏠';
    if (nameLower.includes('travel')) return '✈️';
    if (nameLower.includes('gift')) return '🎁';
    return '📁';
}

// ============= دوال النماذج =============

function getCategoryFormData() {
    return {
        name: document.getElementById('categoryName')?.value || '',
        icon: document.getElementById('categoryIcon')?.value || null
    };
}

function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.add('active');
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.remove('active');
    const form = document.getElementById('categoryForm');
    if (form) form.reset();
}

async function editCategory(id) {
    const category = currentCategories.find(c => c.id === id);
    if (!category) return;
    
    const newName = prompt('Enter new category name:', category.name);
    if (!newName) return;
    
    await updateCategory(id, {
        name: newName,
        icon: category.icon
    });
}

// تهيئة صفحة التصنيفات
async function initCategoriesPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }
    
    await fetchCategories();
    
    // معالج نموذج الإضافة
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = getCategoryFormData();
            if (data.name) {
                await createCategory(data);
            } else {
                showToast('Please enter a category name', 'warning');
            }
        });
    }
}

// تشغيل التهيئة
if (window.location.pathname.includes('categories.html')) {
    document.addEventListener('DOMContentLoaded', initCategoriesPage);
}