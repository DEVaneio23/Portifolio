// Configuração local (sem chaves reais)
const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

// Cliente Supabase
let supabase = null;

// Função para inicializar o Supabase
function initializeSupabase() {
  try {
    // Desativar Supabase se não houver chaves ou se for execução local
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || (typeof window !== 'undefined' && window.DISABLE_SUPABASE)) {
      return false;
    }
    if (typeof window.supabase !== 'undefined' && window.supabase) {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
}

// Tentar inicializar várias vezes
let supabaseInitialized = false;
let initializationAttempts = 0;
const maxAttempts = 10;

function tryInitializeSupabase() {
  if (supabaseInitialized || initializationAttempts >= maxAttempts) {
    return;
  }
  
  initializationAttempts++;
  
  if (initializeSupabase()) {
    supabaseInitialized = true;
  } else {
    // Tentar novamente em 2 segundos
    setTimeout(tryInitializeSupabase, 2000);
  }
}

// Iniciar tentativas de inicialização
// Aguardar o DOM carregar primeiro
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(tryInitializeSupabase, 1000);
});

// Também tentar quando a janela carregar
window.addEventListener('load', () => {
  setTimeout(tryInitializeSupabase, 2000);
});

// Utilitários de data/hora (consistência UTC e datas locais)
function nowIso() {
  return new Date().toISOString();
}

function toIsoDate(value) {
  if (!value) {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }
  if (value instanceof Date) return value.toISOString().split('T')[0];
  if (typeof value === 'string') {
    // Já está em YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    // DD/MM/YYYY
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    // Tentar Date
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  try { return new Date(value).toISOString().split('T')[0]; } catch { return new Date().toISOString().split('T')[0]; }
}

// Nova: garantir prontidão do Supabase de forma bloqueante
async function ensureSupabaseReady(maxWaitMs = 3000) {
  if (supabase) return true;
  const start = Date.now();
  // Aguardar window.supabase.createClient ficar disponível
  while (!(typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')) {
    if (Date.now() - start > maxWaitMs) break;
    await new Promise((r) => setTimeout(r, 150));
  }
  // Criar cliente se possível
  if (
    !supabase &&
    typeof window !== 'undefined' &&
    window.supabase &&
    typeof window.supabase.createClient === 'function' &&
    SUPABASE_URL && SUPABASE_ANON_KEY &&
    !(typeof window !== 'undefined' && window.DISABLE_SUPABASE)
  ) {
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      supabaseInitialized = true;
      return true;
    } catch (_) {}
  }
  // Última tentativa usando rotina existente
  tryInitializeSupabase();
  // Aguardar mais um pouco
  await new Promise((r) => setTimeout(r, 300));
  return !!supabase;
}

// Funções para transactions
async function addTransactionToSupabase(transaction) {
  if (!supabase) {
    // Fallback para localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '{}');
    const id = Date.now().toString();
    transaction.id = id;
    transaction.created_at = new Date().toISOString();
    transaction.updated_at = new Date().toISOString();
    
    if (!transactions[transaction.category_id]) {
      transactions[transaction.category_id] = [];
    }
    transactions[transaction.category_id].push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    return transaction;
  }
  
  // Converter category_id de string para UUID se necessário
  if (transaction.category_id && typeof transaction.category_id === 'string' && !transaction.category_id.includes('-')) {
    const categoryId = await getCategoryIdByName(transaction.category_id);
    if (categoryId) {
      transaction.category_id = categoryId;
    } else {
      // Se não encontrar a categoria, criar uma nova
      const newCategoryId = await createCategory(transaction.category_id);
      if (newCategoryId) {
        transaction.category_id = newCategoryId;
      } else {
        transaction.category_id = null; // Sem categoria
      }
    }
  }
  
  // Normalizar timestamps (UTC) e datas
  transaction.created_at = transaction.created_at || nowIso();
  transaction.updated_at = nowIso();
  if (transaction.date) transaction.date = toIsoDate(transaction.date);

  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateTransactionInSupabase(id, updates) {
  if (!supabase) {
    // Fallback para localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '{}');
    for (const category in transactions) {
      const index = transactions[category].findIndex(item => item.id === id);
      if (index !== -1) {
        transactions[category][index] = { ...transactions[category][index], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('transactions', JSON.stringify(transactions));
        return transactions[category][index];
      }
    }
    return null;
  }
  
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteTransactionFromSupabase(id) {
  if (!supabase) {
    // Fallback para localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '{}');
    for (const category in transactions) {
      transactions[category] = transactions[category].filter(item => item.id !== id);
    }
    localStorage.setItem('transactions', JSON.stringify(transactions));
    return;
  }
  
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

// Funções para payments
async function addPaymentToSupabase(payment) {
  if (!supabase) {
    // Fallback para localStorage
    const payments = JSON.parse(localStorage.getItem('payments') || '{}');
    const id = Date.now().toString();
    payment.id = id;
    payment.created_at = new Date().toISOString();
    payment.updated_at = new Date().toISOString();
    
    if (!payments[payment.category_id]) {
      payments[payment.category_id] = [];
    }
    payments[payment.category_id].push(payment);
    localStorage.setItem('payments', JSON.stringify(payments));
    return payment;
  }
  
  // Converter category_id de string para UUID se necessário
  if (payment.category_id && typeof payment.category_id === 'string' && !payment.category_id.includes('-')) {
    const categoryId = await getCategoryIdByName(payment.category_id);
    if (categoryId) {
      payment.category_id = categoryId;
    } else {
      const newCategoryId = await createCategory(payment.category_id);
      if (newCategoryId) {
        payment.category_id = newCategoryId;
      } else {
        payment.category_id = null;
      }
    }
  }
  
  const { data, error } = await supabase
    .from('payments')
    .insert([{
      ...payment,
      created_at: payment.created_at || nowIso(),
      updated_at: nowIso(),
      // due_date pode ser DATE; normalizar
      due_date: toIsoDate(payment.due_date || payment.date)
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updatePaymentInSupabase(id, updates) {
  if (!supabase) {
    // Fallback para localStorage
    const payments = JSON.parse(localStorage.getItem('payments') || '{}');
    for (const category in payments) {
      const index = payments[category].findIndex(item => item.id === id);
      if (index !== -1) {
        payments[category][index] = { ...payments[category][index], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('payments', JSON.stringify(payments));
        return payments[category][index];
      }
    }
    return null;
  }
  
  const { data, error } = await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deletePaymentFromSupabase(id) {
  if (!supabase) {
    // Fallback para localStorage
    const payments = JSON.parse(localStorage.getItem('payments') || '{}');
    for (const category in payments) {
      payments[category] = payments[category].filter(item => item.id !== id);
    }
    localStorage.setItem('payments', JSON.stringify(payments));
    return;
  }
  
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}

// Funções para installments
async function addInstallmentToSupabase(installment) {
  if (!supabase) {
    // Fallback para localStorage
    const installments = JSON.parse(localStorage.getItem('installments') || '{}');
    const id = Date.now().toString();
    installment.id = id;
    installment.created_at = new Date().toISOString();
    installment.updated_at = new Date().toISOString();
    
    if (!installments[installment.category_id]) {
      installments[installment.category_id] = [];
    }
    installments[installment.category_id].push(installment);
    localStorage.setItem('installments', JSON.stringify(installments));
    return installment;
  }
  
  // Converter category_id de string para UUID se necessário
  if (installment.category_id && typeof installment.category_id === 'string' && !installment.category_id.includes('-')) {
    const categoryId = await getCategoryIdByName(installment.category_id);
    if (categoryId) {
      installment.category_id = categoryId;
    } else {
      // Se não encontrar a categoria, criar uma nova
      const newCategoryId = await createCategory(installment.category_id);
      if (newCategoryId) {
        installment.category_id = newCategoryId;
      } else {
        installment.category_id = null; // Sem categoria
      }
    }
  }
  
  // Garantir um ID cliente para o parcelamento (usado logo após inserir para criar itens)
  try {
    const generateUuidV4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    if (!installment.id) {
      installment.id = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : generateUuidV4();
    }
  } catch (_) {
    // ok
  }
  // Normalizar campos antes de inserir
  try {
    const normalizeDateToISO = (value) => {
      if (!value) return value;
      if (value instanceof Date) return value.toISOString().split('T')[0];
      if (typeof value === 'string') {
        // YYYY-MM-DD já OK
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
        // DD/MM/YYYY
        const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m) {
          const [, dd, mm, yyyy] = m;
          return `${yyyy}-${mm}-${dd}`;
        }
        // Tentar Date parseável
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      }
      return value;
    };

    installment.first_due_date = normalizeDateToISO(installment.first_due_date);
    if (typeof installment.installment_amount === 'number') {
      installment.installment_amount = Number(installment.installment_amount.toFixed(2));
    }
    if (typeof installment.total_amount === 'number') {
      installment.total_amount = Number(installment.total_amount.toFixed(2));
    }
    installment.created_at = installment.created_at || nowIso();
    installment.updated_at = nowIso();
  } catch (_) {
    // Silent: manter valores originais se falhar
  }

  const { data, error } = await supabase
    .from('installments')
    .insert([installment])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateInstallmentInSupabase(id, updates) {
  if (!supabase) {
    // Fallback para localStorage
    const installments = JSON.parse(localStorage.getItem('installments') || '{}');
    for (const category in installments) {
      const index = installments[category].findIndex(item => item.id === id);
      if (index !== -1) {
        installments[category][index] = { ...installments[category][index], ...updates, updated_at: new Date().toISOString() };
        localStorage.setItem('installments', JSON.stringify(installments));
        return installments[category][index];
      }
    }
    return null;
  }
  
  const { data, error } = await supabase
    .from('installments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteInstallmentFromSupabase(id) {
  if (!supabase) {
    // Fallback para localStorage
    const installments = JSON.parse(localStorage.getItem('installments') || '{}');
    for (const category in installments) {
      installments[category] = installments[category].filter(item => item.id !== id);
    }
    localStorage.setItem('installments', JSON.stringify(installments));
    return;
  }
  
  const { error } = await supabase.from('installments').delete().eq('id', id);
  if (error) throw error;
}

// Funções para installment_items
async function addInstallmentItemToSupabase(item) {
  if (!supabase) {
    // Fallback para localStorage
    const items = JSON.parse(localStorage.getItem('installment_items') || '[]');
    const id = Date.now().toString();
    item.id = id;
    item.created_at = new Date().toISOString();
    item.updated_at = new Date().toISOString();
    items.push(item);
    localStorage.setItem('installment_items', JSON.stringify(items));
    return item;
  }
  
  const { data, error } = await supabase
    .from('installment_items')
    .insert([{ 
      ...item,
      created_at: item.created_at || nowIso(),
      updated_at: nowIso(),
      // due_date é DATE
      due_date: toIsoDate(item.due_date || item.dueDate)
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function updateInstallmentItemInSupabase(id, updates) {
  if (!supabase) {
    // Fallback para localStorage
    const items = JSON.parse(localStorage.getItem('installment_items') || '[]');
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updated_at: new Date().toISOString() };
      localStorage.setItem('installment_items', JSON.stringify(items));
      return items[index];
    }
    return null;
  }
  
  const { data, error } = await supabase
    .from('installment_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function deleteInstallmentItemFromSupabase(id) {
  if (!supabase) {
    // Fallback para localStorage
    const items = JSON.parse(localStorage.getItem('installment_items') || '[]');
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem('installment_items', JSON.stringify(filtered));
    return;
  }
  
  const { error } = await supabase.from('installment_items').delete().eq('id', id);
  if (error) throw error;
}

async function getInstallmentItemsFromSupabase(installmentId) {
  if (!supabase) {
    // Fallback para localStorage
    const items = JSON.parse(localStorage.getItem('installment_items') || '[]');
    return items.filter(item => item.installment_id === installmentId);
  }
  
  const { data, error } = await supabase
    .from('installment_items')
    .select('*')
    .eq('installment_id', installmentId)
    .order('number', { ascending: true });
  if (error) throw error;
  return data;
}

// Funções para settings
async function addSettingToSupabase(key, value, note = '') {
  if (!supabase) {
    // Fallback para localStorage
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    settings[key] = { value, note, created_at: new Date().toISOString() };
    localStorage.setItem('settings', JSON.stringify(settings));
    return { key, value, note };
  }
  
  const { data, error } = await supabase.from('settings').upsert([
    { key, value, note, updated_at: new Date().toISOString() }
  ], { onConflict: 'key' });
  if (error) throw error;
  return data && data[0];
}

async function getSettingFromSupabase(key) {
  if (!supabase) {
    // Fallback para localStorage
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    return settings[key] ? settings[key].value : null;
  }
  
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  if (error || !data) return null;
  return data.value;
}

async function updateSettingInSupabase(key, value, note = '') {
  return await addSettingToSupabase(key, value, note);
}

async function deleteSettingFromSupabase(key) {
  if (!supabase) {
    // Fallback para localStorage
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    delete settings[key];
    localStorage.setItem('settings', JSON.stringify(settings));
    return;
  }
  
  const { error } = await supabase.from('settings').delete().eq('key', key);
  if (error) throw error;
}

async function getAllSettingsFromSupabase() {
  if (!supabase) {
    // Fallback para localStorage
    const settings = JSON.parse(localStorage.getItem('settings') || '{}');
    return Object.entries(settings).map(([key, data]) => ({
      key,
      value: data.value,
      note: data.note,
      created_at: data.created_at
    }));
  }
  
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Funções para backups
async function addBackupToSupabase(payload, note = '') {
  const { data, error } = await supabase.from('backups').insert([
    { payload, note, created_at: new Date().toISOString() }
  ]);
  if (error) throw error;
  return data && data[0];
}

async function getBackupsFromSupabase() {
  const { data, error } = await supabase.from('backups').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

async function getBackupByIdFromSupabase(id) {
  const { data, error } = await supabase
    .from('backups')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function deleteBackupFromSupabase(id) {
  const { error } = await supabase.from('backups').delete().eq('id', id);
  if (error) throw error;
}

// Funções para reports
async function addReportToSupabase(report) {
  const payload = { ...report };
  // Garantir consistência de campos obrigatórios
  payload.created_at = payload.created_at || new Date().toISOString();
  const { data, error } = await supabase
    .from('reports')
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getReportsFromSupabase(filters = {}) {
  let query = supabase.from('reports').select('*');
  if (filters.report_type) query = query.eq('report_type', filters.report_type);
  if (filters.year) query = query.eq('year', filters.year);
  if (filters.month) query = query.eq('month', filters.month);
  if (filters.week) query = query.eq('week', filters.week);
  query = query.order('created_at', { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

async function deleteReportFromSupabase(id) {
  // Segurança: por padrão, não excluir relatórios em produção
  const { error } = await supabase.from('reports').delete().eq('id', id);
  if (error) throw error;
}

// Funções auxiliares para gerenciar categorias
async function getCategoryIdByName(name) {
  if (!supabase) return null;
  
  const { data, error } = await supabase
    .from('categories')
    .select('id')
    .eq('name', name)
    .single();
  
  if (error || !data) return null;
  return data.id;
}

async function createCategory(name) {
  if (!supabase) return null;
  
  const categoryData = {
    name: name,
    icon: getCategoryIcon(name),
    color: getCategoryColor(name),
    is_archived: false
  };
  
  const { data, error } = await supabase
    .from('categories')
    .insert([categoryData])
    .select();
  
  if (error) throw error;
  return data && data[0] ? data[0].id : null;
}

// Obter todas as categorias (id, name)
async function getCategoriesList() {
  if (!supabase) return [];
  const { data, error } = await supabase.from('categories').select('id, name');
  if (error) return [];
  return data || [];
}

// Mapas auxiliares de categorias
async function getCategoryMaps() {
  const list = await getCategoriesList();
  const nameToId = {};
  const idToName = {};
  list.forEach((c) => {
    if (c && c.id && c.name) {
      nameToId[c.name] = c.id;
      idToName[c.id] = c.name;
    }
  });
  return { nameToId, idToName };
}

function getCategoryIcon(name) {
  const icons = {
    'games': '🎮',
    'bar': '🍺',
    'personal': '👤',
    'food': '🍕',
    'transport': '🚗',
    'health': '🏥',
    'education': '📚',
    'entertainment': '🎬',
    'shopping': '🛒',
    'bills': '📄',
    'salary': '💰',
    'freelance': '💼',
    'investment': '📈',
    'other': '📌'
  };
  return icons[name] || '📌';
}

function getCategoryColor(name) {
  const colors = {
    'games': '#ff6b6b',
    'bar': '#4ecdc4',
    'personal': '#45b7d1',
    'food': '#96ceb4',
    'transport': '#feca57',
    'health': '#ff9ff3',
    'education': '#54a0ff',
    'entertainment': '#5f27cd',
    'shopping': '#00d2d3',
    'bills': '#ff9f43',
    'salary': '#10ac84',
    'freelance': '#2e86de',
    'investment': '#ee5a24',
    'other': '#8395a7'
  };
  return colors[name] || '#8395a7';
}

// Inicializar categorias padrão
async function initializeDefaultCategories() {
  if (!supabase) return;
  
  const defaultCategories = [
    { name: 'games', icon: '🎮', color: '#ff6b6b' },
    { name: 'bar', icon: '🍺', color: '#4ecdc4' },
    { name: 'personal', icon: '👤', color: '#45b7d1' },
    { name: 'food', icon: '🍕', color: '#96ceb4' },
    { name: 'transport', icon: '🚗', color: '#feca57' },
    { name: 'health', icon: '🏥', color: '#ff9ff3' },
    { name: 'education', icon: '📚', color: '#54a0ff' },
    { name: 'entertainment', icon: '🎬', color: '#5f27cd' },
    { name: 'shopping', icon: '🛒', color: '#00d2d3' },
    { name: 'bills', icon: '📄', color: '#ff9f43' },
    { name: 'salary', icon: '💰', color: '#10ac84' },
    { name: 'freelance', icon: '💼', color: '#2e86de' },
    { name: 'investment', icon: '📈', color: '#ee5a24' },
    { name: 'other', icon: '📌', color: '#8395a7' }
  ];
  
  for (const category of defaultCategories) {
    try {
      await supabase
        .from('categories')
        .upsert([category], { onConflict: 'name' });
    } catch (error) {
      // Silenciado em produção para evitar poluição do console
    }
  }
}

// Funções para relatórios
async function saveWeeklyReport(report) {
  try {
    await addReportToSupabase({
      report_type: 'weekly',
      year: report.year,
      week: report.week,
      stats: report.stats
    });
  } catch (error) {
    console.error('Erro ao salvar relatório semanal:', error);
  }
}

async function saveMonthlyReport(report) {
  try {
    await addReportToSupabase({
      report_type: 'monthly',
      year: report.year,
      month: report.month,
      stats: report.stats
    });
  } catch (error) {
    console.error('Erro ao salvar relatório mensal:', error);
  }
}

async function getWeeklyReports(year) {
  try {
    return await getReportsFromSupabase({ report_type: 'weekly', year });
  } catch (error) {
    console.error('Erro ao buscar relatórios semanais:', error);
    return [];
  }
}

async function getMonthlyReports(year) {
  try {
    return await getReportsFromSupabase({ report_type: 'monthly', year });
  } catch (error) {
    console.error('Erro ao buscar relatórios mensais:', error);
    return [];
  }
}

// Funções para buscar dados (usadas pelo script.js)
async function getTransactionsFromSupabase() {
  if (!supabase) await ensureSupabaseReady(4000);
  if (!supabase) {
    // Fallback para localStorage
    const transactions = JSON.parse(localStorage.getItem('transactions') || '{}');
    return Object.values(transactions).flat();
  }
  
  const { data, error } = await supabase.from('transactions').select('*');
  if (error) throw error;
  return data || [];
}

async function getPaymentsFromSupabase() {
  if (!supabase) await ensureSupabaseReady(4000);
  if (!supabase) {
    // Fallback para localStorage
    const payments = JSON.parse(localStorage.getItem('payments') || '{}');
    return Object.values(payments).flat();
  }
  
  const { data, error } = await supabase.from('payments').select('*');
  if (error) throw error;
  return data || [];
}

async function getInstallmentsFromSupabase() {
  if (!supabase) await ensureSupabaseReady(4000);
  if (!supabase) {
    // Fallback para localStorage
    const installments = JSON.parse(localStorage.getItem('installments') || '{}');
    return Object.values(installments).flat();
  }
  
  const { data, error } = await supabase.from('installments').select('*');
  if (error) throw error;
  return data || [];
}

// Expor funções globalmente para uso no script.js
window.addTransactionToSupabase = addTransactionToSupabase;
window.updateTransactionInSupabase = updateTransactionInSupabase;
window.deleteTransactionFromSupabase = deleteTransactionFromSupabase;
window.addPaymentToSupabase = addPaymentToSupabase;
window.updatePaymentInSupabase = updatePaymentInSupabase;
window.deletePaymentFromSupabase = deletePaymentFromSupabase;
window.addInstallmentToSupabase = addInstallmentToSupabase;
window.updateInstallmentInSupabase = updateInstallmentInSupabase;
window.deleteInstallmentFromSupabase = deleteInstallmentFromSupabase;
window.addInstallmentItemToSupabase = addInstallmentItemToSupabase;
window.updateInstallmentItemInSupabase = updateInstallmentItemInSupabase;
window.deleteInstallmentItemFromSupabase = deleteInstallmentItemFromSupabase;
window.getInstallmentItemsFromSupabase = getInstallmentItemsFromSupabase;
window.addSettingToSupabase = addSettingToSupabase;
window.getSettingFromSupabase = getSettingFromSupabase;
window.updateSettingInSupabase = updateSettingInSupabase;
window.deleteSettingFromSupabase = deleteSettingFromSupabase;
window.getAllSettingsFromSupabase = getAllSettingsFromSupabase;
window.addBackupToSupabase = addBackupToSupabase;
window.getBackupsFromSupabase = getBackupsFromSupabase;
window.getBackupByIdFromSupabase = getBackupByIdFromSupabase;
window.deleteBackupFromSupabase = deleteBackupFromSupabase;
window.addReportToSupabase = addReportToSupabase;
window.getReportsFromSupabase = getReportsFromSupabase;
window.deleteReportFromSupabase = deleteReportFromSupabase;
window.getCategoryIdByName = getCategoryIdByName;
window.createCategory = createCategory;
window.getCategoryIcon = getCategoryIcon;
window.getCategoryColor = getCategoryColor;
window.initializeDefaultCategories = initializeDefaultCategories;
window.getCategoriesList = getCategoriesList;
window.getCategoryMaps = getCategoryMaps;
window.saveWeeklyReport = saveWeeklyReport;
window.saveMonthlyReport = saveMonthlyReport;
window.getWeeklyReports = getWeeklyReports;
window.getMonthlyReports = getMonthlyReports;
window.getTransactionsFromSupabase = getTransactionsFromSupabase;
window.getPaymentsFromSupabase = getPaymentsFromSupabase;
window.getInstallmentsFromSupabase = getInstallmentsFromSupabase; 
window.ensureSupabaseReady = ensureSupabaseReady;