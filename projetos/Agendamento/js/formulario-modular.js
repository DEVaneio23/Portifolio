/**
 * SISTEMA DE AGENDAMENTO DE BANCAS - PPGD (VERSÃO MODULAR)
 * 
 * Este arquivo contém a lógica principal do formulário de agendamento
 * utilizando módulos ES6 para melhor organização e manutenibilidade.
 * 
 * Funcionalidades:
 * - Validação de formulários
 * - Gerenciamento de estado
 * - Integração com módulos externos
 * - Interface responsiva
 * 
 * @author Dev Team
 * @version 2.0.0
 * @since 2025
 */

/**
 * DICAS RÁPIDAS
 * - Este arquivo apenas inicializa o app. Regras de negócio ficam nos módulos.
 * - Se abrir via file://, imports ES podem falhar por CORS. Use servidor local (ex.: python -m http.server).
 */

import { inicializarFormulario } from './modules/form.js';

// Inicializa o sistema quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
  console.log('Sistema de Agendamento de Bancas - Inicializando...');
  
  try {
    inicializarFormulario();
    console.log('Sistema inicializado com sucesso!');
  } catch (error) {
    console.error('Erro ao inicializar o sistema:', error);
  }
});

// Exporta funções principais para uso externo (se necessário)
export { inicializarFormulario }; 