/**
 * MÓDULO DE AUTENTICAÇÃO - SISTEMA DE AGENDAMENTO DE BANCAS PPGD
 * 
 * Este módulo gerencia toda a lógica de autenticação do sistema,
 * incluindo login, logout, renovação de tokens e gerenciamento de sessão.
 * 
 * Funcionalidades:
 * - Autenticação de usuários
 * - Gerenciamento de tokens JWT
 * - Renovação automática de sessão
 * - Controle de acesso
 * 
 * @author Dev Team
 * @version 1.0.0
 * @since 2025
 */

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.authToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        
        // Configurações de API
        this.apiBaseUrl = config.API_BASE_URL || 'http://localhost:5000/api';
        this.authEndpoints = {
            login: '/auth/login',
            refresh: '/auth/refresh',
            logout: '/auth/logout',
            profile: '/auth/profile'
        };
        
        this.init();
    }

    /**
     * Inicializa o gerenciador de autenticação
     */
    init() {
        // Verificar se há tokens salvos
        this.checkStoredTokens();
        
        // Configurar interceptors para requisições
        this.setupInterceptors();
        
        // Verificar expiração do token periodicamente
        this.startTokenCheck();
    }

    /**
     * Verifica tokens armazenados no localStorage
     */
    checkStoredTokens() {
        try {
                const storedToken = localStorage.getItem('ppgd_auth_token');
    const storedRefresh = localStorage.getItem('ppgd_refresh_token');
    const storedUser = localStorage.getItem('ppgd_user');
            
            if (storedToken && storedRefresh && storedUser) {
                this.authToken = storedToken;
                this.refreshToken = storedRefresh;
                this.currentUser = JSON.parse(storedUser);
                
                // Verificar se o token ainda é válido
                if (this.isTokenValid()) {
                    this.isAuthenticated = true;
                    this.updateUIForAuthenticatedUser();
                } else {
                    // Token expirado, tentar refresh
                    this.refreshAuthToken();
                }
            }
        } catch (error) {
            console.error('Erro ao verificar tokens armazenados:', error);
            this.clearStoredTokens();
        }
    }

    /**
     * Verifica se o token atual é válido
     */
    isTokenValid() {
        if (!this.tokenExpiry) return false;
        return Date.now() < this.tokenExpiry;
    }

    /**
     * Realiza login do professor
     */
    async loginProfessor(email, password, rememberMe = false) {
        try {
            // Mostrar loading
            this.showLoading(true);
            
            // Validar entrada
            if (!this.validateLoginInput(email, password)) {
                return { success: false, message: 'Dados de entrada inválidos' };
            }

            // Preparar dados para envio
            const loginData = {
                email: email.toLowerCase().trim(),
                password: password,
                role: 'professor'
            };

            // Fazer requisição para o backend
            const response = await fetch(`${this.apiBaseUrl}${this.authEndpoints.login}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                // Login bem-sucedido
                await this.handleSuccessfulLogin(data, rememberMe);
                return { success: true, message: 'Login realizado com sucesso!' };
            } else {
                // Login falhou
                const errorMessage = this.handleLoginError(data, response.status);
                return { success: false, message: errorMessage };
            }

        } catch (error) {
            console.error('Erro durante login:', error);
            return { 
                success: false, 
                message: 'Erro de conexão. Verifique sua internet e tente novamente.' 
            };
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Valida dados de entrada do login
     */
    validateLoginInput(email, password) {
        // Validar email
        if (!email || !email.trim()) {
            this.showError('E-mail é obrigatório');
            return false;
        }

        if (!validation.isValidEmail(email)) {
            this.showError('Formato de e-mail inválido');
            return false;
        }

        // Validar senha
        if (!password || !password.trim()) {
            this.showError('Senha é obrigatória');
            return false;
        }

        if (password.length < 8) {
            this.showError('Senha deve ter pelo menos 8 caracteres');
            return false;
        }

        return true;
    }

    /**
     * Processa login bem-sucedido
     */
    async handleSuccessfulLogin(data, rememberMe) {
        // Armazenar tokens
        this.authToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.currentUser = data.user;
        this.tokenExpiry = Date.now() + (data.expiresIn * 1000);

        // Salvar no localStorage se "lembrar de mim" estiver marcado
        if (rememberMe) {
            this.saveTokensToStorage();
        }

        // Atualizar estado de autenticação
        this.isAuthenticated = true;

        // Atualizar UI
        this.updateUIForAuthenticatedUser();

        // Mostrar mensagem de sucesso
        this.showSuccess('Login realizado com sucesso! Redirecionando...');

        // Redirecionar para dashboard após delay
        setTimeout(() => {
            this.redirectToDashboard();
        }, 1500);
    }

    /**
     * Processa erros de login
     */
    handleLoginError(data, status) {
        let message = 'Erro durante o login';

        switch (status) {
            case 400:
                message = data.message || 'Dados de entrada inválidos';
                break;
            case 401:
                if (data.code === 'INVALID_CREDENTIALS') {
                    message = 'E-mail ou senha incorretos';
                } else if (data.code === 'ACCOUNT_LOCKED') {
                    message = 'Conta bloqueada por muitas tentativas. Tente novamente em 2 horas.';
                } else if (data.code === 'ACCOUNT_INACTIVE') {
                    message = 'Conta inativa. Entre em contato com o suporte.';
                } else {
                    message = 'Credenciais inválidas';
                }
                break;
            case 403:
                if (data.code === 'INSUFFICIENT_PERMISSIONS') {
                    message = 'Acesso negado. Apenas professores podem acessar esta área.';
                } else {
                    message = 'Acesso negado';
                }
                break;
            case 429:
                message = 'Muitas tentativas de login. Tente novamente em 15 minutos.';
                break;
            case 500:
                message = 'Erro interno do servidor. Tente novamente mais tarde.';
                break;
            default:
                message = data.message || 'Erro desconhecido';
        }

        this.showError(message);
        return message;
    }

    /**
     * Salva tokens no localStorage
     */
    saveTokensToStorage() {
        try {
                    localStorage.setItem('ppgd_auth_token', this.authToken);
        localStorage.setItem('ppgd_refresh_token', this.refreshToken);
        localStorage.setItem('ppgd_user', JSON.stringify(this.currentUser));
        localStorage.setItem('ppgd_token_expiry', this.tokenExpiry);
        } catch (error) {
            console.error('Erro ao salvar tokens:', error);
        }
    }

    /**
     * Limpa tokens armazenados
     */
    clearStoredTokens() {
        try {
                    localStorage.removeItem('ppgd_auth_token');
        localStorage.removeItem('ppgd_refresh_token');
        localStorage.removeItem('ppgd_user');
        localStorage.removeItem('ppgd_token_expiry');
        } catch (error) {
            console.error('Erro ao limpar tokens:', error);
        }
    }

    /**
     * Atualiza token de autenticação
     */
    async refreshAuthToken() {
        try {
            if (!this.refreshToken) {
                throw new Error('Refresh token não disponível');
            }

            const response = await fetch(`${this.apiBaseUrl}${this.authEndpoints.refresh}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.refreshToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.authToken = data.accessToken;
                this.tokenExpiry = Date.now() + (data.expiresIn * 1000);
                
                // Atualizar token no localStorage
                        if (localStorage.getItem('ppgd_auth_token')) {
            localStorage.setItem('ppgd_auth_token', this.authToken);
            localStorage.setItem('ppgd_token_expiry', this.tokenExpiry);
                }
                
                return true;
            } else {
                // Refresh falhou, fazer logout
                await this.logout();
                return false;
            }

        } catch (error) {
            console.error('Erro ao atualizar token:', error);
            await this.logout();
            return false;
        }
    }

    /**
     * Realiza logout do usuário
     */
    async logout() {
        try {
            // Notificar backend sobre logout
            if (this.authToken) {
                await fetch(`${this.apiBaseUrl}${this.authEndpoints.logout}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('Erro ao notificar logout:', error);
        } finally {
            // Limpar estado local
            this.isAuthenticated = false;
            this.currentUser = null;
            this.authToken = null;
            this.refreshToken = null;
            this.tokenExpiry = null;

            // Limpar tokens armazenados
            this.clearStoredTokens();

            // Atualizar UI
            this.updateUIForLoggedOutUser();

            // Redirecionar para página de login
            this.redirectToLogin();
        }
    }

    /**
     * Verifica permissões do usuário
     */
    hasPermission(permission) {
        if (!this.isAuthenticated || !this.currentUser) {
            return false;
        }

        const userRoles = this.currentUser.roles || [];
        
        // Mapear permissões para roles
        const permissionMap = {
            'view_agendamentos': ['professor', 'admin', 'secretaria'],
            'create_agendamentos': ['professor', 'admin'],
            'edit_agendamentos': ['professor', 'admin'],
            'delete_agendamentos': ['admin'],
            'manage_users': ['admin'],
            'view_reports': ['professor', 'admin', 'secretaria']
        };

        const requiredRoles = permissionMap[permission] || [];
        return requiredRoles.some(role => userRoles.includes(role));
    }

    /**
     * Obtém informações do usuário atual
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Verifica se o usuário está autenticado
     */
    isUserAuthenticated() {
        return this.isAuthenticated && this.isTokenValid();
    }

    /**
     * Atualiza UI para usuário autenticado
     */
    updateUIForAuthenticatedUser() {
        // Implementar conforme necessário
        console.log('Usuário autenticado:', this.currentUser);
    }

    /**
     * Atualiza UI para usuário deslogado
     */
    updateUIForLoggedOutUser() {
        // Implementar conforme necessário
        console.log('Usuário deslogado');
    }

    /**
     * Mostra mensagem de erro
     */
    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Ocultar após 5 segundos
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Mostra mensagem de sucesso
     */
    showSuccess(message) {
        const successElement = document.getElementById('successMessage');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            
            // Ocultar após 5 segundos
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Mostra/esconde loading
     */
    showLoading(show) {
        const button = document.getElementById('loginButton');
        const spinner = document.getElementById('loadingSpinner');
        const buttonText = document.getElementById('buttonText');
        
        if (button && spinner && buttonText) {
            if (show) {
                button.disabled = true;
                spinner.style.display = 'inline-block';
                buttonText.textContent = 'Entrando...';
            } else {
                button.disabled = false;
                spinner.style.display = 'none';
                buttonText.textContent = 'Entrar no Sistema';
            }
        }
    }

    /**
     * Redireciona para dashboard
     */
    redirectToDashboard() {
        // Redirecionar para dashboard do professor
        window.location.href = 'dashboard-professor.html';
    }

    /**
     * Redireciona para página de login
     */
    redirectToLogin() {
        window.location.href = 'login-professor.html';
    }

    /**
     * Configura interceptors para requisições
     */
    setupInterceptors() {
        // Interceptor para adicionar token em todas as requisições
        const originalFetch = window.fetch;
        window.fetch = async (url, options = {}) => {
            if (this.isAuthenticated && this.authToken) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${this.authToken}`
                };
            }
            return originalFetch(url, options);
        };
    }

    /**
     * Inicia verificação periódica do token
     */
    startTokenCheck() {
        setInterval(() => {
            if (this.isAuthenticated && this.tokenExpiry) {
                const timeUntilExpiry = this.tokenExpiry - Date.now();
                
                // Se o token expira em menos de 5 minutos, tentar refresh
                if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
                    this.refreshAuthToken();
                }
                
                // Se o token expirou, fazer logout
                if (timeUntilExpiry <= 0) {
                    this.logout();
                }
            }
        }, 60000); // Verificar a cada minuto
    }
}

// Exportar instância global
window.authManager = new AuthManager();
