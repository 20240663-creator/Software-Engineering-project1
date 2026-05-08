// advisor.js - المستشار المالي والذكاء الاصطناعي

// إرسال سؤال للمستشار
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // إضافة رسالة المستخدم
    addMessage(message, 'user');
    input.value = '';
    
    // إظهار مؤشر الكتابة
    const loadingMsg = addMessage('Thinking... 🤔', 'advisor', true);
    
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.ADVISOR_ASK}`, {
            method: 'POST',
            body: JSON.stringify({ message: message })
        });
        
        if (response.ok) {
            const data = await response.json();
            // استبدال رسالة التحميل بالرد الفعلي
            loadingMsg.remove();
            addMessage(data.response || data.answer || 'I received your question. processing...', 'advisor');
        } else {
            loadingMsg.remove();
            addMessage('Sorry, I encountered an error. Please try again.', 'advisor');
        }
    } catch (error) {
        console.error('Error asking advisor:', error);
        loadingMsg.remove();
        addMessage('Network error. Please check your connection.', 'advisor');
    }
}

// إضافة رسالة إلى الشات
function addMessage(text, sender, isLoading = false) {
    const chatContainer = document.getElementById('chatContainer');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.textContent = text;
    
    if (isLoading) {
        messageDiv.classList.add('loading');
    }
    
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return messageDiv;
}

// سؤال سريع
function askQuestion(question) {
    document.getElementById('messageInput').value = question;
    sendMessage();
}

// تحميل تاريخ المحادثات
async function loadChatHistory() {
    try {
        const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.ADVISOR_HISTORY}`, {
            method: 'GET'
        });
        
        if (response.ok) {
            const history = await response.json();
            const chatContainer = document.getElementById('chatContainer');
            
            // مسح المحادثة الحالية (إذا كانت فارغة أو ترحيب فقط)
            if (chatContainer.children.length <= 1) {
                chatContainer.innerHTML = '';
            }
            
            // عرض المحادثات السابقة
            history.forEach(item => {
                addMessage(item.question, 'user');
                addMessage(item.answer, 'advisor');
            });
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

// تفعيل إرسال بالضغط على Enter
if (document.getElementById('messageInput')) {
    document.getElementById('messageInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

// تحميل التاريخ عند فتح الصفحة
if (window.location.pathname.includes('advisor.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        // التحقق من المصادقة
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        loadChatHistory();
    });
}