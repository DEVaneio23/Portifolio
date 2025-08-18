/**
 * ===========================================================================
 * CONFIGURAÇÃO DO SISTEMA - SISTEMA DE AGENDAMENTO DE BANCAS
 * ===========================================================================
 * 
 * Este arquivo contém configurações globais do sistema que podem ser
 * facilmente modificadas sem afetar a lógica principal.
 * 
 * ===========================================================================
 */

/**
 * Configurações de desenvolvimento
 */
export const DEV_CONFIG = {
  DEBUG: true,
  LOG_LEVEL: 'info', // 'debug', 'info', 'warn', 'error'
  ENABLE_CONSOLE_LOGS: true,
  ENABLE_PERFORMANCE_MONITORING: false
};

/**
 * Configurações de validação
 */
export const VALIDATION_CONFIG = {
  // Validação de CPF
  CPF_ENABLE_MASK: true,
  CPF_AUTO_VALIDATE: true,
  
  // Validação de email
  EMAIL_ENABLE_REAL_TIME_VALIDATION: true,
  
  // Validação de arquivos
  FILE_MAX_SIZE: 10 * 1024 * 1024, // 10MB
  FILE_ALLOWED_TYPES: ['application/pdf'],
  FILE_ENABLE_PREVIEW: true,
  
  // Validação de resumo
  RESUMO_MIN_PALAVRAS: 100,
  RESUMO_MIN_KEYWORDS: 2,
  RESUMO_ENABLE_REAL_TIME_COUNT: true
};

/**
 * Configurações de interface
 */
export const UI_CONFIG = {
  // Animações
  ENABLE_ANIMATIONS: true,
  ANIMATION_DURATION: 300,
  
  // Progresso
  SHOW_PROGRESS_BAR: true,
  PROGRESS_UPDATE_DELAY: 100,
  
  // Alertas
  ALERT_AUTO_HIDE: true,
  ALERT_HIDE_DELAY: 5000,
  
  // Checklist
  SHOW_CHECKLIST: true,
  CHECKLIST_UPDATE_REAL_TIME: true
};

/**
 * Configurações de membros da banca
 */
export const MEMBERS_CONFIG = {
  // Mestrado
  MESTRADO_TOTAL_MEMBROS: 3,
  MESTRADO_MIN_INTERNOS: 1,
  MESTRADO_MAX_EXTERNOS: 1,
  
  // Doutorado
  DOUTORADO_TOTAL_MEMBROS: 5,
  DOUTORADO_MIN_INTERNOS: 2,
  DOUTORADO_MAX_EXTERNOS: 2,
  
  // Regras gerais
  MIN_MULHERES_BANCA: 1,
  ENABLE_GENDER_VALIDATION: true,
  ENABLE_REAL_TIME_VALIDATION: true
};

/**
 * Configurações de agendamento
 */
export const SCHEDULING_CONFIG = {
  // Horários
  HORA_INICIO: 8,
  HORA_FIM: 18,
  
  // Datas
  DIAS_MINIMOS_ANTECEDENCIA: 15,
  BLOQUEAR_FINAIS_SEMANA: true,
  BLOQUEAR_FERIADOS: true,
  
  // Modalidades
  MODALIDADES_DISPONIVEIS: ['presencial', 'online'],
  MODALIDADE_PADRAO: 'presencial'
};

/**
 * Configurações de upload
 */
export const UPLOAD_CONFIG = {
  // Drag and drop
  ENABLE_DRAG_DROP: true,
  SHOW_FILE_PREVIEW: true,
  
  // Validação
  ENABLE_FILE_VALIDATION: true,
  ENABLE_SIZE_VALIDATION: true,
  ENABLE_TYPE_VALIDATION: true,
  
  // Compressão
  ENABLE_AUTO_COMPRESSION: false,
  COMPRESSION_QUALITY: 0.8
};

/**
 * Configurações de performance
 */
export const PERFORMANCE_CONFIG = {
  // Debounce
  INPUT_DEBOUNCE_DELAY: 300,
  VALIDATION_DEBOUNCE_DELAY: 500,
  
  // Lazy loading
  ENABLE_LAZY_LOADING: true,
  LAZY_LOAD_DELAY: 100,
  
  // Cache
  ENABLE_CACHE: true,
  CACHE_DURATION: 300000 // 5 minutos
};

/**
 * Configurações de acessibilidade
 */
export const ACCESSIBILITY_CONFIG = {
  // Navegação por teclado
  ENABLE_KEYBOARD_NAVIGATION: true,
  ENABLE_TAB_INDEX: true,
  
  // Screen readers
  ENABLE_ARIA_LABELS: true,
  ENABLE_ROLE_ATTRIBUTES: true,
  
  // Alto contraste
  ENABLE_HIGH_CONTRAST: false,
  
  // Tamanho da fonte
  ENABLE_FONT_SIZE_CONTROL: false
};

/**
 * Configurações de segurança
 */
export const SECURITY_CONFIG = {
  // Validação no cliente
  ENABLE_CLIENT_VALIDATION: true,
  
  // Sanitização
  ENABLE_INPUT_SANITIZATION: true,
  ENABLE_XSS_PROTECTION: true,
  
  // CSRF
  ENABLE_CSRF_PROTECTION: false,
  
  // Rate limiting
  ENABLE_RATE_LIMITING: false
};

/**
 * Configurações de internacionalização
 */
export const I18N_CONFIG = {
  // Idioma padrão
  DEFAULT_LOCALE: 'pt-BR',
  
  // Fallback
  FALLBACK_LOCALE: 'en',
  
  // Formatação
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  CURRENCY_FORMAT: 'BRL'
};

/**
 * Configurações de analytics
 */
export const ANALYTICS_CONFIG = {
  // Google Analytics
  ENABLE_GOOGLE_ANALYTICS: false,
  GA_TRACKING_ID: '',
  
  // Eventos customizados
  ENABLE_CUSTOM_EVENTS: true,
  
  // Performance monitoring
  ENABLE_PERFORMANCE_MONITORING: false
};

/**
 * Configurações de erro e logging
 */
export const ERROR_CONFIG = {
  // Logging
  ENABLE_ERROR_LOGGING: true,
  LOG_ERRORS_TO_CONSOLE: true,
  
  // User feedback
  SHOW_ERROR_MESSAGES: true,
  SHOW_SUCCESS_MESSAGES: true,
  
  // Error recovery
  ENABLE_AUTO_RECOVERY: true,
  MAX_RETRY_ATTEMPTS: 3
}; 