// Smart Wallet Project - JavaScript Handler
// Handles Send Money and Request Money functionality

// =============================================
// SEND MONEY FUNCTIONALITY
// =============================================

function handleSendMoney() {
    // Get form values
    const recipientType = document.getElementById('recipientType').value;
    const recipientName = document.getElementById('recipientName').value;
    const recipientEmail = document.getElementById('recipientEmail').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const purpose = document.getElementById('purpose').value;
    const description = document.getElementById('description').value;
    const saveRecipient = document.getElementById('saveRecipient').checked;

    // Validation
    if (!recipientType || !recipientName || !recipientEmail || !amount || !purpose) {
        showAlert('Please fill in all required fields');
        return;
    }

    if (amount <= 0) {
        showAlert('Amount must be greater than 0');
        return;
    }

    // Simulate API call
    console.log('Sending money:', {
        recipientType,
        recipientName,
        recipientEmail,
        amount,
        purpose,
        description,
        saveRecipient,
        timestamp: new Date().toLocaleString()
    });

    // Show success modal
    showSuccessModal(recipientName, amount, purpose);

    // Reset form
    document.getElementById('sendMoneyForm').reset();

    // Add transaction to recent transfers list
    addTransferToList(recipientName, amount);
}

function showSuccessModal(recipientName, amount, purpose) {
    const modal = document.getElementById('successModal');
    const detailsDiv = document.getElementById('successDetails');

    if (modal && detailsDiv) {
        detailsDiv.innerHTML = `
            <p><strong>To:</strong> ${recipientName}</p>
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>Purpose:</strong> ${purpose}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Transaction ID:</strong> TXN${generateTransactionId()}</p>
        `;
        modal.classList.add('show');

        // Auto close after 5 seconds
        setTimeout(() => closeModal('successModal'), 5000);
    }
}

function addTransferToList(name, amount) {
    const transfersList = document.querySelector('.transfers-list');
    if (!transfersList) return;

    const newTransfer = document.createElement('div');
    newTransfer.className = 'transfer-item';
    newTransfer.innerHTML = `
        <div class="transfer-info">
            <div class="transfer-recipient">${name}</div>
            <div class="transfer-date">Just now</div>
        </div>
        <div class="transfer-amount">-$${amount.toFixed(2)}</div>
    `;

    transfersList.insertBefore(newTransfer, transfersList.firstChild);
}

// =============================================
// REQUEST MONEY FUNCTIONALITY
// =============================================

function handleRequestMoney() {
    // Get form values
    const requesterName = document.getElementById('requesterName').value;
    const requesterEmail = document.getElementById('requesterEmail').value;
    const requestAmount = parseFloat(document.getElementById('requestAmount').value);
    const reason = document.getElementById('reason').value;
    const dueDate = document.getElementById('dueDate').value;
    const requestDescription = document.getElementById('requestDescription').value;
    const requestPriority = document.getElementById('requestPriority').value;
    const sendReminder = document.getElementById('sendReminder').checked;

    // Validation
    if (!requesterName || !requesterEmail || !requestAmount || !reason || !dueDate) {
        showAlert('Please fill in all required fields');
        return;
    }

    if (requestAmount <= 0) {
        showAlert('Amount must be greater than 0');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requesterEmail)) {
        showAlert('Please enter a valid email address');
        return;
    }

    // Validate due date is in future
    const selectedDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showAlert('Due date must be in the future');
        return;
    }

    // Simulate API call
    console.log('Creating money request:', {
        requesterName,
        requesterEmail,
        requestAmount,
        reason,
        dueDate,
        requestDescription,
        requestPriority,
        sendReminder,
        timestamp: new Date().toLocaleString()
    });

    // Show success modal
    showRequestSuccessModal(requesterName, requestAmount, reason, dueDate);

    // Reset form
    document.getElementById('requestMoneyForm').reset();

    // Add request to pending requests list
    addRequestToList(requesterName, requestAmount, dueDate, sendReminder);
}

function showRequestSuccessModal(requesterName, amount, reason, dueDate) {
    const modal = document.getElementById('requestModal');
    const detailsDiv = document.getElementById('requestDetails');

    if (modal && detailsDiv) {
        const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        detailsDiv.innerHTML = `
            <p><strong>Requested from:</strong> ${requesterName}</p>
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p><strong>Due Date:</strong> ${formattedDate}</p>
            <p><strong>Request ID:</strong> REQ${generateTransactionId()}</p>
        `;
        modal.classList.add('show');

        // Auto close after 5 seconds
        setTimeout(() => closeModal('requestModal'), 5000);
    }
}

function addRequestToList(name, amount, dueDate, sendReminder) {
    const requestsTable = document.querySelector('.requests-table');
    if (!requestsTable) return;

    const formattedDate = new Date(dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });

    const newRequest = document.createElement('div');
    newRequest.className = 'request-row';
    newRequest.innerHTML = `
        <div class="request-name">${name}</div>
        <div class="request-amount">$${amount.toFixed(2)}</div>
        <div class="request-date">${formattedDate}</div>
        <div class="request-status"><span class="badge badge-pending">Pending</span></div>
        <div class="request-action">
            <button class="btn-small btn-reminder" onclick="sendReminder('${name}')">Remind</button>
        </div>
    `;

    // Insert after header row
    if (requestsTable.children.length > 1) {
        requestsTable.insertBefore(newRequest, requestsTable.children[1]);
    } else {
        requestsTable.appendChild(newRequest);
    }
}

function sendReminder(name) {
    console.log('Sending reminder to:', name);
    
    const modal = document.getElementById('reminderModal');
    const messageDiv = document.getElementById('reminderMessage');

    if (modal && messageDiv) {
        messageDiv.textContent = `A reminder has been sent to ${name}. They will receive an email notification.`;
        modal.classList.add('show');

        // Auto close after 3 seconds
        setTimeout(() => closeModal('reminderModal'), 3000);
    }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function generateTransactionId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
}

function showAlert(message) {
    // Modern alert using a simple alert or custom toast
    alert(message);
    
    // Optional: Create a custom toast notification
    // createToast(message, 'error');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Close modal when clicking the X button
document.addEventListener('DOMContentLoaded', function() {
    const closeButtons = document.querySelectorAll('.modal-close');
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });

    // Close modal when clicking outside of it
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    });

    // Format currency inputs
    const currencyInputs = document.querySelectorAll('input[type="number"]');
    currencyInputs.forEach(input => {
        if (input.id.includes('amount') || input.id.includes('Amount')) {
            input.addEventListener('blur', function() {
                if (this.value) {
                    this.value = parseFloat(this.value).toFixed(2);
                }
            });
        }
    });
});

// =============================================
// NAVIGATION HELPERS
// =============================================

function navigateTo(url) {
    window.location.href = url;
}

function goBack() {
    window.history.back();
}

// =============================================
// FORM VALIDATION
// =============================================

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function validateAmount(amount) {
    return !isNaN(amount) && amount > 0;
}

function validatePhoneNumber(phone) {
    const regex = /^[\d\s\-\+\(\)]+$/;
    return regex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

// =============================================
// LOCAL STORAGE HELPERS
// =============================================

function saveFavoriteRecipient(data) {
    let recipients = JSON.parse(localStorage.getItem('favoriteRecipients') || '[]');
    recipients.push({
        ...data,
        id: generateTransactionId(),
        savedDate: new Date().toISOString()
    });
    localStorage.setItem('favoriteRecipients', JSON.stringify(recipients));
    console.log('Recipient saved:', data);
}

function getFavoriteRecipients() {
    return JSON.parse(localStorage.getItem('favoriteRecipients') || '[]');
}

function removeFavoriteRecipient(id) {
    let recipients = JSON.parse(localStorage.getItem('favoriteRecipients') || '[]');
    recipients = recipients.filter(r => r.id !== id);
    localStorage.setItem('favoriteRecipients', JSON.stringify(recipients));
    console.log('Recipient removed');
}

// =============================================
// MOCK DATA FUNCTIONS
// =============================================

function getRecentTransactions() {
    return [
        { id: 1, name: 'John Doe', amount: 150, date: 'Today', time: '10:30 AM' },
        { id: 2, name: 'Sarah Smith', amount: 500, date: 'Yesterday', time: '' },
        { id: 3, name: 'Mike Johnson', amount: 75.50, date: '2 days ago', time: '' }
    ];
}

function getPendingRequests() {
    return [
        { id: 1, name: 'Alice Johnson', amount: 250, dueDate: '2026-04-15', status: 'Pending' },
        { id: 2, name: 'Bob Smith', amount: 500, dueDate: '2026-04-10', status: 'Overdue' },
        { id: 3, name: 'Carol White', amount: 150.50, dueDate: '2026-04-20', status: 'Pending' },
        { id: 4, name: 'David Brown', amount: 2550, dueDate: '2026-04-25', status: 'Pending' }
    ];
}

// =============================================
// EXPORT FOR TESTING
// =============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        handleSendMoney,
        handleRequestMoney,
        sendReminder,
        validateEmail,
        validateAmount,
        validatePhoneNumber,
        saveFavoriteRecipient,
        getFavoriteRecipients,
        removeFavoriteRecipient
    };
}
