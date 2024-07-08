const { createApp } = Vue;
const { createStore } = Vuex;

const LOCAL_STORAGE_KEY_TRANSACTIONS = 'cierreCajaData';
const LOCAL_STORAGE_KEY_MANAGER = 'manager';
const LOCAL_STORAGE_KEY_INITIAL_CASH = 'initialCash';
const LOCAL_STORAGE_KEY_EXPENSES = 'expenses';

const store = createStore({
    state() {
        return {
            transactions: [],
            cashWithdrawal: 0,
            withdrawalReason: '',
            expenses: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_EXPENSES)) || [{ ticketNumber: '', amount: '', paymentMethod: 'Efectivo', cashPaid: '', cashReturned: '', details: '' }]
        };
    },
    mutations: {
        addTransaction(state, transaction) {
            state.transactions.push({ ...transaction, id: Date.now() });
            localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(state.transactions));
        },
        setCashWithdrawal(state, amount) {
            state.cashWithdrawal = amount;
        },
        setWithdrawalReason(state, reason) {
            state.withdrawalReason = reason;
        },
        loadTransactions(state, transactions) {
            state.transactions = transactions;
        },
        setExpenses(state, expenses) {
            state.expenses = expenses;
            localStorage.setItem(LOCAL_STORAGE_KEY_EXPENSES, JSON.stringify(state.expenses));
        },
        clearData(state) {
            state.transactions = [];
            state.cashWithdrawal = 0;
            state.withdrawalReason = '';
            state.expenses = [{ ticketNumber: '', amount: '', paymentMethod: 'Efectivo', cashPaid: '', cashReturned: '', details: '' }];
            localStorage.removeItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
            localStorage.removeItem(LOCAL_STORAGE_KEY_MANAGER);
            localStorage.removeItem(LOCAL_STORAGE_KEY_INITIAL_CASH);
            localStorage.removeItem(LOCAL_STORAGE_KEY_EXPENSES);
        }
    },
    getters: {
        transactions: state => state.transactions,
        totalCashInBox: state => {
            return state.transactions.reduce((total, transaction) => {
                const totalExpenses = transaction.expenses.reduce((sum, expense) => {
                    if (expense.paymentMethod === 'Efectivo') {
                        return sum + Number(expense.amount);
                    }
                    return sum;
                }, 0);
                return total + Number(transaction.totalSalesCash) + Number(transaction.initialCash) - totalExpenses;
            }, 0);
        },
        totalCashAfterWithdrawal: state => {
            return state.transactions.reduce((total, transaction) => {
                const totalExpenses = transaction.expenses.reduce((sum, expense) => {
                    if (expense.paymentMethod === 'Efectivo') {
                        return sum + Number(expense.amount);
                    }
                    return sum;
                }, 0);
                return total + Number(transaction.totalSalesCash) + Number(transaction.initialCash) - totalExpenses;
            }, 0) - state.cashWithdrawal;
        }
    }
});

createApp({
    data() {
        return {
            newTransaction: {
                date: new Date().toISOString().split('T')[0],
                manager: localStorage.getItem(LOCAL_STORAGE_KEY_MANAGER) || '',
                initialCash: localStorage.getItem(LOCAL_STORAGE_KEY_INITIAL_CASH) || '',
                totalSalesCash: '',
                totalDebit: '',
                totalCredit: '',
                totalTransfers: '',
                expenses: JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_EXPENSES)) || [{ ticketNumber: '', amount: '', paymentMethod: 'Efectivo', cashPaid: '', cashReturned: '', details: '' }]
            },
            cashWithdrawal: 0,
            withdrawalReason: ''
        };
    },
    computed: {
        transactions() {
            return this.$store.getters.transactions;
        },
        totalDebitCredit() {
            return Number(this.newTransaction.totalDebit) + Number(this.newTransaction.totalCredit);
        },
        totalCashInBox() {
            return this.$store.getters.totalCashInBox;
        },
        totalCashAfterWithdrawal() {
            return this.$store.getters.totalCashAfterWithdrawal;
        },
        currentDate() {
            return new Date().toISOString().split('T')[0];
        },
        isFormComplete() {
            return (
                this.newTransaction.manager &&
                this.newTransaction.initialCash !== '' &&
                this.newTransaction.totalSalesCash !== '' &&
                this.newTransaction.totalDebit !== '' &&
                this.newTransaction.totalCredit !== '' &&
                this.newTransaction.totalTransfers !== ''
            );
        }
    },
    watch: {
        'newTransaction.manager'(newValue) {
            localStorage.setItem(LOCAL_STORAGE_KEY_MANAGER, newValue);
        },
        'newTransaction.initialCash'(newValue) {
            localStorage.setItem(LOCAL_STORAGE_KEY_INITIAL_CASH, newValue);
        },
        'newTransaction.expenses': {
            handler(newValue) {
                localStorage.setItem(LOCAL_STORAGE_KEY_EXPENSES, JSON.stringify(newValue));
            },
            deep: true
        }
    },
    methods: {
        formatCurrency(value) {
            return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(value);
        },
        addTransaction() {
            this.newTransaction.expenses.forEach(expense => {
                if (expense.paymentMethod === 'Efectivo') {
                    expense.cashReturned = Number(expense.cashPaid) - Number(expense.amount);
                }
            });
            this.$store.commit('addTransaction', this.newTransaction);
            this.resetNewTransaction();
        },
        resetNewTransaction() {
            this.newTransaction = {
                date: new Date().toISOString().split('T')[0],
                manager: localStorage.getItem(LOCAL_STORAGE_KEY_MANAGER) || '',
                initialCash: localStorage.getItem(LOCAL_STORAGE_KEY_INITIAL_CASH) || '',
                totalSalesCash: '',
                totalDebit: '',
                totalCredit: '',
                totalTransfers: '',
                expenses: [{ ticketNumber: '', amount: '', paymentMethod: 'Efectivo', cashPaid: '', cashReturned: '', details: '' }]
            };
        },
        totalDebitCreditTransaction(transaction) {
            return Number(transaction.totalDebit) + Number(transaction.totalCredit);
        },
        totalSalesTransaction(transaction) {
            return Number(transaction.totalSalesCash) + this.totalDebitCreditTransaction(transaction) + Number(transaction.totalTransfers);
        },
        totalSalesCashMinusExpenses(transaction) {
            const totalExpenses = transaction.expenses.reduce((sum, expense) => {
                if (expense.paymentMethod === 'Efectivo') {
                    return sum + Number(expense.amount);
                }
                return sum;
            }, 0);
            return Number(transaction.totalSalesCash) - totalExpenses;
        },
        totalExpenses(expenses) {
            return expenses.reduce((total, expense) => total + Number(expense.amount), 0);
        },
        addExpense() {
            this.newTransaction.expenses.push({ ticketNumber: '', amount: '', paymentMethod: 'Efectivo', cashPaid: '', cashReturned: '', details: '' });
        },
        updateCashReturned(expense) {
            if (expense.paymentMethod === 'Efectivo') {
                expense.cashReturned = Number(expense.cashPaid) - Number(expense.amount);
            }
        },
        async makeCashWithdrawal() {
            if (this.cashWithdrawal && this.withdrawalReason) {
                this.$store.commit('setCashWithdrawal', Number(this.cashWithdrawal));
                this.$store.commit('setWithdrawalReason', this.withdrawalReason);
                await this.sendPDF();
            }
        },
        async finalizeClosure() {
            if (this.totalCashInBox > 0 && this.totalCashInBox <= 30000) {
                await this.sendPDF();
            }
        },
        showTotalCashAfterWithdrawal() {
            // Muestra el total de dinero en caja después del retiro
            this.totalCashAfterWithdrawal; // Esto actualiza la vista
        },
        clearAllData() {
            this.$store.commit('clearData');
            this.resetNewTransaction();
            this.cashWithdrawal = 0;
            this.withdrawalReason = '';
        },
        generatePDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Header
            doc.setFontSize(18);
            doc.text("Reporte de Cierre de Caja", 14, 16);
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(`Fecha: ${this.currentDate}`, 14, 24);

            // Transactions table
            this.transactions.forEach((transaction, index) => {
                const startY = 30 + index * 60; // Adjust the spacing between transactions

                doc.autoTable({
                    body: [
                        ['Fecha', transaction.date],
                        ['Encargado', transaction.manager],
                        ['Inicio Efectivo', this.formatCurrency(transaction.initialCash)],
                        ['Total Ventas en Efectivo', this.formatCurrency(transaction.totalSalesCash)],
                        ['Total Débito', this.formatCurrency(transaction.totalDebit)],
                        ['Total Crédito', this.formatCurrency(transaction.totalCredit)],
                        ['Total Transferencias', this.formatCurrency(transaction.totalTransfers)],
                        ['Total Débito + Crédito', this.formatCurrency(this.totalDebitCreditTransaction(transaction))],
                        ['Total Ventas en Efectivo - los Gastos', this.formatCurrency(this.totalSalesCashMinusExpenses(transaction))],
                        ['Total Ventas', this.formatCurrency(this.totalSalesTransaction(transaction))]
                    ],
                    startY,
                    theme: 'striped',
                    styles: { fontSize: 10 },
                    columnStyles: {
                        0: { cellWidth: 'wrap' },
                        1: { cellWidth: 'auto' }
                    }
                });
            });

            const finalY = doc.previousAutoTable.finalY + 10;

            // Expenses details section
            doc.setFontSize(14);
            doc.text("Detalle de Gastos", 14, finalY);
            doc.setFontSize(12);

            this.transactions.forEach(transaction => {
                transaction.expenses.forEach(expense => {
                    doc.autoTable({
                        body: [
                            ['Fecha', transaction.date],
                            ['N° Boleta', expense.ticketNumber],
                            ['Monto', this.formatCurrency(expense.amount)],
                            ['Método de Pago', expense.paymentMethod],
                            ['Efectivo Pagado', expense.paymentMethod === 'Efectivo' ? this.formatCurrency(expense.cashPaid) : '-'],
                            ['Efectivo Devuelto', expense.paymentMethod === 'Efectivo' ? this.formatCurrency(expense.cashReturned) : '-'],
                            ['Detalle', expense.details]
                        ],
                        startY: doc.previousAutoTable.finalY + 10,
                        theme: 'striped',
                        styles: { fontSize: 10 },
                        columnStyles: {
                            0: { cellWidth: 'wrap' },
                            1: { cellWidth: 'auto' }
                        }
                    });
                });
            });

            const expensesFinalY = doc.previousAutoTable.finalY + 10;

            // Cash summary section
            doc.setFontSize(14);
            doc.text("Resumen de Caja", 14, expensesFinalY);
            doc.setFontSize(12);

            // Agregar motivo del retiro, incluso si no hubo retiro
            const cashWithdrawal = this.$store.state.cashWithdrawal || 0;
            const withdrawalReason = this.$store.state.withdrawalReason || 'No hubo retiro';

            doc.autoTable({
                body: [
                    ['Total Efectivo en Caja', this.formatCurrency(this.totalCashInBox)],
                    ['Total Dinero en Caja después del Retiro', this.formatCurrency(this.totalCashAfterWithdrawal)],
                    ['Retiro de Efectivo', this.formatCurrency(cashWithdrawal)],
                    ['Motivo del Retiro', withdrawalReason]
                ],
                startY: expensesFinalY + 10,
                theme: 'striped',
                styles: {
                    cellPadding: 2,
                    fontSize: 12
                },
                columnStyles: {
                    0: { cellWidth: 'wrap' },
                    1: { cellWidth: 'auto' }
                }
            });

            return doc;
        },
        async sendPDF() {
            const doc = this.generatePDF();
            const pdfData = doc.output('blob');

            const formData = new FormData();
            formData.append('pdf', pdfData, 'reporte-cierre-caja.pdf');

            try {
                await fetch('http://localhost:3000/send-email', {
                    method: 'POST',
                    body: formData
                });
            } catch (error) {
                console.error('Error al enviar el correo:', error);
            }
        },
        async downloadAndClearPDF() {
            const doc = this.generatePDF();
            doc.save('reporte-cierre-caja.pdf');
            this.clearAllData();
        }
    },
    mounted() {
        const savedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
        if (savedTransactions) {
            this.$store.commit('loadTransactions', JSON.parse(savedTransactions));
        }
    }
}).use(store).mount('#app');
