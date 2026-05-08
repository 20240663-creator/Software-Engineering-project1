let currentTransactions = [];
        
        function setDateRange(range) {
            const today = new Date();
            const startDate = new Date();
            const endDate = new Date();
            
            switch(range) {
                case 'week':
                    startDate.setDate(today.getDate() - 7);
                    break;
                case 'month':
                    startDate.setMonth(today.getMonth() - 1);
                    break;
                case 'quarter':
                    startDate.setMonth(today.getMonth() - 3);
                    break;
                case 'year':
                    startDate.setFullYear(today.getFullYear() - 1);
                    break;
                case 'all':
                    startDate.setFullYear(2020);
                    break;
                default:
                    return;
            }
            
            document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
            document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
            loadReportData();
        }
        
        async function loadReportData() {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            if (!startDate || !endDate) {
                showToast('Please select date range', 'warning');
                return;
            }
            
            try {
                const response = await fetchWithAuth(`${CONFIG.API_BASE_URL}${CONFIG.API_ENDPOINTS.TRANSACTIONS}`, {
                    method: 'GET'
                });
                
                if (response.ok) {
                    let transactions = await response.json();
                    
                    // Filter by date range
                    const start = new Date(startDate);
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59);
                    
                    currentTransactions = transactions.filter(t => {
                        const date = new Date(t.date);
                        return date >= start && date <= end;
                    });
                    
                    updateReportDisplay(currentTransactions);
                }
            } catch (error) {
                console.error('Error loading report data:', error);
                showToast('Failed to load report data', 'error');
            }
        }
        
        function updateReportDisplay(transactions) {
            // Calculate totals
            const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
            const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const netSavings = totalIncome - totalExpenses;
            
            document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
            document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
            document.getElementById('netSavings').textContent = `$${netSavings.toFixed(2)}`;
            document.getElementById('transactionCount').textContent = transactions.length;
            
            // Category breakdown for expenses only
            const expensesByCategory = {};
            transactions.filter(t => t.amount < 0).forEach(t => {
                const category = t.category || 'Other';
                expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(t.amount);
            });
            
            const categoryContainer = document.getElementById('categoryBreakdown');
            if (Object.keys(expensesByCategory).length === 0) {
                categoryContainer.innerHTML = '<div class="empty-state">No expense data for selected period</div>';
            } else {
                const sortedCategories = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
                const totalExpenseAmount = totalExpenses;
                
                categoryContainer.innerHTML = sortedCategories.map(([cat, amount]) => `
                    <div class="category-item">
                        <div class="category-name">${cat}</div>
                        <div class="category-amount">$${amount.toFixed(2)}</div>
                        <div class="progress-bar" style="margin-top: 0.5rem;">
                            <div class="progress-fill" style="width: ${(amount / totalExpenseAmount) * 100}%"></div>
                        </div>
                    </div>
                `).join('');
            }
            
            // Update table
            const tableBody = document.getElementById('reportTableBody');
            const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
            
            if (sortedTransactions.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">No transactions found for selected period</td></tr>';
            } else {
                tableBody.innerHTML = sortedTransactions.map(t => `
                    <tr>
                        <td>${new Date(t.date).toLocaleDateString()}</td>
                        <td>${t.category || '-'}</td>
                        <td>${t.description || '-'}</td>
                        <td class="${t.amount < 0 ? 'amount-negative' : 'amount-positive'}">
                            ${t.amount < 0 ? '-' : '+'}$${Math.abs(t.amount).toFixed(2)}
                        </td>
                        <td>${t.type || (t.amount < 0 ? 'Expense' : 'Income')}</td>
                    </tr>
                `).join('');
            }
        }
        
        function exportToCSV() {
            if (currentTransactions.length === 0) {
                showToast('No data to export', 'warning');
                return;
            }
            
            const headers = ['Date', 'Category', 'Description', 'Amount', 'Type'];
            const rows = currentTransactions.map(t => [
                new Date(t.date).toLocaleDateString(),
                t.category || '',
                t.description || '',
                t.amount,
                t.type || (t.amount < 0 ? 'Expense' : 'Income')
            ]);
            
            const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smart_wallet_report_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Report exported successfully!', 'success');
        }
        
        function printReport() {
            const printContent = document.querySelector('main').cloneNode(true);
            const originalHeader = document.querySelector('.main-header').cloneNode(true);
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Smart Wallet Financial Report</title>
                        <link rel="stylesheet" href="../static/css/style.css" />
                        <style>
                            body { padding: 20px; }
                            .no-print { display: none; }
                            .main-header { position: static; }
                            .logout-btn { display: none; }
                            .export-buttons { display: none; }
                            @media print {
                                .main-header { position: static; }
                            }
                        </style>
                    </head>
                    <body>
                        ${originalHeader.outerHTML}
                        ${printContent.outerHTML}
                    </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
        
        // Event listeners
        document.querySelectorAll('.date-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                setDateRange(this.dataset.range);
            });
        });
        
        document.getElementById('applyFiltersBtn').addEventListener('click', loadReportData);
        
        // Set default dates
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        document.getElementById('startDate').value = firstDay.toISOString().split('T')[0];
        document.getElementById('endDate').value = lastDay.toISOString().split('T')[0];
        
        // Load initial data
        document.addEventListener('DOMContentLoaded', async () => {
            if (!isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }
            await loadReportData();
        });
        
        window.exportToCSV = exportToCSV;
        window.printReport = printReport;