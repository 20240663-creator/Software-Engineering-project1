// config.js - جميع التكوينات المركزية

const CONFIG = {
    API_BASE_URL: 'http://127.0.0.1:8000',
    API_ENDPOINTS: {
        // المصادقة
        REGISTER: '/auth/users/',
        ACTIVATION: '/auth/users/activation/',
        LOGIN: '/auth/jwt/create/',
        REFRESH: '/auth/jwt/refresh/',
        VERIFY: '/auth/jwt/verify/',
        USER_DETAILS: '/auth/users/me/',
        USER_UPDATE: '/auth/users/me/',
        
        // المستشار المالي
        ADVISOR_ASK: '/advisor/ask/',
        ADVISOR_HISTORY: '/advisor/history/',
        
        // سيكون هناك endpoints أخرى حسب الـ API الخاصة بك
    },
    STORAGE_KEYS: {
        ACCESS_TOKEN: 'access_token',
        REFRESH_TOKEN: 'refresh_token',
        USER_DATA: 'user_data'
    }
};

// دالة للحصول على التوكن
function getAccessToken() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
}

// دالة لحفظ التوكن
function setTokens(access, refresh) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, access);
    localStorage.setItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refresh);
}

// دالة لحذف التوكنات (تسجيل الخروج)
function clearTokens() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
}

// دالة للتحقق من وجود توكن صالح
function isAuthenticated() {
    return getAccessToken() !== null;
}