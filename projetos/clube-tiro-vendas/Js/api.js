/**
 * API Layer — RangeClub Demo (Portfólio)
 * Gerencia comunicação com Supabase e fallback para localStorage
 */
(function() {
  'use strict';

  // Importar moment.js se disponível
  const moment = window.moment || {
    format: (date, format) => {
      if (!date) return '';
      const d = new Date(date);
      if (format === 'YYYY-MM-DD') {
        return d.toISOString().split('T')[0];
      }
      return d.toLocaleDateString('pt-BR');
    }
  };

  /**
   * Módulo de API (Supabase)
   * - Quando SUPABASE_URL/KEY forem preenchidos, a API usa o banco
   */
  // Configuração e inicialização
  const hasConfig = typeof window.APP_CONFIG !== 'undefined' && 
                   !!window.APP_CONFIG.SUPABASE_URL && 
                   !!window.APP_CONFIG.SUPABASE_ANON_KEY;
  const hasSupabaseLib = typeof window.supabase !== 'undefined';

  let supabaseClient = null;
  let isInitialized = false;

  // Inicializar cliente Supabase
  function initializeSupabase() {
    if (!hasConfig || !hasSupabaseLib) {
      console.log('[API] Supabase não configurado (DEMO). Usando localStorage.');
      return false;
    }

    try {
      supabaseClient = window.supabase.createClient(
        window.APP_CONFIG.SUPABASE_URL, 
        window.APP_CONFIG.SUPABASE_ANON_KEY
      );
      isInitialized = true;
      console.log('[API] Cliente Supabase inicializado com sucesso');
      return true;
    } catch (error) {
      console.error('[API] Erro ao inicializar Supabase:', error);
      return false;
    }
  }

  // Função utilitária para tratamento de erros
  function handleError(error, operation, table) {
    const errorMessage = `[API] Erro na operação ${operation} na tabela ${table}: ${error.message}`;
    console.error(errorMessage);
    
    // Em produção, enviar para serviço de monitoramento
    if (window.APP_CONFIG?.DEBUG_MODE) {
      console.trace(errorMessage);
    }
    
    throw new Error(errorMessage);
  }

  // Função para validar parâmetros
  function validateParams(table, operation, params = {}) {
    if (!table || typeof table !== 'string') {
      throw new Error(`[API] Nome da tabela inválido: ${table}`);
    }

    // Em DEMO, não interromper o fluxo: as funções abaixo tratam supabaseClient ausente
    if (!isInitialized) return true;

    return true;
  }

  // Operações básicas do banco
  async function dbList(table, options = {}) {
    try {
      validateParams(table, 'list');
      
      if (!supabaseClient) return null;
      
      let query = supabaseClient.from(table).select('*');
      
      // Aplicar filtros se fornecidos
      if (options.where) {
        Object.entries(options.where).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      // Aplicar ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }
      
      // Aplicar limite
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      handleError(error, 'list', table);
    }
  }

  async function dbListWhere(table, match, options = {}) {
    try {
      validateParams(table, 'listWhere');
      
      if (!supabaseClient) return null;
      
      let query = supabaseClient.from(table).select('*');
      
      if (match && typeof match === 'object') {
        Object.entries(match).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            query = query.eq(key, value);
          }
        });
      }
      
      // Aplicar opções adicionais
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      handleError(error, 'listWhere', table);
    }
  }

  async function dbInsert(table, payload) {
    try {
      validateParams(table, 'insert');
      
      if (!supabaseClient) return null;
      
      // Validar payload
      if (!payload || typeof payload !== 'object') {
        throw new Error('Payload inválido para inserção');
      }
      
      const { data, error } = await supabaseClient
        .from(table)
        .insert(payload)
        .select();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      handleError(error, 'insert', table);
    }
  }

  async function dbUpdate(table, match, changes) {
    try {
      validateParams(table, 'update');
      
      if (!supabaseClient) return null;
      
      // Validar parâmetros
      if (!match || typeof match !== 'object') {
        throw new Error('Critérios de match inválidos para atualização');
      }
      
      if (!changes || typeof changes !== 'object') {
        throw new Error('Dados de atualização inválidos');
      }
      
      let query = supabaseClient.from(table).update(changes);
      
      // Aplicar critérios de match
      Object.entries(match).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data, error } = await query.select();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      handleError(error, 'update', table);
    }
  }

  async function dbDelete(table, match) {
    try {
      validateParams(table, 'delete');
      
      if (!supabaseClient) return null;
      
      // Validar critérios de match
      if (!match || typeof match !== 'object') {
        throw new Error('Critérios de match inválidos para exclusão');
      }
      
      let query = supabaseClient.from(table).delete();
      
      // Aplicar critérios de match
      Object.entries(match).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data, error } = await query.select();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      handleError(error, 'delete', table);
    }
  }

  // Consultas específicas otimizadas
  async function dbSearchFiliados(term, options = {}) {
    try {
      validateParams('filiados', 'search');
      
      if (!supabaseClient) return [];
      
      const searchTerm = (term || '').trim();
      if (!searchTerm) return [];
      
      const pattern = `%${searchTerm}%`;
      let query = supabaseClient
        .from('filiados')
        .select('id,nome,cpf,cr,telefone,email,data_cadastro')
        .or(`nome.ilike.${pattern},cpf.ilike.${pattern},cr.ilike.${pattern}`)
        .order('nome', { ascending: true })
        .limit(options.limit || 20);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      handleError(error, 'searchFiliados', 'filiados');
    }
  }

  // Funções utilitárias para datas
  function getDayRangeISO(date = new Date()) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    
    return { 
      start: start.toISOString(), 
      end: end.toISOString() 
    };
  }

  // Relatórios otimizados
  async function dbComandasFechadasHoje(options = {}) {
    try {
      validateParams('comandas', 'report');
      
      if (!supabaseClient) return [];
      
      const { start, end } = getDayRangeISO(new Date());
      let query = supabaseClient
        .from('comandas')
        .select('*')
        .eq('status', 'fechada')
        .gte('data_fechamento', start)
        .lt('data_fechamento', end)
        .order('data_fechamento', { ascending: false });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      handleError(error, 'comandasFechadasHoje', 'comandas');
    }
  }

  async function dbComandasAbertasHoje(options = {}) {
    try {
      validateParams('comandas', 'report');
      
      if (!supabaseClient) return [];
      
      const { start, end } = getDayRangeISO(new Date());
      let query = supabaseClient
        .from('comandas')
        .select('*')
        .eq('status', 'aberta')
        .gte('data_abertura', start)
        .lt('data_abertura', end)
        .order('data_abertura', { ascending: false });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      handleError(error, 'comandasAbertasHoje', 'comandas');
    }
  }

  async function dbItensByComandaIds(ids, options = {}) {
    try {
      validateParams('itens_comanda', 'report');
      
      if (!supabaseClient || !Array.isArray(ids) || ids.length === 0) {
        return [];
      }
      
      let query = supabaseClient
        .from('itens_comanda')
        .select('*')
        .in('comanda_id', ids);
      
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      handleError(error, 'itensByComandaIds', 'itens_comanda');
    }
  }

  // Função para verificar saúde da conexão
  async function dbHealthCheck() {
    try {
      if (!supabaseClient) return { status: 'disconnected', message: 'Cliente não inicializado' };
      
      const { data, error } = await supabaseClient
        .from('filiados')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      return { status: 'connected', message: 'Conexão ativa' };
    } catch (error) {
      return { 
        status: 'error', 
        message: `Erro de conexão: ${error.message}` 
      };
    }
  }

  // Inicializar API
  function init() {
    const initialized = initializeSupabase();
    
    // Expor API global
    window.DB = {
      isEnabled: initialized,
      isInitialized: initialized,
      
      // Operações básicas
      list: dbList,
      listWhere: dbListWhere,
      insert: dbInsert,
      update: dbUpdate,
      delete: dbDelete,
      
      // Consultas específicas
      searchFiliados: dbSearchFiliados,
      comandasFechadasHoje: dbComandasFechadasHoje,
      comandasAbertasHoje: dbComandasAbertasHoje,
      itensByComandaIds: dbItensByComandaIds,
      
      // Utilitários
      healthCheck: dbHealthCheck,
      getConfig: () => ({ hasConfig, hasSupabaseLib, isInitialized })
    };
    
    console.log('[API] Inicializada com sucesso');
  }

  // Auto-inicialização quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



// Função para buscar estatísticas de vendas
window.buscarEstatisticasVendas = async function(dataInicio = null, dataFim = null) {
  try {
    let url = '/api/relatorios/vendas/stats';
    
    if (dataInicio && dataFim) {
      url += `?dataInicio=${dataInicio.toISOString()}&dataFim=${dataFim.toISOString()}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao buscar estatísticas');
    }

    const data = await response.json();
    return data;
    
  } catch (error) {
    console.error('[API] Erro ao buscar estatísticas:', error);
    return { success: false, error: error.message };
  }
};