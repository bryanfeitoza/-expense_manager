const API = {
    baseURL: '',
    tokens: {
        access: null,
        refresh: null
    },

    init() {
        this.tokens.access = localStorage.getItem('accessToken');
        this.tokens.refresh = localStorage.getItem('refreshToken');
    },

    async request(method, path, data = null, isForm = false) {
        const headers = { 'Content-Type': 'application/json' };
        if (this.tokens.access) {
            headers['Authorization'] = `Bearer ${this.tokens.access}`;
        }

        const config = {
            method,
            headers,
            body: data ? JSON.stringify(data) : undefined
        };

        if (isForm) {
            delete headers['Content-Type'];
            config.body = data;
        }

        const response = await fetch(`${this.baseURL}${path}`, config);

        if (response.status === 204) return null;

        if (response.status === 401 && this.tokens.refresh) {
            const refreshed = await this.refreshToken();
            if (refreshed) {
                headers['Authorization'] = `Bearer ${this.tokens.access}`;
                const retryResponse = await fetch(`${this.baseURL}${path}`, config);
                const retryData = await retryResponse.json();
                if (!retryResponse.ok) throw { status: retryResponse.status, ...retryData };
                return retryData;
            }
        }

        const responseData = await response.json();
        if (!response.ok) throw { status: response.status, ...responseData };
        return responseData;
    },

    async refreshToken() {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.tokens.refresh })
            });
            if (!response.ok) {
                this.logout();
                return false;
            }
            const data = await response.json();
            this.tokens.access = data.accessToken;
            this.tokens.refresh = data.refreshToken;
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            return true;
        } catch {
            this.logout();
            return false;
        }
    },

    logout() {
        this.tokens.access = null;
        this.tokens.refresh = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.hash = '#login';
    },

    isAuthenticated() {
        return !!this.tokens.access;
    },

    getAuthHeaders() {
        return this.tokens.access ? { 'Authorization': `Bearer ${this.tokens.access}` } : {};
    },

    // Auth
    register(data) { return this.request('POST', '/api/auth/register', data); },
    login(data) { return this.request('POST', '/api/auth/login', data); },
    refresh(data) { return this.request('POST', '/api/auth/refresh', data); },
    logoutApi() { return this.request('POST', '/api/auth/logout'); },
    me() { return this.request('GET', '/api/auth/me'); },

    // Transactions
    getTransactions(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/api/transactions?${query}`);
    },
    getTransaction(id) { return this.request('GET', `/api/transactions/${id}`); },
    createTransaction(data) { return this.request('POST', '/api/transactions', data); },
    updateTransaction(id, data) { return this.request('PUT', `/api/transactions/${id}`, data); },
    deleteTransaction(id) { return this.request('DELETE', `/api/transactions/${id}`); },

    // Categories
    getCategories() { return this.request('GET', '/api/categories'); },
    getCategory(id) { return this.request('GET', `/api/categories/${id}`); },
    createCategory(data) { return this.request('POST', '/api/categories', data); },
    updateCategory(id, data) { return this.request('PUT', `/api/categories/${id}`, data); },
    deleteCategory(id) { return this.request('DELETE', `/api/categories/${id}`); },

    // Accounts
    getAccounts() { return this.request('GET', '/api/accounts'); },
    getAccount(id) { return this.request('GET', `/api/accounts/${id}`); },
    createAccount(data) { return this.request('POST', '/api/accounts', data); },
    updateAccount(id, data) { return this.request('PUT', `/api/accounts/${id}`, data); },
    deleteAccount(id) { return this.request('DELETE', `/api/accounts/${id}`); },

    // Dashboard
    getDashboardSummary(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/api/dashboard/summary?${query}`);
    },
    getMonthlyEvolution(year) {
        return this.request('GET', `/api/dashboard/monthly-evolution${year ? `?year=${year}` : ''}`);
    },
    getCategoryBreakdown(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/api/dashboard/category-breakdown?${query}`);
    },
    getCalendar(year, month) {
        let path = `/api/dashboard/calendar?year=${year || new Date().getFullYear()}`;
        if (month) path += `&month=${month}`;
        return this.request('GET', path);
    },

    // AI
    classifySpending(data) { return this.request('POST', '/api/ai/classify', data); },
    analyzeSpending(data) { return this.request('POST', '/api/ai/analyze', data); },
    getAnomalies() { return this.request('GET', '/api/ai/anomalies'); },
    getPredictions() { return this.request('GET', '/api/ai/predict'); },
    getTips() { return this.request('GET', '/api/ai/tips'); },
    aiChat(data) { return this.request('POST', '/api/ai/chat', data); },

    // Reports
    getReportByCategory(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/api/reports/by-category?${query}`);
    },
    getReportMonthly(year) {
        return this.request('GET', `/api/reports/monthly${year ? `?year=${year}` : ''}`);
    },
    exportCSV(params = {}) {
        const query = new URLSearchParams(params).toString();
        window.open(`${this.baseURL}/api/reports/export/csv?token=${this.tokens.access}&${query}`, '_blank');
    },

    // Saving Goals
    getSavingGoals() { return this.request('GET', '/api/saving-goals'); },
    getSavingGoal(id) { return this.request('GET', `/api/saving-goals/${id}`); },
    createSavingGoal(data) { return this.request('POST', '/api/saving-goals', data); },
    updateSavingGoal(id, data) { return this.request('PUT', `/api/saving-goals/${id}`, data); },
    deleteSavingGoal(id) { return this.request('DELETE', `/api/saving-goals/${id}`); },

    // Budgets
    getBudgets(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', `/api/budgets?${query}`);
    },
    getBudget(id) { return this.request('GET', `/api/budgets/${id}`); },
    createBudget(data) { return this.request('POST', '/api/budgets', data); },
    updateBudget(id, data) { return this.request('PUT', `/api/budgets/${id}`, data); },
    deleteBudget(id) { return this.request('DELETE', `/api/budgets/${id}`); }
};

API.init();
