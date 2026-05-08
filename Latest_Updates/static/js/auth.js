// auth.js - كل ما يتعلق بالمصادقة والتوكنات

// ============= دوال المصادقة الأساسية =============

// تسجيل مستخدم جديد
async function registerUser(userData) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.REGISTER}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Account created successfully! Please check your email to activate your account.', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            return true;
        } else {
            let errorMsg = 'Registration failed:\n';
            for (const [key, value] of Object.entries(data)) {
                errorMsg += `${key}: ${value.join(', ')}\n`;
            }
            showToast(errorMsg, 'error');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error. Make sure the server is running.', 'error');
        return false;
    }
}

// تسجيل الدخول
async function loginUser(credentials) {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            setTokens(data.access, data.refresh);
            await fetchUserProfile();
            showToast('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return true;
        } else {
            showToast('Login failed: ' + (data.detail || 'Invalid credentials'), 'error');
            return false;
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error. Make sure the server is running.', 'error');
        return false;
    }
}

// جلب بيانات المستخدم
async function fetchUserProfile() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.USER_DETAILS}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            const userData = await response.json();
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
            return userData;
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
    return null;
}

// تحديث بيانات المستخدم
async function updateUserProfile(userData) {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.USER_UPDATE}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(data));
            showToast('Profile updated successfully!', 'success');
            return data;
        } else {
            showToast('Failed to update profile', 'error');
            return null;
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        return null;
    }
}

// تسجيل الخروج
function logoutUser() {
    clearTokens();
    showToast('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 1000);
}

// تحديث التوكن
async function refreshAccessToken() {
    const refresh = localStorage.getItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    if (!refresh) {
        return false;
    }

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.REFRESH}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refresh })
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, data.access);
            return true;
        } else {
            logoutUser();
            return false;
        }
    } catch (error) {
        console.error('Refresh token error:', error);
        return false;
    }
}

// طلب عام مع توكن
async function fetchWithAuth(url, options = {}) {
    let token = getAccessToken();
    
    if (!token) {
        window.location.href = 'login.html';
        throw new Error('No access token found');
    }

    options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        let response = await fetch(url, options);
        
        if (response.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                token = getAccessToken();
                options.headers['Authorization'] = `Bearer ${token}`;
                response = await fetch(url, options);
            } else {
                window.location.href = 'login.html';
                throw new Error('Session expired');
            }
        }
        
        return response;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// ============= دوال مساعدة =============

// عرض رسالة toast
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ============= معالجات الصفحات =============

// معالج تسجيل الدخول
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const credentials = {
            username: document.getElementById('username').value,
            password: document.getElementById('password').value
        };
        
        await loginUser(credentials);
    });
}

// معالج التسجيل
if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = document.getElementById('password').value;
        const re_password = document.getElementById('re_password').value;
        
        if (password !== re_password) {
            showToast("Passwords don't match!", 'error');
            return;
        }
        
        const userData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: password,
            re_password: re_password
        };
        
        await registerUser(userData);
    });
}

// معالج زر تسجيل الخروج
if (document.getElementById('logout-btn')) {
    document.getElementById('logout-btn').addEventListener('click', logoutUser);
}

// إضافة أنماط الـ toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);





