const App = {
    currentPage: 'dashboard',
    user: null,
    categories: [],
    accounts: [],

    async init() {
        this.checkAuth();
        this.setupEventListeners();
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    checkAuth() {
        const user = localStorage.getItem('user');
        if (user) {
            this.user = JSON.parse(user);
            this.showApp();
        } else if (window.location.hash !== '#register') {
            window.location.hash = '#login';
        }
    },

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.page) {
                e.preventDefault();
                this.navigate(navItem.dataset.page);
            }
        });

        document.addEventListener('submit', (e) => {
            if (e.target.id === 'loginForm') this.handleLogin(e);
            if (e.target.id === 'registerForm') this.handleRegister(e);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.getElementById('chatPanel').classList.contains('open')) {
                    this.toggleChatPanel();
                    return;
                }
                const sidebar = document.getElementById('sidebar');
                if (window.innerWidth <= 768 && sidebar.classList.contains('show')) {
                    sidebar.classList.remove('show');
                }
            }
        });
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'login';
        if (hash === 'login' || hash === 'register') {
            if (this.user) {
                window.location.hash = '#dashboard';
                return;
            }
            this.renderAuth(hash);
        } else {
            if (!this.user) {
                window.location.hash = '#login';
                return;
            }
            this.currentPage = hash;
            this.renderPage(hash);
        }
    },

    navigate(page) {
        window.location.hash = `#${page}`;
    },

    showApp() {
        document.getElementById('auth-container').classList.add('d-none');
        document.getElementById('app-container').classList.remove('d-none');
        const name = this.user?.name || 'Usuário';
        document.getElementById('userName').textContent = name;
        document.getElementById('userAvatar').textContent = name[0].toUpperCase();
    },

    toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('show');
    },

    toast(message, type = 'info') {
        const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast-custom ${type}`;
        toast.innerHTML = `<i class="bi ${icons[type] || icons.info} toast-icon"></i><span class="toast-msg">${message}</span><span class="toast-close" onclick="this.parentElement.remove()">✕</span>`;
        container.appendChild(toast);
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
    },

    /* ===== CHAT PANEL ===== */

    toggleChatPanel() {
        const panel = document.getElementById('chatPanel');
        const overlay = document.getElementById('chatOverlay');
        panel.classList.toggle('open');
        overlay.classList.toggle('open');
        if (panel.classList.contains('open')) {
            setTimeout(() => document.getElementById('chatInput')?.focus(), 300);
        }
    },

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (!msg) return;

        const body = document.getElementById('chatBody');
        const empty = body.querySelector('.chat-empty');
        if (empty) empty.remove();

        body.appendChild(this.createMsgBubble(msg, 'user'));
        input.value = '';
        body.scrollTop = body.scrollHeight;

        const btn = document.getElementById('chatSendBtn');
        btn.disabled = true;

        try {
            const result = await API.aiChat({ message: msg });
            const response = result.response || result.message || '';
            body.appendChild(this.createMsgBubble(response, 'system'));
        } catch {
            body.appendChild(this.createMsgBubble('Não foi possível processar agora.', 'system'));
        }

        btn.disabled = false;
        body.scrollTop = body.scrollHeight;
    },

    createMsgBubble(text, role) {
        const div = document.createElement('div');
        div.className = `chat-msg ${role}`;
        div.innerHTML = `<div class="msg-bubble">${this.escapeHtml(text)}</div>`;
        return div;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    renderAuth(page) {
        document.getElementById('auth-container').classList.remove('d-none');
        document.getElementById('app-container').classList.add('d-none');
        const container = document.getElementById('auth-container');

        if (page === 'register') {
            container.innerHTML = `
                <div class="login-container">
                    <div class="login-card">
                        <div class="brand">
                            <div class="brand-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                            </div>
                            <h4>Criar Conta</h4>
                            <p>Gerencie suas finanças</p>
                        </div>
                        <form id="registerForm">
                            <div class="mb-3">
                                <label class="form-label">Nome</label>
                                <input type="text" class="form-control" id="regName" required placeholder="Seu nome completo">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="regEmail" required placeholder="seu@email.com">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Senha</label>
                                <input type="password" class="form-control" id="regPassword" required minlength="6" placeholder="Mínimo 6 caracteres">
                            </div>
                            <div id="registerError" class="alert alert-danger d-none"></div>
                            <button type="submit" class="btn btn-primary w-100 mb-3">Criar Conta</button>
                            <p class="text-center mb-0 text-secondary">
                                Já tem conta? <a href="#" onclick="App.navigate('login')">Entrar</a>
                            </p>
                        </form>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div class="login-container">
                    <div class="login-card">
                        <div class="brand">
                            <div class="brand-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>
                            </div>
                            <h4>Gerenciador de Gastos</h4>
                            <p>Organize seus gastos</p>
                        </div>
                        <form id="loginForm">
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="loginEmail" required placeholder="seu@email.com" value="admin@email.com">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Senha</label>
                                <input type="password" class="form-control" id="loginPassword" required placeholder="Sua senha" value="admin123">
                            </div>
                            <div id="loginError" class="alert alert-danger d-none"></div>
                            <button type="submit" class="btn btn-primary w-100 mb-3">Entrar</button>
                            <p class="text-center mb-0 text-secondary">
                                Não tem conta? <a href="#" onclick="App.navigate('register')">Cadastre-se</a>
                            </p>
                        </form>
                    </div>
                </div>
            `;
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>';

        try {
            const data = await API.login({
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            });
            API.tokens.access = data.accessToken;
            API.tokens.refresh = data.refreshToken;
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));
            this.user = data.user;
            this.showApp();
            window.location.hash = '#dashboard';
        } catch (err) {
            const errorDiv = document.getElementById('loginError');
            errorDiv.classList.remove('d-none');
            errorDiv.textContent = err.message || err.error || 'Erro ao fazer login';
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Entrar';
        }
    },

    async handleRegister(e) {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>';

        try {
            await API.register({
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value
            });
            this.toast('Conta criada com sucesso! Faça login.', 'success');
            this.navigate('login');
        } catch (err) {
            const errorDiv = document.getElementById('registerError');
            errorDiv.classList.remove('d-none');
            errorDiv.textContent = err.message || err.error || 'Erro ao criar conta';
        } finally {
            btn.disabled = false;
            btn.innerHTML = 'Criar Conta';
        }
    },

    async handleLogout() {
        try { await API.logoutApi(); } catch {}
        API.logout();
        this.user = null;
        this.toast('Sessão encerrada', 'info');
    },

    renderPage(page) {
        const container = document.getElementById('page-content');
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navEl) navEl.classList.add('active');

        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('show');
        }

        const titles = {
            dashboard: 'Dashboard',
            transactions: 'Transações',
            'calendar-heatmap': 'Calendário de Gastos',
            categories: 'Categorias',
            accounts: 'Contas',
            goals: 'Metas',
            budgets: 'Orçamentos',
            ai: 'Análises',
            reports: 'Relatórios'
        };
        document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

        switch (page) {
            case 'dashboard': this.renderDashboard(container); break;
            case 'transactions': this.renderTransactions(container); break;
            case 'calendar-heatmap': this.renderCalendarHeatmap(container); break;
            case 'categories': this.renderCategories(container); break;
            case 'accounts': this.renderAccounts(container); break;
            case 'goals': this.renderGoals(container); break;
            case 'budgets': this.renderBudgets(container); break;
            case 'ai': this.renderAI(container); break;
            case 'reports': this.renderReports(container); break;
            default: this.renderDashboard(container);
        }
    },

    formatCurrency(value) {
        const num = parseFloat(value) || 0;
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    },

    /* ===== DASHBOARD ===== */
    async renderDashboard(container) {
        container.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';

        try {
            const [summary, monthly, categories] = await Promise.all([
                API.getDashboardSummary(),
                API.getMonthlyEvolution(new Date().getFullYear()),
                API.getCategoryBreakdown()
            ]);

            const balanceColor = summary.totalBalance >= 0 ? 'var(--accent)' : 'var(--red)';
            const netColor = summary.netBalance >= 0 ? 'var(--accent)' : 'var(--red)';

            container.innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-3 col-6">
                        <div class="stat-card" style="border-top: 2px solid var(--accent)">
                            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)"><i class="bi bi-wallet2"></i></div>
                            <div class="stat-value" style="color:${balanceColor}">${this.formatCurrency(summary.totalBalance)}</div>
                            <div class="stat-label">Saldo Total</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stat-card" style="border-top: 2px solid var(--green)">
                            <div class="stat-icon" style="background:var(--green-dim);color:var(--green)"><i class="bi bi-arrow-up-circle"></i></div>
                            <div class="stat-value" style="color:var(--green)">${this.formatCurrency(summary.monthlyIncome)}</div>
                            <div class="stat-label">Receitas do Mês</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stat-card" style="border-top: 2px solid var(--red)">
                            <div class="stat-icon" style="background:var(--red-dim);color:var(--red)"><i class="bi bi-arrow-down-circle"></i></div>
                            <div class="stat-value" style="color:var(--red)">${this.formatCurrency(summary.monthlyExpenses)}</div>
                            <div class="stat-label">Despesas do Mês</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stat-card" style="border-top: 2px solid var(--accent)">
                            <div class="stat-icon" style="background:var(--accent-dim);color:var(--accent)"><i class="bi bi-piggy-bank"></i></div>
                            <div class="stat-value" style="color:${netColor}">${this.formatCurrency(summary.netBalance)}</div>
                            <div class="stat-label">Balanço do Mês</div>
                        </div>
                    </div>
                </div>

                <div class="row g-3">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header">
                                <h6>Evolução Mensal</h6>
                                <span style="display:flex;gap:1rem;font-size:0.75rem">
                                    <span style="color:var(--green)"><i class="bi bi-circle-fill" style="font-size:0.5rem;margin-right:0.25rem"></i>Receitas</span>
                                    <span style="color:var(--red)"><i class="bi bi-circle-fill" style="font-size:0.5rem;margin-right:0.25rem"></i>Despesas</span>
                                </span>
                            </div>
                            <div class="chart-container">
                                <canvas id="monthlyChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="card">
                            <div class="card-header">
                                <h6>Gastos por Categoria</h6>
                            </div>
                            <div class="chart-container chart-container-sm">
                                <canvas id="categoryChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mt-3">
                    <div class="card-header">
                        <h6>Despesas por Categoria - Detalhado</h6>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr><th>Categoria</th><th>Tipo</th><th>Valor</th><th>%</th></tr>
                            </thead>
                            <tbody>
                                ${(categories.categories || []).filter(c => c.type === 'despesa').map(c => `
                                    <tr>
                                        <td><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${c.color};margin-right:0.5rem"></span>${c.name}</td>
                                        <td><span class="badge-despesa">${c.type}</span></td>
                                        <td style="color:var(--red)">${this.formatCurrency(c.total)}</td>
                                        <td>
                                            <div style="display:flex;align-items:center;gap:0.5rem">
                                                <div class="progress flex-grow-1" style="height:6px;width:100px">
                                                    <div class="progress-bar" style="width:${c.percentage || 0}%;background:${c.color || 'var(--red)'}"></div>
                                                </div>
                                                <span style="font-size:0.8rem;color:var(--text-secondary)">${c.percentage || 0}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="4" class="text-center text-secondary">Nenhum gasto no período</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            setTimeout(() => {
                this.renderMonthlyChart(monthly);
                this.renderCategoryChart(categories);
            }, 50);
        } catch (err) {
            container.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle me-2"></i>${err.message}</div>`;
        }
    },

    renderMonthlyChart(data) {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;
        const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        const labels = (data || []).map(d => months[d.month - 1]);
        const income = (data || []).map(d => d.income || 0);
        const expenses = (data || []).map(d => d.expenses || 0);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Receitas', data: income, backgroundColor: 'rgba(34,197,94,0.6)', hoverBackgroundColor: 'rgba(34,197,94,0.8)', borderRadius: 6, borderSkipped: false },
                    { label: 'Despesas', data: expenses, backgroundColor: 'rgba(239,68,68,0.6)', hoverBackgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 6, borderSkipped: false }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#64748b', font: { size: 11 } }, grid: { color: 'rgba(51,65,85,0.3)' } },
                    y: { ticks: { color: '#64748b', callback: v => 'R$ ' + v, font: { size: 11 } }, grid: { color: 'rgba(51,65,85,0.3)' } }
                }
            }
        });
    },

    renderCategoryChart(data) {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        const cats = (data.categories || []).filter(c => c.type === 'despesa');
        const total = cats.reduce((s, c) => s + parseFloat(c.total || 0), 0);
        if (total === 0) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: cats.map(c => c.name),
                datasets: [{
                    data: cats.map(c => c.total),
                    backgroundColor: cats.map(c => c.color || '#64748b'),
                    borderWidth: 2,
                    borderColor: 'var(--bg-card)'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } }
                }
            }
        });
    },

    /* ===== TRANSACTIONS ===== */
    async renderTransactions(container) {
        let currentPage = 1;
        const loadTransactions = async (page = 1) => {
            container.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';
            try {
                const search = document.getElementById('searchTrans')?.value || '';
                const type = document.getElementById('filterType')?.value || '';
                const category = document.getElementById('filterCategory')?.value || '';
                const period = document.getElementById('filterPeriod')?.value || '';

                const params = { page, limit: 15 };
                if (search) params.search = search;
                if (type) params.type = type;
                if (category) params.categoryId = category;
                if (period) {
                    const now = new Date();
                    if (period === 'month') {
                        params.startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                        params.endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                    } else if (period === 'quarter') {
                        const qStart = Math.floor(now.getMonth() / 3) * 3;
                        params.startDate = new Date(now.getFullYear(), qStart, 1).toISOString().split('T')[0];
                        params.endDate = new Date(now.getFullYear(), qStart + 3, 0).toISOString().split('T')[0];
                    } else if (period === 'year') {
                        params.startDate = `${now.getFullYear()}-01-01`;
                        params.endDate = `${now.getFullYear()}-12-31`;
                    }
                }

                const [data, cats] = await Promise.all([
                    API.getTransactions(params),
                    API.getCategories()
                ]);
                this.categories = cats || [];

                container.innerHTML = `
                    <div class="card animate-fade-in">
                        <div class="card-header">
                            <h6>Todas as Transações</h6>
                            <button class="btn btn-primary btn-sm" onclick="App.showTransactionModal()">
                                <i class="bi bi-plus-lg"></i> Nova
                            </button>
                        </div>
                        <div class="row g-2 mb-3 px-3">
                            <div class="col-md-3 col-6">
                                <input type="text" class="form-control" id="searchTrans" placeholder="Buscar..." oninput="App.debouncedReload()">
                            </div>
                            <div class="col-md-2 col-6">
                                <select class="form-select" id="filterPeriod" onchange="App.debouncedReload()">
                                    <option value="">Período</option>
                                    <option value="month">Este mês</option>
                                    <option value="quarter">Este trimestre</option>
                                    <option value="year">Este ano</option>
                                </select>
                            </div>
                            <div class="col-md-2 col-6">
                                <select class="form-select" id="filterType" onchange="App.debouncedReload()">
                                    <option value="">Todos</option>
                                    <option value="receita">Receitas</option>
                                    <option value="despesa">Despesas</option>
                                </select>
                            </div>
                            <div class="col-md-3 col-6">
                                <select class="form-select" id="filterCategory" onchange="App.debouncedReload()">
                                    <option value="">Todas categorias</option>
                                    ${(this.categories || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="col-md-2 col-12">
                                <button class="btn btn-outline-secondary w-100" onclick="App.exportCSV()">
                                    <i class="bi bi-download"></i> Exportar
                                </button>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th>Valor</th><th style="width:80px">Ações</th></tr>
                                </thead>
                                <tbody>
                                    ${(data.transactions || data.rows || []).map(t => {
                                        const catIcon = t.category?.icon || 'tag';
                                        const catColor = t.category?.color || '#64748b';
                                        return `
                                        <tr>
                                            <td style="white-space:nowrap;font-size:0.8rem;color:var(--text-secondary)">${new Date(t.transactionDate || t.transaction_date).toLocaleDateString('pt-BR')}</td>
                                            <td><strong>${t.description || '-'}</strong></td>
                                            <td>${t.category ? `<span style="display:inline-flex;align-items:center;gap:0.35rem"><span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${catColor}"></span>${t.category.name}</span>` : '<span class="text-muted">—</span>'}</td>
                                            <td><span class="badge-${t.type === 'receita' ? 'receita' : 'despesa'}">${t.type}</span></td>
                                            <td style="color:${t.type === 'receita' ? 'var(--green)' : 'var(--red)'};font-weight:600;font-variant-numeric:tabular-nums">${this.formatCurrency(t.amount)}</td>
                                            <td>
                                                <div style="display:flex;gap:0.35rem">
                                                    <button class="btn btn-sm btn-outline-secondary" onclick="App.showTransactionModal('${t.id}')" title="Editar"><i class="bi bi-pencil"></i></button>
                                                    <button class="btn btn-sm btn-outline-danger" onclick="App.deleteTransaction('${t.id}')" title="Excluir"><i class="bi bi-trash"></i></button>
                                                </div>
                                            </td>
                                        </tr>`;
                                    }).join('') || '<tr><td colspan="6" class="text-center text-secondary py-4">Nenhuma transação encontrada</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                        ${this.renderPagination(data.pagination || data, page, loadTransactions)}
                    </div>
                `;
            } catch (err) {
                container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
            }
        };
        await loadTransactions(1);
        window.loadTransactions = loadTransactions;
    },

    debounceTimer: null,
    debouncedReload() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const container = document.getElementById('page-content');
            this.renderTransactions(container);
        }, 300);
    },

    exportCSV() {
        const search = document.getElementById('searchTrans')?.value || '';
        const type = document.getElementById('filterType')?.value || '';
        const category = document.getElementById('filterCategory')?.value || '';
        const params = {};
        if (search) params.search = search;
        if (type) params.type = type;
        if (category) params.categoryId = category;
        API.exportCSV(params);
    },

    renderPagination(pagination, currentPage, loadFn) {
        if (!pagination || pagination.totalPages <= 1) return '';
        const pages = [];
        const total = pagination.totalPages;
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= currentPage - 2 && i <= currentPage + 2)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }
        return `
            <nav class="d-flex justify-content-center mt-3">
                <ul class="pagination">
                    <li class="page-item ${currentPage <= 1 ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="event.preventDefault(); loadTransactions(${currentPage - 1})">Anterior</a>
                    </li>
                    ${pages.map(p => p === '...' ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : `
                        <li class="page-item ${p === currentPage ? 'active' : ''}">
                            <a class="page-link" href="#" onclick="event.preventDefault(); loadTransactions(${p})">${p}</a>
                        </li>
                    `).join('')}
                    <li class="page-item ${currentPage >= pagination.totalPages ? 'disabled' : ''}">
                        <a class="page-link" href="#" onclick="event.preventDefault(); loadTransactions(${currentPage + 1})">Próximo</a>
                    </li>
                </ul>
            </nav>
        `;
    },

    async showTransactionModal(id = null) {
        const isEdit = !!id;
        const [cats, accounts] = await Promise.all([API.getCategories(), API.getAccounts()]);

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'transactionModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content animate-scale-in">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-${isEdit ? 'pencil' : 'plus-circle'} me-2" style="color:var(--accent)"></i>${isEdit ? 'Editar' : 'Nova'} Transação</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="transactionForm">
                            <input type="hidden" id="transId" value="${id || ''}">
                            <div class="row g-3">
                                <div class="col-6">
                                    <label class="form-label">Tipo</label>
                                    <select class="form-select" id="transType" required>
                                        <option value="despesa">💰 Despesa</option>
                                        <option value="receita">📈 Receita</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Data</label>
                                    <input type="date" class="form-control" id="transDate">
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Descrição</label>
                                    <input type="text" class="form-control" id="transDescription" placeholder="Ex: Almoço no restaurante">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Valor (R$)</label>
                                    <input type="number" step="0.01" class="form-control" id="transAmount" required placeholder="0,00">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Categoria</label>
                                    <select class="form-select" id="transCategory">
                                        <option value="">🤖 IA classifica</option>
                                        ${(cats || []).map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Conta</label>
                                    <select class="form-select" id="transAccount">
                                        <option value="">Selecione</option>
                                        ${(accounts || []).map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Observações</label>
                                    <textarea class="form-control" id="transNotes" rows="1" style="resize:none"></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button class="btn btn-primary" onclick="App.saveTransaction()">${isEdit ? '<i class="bi bi-check-lg"></i> Salvar' : '<i class="bi bi-plus-lg"></i> Criar'}</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        if (isEdit) {
            try {
                const t = await API.getTransaction(id);
                document.getElementById('transType').value = t.type;
                document.getElementById('transDescription').value = t.description || '';
                document.getElementById('transAmount').value = t.amount;
                document.getElementById('transCategory').value = t.categoryId || '';
                document.getElementById('transAccount').value = t.accountId || '';
                document.getElementById('transDate').value = (t.transactionDate || t.transaction_date || '').split('T')[0];
                document.getElementById('transNotes').value = t.notes || '';
            } catch (err) {
                this.toast('Erro ao carregar transação', 'error');
                modal.remove();
                return;
            }
        } else {
            document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
        }

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    },

    async saveTransaction() {
        const id = document.getElementById('transId').value;
        const data = {
            type: document.getElementById('transType').value,
            description: document.getElementById('transDescription').value,
            amount: parseFloat(document.getElementById('transAmount').value),
            categoryId: document.getElementById('transCategory').value || null,
            accountId: document.getElementById('transAccount').value || null,
            transactionDate: document.getElementById('transDate').value,
            notes: document.getElementById('transNotes').value || null
        };
        if (!data.description) return this.toast('Informe uma descrição', 'warning');
        if (!data.amount || data.amount <= 0) return this.toast('Informe um valor válido', 'warning');

        try {
            if (id) {
                await API.updateTransaction(id, data);
                this.toast('Transação atualizada!', 'success');
            } else {
                await API.createTransaction(data);
                this.toast('Transação criada!', 'success');
            }
            bootstrap.Modal.getInstance(document.getElementById('transactionModal')).hide();
            this.renderPage('transactions');
        } catch (err) {
            this.toast(err.message || 'Erro ao salvar', 'error');
        }
    },

    async deleteTransaction(id) {
        if (!confirm('Tem certeza que deseja excluir esta transação?')) return;
        try {
            await API.deleteTransaction(id);
            this.toast('Transação excluída', 'success');
            this.renderPage('transactions');
        } catch (err) {
            this.toast(err.message || 'Erro ao excluir', 'error');
        }
    },

    /* ===== CATEGORIES ===== */
    async renderCategories(container) {
        container.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';
        try {
            const data = await API.getCategories();
            container.innerHTML = `
                <div class="card animate-fade-in">
                    <div class="card-header">
                        <h6>Categorias</h6>
                        <button class="btn btn-primary btn-sm" onclick="App.showCategoryModal()"><i class="bi bi-plus-lg"></i> Nova</button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr><th>Cor</th><th>Nome</th><th>Tipo</th><th>Limite</th><th style="width:80px">Ações</th></tr>
                            </thead>
                            <tbody>
                                ${(data || []).map(c => `
                                    <tr>
                                        <td><span style="display:inline-block;width:24px;height:24px;border-radius:6px;background:${c.color};vertical-align:middle"></span></td>
                                        <td><strong>${c.name}</strong></td>
                                        <td><span class="badge-${c.type}">${c.type}</span></td>
                                        <td>${c.monthlyLimit ? this.formatCurrency(c.monthlyLimit) : '<span class="text-muted">—</span>'}</td>
                                        <td>
                                            <div style="display:flex;gap:0.35rem">
                                                <button class="btn btn-sm btn-outline-secondary" onclick="App.showCategoryModal('${c.id}')"><i class="bi bi-pencil"></i></button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="App.deleteCategory('${c.id}')"><i class="bi bi-trash"></i></button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="5" class="text-center text-secondary py-4">Nenhuma categoria</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    },

    async showCategoryModal(id = null) {
        const isEdit = !!id;
        let cat = {};
        if (isEdit) { try { cat = await API.getCategory(id); } catch {} }

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'categoryModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content animate-scale-in">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-tag me-2" style="color:var(--accent)"></i>${isEdit ? 'Editar' : 'Nova'} Categoria</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="categoryForm">
                            <input type="hidden" id="catId" value="${id || ''}">
                            <div class="mb-3">
                                <label class="form-label">Nome</label>
                                <input type="text" class="form-control" id="catName" value="${cat.name || ''}" required>
                            </div>
                            <div class="row g-3">
                                <div class="col-6">
                                    <label class="form-label">Tipo</label>
                                    <select class="form-select" id="catType">
                                        <option value="despesa" ${cat.type === 'despesa' ? 'selected' : ''}>Despesa</option>
                                        <option value="receita" ${cat.type === 'receita' ? 'selected' : ''}>Receita</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Cor</label>
                                    <input type="color" class="form-control form-control-color" id="catColor" value="${cat.color || '#6c757d'}" style="height:40px;padding:0.25rem">
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Ícone (Bootstrap Icons)</label>
                                    <input type="text" class="form-control" id="catIcon" value="${cat.icon || 'tag'}" placeholder="Ex: cart, house, car-front">
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Limite Mensal (R$)</label>
                                    <input type="number" step="0.01" class="form-control" id="catLimit" value="${cat.monthlyLimit || ''}" placeholder="0,00">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button class="btn btn-primary" onclick="App.saveCategory()">Salvar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    },

    async saveCategory() {
        const id = document.getElementById('catId').value;
        const data = {
            name: document.getElementById('catName').value,
            type: document.getElementById('catType').value,
            icon: document.getElementById('catIcon').value || 'tag',
            color: document.getElementById('catColor').value,
            monthlyLimit: parseFloat(document.getElementById('catLimit').value) || null
        };
        if (!data.name) return this.toast('Informe o nome da categoria', 'warning');
        try {
            if (id) await API.updateCategory(id, data);
            else await API.createCategory(data);
            bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
            this.toast(`Categoria ${id ? 'atualizada' : 'criada'}!`, 'success');
            this.renderPage('categories');
        } catch (err) {
            this.toast(err.message || 'Erro ao salvar', 'error');
        }
    },

    async deleteCategory(id) {
        if (!confirm('Excluir categoria? As transações associadas perderão a categoria.')) return;
        try { await API.deleteCategory(id); this.toast('Categoria excluída', 'success'); this.renderPage('categories'); }
        catch (err) { this.toast(err.message, 'error'); }
    },

    /* ===== ACCOUNTS ===== */
    async renderAccounts(container) {
        container.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';
        try {
            const data = await API.getAccounts();
            const total = (data || []).reduce((s, a) => s + parseFloat(a.balance || 0), 0);
            container.innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-4">
                        <div class="stat-card" style="border-top:2px solid var(--accent)">
                             <div class="stat-label">Saldo Total</div>
                            <div class="stat-value" style="color:var(--accent)">${this.formatCurrency(total)}</div>
                            <div class="stat-label">em ${(data || []).length} conta(s)</div>
                        </div>
                    </div>
                </div>
                <div class="card animate-fade-in">
                    <div class="card-header">
                        <h6>Contas Bancárias</h6>
                        <button class="btn btn-primary btn-sm" onclick="App.showAccountModal()"><i class="bi bi-plus-lg"></i> Nova</button>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead><tr><th>Nome</th><th>Tipo</th><th>Saldo</th><th>Moeda</th><th style="width:80px">Ações</th></tr></thead>
                            <tbody>
                                ${(data || []).map(a => {
                                    const typeNames = { checking: 'Conta Corrente', savings: 'Poupança', credit: 'Cartão', cash: 'Dinheiro', investment: 'Investimento' };
                                    return `
                                    <tr>
                                        <td><strong>${a.name}</strong></td>
                                        <td><span class="text-secondary">${typeNames[a.type] || a.type}</span></td>
                                        <td style="color:${a.balance >= 0 ? 'var(--green)' : 'var(--red)'};font-weight:600">${this.formatCurrency(a.balance)}</td>
                                        <td>${a.currency || 'BRL'}</td>
                                        <td>
                                            <div style="display:flex;gap:0.35rem">
                                                <button class="btn btn-sm btn-outline-secondary" onclick="App.showAccountModal('${a.id}')"><i class="bi bi-pencil"></i></button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="App.deleteAccount('${a.id}')"><i class="bi bi-trash"></i></button>
                                            </div>
                                        </td>
                                    </tr>`;
                                }).join('') || '<tr><td colspan="5" class="text-center text-secondary py-4">Nenhuma conta</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    },

    async showAccountModal(id = null) {
        const isEdit = !!id;
        let acc = {};
        if (isEdit) { try { acc = await API.getAccount(id); } catch {} }

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'accountModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content animate-scale-in">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-wallet2 me-2" style="color:var(--accent)"></i>${isEdit ? 'Editar' : 'Nova'} Conta</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="accountForm">
                            <input type="hidden" id="accId" value="${id || ''}">
                            <div class="mb-3">
                                <label class="form-label">Nome da Conta</label>
                                <input type="text" class="form-control" id="accName" value="${acc.name || ''}" required>
                            </div>
                            <div class="row g-3">
                                <div class="col-6">
                                    <label class="form-label">Tipo</label>
                                    <select class="form-select" id="accType">
                                        <option value="checking" ${acc.type === 'checking' ? 'selected' : ''}>Conta Corrente</option>
                                        <option value="savings" ${acc.type === 'savings' ? 'selected' : ''}>Poupança</option>
                                        <option value="credit" ${acc.type === 'credit' ? 'selected' : ''}>Cartão de Crédito</option>
                                        <option value="cash" ${acc.type === 'cash' ? 'selected' : ''}>Dinheiro</option>
                                        <option value="investment" ${acc.type === 'investment' ? 'selected' : ''}>Investimento</option>
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Moeda</label>
                                    <select class="form-select" id="accCurrency">
                                        <option value="BRL" ${(acc.currency||'BRL') === 'BRL' ? 'selected' : ''}>BRL (R$)</option>
                                        <option value="USD" ${acc.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
                                        <option value="EUR" ${acc.currency === 'EUR' ? 'selected' : ''}>EUR (€)</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Saldo</label>
                                    <input type="number" step="0.01" class="form-control" id="accBalance" value="${acc.balance || 0}">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button class="btn btn-primary" onclick="App.saveAccount()">Salvar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    },

    async saveAccount() {
        const id = document.getElementById('accId').value;
        const data = {
            name: document.getElementById('accName').value,
            type: document.getElementById('accType').value,
            balance: parseFloat(document.getElementById('accBalance').value) || 0,
            currency: document.getElementById('accCurrency').value
        };
        if (!data.name) return this.toast('Informe o nome da conta', 'warning');
        try {
            if (id) await API.updateAccount(id, data);
            else await API.createAccount(data);
            bootstrap.Modal.getInstance(document.getElementById('accountModal')).hide();
            this.toast(`Conta ${id ? 'atualizada' : 'criada'}!`, 'success');
            this.renderPage('accounts');
        } catch (err) {
            this.toast(err.message || 'Erro ao salvar', 'error');
        }
    },

    async deleteAccount(id) {
        if (!confirm('Excluir conta?')) return;
        try { await API.deleteAccount(id); this.toast('Conta excluída', 'success'); this.renderPage('accounts'); }
        catch (err) { this.toast(err.message, 'error'); }
    },

    /* ===== GOALS ===== */
    async renderGoals(container) {
        container.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';
        try {
            const data = await API.getSavingGoals();
            container.innerHTML = `
                <div class="card animate-fade-in">
                    <div class="card-header">
                        <h6>Metas de Economia</h6>
                        <button class="btn btn-primary btn-sm" onclick="App.showGoalModal()"><i class="bi bi-plus-lg"></i> Nova</button>
                    </div>
                    <div class="row g-3 p-3">
                        ${(data || []).map(g => {
                            const progress = g.targetAmount > 0 ? Math.min(100, (g.currentAmount / g.targetAmount) * 100) : 0;
                            const barColor = progress >= 100 ? 'var(--green)' : progress >= 50 ? 'var(--accent)' : 'var(--yellow)';
                            const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                            return `
                                <div class="col-md-6 col-lg-4">
                                    <div class="card budget-card h-100">
                                        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
                                            <div style="display:flex;align-items:center;gap:0.75rem">
                                                <div style="width:44px;height:44px;border-radius:12px;background:${g.color || '#a78bfa'}22;display:flex;align-items:center;justify-content:center;font-size:1.3rem">🎯</div>
                                                <div>
                                                    <h6 class="mb-0" style="font-size:0.95rem">${g.name}</h6>
                                                    <small class="text-muted">${g.completed ? '✅ Concluída' : daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} dias restantes` : '⏰ Prazo esgotado') : 'Sem prazo'}</small>
                                                </div>
                                            </div>
                                            <div style="display:flex;gap:0.35rem">
                                                <button class="btn btn-sm btn-outline-secondary" onclick="App.showGoalModal('${g.id}')"><i class="bi bi-pencil"></i></button>
                                                <button class="btn btn-sm btn-outline-danger" onclick="App.deleteGoal('${g.id}')"><i class="bi bi-trash"></i></button>
                                            </div>
                                        </div>
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem">
                                            <span style="font-weight:600;font-size:1.1rem">${this.formatCurrency(g.currentAmount)}</span>
                                            <span class="text-muted" style="font-size:0.8rem">${this.formatCurrency(g.targetAmount)}</span>
                                        </div>
                                        <div class="progress" style="height:8px;background:rgba(148,163,184,0.1)">
                                            <div class="progress-bar" style="width:${progress}%;background:${barColor}" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                        <small class="mt-2" style="color:${progress >= 100 ? 'var(--green)' : 'var(--text-secondary)'};font-weight:500">${progress.toFixed(0)}% concluído</small>
                                    </div>
                                </div>
                            `;
                        }).join('') || '<div class="col-12 text-center text-secondary py-5"><i class="bi bi-piggy-bank" style="font-size:2.5rem;opacity:0.4;display:block;margin-bottom:1rem"></i>Nenhuma meta criada ainda</div>'}
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    },

    async showGoalModal(id = null) {
        const isEdit = !!id;
        let goal = {};
        if (isEdit) { try { goal = await API.getSavingGoal(id); } catch {} }

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'goalModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content animate-scale-in">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-piggy-bank me-2" style="color:var(--accent)"></i>${isEdit ? 'Editar' : 'Nova'} Meta</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="goalForm">
                            <input type="hidden" id="goalId" value="${id || ''}">
                            <div class="mb-3">
                                <label class="form-label">Nome da Meta</label>
                                <input type="text" class="form-control" id="goalName" value="${goal.name || ''}" required placeholder="Ex: Viagem para Europa">
                            </div>
                            <div class="row g-3">
                                <div class="col-6">
                                    <label class="form-label">Valor Alvo</label>
                                    <input type="number" step="0.01" class="form-control" id="goalTarget" value="${goal.targetAmount || ''}" required>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Valor Atual</label>
                                    <input type="number" step="0.01" class="form-control" id="goalCurrent" value="${goal.currentAmount || 0}">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Prazo</label>
                                    <input type="date" class="form-control" id="goalDeadline" value="${goal.deadline ? goal.deadline.split('T')[0] : ''}">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Cor</label>
                                    <input type="color" class="form-control form-control-color" id="goalColor" value="${goal.color || '#a78bfa'}" style="height:40px;padding:0.25rem">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button class="btn btn-primary" onclick="App.saveGoal()">Salvar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    },

    async saveGoal() {
        const id = document.getElementById('goalId').value;
        const data = {
            name: document.getElementById('goalName').value,
            targetAmount: parseFloat(document.getElementById('goalTarget').value),
            currentAmount: parseFloat(document.getElementById('goalCurrent').value) || 0,
            deadline: document.getElementById('goalDeadline').value || null,
            color: document.getElementById('goalColor').value
        };
        if (!data.name) return this.toast('Informe o nome da meta', 'warning');
        if (!data.targetAmount || data.targetAmount <= 0) return this.toast('Informe um valor alvo', 'warning');
        try {
            if (id) await API.updateSavingGoal(id, data);
            else await API.createSavingGoal(data);
            bootstrap.Modal.getInstance(document.getElementById('goalModal')).hide();
            this.toast(`Meta ${id ? 'atualizada' : 'criada'}!`, 'success');
            this.renderPage('goals');
        } catch (err) {
            this.toast(err.message || 'Erro ao salvar', 'error');
        }
    },

    async deleteGoal(id) {
        if (!confirm('Excluir meta?')) return;
        try { await API.deleteSavingGoal(id); this.toast('Meta excluída', 'success'); this.renderPage('goals'); }
        catch (err) { this.toast(err.message, 'error'); }
    },

    /* ===== SPENDING CALENDAR HEATMAP (THE BIG DIFFERENTIATOR) ===== */
    async renderCalendarHeatmap(container) {
        container.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';
        try {
            const year = new Date().getFullYear();
            const data = await API.getCalendar(year);
            const dayTotals = {};
            let maxTotal = 0;
            (data || []).forEach(d => {
                dayTotals[d.date] = d.total;
                if (d.total > maxTotal) maxTotal = d.total;
            });

            const getLevel = (total) => {
                if (total === 0) return 0;
                if (!maxTotal) return 0;
                const ratio = total / maxTotal;
                if (ratio <= 0.2) return 1;
                if (ratio <= 0.4) return 2;
                if (ratio <= 0.6) return 3;
                if (ratio <= 0.8) return 4;
                return 5;
            };

            const dayLabels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
            const today = new Date().toISOString().split('T')[0];
            const totalSpent = (data || []).reduce((s, d) => s + d.total, 0);
            const avgDaily = (data || []).length > 0 ? (data || []).reduce((s, d) => s + d.total, 0) / (data || []).length : 0;

            container.innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-3 col-6">
                        <div class="stat-card" style="border-top:2px solid var(--accent)">
                             <div class="stat-label">Total Gasto em ${year}</div>
                            <div class="stat-value" style="color:var(--red);font-size:1.3rem">${this.formatCurrency(totalSpent)}</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stat-card" style="border-top:2px solid var(--accent)">
                             <div class="stat-label">Média por Dia</div>
                            <div class="stat-value" style="color:var(--accent);font-size:1.3rem">${this.formatCurrency(avgDaily)}</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stat-card" style="border-top:2px solid var(--yellow)">
                             <div class="stat-label">Dias com Gastos</div>
                            <div class="stat-value" style="color:var(--yellow);font-size:1.3rem">${(data || []).length}</div>
                        </div>
                    </div>
                    <div class="col-md-3 col-6">
                        <div class="stat-card" style="border-top:2px solid var(--accent)">
                             <div class="stat-label">Maior Gasto (dia)</div>
                            <div class="stat-value" style="color:var(--accent);font-size:1.3rem">${this.formatCurrency(maxTotal)}</div>
                        </div>
                    </div>
                </div>

                <div class="card animate-fade-in">
                    <div class="card-header">
                        <h6><i class="bi bi-calendar-heart me-2" style="color:var(--accent)"></i>Mapa de Calor de Gastos - ${year}</h6>
                        <span style="font-size:0.75rem;color:var(--text-muted)">Passe o mouse sobre os dias para detalhes</span>
                    </div>
                    <div class="heatmap-container">
                        ${[0,1,2,3,5,6,7,8,9,10,11].map(m => {
                            const firstDay = new Date(year, m, 1).getDay();
                            const daysInMonth = new Date(year, m + 1, 0).getDate();
                            const days = [];
                            for (let i = 0; i < firstDay; i++) days.push('<div class="heatmap-day empty"></div>');
                            for (let d = 1; d <= daysInMonth; d++) {
                                const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                const total = dayTotals[dateStr] || 0;
                                const level = getLevel(total);
                                const isToday = dateStr === today ? ' today' : '';
                                days.push(`
                                    <div class="heatmap-day level-${level}${isToday}" title="${dateStr}: ${this.formatCurrency(total)}">
                                        <div class="heatmap-tooltip">${dateStr}<br><strong>${this.formatCurrency(total)}</strong></div>
                                    </div>
                                `);
                            }
                            return `
                                <div class="heatmap-month">
                                    <div class="heatmap-month-label">${this.monthNames[m]}</div>
                                    <div class="heatmap-grid">
                                        ${dayLabels.map(l => `<div class="heatmap-day-label">${l}</div>`).join('')}
                                        ${days.join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class="heatmap-legend">
                        <span>Menos</span>
                        <div class="legend-item level-0"></div>
                        <div class="legend-item level-1"></div>
                        <div class="legend-item level-2"></div>
                        <div class="legend-item level-3"></div>
                        <div class="legend-item level-4"></div>
                        <div class="legend-item level-5"></div>
                        <span>Mais</span>
                        <span style="margin-left:1rem">🟢 Hoje</span>
                    </div>
                </div>

                <div class="card mt-3">
                    <div class="card-header">
                        <h6>Gastos Recentes</h6>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead><tr><th>Data</th><th>Valor</th></tr></thead>
                            <tbody>
                                ${(data || []).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map(d => `
                                    <tr>
                                        <td>${new Date(d.date).toLocaleDateString('pt-BR')}</td>
                                        <td style="color:var(--red);font-weight:600">${this.formatCurrency(d.total)}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="2" class="text-center text-secondary py-4">Nenhum gasto registrado neste ano</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    },

    monthNames: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],

    /* ===== BUDGETS ===== */
    async renderBudgets(container) {
        container.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';
        try {
            const now = new Date();
            const [budgets, categories] = await Promise.all([
                API.getBudgets({ month: now.getMonth() + 1, year: now.getFullYear() }),
                API.getCategories()
            ]);
            this.categories = categories || [];

            container.innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-md-4 col-6">
                        <div class="stat-card" style="border-top:2px solid var(--accent)">
                             <div class="stat-label">Orçamentos Ativos</div>
                            <div class="stat-value" style="color:var(--accent);font-size:1.3rem">${(budgets || []).length}</div>
                        </div>
                    </div>
                    <div class="col-md-4 col-6">
                        <div class="stat-card" style="border-top:2px solid var(--green)">
                             <div class="stat-label">Dentro do Orçamento</div>
                            <div class="stat-value" style="color:var(--green);font-size:1.3rem">${(budgets || []).filter(b => b.percentage < 80).length}</div>
                        </div>
                    </div>
                    <div class="col-md-4 col-6">
                        <div class="stat-card" style="border-top:2px solid var(--red)">
                             <div class="stat-label">Estourados</div>
                            <div class="stat-value" style="color:var(--red);font-size:1.3rem">${(budgets || []).filter(b => b.percentage >= 100).length}</div>
                        </div>
                    </div>
                </div>

                <div class="card animate-fade-in">
                    <div class="card-header">
                        <h6><i class="bi bi-pie-chart me-2" style="color:var(--accent)"></i>Orçamentos Mensais - ${this.monthNames[now.getMonth()]}</h6>
                        <button class="btn btn-primary btn-sm" onclick="App.showBudgetModal()"><i class="bi bi-plus-lg"></i> Novo</button>
                    </div>
                    <div class="row g-3 p-3">
                        ${(budgets || []).map(b => {
                            const pct = b.percentage;
                            const statusClass = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success';
                            const circumference = 2 * Math.PI * 34;
                            const offset = circumference - (pct / 100) * circumference;
                            const catName = b.category ? b.category.name : 'Geral';
                            const catColor = b.category ? b.category.color : '#06b6d4';
                            return `
                                <div class="col-md-6 col-lg-4">
                                    <div class="card budget-card">
                                        <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.75rem">
                                            <div class="budget-ring ${statusClass}">
                                                <svg width="80" height="80" viewBox="0 0 80 80">
                                                    <circle class="ring-bg" cx="40" cy="40" r="34"/>
                                                    <circle class="ring-fill" cx="40" cy="40" r="34" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" style="stroke:${pct >= 100 ? '#ef4444' : pct >= 80 ? '#eab308' : '#22c55e'}"/>
                                                </svg>
                                                <div class="ring-center" style="color:${pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--yellow)' : 'var(--green)'}">${pct.toFixed(0)}%</div>
                                            </div>
                                            <div style="flex:1;min-width:0">
                                                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                                                    <div>
                                                        <strong style="font-size:0.9rem">${catName}</strong>
                                                        ${b.category ? '' : '<span class="badge-despesa" style="font-size:0.65rem">geral</span>'}
                                                    </div>
                                                    <div style="display:flex;gap:0.25rem">
                                                        <button class="btn btn-sm btn-outline-secondary" onclick="App.showBudgetModal('${b.id}')" style="padding:0.2rem 0.4rem;font-size:0.7rem"><i class="bi bi-pencil"></i></button>
                                                        <button class="btn btn-sm btn-outline-danger" onclick="App.deleteBudget('${b.id}')" style="padding:0.2rem 0.4rem;font-size:0.7rem"><i class="bi bi-trash"></i></button>
                                                    </div>
                                                </div>
                                                <div style="margin-top:0.35rem">
                                                    <span style="font-weight:600;font-size:0.95rem">${this.formatCurrency(b.spent)}</span>
                                                    <span class="text-muted" style="font-size:0.8rem"> / ${this.formatCurrency(b.limitAmount)}</span>
                                                </div>
                                                <div style="display:flex;justify-content:space-between;margin-top:0.25rem">
                                                    <span style="font-size:0.7rem;color:${pct >= 100 ? 'var(--red)' : 'var(--text-secondary)'}">
                                                        ${pct >= 100 ? '⚠️ Limite excedido' : `${this.formatCurrency(b.remaining)} restantes`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('') || '<div class="col-12 text-center text-secondary py-5"><i class="bi bi-pie-chart" style="font-size:2.5rem;opacity:0.4;display:block;margin-bottom:1rem"></i>Nenhum orçamento definido</div>'}
                    </div>
                </div>
            `;
        } catch (err) {
            container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    },

    async showBudgetModal(id = null) {
        const isEdit = !!id;
        let budget = {};
        if (isEdit) { try { budget = await API.getBudget(id); } catch {} }

        const cats = this.categories || [];
        const now = new Date();

        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.id = 'budgetModal';
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content animate-scale-in">
                    <div class="modal-header">
                        <h5 class="modal-title"><i class="bi bi-pie-chart me-2" style="color:var(--accent)"></i>${isEdit ? 'Editar' : 'Novo'} Orçamento</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="budgetForm">
                            <input type="hidden" id="budgetId" value="${id || ''}">
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label">Categoria</label>
                                    <select class="form-select" id="budgetCategory">
                                        <option value="">Orçamento Geral</option>
                                        ${cats.filter(c => c.type === 'despesa').map(c => `<option value="${c.id}" ${budget.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Mês</label>
                                    <select class="form-select" id="budgetMonth">
                                        ${['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((name, i) => `
                                            <option value="${i + 1}" ${(budget.month || now.getMonth() + 1) === i + 1 ? 'selected' : ''}>${name}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Ano</label>
                                    <input type="number" class="form-control" id="budgetYear" value="${budget.year || now.getFullYear()}" min="2024" max="2030">
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Limite (R$)</label>
                                    <input type="number" step="0.01" class="form-control" id="budgetLimit" value="${budget.limitAmount || ''}" required>
                                </div>
                                <div class="col-6">
                                    <label class="form-label">Alerta em (%)</label>
                                    <input type="number" class="form-control" id="budgetAlert" value="${budget.alertThreshold || 80}" min="1" max="100">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button class="btn btn-primary" onclick="App.saveBudget()">Salvar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    },

    async saveBudget() {
        const id = document.getElementById('budgetId').value;
        const data = {
            categoryId: document.getElementById('budgetCategory').value || null,
            month: parseInt(document.getElementById('budgetMonth').value),
            year: parseInt(document.getElementById('budgetYear').value),
            limitAmount: parseFloat(document.getElementById('budgetLimit').value),
            alertThreshold: parseInt(document.getElementById('budgetAlert').value) || 80
        };
        if (!data.limitAmount || data.limitAmount <= 0) return this.toast('Informe um limite válido', 'warning');
        try {
            if (id) await API.updateBudget(id, data);
            else await API.createBudget(data);
            bootstrap.Modal.getInstance(document.getElementById('budgetModal')).hide();
            this.toast(`Orçamento ${id ? 'atualizado' : 'criado'}!`, 'success');
            this.renderPage('budgets');
        } catch (err) {
            this.toast(err.message || 'Erro ao salvar', 'error');
        }
    },

    async deleteBudget(id) {
        if (!confirm('Excluir orçamento?')) return;
        try { await API.deleteBudget(id); this.toast('Orçamento excluído', 'success'); this.renderPage('budgets'); }
        catch (err) { this.toast(err.message, 'error'); }
    },

    /* ===== AI ===== */
    async renderAI(container) {
        const tips = await API.getTips().catch(() => ({ tips: [] }));
        container.innerHTML = `
            <div class="row g-3 animate-fade-in">
                <div class="col-lg-6">
                    <div class="card" id="aiAnalysisPanel">
                        <div class="card-header">
                            <h6>Análise de Gastos</h6>
                        </div>
                        <div class="text-center py-4" id="aiDefaultState">
                            <i class="bi bi-bar-chart-line" style="font-size:2.5rem;color:var(--text-muted);opacity:0.4;display:block;margin-bottom:0.75rem"></i>
                            <p class="text-secondary" style="font-size:0.9rem">Selecione uma análise para visualizar o resultado</p>
                        </div>
                        <div id="aiResultArea"></div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="card">
                        <div class="card-header">
                            <h6>Ações</h6>
                        </div>
                        <div style="display:flex;flex-direction:column;gap:0.75rem;padding:0.25rem 0">
                            <button class="btn btn-outline-secondary text-start" onclick="App.analyzeSpending()" id="btnAnalyze" style="padding:0.75rem 1rem">
                                <div style="display:flex;align-items:center;gap:0.75rem">
                                    <span style="width:36px;height:36px;border-radius:8px;background:var(--accent-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="bi bi-search" style="color:var(--accent)"></i></span>
                                    <div><strong style="font-size:0.9rem">Analisar Gastos</strong><br><small class="text-muted">Resumo detalhado do período atual</small></div>
                                </div>
                            </button>
                            <button class="btn btn-outline-secondary text-start" onclick="App.detectAnomalies()" id="btnAnomalies" style="padding:0.75rem 1rem">
                                <div style="display:flex;align-items:center;gap:0.75rem">
                                    <span style="width:36px;height:36px;border-radius:8px;background:var(--yellow-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="bi bi-exclamation-triangle" style="color:var(--yellow)"></i></span>
                                    <div><strong style="font-size:0.9rem">Detectar Anomalias</strong><br><small class="text-muted">Gastos fora do padrão habitual</small></div>
                                </div>
                            </button>
                            <button class="btn btn-outline-secondary text-start" onclick="App.getPredictions()" id="btnPredict" style="padding:0.75rem 1rem">
                                <div style="display:flex;align-items:center;gap:0.75rem">
                                    <span style="width:36px;height:36px;border-radius:8px;background:var(--accent-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="bi bi-graph-up-arrow" style="color:var(--accent)"></i></span>
                                    <div><strong style="font-size:0.9rem">Prever Despesas</strong><br><small class="text-muted">Projeção para os próximos meses</small></div>
                                </div>
                            </button>
                        </div>
                    </div>
                    <div class="card mt-3">
                        <div class="card-header"><h6>Dicas</h6></div>
                        <div style="max-height:240px;overflow-y:auto">
                            ${(tips.tips || ['Mantenha um controle regular dos seus gastos.','Defina metas financeiras mensais.','Use categorias para organizar suas despesas.']).map(t => `
                                <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:10px;padding:0.75rem 1rem;margin-bottom:0.5rem;font-size:0.85rem;line-height:1.5">${t}</div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async analyzeSpending() {
        const area = document.getElementById('aiResultArea');
        const defaultState = document.getElementById('aiDefaultState');
        const btn = document.getElementById('btnAnalyze');
        if (defaultState) defaultState.style.display = 'none';
        area.innerHTML = '<div class="text-center py-3"><span class="loading-spinner"></span></div>';
        btn.disabled = true;
        try {
            const result = await API.analyzeSpending({ period: 'month' });
            const msg = result.analysis || result.message || (Array.isArray(result) ? result.join('\n') : 'Nenhum dado relevante no período.');
            area.innerHTML = `<div class="animate-fade-in" style="padding:0.5rem 0"><div style="background:var(--accent-dim);border-radius:10px;padding:1rem;font-size:0.9rem;line-height:1.6;white-space:pre-wrap">${this.escapeHtml(msg)}</div></div>`;
        } catch {
            area.innerHTML = `<div class="alert alert-info">Nenhum gasto registrado neste período para análise.</div>`;
        }
        btn.disabled = false;
    },

    async detectAnomalies() {
        const area = document.getElementById('aiResultArea');
        const defaultState = document.getElementById('aiDefaultState');
        const btn = document.getElementById('btnAnomalies');
        if (defaultState) defaultState.style.display = 'none';
        area.innerHTML = '<div class="text-center py-3"><span class="loading-spinner"></span></div>';
        btn.disabled = true;
        try {
            const result = await API.getAnomalies();
            const anomalies = result.anomalies || [];
            if (anomalies.length === 0) {
                area.innerHTML = `<div class="animate-fade-in" style="padding:0.5rem 0"><div style="background:var(--green-dim);border-radius:10px;padding:1rem;display:flex;align-items:center;gap:0.75rem"><i class="bi bi-check-circle-fill" style="color:var(--green);font-size:1.2rem"></i><span style="font-size:0.9rem">Nenhuma anomalia detectada no período.</span></div></div>`;
            } else {
                const items = anomalies.map(a => `<div style="display:flex;align-items:start;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid var(--border-color)"><i class="bi bi-exclamation-triangle-fill" style="color:var(--yellow);margin-top:0.15rem"></i><span style="font-size:0.85rem">${a.description || a}</span></div>`).join('');
                area.innerHTML = `<div class="animate-fade-in" style="padding:0.5rem 0"><div class="card-header" style="padding:0.5rem 0"><h6>Anomalias Detectadas</h6></div>${items}</div>`;
            }
        } catch {
            area.innerHTML = `<div class="alert alert-info">Não foi possível verificar anomalias agora.</div>`;
        }
        btn.disabled = false;
    },

    async getPredictions() {
        const area = document.getElementById('aiResultArea');
        const defaultState = document.getElementById('aiDefaultState');
        const btn = document.getElementById('btnPredict');
        if (defaultState) defaultState.style.display = 'none';
        area.innerHTML = '<div class="text-center py-3"><span class="loading-spinner"></span></div>';
        btn.disabled = true;
        try {
            const result = await API.getPredictions();
            const predictions = result.predictions || result;
            const text = typeof predictions === 'string' ? predictions : (predictions.message || predictions.insight || 'Previsão não disponível.');
            area.innerHTML = `<div class="animate-fade-in" style="padding:0.5rem 0"><div style="background:var(--accent-dim);border-radius:10px;padding:1rem;font-size:0.9rem;line-height:1.6;white-space:pre-wrap">${this.escapeHtml(text)}</div></div>`;
        } catch {
            area.innerHTML = `<div class="alert alert-info">Sem dados suficientes para projeções.</div>`;
        }
        btn.disabled = false;
    },

    /* ===== REPORTS ===== */
    async renderReports(container) {
        container.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div></div>';

        try {
            const [byCategory, monthly] = await Promise.all([
                API.getReportByCategory(),
                API.getReportMonthly(new Date().getFullYear())
            ]);

            container.innerHTML = `
                <div class="row g-3 mb-4">
                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h6>Gastos por Categoria</h6>
                            </div>
                            <div class="chart-container chart-container-sm">
                                <canvas id="reportPieChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="card">
                            <div class="card-header">
                                <h6>Evolução Mensal</h6>
                            </div>
                            <div class="chart-container chart-container-sm">
                                <canvas id="reportBarChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h6>Detalhamento por Categoria</h6>
                        <div style="display:flex;gap:0.5rem">
                            <button class="btn btn-outline-secondary btn-sm" onclick="API.exportCSV()"><i class="bi bi-download"></i> Exportar CSV</button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead><tr><th>Categoria</th><th>Valor</th><th>%</th></tr></thead>
                            <tbody>
                                ${(byCategory.categories || []).map(c => `
                                    <tr>
                                        <td><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${c.color};margin-right:0.5rem"></span>${c.name}</td>
                                        <td style="font-weight:600">${this.formatCurrency(c.total)}</td>
                                        <td>
                                            <div class="progress" style="height:6px;width:100px;display:inline-block;vertical-align:middle;margin-right:0.5rem">
                                                <div class="progress-bar" style="width:${c.percentage || 0}%;background:${c.color || 'var(--accent)'}"></div>
                                            </div>
                                            <span style="font-size:0.8rem;color:var(--text-secondary)">${(c.percentage || 0).toFixed(1)}%</span>
                                        </td>
                                    </tr>
                                `).join('') || '<tr><td colspan="3" class="text-center text-secondary py-4">Nenhum dado disponível</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            setTimeout(() => {
                this.renderReportCharts(byCategory, monthly);
            }, 50);
        } catch (err) {
            container.innerHTML = `<div class="alert alert-danger">${err.message}</div>`;
        }
    },

    renderReportCharts(byCategory, monthly) {
        const pieCtx = document.getElementById('reportPieChart');
        if (pieCtx) {
            const cats = (byCategory.categories || byCategory || []).filter(c => parseFloat(c.total) > 0);
            if (cats.length) {
                new Chart(pieCtx, {
                    type: 'doughnut',
                    data: {
                        labels: cats.map(c => c.name),
                        datasets: [{
                            data: cats.map(c => c.total),
                            backgroundColor: cats.map(c => c.color || '#6c757d'),
                            borderWidth: 2,
                            borderColor: 'var(--bg-card)'
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        cutout: '60%',
                        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } } }
                    }
                });
            }
        }

        const barCtx = document.getElementById('reportBarChart');
        if (barCtx) {
            const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
            const data = monthly || [];
            new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: data.map(d => months[d.month - 1]),
                    datasets: [
                        { label: 'Receitas', data: data.map(d => d.income || 0), backgroundColor: 'rgba(34,197,94,0.6)', borderRadius: 6, borderSkipped: false },
                        { label: 'Despesas', data: data.map(d => d.expenses || 0), backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 6, borderSkipped: false }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
                    scales: {
                        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(51,65,85,0.3)' } },
                        y: { ticks: { color: '#64748b', callback: v => 'R$ ' + v }, grid: { color: 'rgba(51,65,85,0.3)' } }
                    }
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
