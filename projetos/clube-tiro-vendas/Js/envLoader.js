/**
 * Carregador de Variáveis de Ambiente para Frontend
 * RangeClub Demo — Carregamento Seguro de Configurações (DEMO)
 */

(function() {
  'use strict';
  
  // Sistema de carregamento de variáveis de ambiente
  const EnvLoader = {
    // Cache das variáveis carregadas
    cache: {},
    
    // Configurações padrão
    defaults: {
      // Em DEMO, manter vazio para evitar conexões externas
      SUPABASE_URL: "",
      SUPABASE_ANON_KEY: "",
      NODE_ENV: "production",
      DEBUG_MODE: false,
      LOG_LEVEL: "error"
    },
    
    // Inicializar o carregador
    init() {
      this.loadFromEnvFile();
      this.loadFromMetaTags();
      this.loadFromLocalStorage();
      this.validateEnvironment();
    },
    
    // Carregar de arquivo .env (se disponível)
    loadFromEnvFile() {
      try {
        // Em ambiente de desenvolvimento, tentar carregar de arquivo
        if (typeof process !== 'undefined' && process.env) {
          Object.keys(process.env).forEach(key => {
            if (key.startsWith('SUPABASE_') || key.startsWith('NODE_ENV') || key.startsWith('DEBUG_')) {
              this.cache[key] = process.env[key];
            }
          });
        }
      } catch (error) {
        // Silencioso em produção
      }
    },
    
    // Carregar de meta tags HTML
    loadFromMetaTags() {
      try {
        const metaTags = document.querySelectorAll('meta[name^="env-"]');
        metaTags.forEach(tag => {
          const key = tag.getAttribute('name').replace('env-', '');
          const value = tag.getAttribute('content');
          if (key && value) {
            this.cache[key] = value;
          }
        });
      } catch (error) {
        // Silencioso em produção
      }
    },
    
    // Carregar de localStorage (para configurações locais)
    loadFromLocalStorage() {
      try {
        const stored = localStorage.getItem('maxgun_env');
        if (stored) {
          const parsed = JSON.parse(stored);
          Object.assign(this.cache, parsed);
        }
      } catch (error) {
        // Silencioso em produção
      }
    },
    
    // Validar ambiente
    validateEnvironment() {
      const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
      const missing = required.filter(key => !this.get(key));
      
      if (missing.length > 0) {
        console.warn('Variáveis de ambiente ausentes:', missing);
        console.warn('Usando valores padrão para desenvolvimento');
      }
    },
    
    // Obter valor de uma variável
    get(key, defaultValue = null) {
      // Prioridade: cache > meta tags > localStorage > padrões
      return this.cache[key] || this.defaults[key] || defaultValue;
    },
    
    // Definir valor de uma variável
    set(key, value) {
      this.cache[key] = value;
      
      // Salvar no localStorage para persistência
      try {
        const stored = localStorage.getItem('maxgun_env') || '{}';
        const parsed = JSON.parse(stored);
        parsed[key] = value;
        localStorage.setItem('maxgun_env', JSON.stringify(parsed));
      } catch (error) {
        // Silencioso em produção
      }
    },
    
    // Obter todas as variáveis
    getAll() {
      return { ...this.defaults, ...this.cache };
    },
    
    // Verificar se é ambiente de desenvolvimento
    isDevelopment() {
      return this.get('NODE_ENV') === 'development';
    },
    
    // Verificar se é ambiente de produção
    isProduction() {
      return this.get('NODE_ENV') === 'production';
    },
    
    // Verificar se debug está habilitado
    isDebugEnabled() {
      return this.get('DEBUG_MODE') === true || this.get('DEBUG_MODE') === 'true';
    },
    
    // Limpar cache
    clear() {
      this.cache = {};
      try {
        localStorage.removeItem('maxgun_env');
      } catch (error) {
        // Silencioso em produção
      }
    }
  };
  
  // Inicializar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => EnvLoader.init());
  } else {
    EnvLoader.init();
  }
  
  // Exportar para uso global
  window.EnvLoader = EnvLoader;
  
  // Função de conveniência para obter variáveis
  window.getEnv = (key, defaultValue) => EnvLoader.get(key, defaultValue);
  
})();
