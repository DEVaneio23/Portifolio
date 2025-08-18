const ENABLE_VERBOSE_LOGS = false;
// Arquivamento automático ao virar o mês (não remove dados)
const ARCHIVE_MONTHLY_DATA = true;
if (!ENABLE_VERBOSE_LOGS && typeof console !== "undefined") {
  const noop = () => {};
  try { console.log = noop; } catch (_) {}
  try { console.warn = noop; } catch (_) {}
}
// Estado da aplicação
let currentCategory = "";
let transactions = {};
let payments = {};
let installments = {}; // Novo: Parcelamentos
let currentFilter = "all";
let currentPaymentFilter = "all";
let currentInstallmentFilter = "all";
let lastBackupTime = null;
let autoBackupInterval = null;

// Sistema de relatórios automáticos
let lastWeeklyReport = null;
let lastMonthlyReport = null;
let autoReportInterval = null;

// Configurações do app
const APP_CONFIG = {
  autoBackupInterval: 5 * 60 * 1000, // 5 minutos
  maxBackups: 10,
  dataVersion: "1.0.7",
  storageCheckInterval: 24 * 60 * 60 * 1000, // 24 horas
  backupReminderDays: 7, // Lembrar backup a cada 7 dias
};

// Modo proteção: evita exclusões acidentais
window.SAFE_MODE = true;

let __backupTimer = null;
function scheduleBackup(delayMs = 15000) {
  try {
    if (__backupTimer) clearTimeout(__backupTimer);
    __backupTimer = setTimeout(() => {
      try { createBackup('auto'); } catch (_) {}
    }, delayMs);
  } catch (_) {}
}
window.__scheduleBackup = scheduleBackup;

// PWA: instalação
let __deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  __deferredInstallPrompt = e;
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.style.display = 'inline-flex';
});

window.addEventListener('appinstalled', () => {
  __deferredInstallPrompt = null;
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.style.display = 'none';
  showNotification?.('Aplicativo instalado!', 'success');
});

async function promptPwaInstall() {
  // iOS não suporta beforeinstallprompt; orientar via instruções
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    const modal = document.getElementById('ios-install-modal');
    if (modal) modal.style.display = 'flex';
    return;
  }
  if (!__deferredInstallPrompt) {
    showNotification?.('Instalação não disponível no momento. Tente novamente mais tarde.', 'info');
    return;
  }
  __deferredInstallPrompt.prompt();
  const { outcome } = await __deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    showNotification?.('Instalação iniciada!', 'success');
  } else {
    showNotification?.('Instalação cancelada.', 'warning');
  }
  __deferredInstallPrompt = null;
  const btn = document.getElementById('install-app-btn');
  if (btn) btn.style.display = 'none';
}

function closeIosInstallModal() {
  const modal = document.getElementById('ios-install-modal');
  if (modal) modal.style.display = 'none';
}

// Mostrar botão de instalar quando suportado
document.addEventListener('DOMContentLoaded', () => {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const btn = document.getElementById('install-app-btn');
  // Em iOS, se não estiver standalone, mostramos botão que abre instruções
  if (btn && isIOS && !isStandalone) btn.style.display = 'inline-flex';
});

// Configurações de sincronização
const SYNC_CONFIG = {
  autoSync: true,
  syncInterval: 30000, // 30 segundos
  maxRetries: 3,
  retryDelay: 5000, // 5 segundos
};

// Status de conectividade
let isOnline = navigator.onLine;
let pendingSync = [];

// Atualizar indicador de status
function updateConnectionStatus() {
  const statusIndicator = document.getElementById("status-indicator");
  const statusText = document.getElementById("status-text");

  if (isOnline) {
    statusIndicator.className = "status-indicator online";
    statusText.textContent = "Online";
  } else {
    statusIndicator.className = "status-indicator offline";
    statusText.textContent = "Offline";
  }
}

// Detectar mudanças de conectividade
window.addEventListener("online", () => {
  isOnline = true;
  updateConnectionStatus();
  // showNotification('Conexão restaurada! Sincronizando dados...', 'success'); // [REMOVIDO: Notificação não essencial]
  syncPendingData();
});

window.addEventListener("offline", () => {
  isOnline = false;
  updateConnectionStatus();
  // showNotification('Modo offline ativado. Dados salvos localmente.', 'info'); // [REMOVIDO: Notificação não essencial]
});

// Atualizar status inicial
document.addEventListener("DOMContentLoaded", () => {
  updateConnectionStatus();

  // Forçar atualização do service worker no iOS
  if (
    navigator.userAgent.includes("iPhone") ||
    navigator.userAgent.includes("iPad")
  ) {
    forceServiceWorkerUpdate();
  }

  // Inicializar categorias padrão se necessário
  setTimeout(() => {
    if (typeof initializeDefaultCategories === "function") {
      initializeDefaultCategories();
    } else {
      console.warn("⚠️ Função initializeDefaultCategories não disponível");
    }
  }, 2000);
});

// Função para forçar atualização do service worker
function forceServiceWorkerUpdate() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.update().then(() => {
          // Força reload se necessário
          if (registration.waiting) {
            registration.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    });
  }
}

// Sincronizar dados pendentes
function syncPendingData() {
  if (!isOnline || pendingSync.length === 0) return;

  // showNotification('Sincronizando dados...', 'info'); // [REMOVIDO: Notificação não essencial]

  // Aqui você implementaria a sincronização com seu servidor
  // Por enquanto, apenas simula a sincronização
  setTimeout(() => {
    pendingSync = [];
    // showNotification('Dados sincronizados com sucesso!', 'success'); // [REMOVIDO: Notificação não essencial]
  }, 2000);
}

// Marcar dados para sincronização
function markForSync(data) {
  pendingSync.push({
    ...data,
    timestamp: Date.now(),
    id: Math.random().toString(36).substr(2, 9),
  });

  if (isOnline) {
    syncPendingData();
  }
}

// Helper para escapar HTML em textos dinâmicos
function escapeHTML(input) {
  const str = String(input == null ? "" : input);
  return str.replace(
    /[&<>"'`=\/]/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "`": "&#96;",
        "=": "&#61;",
        "/": "&#47;",
      }[ch])
  );
}

// Normalização defensiva de transações vindas de diferentes fontes
function normalizeTransaction(raw) {
  try {
    if (!raw) return null;
    const type = raw.type === "income" || raw.type === "expense"
      ? raw.type
      : (Number(raw.amount) >= 0 ? "income" : "expense");
    const amount = Number(raw.amount);
    const description = typeof raw.description === "string" ? raw.description : "";
    const dateStr = typeof raw.date === "string" ? raw.date : (raw.created_at || raw.updated_at || "");
    const d = new Date(dateStr);
    if (!type || Number.isNaN(amount) || Number.isNaN(d.getTime())) return null;
    return {
      ...raw,
      type,
      amount,
      description,
      date: d.toISOString().slice(0, 10)
    };
  } catch (_) {
    return null;
  }
}

// Verificar se o CSS carregou
function checkCSSLoaded() {
  const styles = document.styleSheets;
  let cssLoaded = false;

  for (let i = 0; i < styles.length; i++) {
    try {
      if (styles[i].href && styles[i].href.includes("styles.css")) {
        cssLoaded = true;
        break;
      }
    } catch (e) {
      // Ignorar erros de CORS
    }
  }

  if (!cssLoaded) {
    console.warn("CSS externo não carregou, usando fallback inline");
    // O CSS inline já está no HTML como fallback
  }
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {

  // Aguardar um pouco para garantir que tudo carregou
  setTimeout(async () => {
    try {
      checkCSSLoaded();
      // Garantir Supabase pronto no iOS/Safari antes de buscar dados
      if (typeof window.ensureSupabaseReady === 'function') {
        await window.ensureSupabaseReady(4000);
      }
      await loadData();
      updateCategoryStats();
      updateDisplay();
      startAutoBackup();
      checkForUpdates();
      setupServiceWorker();
      if (typeof initAutoReports === "function") {
        initAutoReports();
      } else {
        console.warn("⚠️ Função initAutoReports não disponível");
      }

      // iOS: tentar recuperar dados e aplicar antes de checagem
      await tryRecoverData();
      // Verificar se há dados perdidos e mostrar notificação
      setTimeout(async () => {
        await checkForLostData();
      }, 1500);

      // Inicializar melhorias para Vercel
      initVercelImprovements();

      console.log("✅ Aplicação inicializada com sucesso!");
    } catch (error) {
      console.error("❌ Erro na inicialização:", error);
    }
  }, 1000);
});

// Função para verificar se há dados perdidos
async function checkForLostData() {
  const savedData = localStorage.getItem("financeData");
  const backups = await getBackups();
  const tempBackup = sessionStorage.getItem("tempBackup");

  // Se não há dados principais mas há backups ou backup temporário
  if (!savedData && ((Array.isArray(backups) && backups.length > 0) || tempBackup)) {
    showNotification(
      '⚠️ Dados perdidos detectados! Clique em "Recuperar Dados" nas configurações.',
      "warning"
    );
    console.log(
      "⚠️ Dados perdidos detectados - backups disponíveis para recuperação"
    );
  }
}

// Melhorias específicas para Vercel
function initVercelImprovements() {
  console.log("🚀 Inicializando melhorias para Vercel...");

  // Verificar espaço de armazenamento
  checkStorageSpace();

  // Configurar lembretes de backup
  setupBackupReminders();

  // Configurar detecção de conectividade
  setupConnectivityDetection();

  // Limpar backups antigos
  cleanOldBackups();

  console.log("✅ Melhorias para Vercel inicializadas");
}

// Verificar se há espaço suficiente no localStorage
function checkStorageSpace() {
  console.log("💾 Verificando espaço de armazenamento...");

  try {
    // Testar com 1MB de dados
    const testData = "x".repeat(1024 * 1024);
    localStorage.setItem("storage_test", testData);
    localStorage.removeItem("storage_test");

    console.log("✅ Espaço de armazenamento disponível");
    return true;
  } catch (error) {
    console.warn("⚠️ Espaço de armazenamento limitado:", error);
    showNotification(
      "⚠️ Espaço de armazenamento limitado! Considere fazer backup e limpar dados antigos.",
      "warning"
    );
    return false;
  }
}

// Configurar lembretes de backup manual
function setupBackupReminders() {
  console.log("📅 Configurando lembretes de backup...");

  // Verificar último backup manual
  const lastBackup = localStorage.getItem("lastManualBackup");
  const daysSinceBackup = lastBackup
    ? (Date.now() - new Date(lastBackup)) / (1000 * 60 * 60 * 24)
    : APP_CONFIG.backupReminderDays + 1;

  if (daysSinceBackup > APP_CONFIG.backupReminderDays) {
    // showNotification('💾 Faça um backup manual dos seus dados! Vá em Configurações > Exportar Backup', 'warning') // [REMOVIDO: Poluição da tela]
  }

  // Configurar verificação diária
  setInterval(() => {
    const lastBackup = localStorage.getItem("lastManualBackup");
    const daysSinceBackup = lastBackup
      ? (Date.now() - new Date(lastBackup)) / (1000 * 60 * 60 * 24)
      : APP_CONFIG.backupReminderDays + 1;

    if (daysSinceBackup > APP_CONFIG.backupReminderDays) {
      // showNotification('💾 Faça um backup manual dos seus dados! Vá em Configurações > Exportar Backup', 'warning') // [REMOVIDO: Poluição da tela]
    }
  }, APP_CONFIG.storageCheckInterval);
}

// Configurar detecção de conectividade
function setupConnectivityDetection() {
  console.log("🌐 Configurando detecção de conectividade...");

  // Detectar quando está online
  window.addEventListener("online", () => {
    console.log("🌐 Conectado à internet");
    // showNotification('🌐 Conectado - Dados salvos localmente', 'success') // [REMOVIDO: Poluição da tela]

    // Verificar se há dados pendentes para sincronizar
    const pendingSync = sessionStorage.getItem("pendingSync");
    if (pendingSync) {
      try {
        const pendingData = JSON.parse(pendingSync);
        console.log(
          "📤 Dados pendentes encontrados:",
          pendingData.length,
          "itens"
        );
        // showNotification('📤 Sincronizando dados pendentes...', 'info') // [REMOVIDO: Poluição da tela]

        // Aqui você poderia implementar sincronização com servidor
        // Por enquanto, apenas limpa os dados pendentes
        sessionStorage.removeItem("pendingSync");
        // showNotification('✅ Dados sincronizados com sucesso!', 'success') // [REMOVIDO: Poluição da tela]
      } catch (error) {
        console.error("❌ Erro ao sincronizar dados:", error);
      }
    }
  });

  // Detectar quando está offline
  window.addEventListener("offline", () => {
    console.log("📱 Modo offline ativado");
    // showNotification('📱 Modo offline - Dados salvos localmente', 'info') // [REMOVIDO: Poluição da tela]
  });

  // Verificar status inicial
  if (navigator.onLine) {
    console.log("🌐 Status inicial: Online");
  } else {
    console.log("📱 Status inicial: Offline");
    // showNotification('📱 Modo offline - Dados salvos localmente', 'info') // [REMOVIDO: Poluição da tela]
  }
}

// Limpar backups antigos automaticamente
async function cleanOldBackups() {
  console.log("🧹 Verificando backups antigos...");

  const backups = await getBackups();
  const maxBackups = APP_CONFIG.maxBackups;

  if (backups.length > maxBackups) {
    console.log(
      `🗑️ Removendo ${backups.length - maxBackups} backups antigos...`
    );

    // Manter apenas os últimos backups
    const recentBackups = backups.slice(-maxBackups);
    // Em Supabase não removemos em massa aqui para evitar exclusões indevidas.

    console.log(`✅ Backups limpos: ${recentBackups.length} backups mantidos`);
    // showNotification(`🧹 ${backups.length - maxBackups} backups antigos removidos automaticamente`, 'info') // [REMOVIDO: Poluição da tela]
  } else {
    console.log(`✅ Backups em ordem: ${backups.length}/${maxBackups}`);
  }
}

// Função para marcar backup manual como feito
function markManualBackup() {
  localStorage.setItem("lastManualBackup", new Date().toISOString());
  console.log("✅ Backup manual marcado como feito");
}

// Gerenciamento de categorias
async function selectCategory(category) {
  currentCategory = category;

  const categoryTitles = {
    games: "🎮 Casa de Jogos",
    bar: "🍺 Bar",
    personal: "👤 Pessoal",
  };

  document.getElementById("category-title").textContent =
    categoryTitles[category];
  showScreen("dashboard-screen");

  // Mostrar/ocultar seção de pagamentos apenas para categoria pessoal
  const paymentsSection = document.getElementById("payments-section");
  if (category === "personal") {
    paymentsSection.style.display = "block";
  } else {
    paymentsSection.style.display = "none";
  }

  // Mostrar seção de parcelamentos para todas as categorias
  const installmentsSection = document.getElementById("installments-section");
  if (installmentsSection) {
    installmentsSection.style.display = "block";
  }

  await updateDisplay();
}

function goHome() {
  showScreen("home-screen");
  currentCategory = "";
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.classList.remove("active");
  });
  document.getElementById(screenId).classList.add("active");
}

// Atualizar estatísticas das categorias na tela inicial
async function updateCategoryStats() {
  const categories = ["games", "bar", "personal"];

  for (const category of categories) {
    const categoryTransactions = transactions[category] || [];
    const categoryInstallments = installments[category] || [];

    // Calcular receitas e despesas das transações
    let totalIncome = categoryTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    let totalExpense = categoryTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Adicionar parcelamentos pagos
    for (const installment of categoryInstallments) {
      if (
        installment.status === "active" ||
        installment.status === "completed"
      ) {
        try {
          // Buscar installment_items para calcular parcelas pagas
          if (typeof window.getInstallmentItemsFromSupabase === "function") {
            const installmentItems =
              (await window.getInstallmentItemsFromSupabase(installment.id)) ||
              [];
            const paidAmount = installmentItems
              .filter((item) => item.status === "paid")
              .reduce(
                (sum, item) => sum + (item.paid_amount || item.amount),
                0
              );

            if (installment.type === "income") {
              totalIncome += paidAmount;
            } else {
              totalExpense += paidAmount;
            }
          }
        } catch (error) {
          console.warn("Erro ao calcular parcelamentos:", error);
        }
      }
    }

    // Atualizar os stats na tela inicial
    const stats = document.querySelectorAll(
      `[onclick="selectCategory('${category}')"] .stat`
    );
    if (stats.length >= 2) {
      stats[0].textContent = `Receitas: ${formatCurrency(totalIncome)}`;
      stats[1].textContent = `Despesas: ${formatCurrency(totalExpense)}`;
    }
  }
}

// Gerenciamento de pagamentos
async function addPayment() {
  const debtorName = document.getElementById("debtor-name").value.trim();
  const amount = Number.parseFloat(
    document.getElementById("payment-amount").value
  );
  const description = document
    .getElementById("payment-description")
    .value.trim();
  const dueDate = document.getElementById("payment-due-date").value;

  if (!debtorName) {
    showNotification("Por favor, insira o nome da pessoa!", "error");
    document.getElementById("debtor-name").classList.add("error-feedback");
    setTimeout(() => {
      document.getElementById("debtor-name").classList.remove("error-feedback");
    }, 500);
    return;
  }

  if (!amount || amount <= 0) {
    showNotification("Por favor, insira um valor válido!", "error");
    document.getElementById("payment-amount").classList.add("error-feedback");
    setTimeout(() => {
      document
        .getElementById("payment-amount")
        .classList.remove("error-feedback");
    }, 500);
    return;
  }

  if (!description) {
    showNotification("Por favor, insira uma descrição!", "error");
    document
      .getElementById("payment-description")
      .classList.add("error-feedback");
    setTimeout(() => {
      document
        .getElementById("payment-description")
        .classList.remove("error-feedback");
    }, 500);
    return;
  }

  if (!dueDate) {
    showNotification("Por favor, insira uma data de vencimento!", "error");
    document.getElementById("payment-due-date").classList.add("error-feedback");
    setTimeout(() => {
      document
        .getElementById("payment-due-date")
        .classList.remove("error-feedback");
    }, 500);
    return;
  }

  // Adicionar loading state
  const addButton = document.querySelector('[onclick="addPayment()"]');
  const originalText = addButton.textContent;
  addButton.innerHTML = '<span class="loading-spinner"></span> Adicionando...';
  addButton.disabled = true;

  try {
    const payment = {
      debtor_name: debtorName,
      amount: amount,
      description: description,
      due_date: dueDate,
      status: "pending",
      category_id: currentCategory || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const inserted = await addPaymentToSupabase(payment);
    if (!payments[currentCategory]) {
      payments[currentCategory] = [];
    }
    payments[currentCategory].push(inserted);
    // Limpar formulário
    document.getElementById("debtor-name").value = "";
    document.getElementById("payment-amount").value = "";
    document.getElementById("payment-description").value = "";
    document.getElementById("payment-due-date").value = "";
    displayPayments();
    updateCategoryStats();
    addButton.textContent = originalText;
    addButton.disabled = false;
    addButton.classList.add("success-feedback");
    setTimeout(() => {
      addButton.classList.remove("success-feedback");
    }, 600);
    showNotification("Pagamento adicionado com sucesso!", "success");
    console.log("Pagamento adicionado no Supabase:", inserted);
    scheduleBackup();
  } catch (error) {
    showNotification("Erro ao salvar pagamento no Supabase!", "error");
    console.error("Erro Supabase:", error);
    addButton.textContent = originalText;
    addButton.disabled = false;
  }
}

// Sistema de confirmação modal
function showConfirmModal(message, onConfirm, onCancel = null) {
  // Remove modal existente se houver
  const existingModal = document.querySelector(".confirm-modal");
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement("div");
  modal.className = "confirm-modal";
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;

  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 30px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease;
    `;

  const messageEl = document.createElement("p");
  messageEl.textContent = message;
  messageEl.style.cssText = `
        margin: 0 0 25px 0;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
    `;

  const buttonsContainer = document.createElement("div");
  buttonsContainer.style.cssText = `
        display: flex;
        gap: 15px;
        justify-content: center;
    `;

  const confirmBtn = document.createElement("button");
  confirmBtn.textContent = "Confirmar";
  confirmBtn.style.cssText = `
        background: #e74c3c;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.3s;
    `;
  confirmBtn.onmouseover = () => (confirmBtn.style.background = "#c0392b");
  confirmBtn.onmouseout = () => (confirmBtn.style.background = "#e74c3c");

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancelar";
  cancelBtn.style.cssText = `
        background: #95a5a6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: background 0.3s;
    `;
  cancelBtn.onmouseover = () => (cancelBtn.style.background = "#7f8c8d");
  cancelBtn.onmouseout = () => (cancelBtn.style.background = "#95a5a6");

  const closeModal = () => {
    modal.style.animation = "fadeOut 0.3s ease";
    modalContent.style.animation = "slideOut 0.3s ease";
    setTimeout(() => modal.remove(), 300);
  };

  confirmBtn.onclick = () => {
    closeModal();
    if (onConfirm) onConfirm();
  };

  cancelBtn.onclick = () => {
    closeModal();
    if (onCancel) onCancel();
  };

  // Fechar com ESC
  const handleEsc = (e) => {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", handleEsc);
      closeModal();
      if (onCancel) onCancel();
    }
  };
  document.addEventListener("keydown", handleEsc);

  // Fechar clicando fora
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeModal();
      if (onCancel) onCancel();
    }
  };

  buttonsContainer.appendChild(cancelBtn);
  buttonsContainer.appendChild(confirmBtn);
  modalContent.appendChild(messageEl);
  modalContent.appendChild(buttonsContainer);
  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Focar no botão de confirmar
  setTimeout(() => confirmBtn.focus(), 100);
}

// Função para substituir alert() por notificação
function showAlert(message, type = "info") {
  showNotification(message, type);
}

function markPaymentAsPaid(paymentId) {
  const categoryPayments = payments[currentCategory] || [];
  const payment = categoryPayments.find((p) => p.id === paymentId);
  if (payment) {
    showConfirmModal("Confirmar que o pagamento foi recebido?", async () => {
      try {
        await updatePaymentInSupabase(paymentId, {
          status: "received",
          received_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        payment.status = "received";
        payment.received_at = new Date().toISOString();
        displayPayments();
        updateCategoryStats();
        showNotification("Pagamento marcado como recebido!", "success");
      } catch (error) {
        showNotification("Erro ao marcar pagamento como recebido!", "error");
        console.error("Erro Supabase:", error);
      }
    });
  }
}

function deletePayment(paymentId) {
  if (window.SAFE_MODE) {
    showNotification("Exclusão desativada no modo seguro.", "warning");
    return;
  }
  showConfirmModal("Tem certeza que deseja excluir este pagamento?", async () => {
    try {
      await deletePaymentFromSupabase(paymentId);
      for (const cat in payments) {
        payments[cat] = payments[cat].filter((p) => p.id !== paymentId);
      }
      displayPayments();
      updateCategoryStats();
      showNotification("Pagamento excluído com sucesso!", "success");
    } catch (error) {
      showNotification("Erro ao excluir pagamento no Supabase!", "error");
      console.error("Erro Supabase:", error);
    }
  });
}

function addTransactionFromPayment(payment) {
  if (!transactions[currentCategory]) {
    transactions[currentCategory] = [];
  }

  const transaction = {
    type: "income",
    amount: payment.amount,
    description: `Recebimento: ${payment.debtor_name} - ${payment.description}`,
    date: new Date().toISOString().slice(0, 10),
    category_id: currentCategory,
    payment_id: payment.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Adicionar ao Supabase
  addTransactionToSupabase(transaction)
    .then((inserted) => {
      transactions[currentCategory].push(inserted);
      displayTransactions();
      updateCategoryStats();
      showNotification("Transação criada a partir do pagamento!", "success");
    })
    .catch((error) => {
      showNotification("Erro ao criar transação do pagamento!", "error");
      console.error("Erro Supabase:", error);
    });
}

function filterPayments(filter, el) {
  currentPaymentFilter = filter;
  document.querySelectorAll("#payments-section .filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  if (el) el.classList.add("active");
  displayPayments();
}

function filterInstallments(filter, el) {
  currentInstallmentFilter = filter;
  document
    .querySelectorAll(".installments-list-section .filter-buttons .filter-btn")
    .forEach((btn) => {
      btn.classList.remove("active");
    });
  if (el) el.classList.add("active");
  displayInstallments();
}

function filterTransactions(filter, el) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  if (el) el.classList.add("active");
  displayTransactions();
}

function displayPayments() {
  const categoryPayments = payments[currentCategory] || [];
  let filteredPayments = categoryPayments;

  if (currentPaymentFilter !== "all") {
    filteredPayments = categoryPayments.filter(
      (p) => p.status === currentPaymentFilter
    );
  }

  const container = document.getElementById("payments-list");

  if (filteredPayments.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💰</div>
        <p>Nenhum pagamento encontrado</p>
      </div>
    `;
    return;
  }

  // Ordenar por data de vencimento
  filteredPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  container.innerHTML = filteredPayments
    .map((payment) => {
      const isOverdue =
        new Date(payment.due_date) < new Date() && payment.status === "pending";
      const statusClass =
        payment.status === "received" ? "paid" : isOverdue ? "overdue" : "";
      const statusText =
        payment.status === "received"
          ? "Recebido"
          : isOverdue
          ? "Vencido"
          : "Pendente";
      const statusClassBadge =
        payment.status === "received"
          ? "paid"
          : isOverdue
          ? "overdue"
          : "pending";

      return `
        <div class="payment-item ${statusClass}">
          <div class="payment-info">
            <div class="payment-debtor">${escapeHTML(
              payment.debtor_name || ""
            )}</div>
            <div class="payment-description">${escapeHTML(
              payment.description || ""
            )}</div>
            <div class="payment-details">
              <span>Vencimento: ${formatDate(payment.due_date)}</span>
              ${
                payment.status === "received"
                  ? `<span>Recebido em: ${formatDate(
                      payment.received_at
                    )}</span>`
                  : ""
              }
            </div>
          </div>
          <div class="payment-actions">
            <div class="payment-amount">${formatCurrency(payment.amount)}</div>
            <span class="payment-status ${statusClassBadge}">${statusText}</span>
            ${
              payment.status === "pending"
                ? `
              <button onclick="markPaymentAsPaid('${payment.id}')" class="btn-paid">Marcar Recebido</button>
            `
                : ""
            }
            ${window.SAFE_MODE ? '' : `<button onclick="deletePayment('${payment.id}')" class="btn btn-danger">🗑️</button>`}
          </div>
        </div>
      `;
    })
    .join("");
}

// Gerenciamento de transações
async function addTransaction() {
  const type = document.getElementById("transaction-type").value;
  const amount = Number.parseFloat(
    document.getElementById("transaction-amount").value
  );
  const description = document
    .getElementById("transaction-description")
    .value.trim();

  if (!amount || amount <= 0) {
    showNotification("Por favor, insira um valor válido!", "error");
    document
      .getElementById("transaction-amount")
      .classList.add("error-feedback");
    setTimeout(() => {
      document
        .getElementById("transaction-amount")
        .classList.remove("error-feedback");
    }, 500);
    return;
  }

  if (!description) {
    showNotification("Por favor, insira uma descrição!", "error");
    document
      .getElementById("transaction-description")
      .classList.add("error-feedback");
    setTimeout(() => {
      document
        .getElementById("transaction-description")
        .classList.remove("error-feedback");
    }, 500);
    return;
  }

  // Adicionar loading state
  const addButton = document.querySelector('[onclick="addTransaction()"]');
  const originalText = addButton.textContent;
  addButton.innerHTML = '<span class="loading-spinner"></span> Adicionando...';
  addButton.disabled = true;

  try {
    const transaction = {
      type: type,
      amount: amount,
      description: description,
      date: new Date().toISOString().slice(0, 10), // formato DATE
      category_id: currentCategory || null,
    };
    const inserted = await addTransactionToSupabase(transaction);
    if (!transactions[currentCategory]) {
      transactions[currentCategory] = [];
    }
    transactions[currentCategory].push(inserted);
    // Limpar formulário
    document.getElementById("transaction-amount").value = "";
    document.getElementById("transaction-description").value = "";
    updateDisplay();
    addButton.textContent = originalText;
    addButton.disabled = false;
    addButton.classList.add("success-feedback");
    setTimeout(() => {
      addButton.classList.remove("success-feedback");
    }, 600);
    showNotification("Transação adicionada com sucesso!", "success");
    console.log("Transação adicionada no Supabase:", inserted);
    scheduleBackup();
  } catch (error) {
    showNotification("Erro ao salvar no Supabase!", "error");
    console.error("Erro Supabase:", error);
    addButton.textContent = originalText;
    addButton.disabled = false;
  }
}

function deleteTransaction(transactionId) {
  if (window.SAFE_MODE) {
    showNotification("Exclusão desativada no modo seguro.", "warning");
    return;
  }
  showConfirmModal("Tem certeza que deseja excluir esta transação?", async () => {
    try {
      await deleteTransactionFromSupabase(transactionId);
      for (const cat in transactions) {
        transactions[cat] = transactions[cat].filter((t) => t.id !== transactionId);
      }
      updateDisplay();
      showNotification("Transação excluída com sucesso!", "success");
    } catch (error) {
      showNotification("Erro ao excluir do Supabase!", "error");
      console.error("Erro Supabase:", error);
    }
  });
}

function filterTransactions(filter, el) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  if (el) el.classList.add("active");
  displayTransactions();
}

// Atualização da interface
async function updateDisplay() {
  displayTransactions();
  displayPayments();
  await displayInstallments(); // Adicionar exibição de parcelamentos
  await updateBalance(); // Atualizar saldo
  await updateSummary(); // Atualizar resumo
  await updateCategoryStats();
}

async function updateBalance() {
  const categoryTransactions = (transactions[currentCategory] || [])
    .map((t) => normalizeTransaction(t))
    .filter(Boolean);
  const categoryInstallments = installments[currentCategory] || [];

  // Calcular saldo das transações
  let balance = categoryTransactions.reduce((total, transaction) => {
    return transaction.type === "income"
      ? total + Number(transaction.amount || 0)
      : total - Number(transaction.amount || 0);
  }, 0);

  // Adicionar parcelamentos pagos
  for (const installment of categoryInstallments) {
    if (installment.status === "active" || installment.status === "completed") {
      try {
        // Buscar installment_items para calcular parcelas pagas
        if (typeof window.getInstallmentItemsFromSupabase === "function") {
          const installmentItems =
            (await window.getInstallmentItemsFromSupabase(installment.id)) ||
            [];
          const paidAmount = installmentItems
            .filter((item) => item.status === "paid")
            .reduce((sum, item) => sum + (item.paid_amount || item.amount), 0);

          if (installment.type === "income") {
            balance += paidAmount;
          } else {
            balance -= paidAmount;
          }
        }
      } catch (error) {
        console.warn("Erro ao calcular parcelamentos:", error);
      }
    }
  }

  const balanceElement = document.getElementById("current-balance");
  balanceElement.textContent = formatCurrency(balance);
  balanceElement.className = `balance-amount ${balance < 0 ? "negative" : ""}`;
}

async function updateSummary() {
  const categoryTransactions = (transactions[currentCategory] || [])
    .map((t) => normalizeTransaction(t))
    .filter(Boolean);
  const categoryInstallments = installments[currentCategory] || [];

  // Calcular receitas e despesas das transações
  let totalIncome = categoryTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  let totalExpense = categoryTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  // Adicionar parcelamentos pagos
  for (const installment of categoryInstallments) {
    if (installment.status === "active" || installment.status === "completed") {
      try {
        // Buscar installment_items para calcular parcelas pagas
        if (typeof window.getInstallmentItemsFromSupabase === "function") {
          const installmentItems =
            (await window.getInstallmentItemsFromSupabase(installment.id)) ||
            [];
          const paidAmount = installmentItems
            .filter((item) => item.status === "paid")
            .reduce((sum, item) => sum + (item.paid_amount || item.amount), 0);

          if (installment.type === "income") {
            totalIncome += paidAmount;
          } else {
            totalExpense += paidAmount;
          }
        }
      } catch (error) {
        console.warn("Erro ao calcular parcelamentos:", error);
      }
    }
  }

  document.getElementById("total-income").textContent =
    formatCurrency(totalIncome);
  document.getElementById("total-expense").textContent =
    formatCurrency(totalExpense);
  document.getElementById("total-transactions").textContent =
    categoryTransactions.length;
}

function displayTransactions() {
  const categoryTransactions = transactions[currentCategory] || [];
  let filteredTransactions = categoryTransactions;

  if (currentFilter !== "all") {
    filteredTransactions = categoryTransactions.filter(
      (t) => t.type === currentFilter
    );
  }

  const container = document.getElementById("transactions-list");

  if (filteredTransactions.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <p>Nenhuma transação encontrada</p>
            </div>
        `;
    return;
  }

  // Normalizar e ordenar por data (mais recente primeiro)
  const normalized = filteredTransactions
    .map((t) => normalizeTransaction(t))
    .filter((t) => t);
  normalized.sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = normalized
    .map((transaction) => `
        <div class="transaction-item ${transaction.type}">
            <div class="transaction-info">
                <div class="transaction-description">${escapeHTML(transaction.description || "")}</div>
                <div class="transaction-date">${formatDate(transaction.date)}</div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === "income" ? "+" : "-"} ${formatCurrency(transaction.amount)}
            </div>
            ${window.SAFE_MODE ? '' : `<button onclick="deleteTransaction('${transaction.id}')" class="btn btn-danger">🗑️</button>`}
        </div>
    `)
    .join("");
}

// Utilitários
function formatCurrency(amount) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

// Timezone e parsing de datas consistente (UTC x local)
const APP_TIMEZONE = 'America/Sao_Paulo';
function parseDateFlexible(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    // Formato DATE (YYYY-MM-DD) → tratar como data local para evitar deslocamento UTC
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const [, y, mm, dd] = m;
      return new Date(Number(y), Number(mm) - 1, Number(dd), 0, 0, 0, 0);
    }
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value) {
  const date = parseDateFlexible(value);
  if (!date) return '-';
  const dateStr = date.toLocaleDateString('pt-BR', { timeZone: APP_TIMEZONE });
  const timeStr = date.toLocaleTimeString('pt-BR', { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit' });
  return `${dateStr} às ${timeStr}`;
}

// Sistema de Backup e Sincronização
function startAutoBackup() {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
  }

  autoBackupInterval = setInterval(() => {
    createBackup();
  }, APP_CONFIG.autoBackupInterval);
}

async function createBackup(note = "") {
  const backupData = {
    transactions: transactions,
    payments: payments,
    installments: installments, // Adicionar parcelamentos
    timestamp: new Date().toISOString(),
    version: APP_CONFIG.dataVersion,
  };
  try {
    await addBackupToSupabase(backupData, note);
    lastBackupTime = new Date();
    showNotification("Backup salvo no Supabase!", "success");
    await showBackupsList(); // Atualizar lista após backup
    console.log("Backup salvo no Supabase:", lastBackupTime.toLocaleString());
  } catch (error) {
    showNotification("Erro ao salvar backup no Supabase!", "error");
    console.error("Erro ao salvar backup no Supabase:", error);
  }
}

async function getBackups() {
  try {
    const backups = await getBackupsFromSupabase();
    return backups;
  } catch (error) {
    // showNotification('Erro ao buscar backups do Supabase!', 'error'); // [REMOVIDO: Poluição da tela]
    console.error("Erro ao buscar backups do Supabase:", error);
    return [];
  }
}

async function restoreBackup(backup) {
  if (!backup) return;
  showConfirmModal(
    "Tem certeza que deseja restaurar este backup? Os dados atuais serão perdidos.",
    async () => {
      try {
        let record = backup;
        if (typeof backup === 'string' && window.getBackupByIdFromSupabase) {
          record = await window.getBackupByIdFromSupabase(backup);
        }
        const backupData = record?.payload || (record?.data ? JSON.parse(record.data) : null);
        if (!backupData) throw new Error("Backup inválido");
        transactions = backupData.transactions || {};
        payments = backupData.payments || {};
        installments = backupData.installments || {};
        updateDisplay();
        showNotification("Backup restaurado com sucesso!", "success");
        await showBackupsList();
      } catch (error) {
        showNotification("Erro ao restaurar backup!", "error");
        console.error("Erro ao restaurar backup:", error);
      }
    }
  );
}

function restoreBackupById(id) {
  return restoreBackup(id);
}

function deleteBackup(backupId) {
  if (window.SAFE_MODE) {
    showNotification("Exclusão de backup desativada no modo seguro.", "warning");
    return;
  }
  showConfirmModal("Tem certeza que deseja excluir este backup?", async () => {
    try {
      await deleteBackupFromSupabase(backupId);
      showNotification("Backup excluído com sucesso!", "success");
      await showBackupsList();
    } catch (error) {
      showNotification("Erro ao excluir backup no Supabase!", "error");
      console.error("Erro Supabase:", error);
    }
  });
}

function exportBackup() {
  const backupData = {
    transactions: transactions,
    payments: payments,
    installments: installments, // Adicionar parcelamentos
    exportDate: new Date().toISOString(),
    version: APP_CONFIG.dataVersion,
  };

  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `backup_financeiro_${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();

  // Marcar backup manual como feito
  markManualBackup();

  // showNotification("Backup exportado com sucesso!") // [REMOVIDO: Notificação não essencial]
}

function importBackup() {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".json";
  fileInput.onchange = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const backupData = JSON.parse(e.target.result);
        showConfirmModal(
          "Tem certeza que deseja importar este backup? Os dados atuais serão substituídos.",
          () => {
            if (
              backupData.transactions &&
              backupData.payments &&
              backupData.installments
            ) {
              transactions = backupData.transactions;
              payments = backupData.payments;
              installments = backupData.installments;
              saveData();
              updateTransactionsDisplay();
              updatePaymentsDisplay();
              updateInstallmentsDisplay();
              // showNotification("Backup importado com sucesso!") // [REMOVIDO: Notificação não essencial]
            } else {
              // showNotification("Arquivo inválido. Por favor, selecione um arquivo de backup válido.", "error") // [REMOVIDO: Notificação não essencial]
            }
          }
        );
      } catch (error) {
        // showNotification("Erro ao ler o arquivo. Verifique se é um arquivo de backup válido.", "error") // [REMOVIDO: Notificação não essencial]
      }
    };
    reader.readAsText(file);
  };
  fileInput.click();
}

// Verificação de atualizações
function checkForUpdates() {
  const currentVersion = localStorage.getItem("financialManager_version");

  if (currentVersion !== APP_CONFIG.dataVersion) {
    // Migração de dados se necessário
    migrateData(currentVersion, APP_CONFIG.dataVersion);
    localStorage.setItem("financialManager_version", APP_CONFIG.dataVersion);
  }
}

function migrateData(oldVersion, newVersion) {
  console.log(`Migrando dados da versão ${oldVersion} para ${newVersion}`);

  // Aqui você pode adicionar lógica de migração específica
  // Por exemplo, converter formatos antigos para novos

  // showNotification("Dados atualizados para a nova versão!") // [REMOVIDO: Notificação não essencial]
}

// Service Worker para funcionalidade offline
function setupServiceWorker() {
  if ("serviceWorker" in navigator) {
    // Verificar se os arquivos essenciais existem antes de registrar
    const essentialFiles = ["/styles.css", "/script.js", "/manifest.json"];

    Promise.allSettled(
      essentialFiles.map((file) =>
        fetch(file, { method: "HEAD" })
          .then((response) => ({ file, exists: response.ok }))
          .catch(() => ({ file, exists: false }))
      )
    )
      .then((results) => {
        const missingFiles = results.filter((r) => !r.value.exists);
        if (missingFiles.length > 0) {
          console.warn(
            "Arquivos não encontrados:",
            missingFiles.map((r) => r.value.file)
          );
        }

        // Registrar Service Worker mesmo com arquivos faltando
        return navigator.serviceWorker.register("/sw.js");
      })
      .then((registration) => {
        console.log("Service Worker registrado:", registration);
      })
      .catch((error) => {
        console.log("Erro ao registrar Service Worker:", error);
      });
  }
}

// Melhorias na persistência de dados
function saveData() {
  try {
    const data = {
      transactions: transactions,
      payments: payments,
      installments: installments, // Adicionar parcelamentos
      lastSaved: new Date().toISOString(),
      version: APP_CONFIG.dataVersion,
    };

    localStorage.setItem("financeData", JSON.stringify(data));
    console.log("💾 Dados salvos com sucesso");

    // Criar backup automático
    createBackup();
  } catch (error) {
    console.error("❌ Erro ao salvar dados:", error);
    showNotification("Erro ao salvar dados!", "error");
  }
}

// Função para tentar recuperar dados perdidos
async function tryRecoverData() {
  console.log("🔍 Tentando recuperar dados perdidos...");

  // Verificar se há backup temporário
  const tempBackup = sessionStorage.getItem("tempBackup");
  if (tempBackup) {
    try {
      const backup = JSON.parse(tempBackup);
      if (backup.financeData) {
        const data = JSON.parse(backup.financeData);
        transactions = data.transactions || {};
        payments = data.payments || {};
        installments = data.installments || {};

        console.log("✅ Dados recuperados do backup temporário");
        // showNotification('Dados recuperados com sucesso!', 'success') // [REMOVIDO: Notificação não essencial]
        return true;
      }
    } catch (error) {
      console.error("Erro ao recuperar dados do backup temporário:", error);
    }
  }

  // Verificar se há backups automáticos
  const backups = await getBackups();
  if (Array.isArray(backups) && backups.length > 0) {
    const latestBackup = backups[0];
    try {
      const payload = latestBackup.payload || (latestBackup.data ? JSON.parse(latestBackup.data) : null) || latestBackup;
      transactions = payload.transactions || {};
      payments = payload.payments || {};
      installments = payload.installments || {};

      console.log("✅ Dados recuperados do último backup automático");
      // showNotification('Dados recuperados do último backup!', 'success') // [REMOVIDO: Notificação não essencial]
      return true;
    } catch (error) {
      console.error("Erro ao recuperar dados do backup automático:", error);
    }
  }

  // Verificar se há dados no localStorage principal
  const savedData = localStorage.getItem("financeData");
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      transactions = data.transactions || {};
      payments = data.payments || {};
      installments = data.installments || {};

      console.log("✅ Dados recuperados do localStorage principal");
      // showNotification('Dados recuperados do localStorage!', 'success') // [REMOVIDO: Notificação não essencial]
      return true;
    } catch (error) {
      console.error("Erro ao recuperar dados do localStorage:", error);
    }
  }

  console.log("❌ Nenhum dado encontrado para recuperação");
  // showNotification('Nenhum dado encontrado para recuperação', 'warning') // [REMOVIDO: Notificação não essencial]
  return false;
}

async function loadData() {
  try {
    console.log("🔄 Iniciando carregamento de dados...");

    // Verificar se o Supabase está disponível (definido em supabase-client.js)
    // Usar as funções do supabase-client.js que já têm fallback para localStorage
    console.log("🔧 Verificando disponibilidade do Supabase...");

    // Tentar carregar dados usando as funções do supabase-client.js
    try {
      // Buscar IDs de categorias conhecidas para mapear UUID -> chave amigável
      const categoryKeyToId = {};
      if (typeof window.getCategoryMaps === "function") {
        const maps = await window.getCategoryMaps();
        Object.keys(maps.idToName || {}).forEach((id) => {
          const name = maps.idToName[id];
          if (name === "games" || name === "bar" || name === "personal") {
            categoryKeyToId[id] = name;
          }
        });
      }

      // Buscar transações usando a função do supabase-client.js
      console.log("📊 Buscando transações...");
      const transactionsData =
        (await window.getTransactionsFromSupabase?.()) || [];
      console.log(
        "✅ Transações carregadas:",
        transactionsData?.length || 0,
        "registros"
      );

      // Agrupar por categoria, normalizando para as chaves 'games' | 'bar' | 'personal'
      transactions = { games: [], bar: [], personal: [] };
      transactionsData?.forEach((tx) => {
        const key = categoryKeyToId[tx.category_id] || currentCategory || "personal";
        if (!transactions[key]) transactions[key] = [];
        transactions[key].push(tx);
      });

      // Buscar pagamentos
      console.log("💰 Buscando pagamentos...");
      const paymentsData = (await window.getPaymentsFromSupabase?.()) || [];
      console.log(
        "✅ Pagamentos carregados:",
        paymentsData?.length || 0,
        "registros"
      );

      payments = { games: [], bar: [], personal: [] };
      paymentsData?.forEach((pay) => {
        const key = categoryKeyToId[pay.category_id] || currentCategory || "personal";
        if (!payments[key]) payments[key] = [];
        payments[key].push(pay);
      });

      // Buscar parcelamentos
      console.log("📅 Buscando parcelamentos...");
      const installmentsData =
        (await window.getInstallmentsFromSupabase?.()) || [];
      console.log(
        "✅ Parcelamentos carregados:",
        installmentsData?.length || 0,
        "registros"
      );

      installments = { games: [], bar: [], personal: [] };
      installmentsData?.forEach((inst) => {
        const key = categoryKeyToId[inst.category_id] || currentCategory || "personal";
        if (!installments[key]) installments[key] = [];
        installments[key].push(inst);
      });

      console.log("📂 Dados carregados com sucesso");
      console.log(
        "📊 Transações:",
        Object.keys(transactions).length,
        "categorias"
      );
      console.log("💰 Pagamentos:", Object.keys(payments).length, "categorias");
      console.log(
        "📅 Parcelamentos:",
        Object.keys(installments).length,
        "categorias"
      );
    } catch (supabaseError) {
      console.warn(
        "⚠️ Erro ao carregar do Supabase, usando localStorage:",
        supabaseError
      );

      // Fallback para localStorage
      console.log("📂 Carregando dados do localStorage (fallback)...");
      const savedTransactions = localStorage.getItem("transactions");
      const savedPayments = localStorage.getItem("payments");
      const savedInstallments = localStorage.getItem("installments");

      transactions = savedTransactions ? JSON.parse(savedTransactions) : {};
      payments = savedPayments ? JSON.parse(savedPayments) : {};
      installments = savedInstallments ? JSON.parse(savedInstallments) : {};

      console.log("📂 Dados carregados do localStorage");
      console.log(
        "📊 Transações:",
        Object.keys(transactions).length,
        "categorias"
      );
      console.log("💰 Pagamentos:", Object.keys(payments).length, "categorias");
      console.log(
        "📅 Parcelamentos:",
        Object.keys(installments).length,
        "categorias"
      );
    }
  } catch (error) {
    console.error("❌ Erro ao carregar dados:", error);
    transactions = {};
    payments = {};
    installments = {};
  }
}

// Sistema de notificações melhorado
function showNotification(message, type = "success") {
  // Criar container de notificações se não existir
  let container = document.querySelector(".notification-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-icon">${icons[type] || icons.info}</div>
    <div class="notification-message">${escapeHTML(message)}</div>
    <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(notification);

  // Auto-remover após 5 segundos
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideOutNotification 0.3s ease forwards";
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Exportar dados (funcionalidade extra)
function exportData() {
  const data = {
    transactions: transactions,
    payments: payments,
    installments: installments, // Adicionar parcelamentos
    exportDate: new Date().toISOString(),
  };

  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `backup_financeiro_${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();
}

// Funções da tela de configurações
async function showSettings() {
  showScreen("settings-screen");
  await updateSettingsInfo();
}

async function updateSettingsInfo() {
  // Atualizar informações de backup
  const backups = await getBackups();
  const lastBackup = Array.isArray(backups) && backups.length > 0 ? backups[0] : null;
  const lastManualBackup = localStorage.getItem("lastManualBackup");

  document.getElementById("last-backup-time").textContent = lastBackup
    ? formatDate(lastBackup.created_at || lastBackup?.payload?.timestamp)
    : "Nunca";
  document.getElementById("total-backups").textContent = Array.isArray(backups) ? backups.length : 0;

  // Atualizar informações de backup manual
  if (document.getElementById("last-manual-backup")) {
    document.getElementById("last-manual-backup").textContent = lastManualBackup
      ? formatDate(lastManualBackup)
      : "Nunca";
  }

  // Atualizar contadores de dados
  const totalTransactions = Object.values(transactions || {}).reduce(
    (sum, cat) => sum + cat.length,
    0
  );
  const totalPayments = Object.values(payments || {}).reduce(
    (sum, cat) => sum + cat.length,
    0
  );
  const totalInstallments = Object.values(installments || {}).reduce(
    (sum, cat) => sum + cat.length,
    0
  );

  document.getElementById("total-transactions-count").textContent =
    totalTransactions;
  document.getElementById("total-payments-count").textContent = totalPayments;
  document.getElementById("total-installments-count").textContent =
    totalInstallments;

  // Atualizar informações do app
  document.getElementById("app-version").textContent = APP_CONFIG.dataVersion;
  document.getElementById("last-update").textContent = "Hoje";
  document.getElementById("app-status").textContent = navigator.onLine
    ? "Online"
    : "Offline";

  // Atualizar informações de armazenamento
  await updateStorageInfo();
}

// Função para atualizar informações de armazenamento
async function updateStorageInfo() {
  try {
    // Calcular tamanho dos dados
    const dataSize = JSON.stringify({
      transactions,
      payments,
      installments,
      backups: await getBackups(),
    }).length;

    const dataSizeKB = (dataSize / 1024).toFixed(1);

    // Verificar espaço disponível
    const testData = "x".repeat(1024 * 100); // 100KB
    localStorage.setItem("storage_test", testData);
    localStorage.removeItem("storage_test");

    if (document.getElementById("storage-info")) {
      document.getElementById("storage-info").innerHTML = `
        <div class="storage-status">
          <span class="status-indicator online"></span>
          <span>Armazenamento: ${dataSizeKB} KB • Espaço disponível</span>
        </div>
      `;
    }

    console.log(`💾 Dados ocupam ${dataSizeKB} KB`);
  } catch (error) {
    console.warn("⚠️ Espaço de armazenamento limitado:", error);

    if (document.getElementById("storage-info")) {
      document.getElementById("storage-info").innerHTML = `
        <div class="storage-status">
          <span class="status-indicator offline"></span>
          <span>Armazenamento: Limite atingido</span>
        </div>
      `;
    }

    showNotification(
      "⚠️ Espaço de armazenamento limitado! Considere fazer backup e limpar dados antigos.",
      "warning"
    );
  }
}

function clearAllData() {
  showConfirmModal(
    "⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados do aplicativo. Esta ação não pode ser desfeita. Tem certeza?",
    () => {
      showConfirmModal(
        "Confirme novamente: Você realmente quer apagar todos os dados? Um backup será criado no Supabase antes de apagar.",
        async () => {
          try {
            await createBackup("pre-wipe");
          } catch (_) {
            showNotification(
              "Não foi possível criar backup no Supabase. Operação cancelada.",
              "error"
            );
            return;
          }
          if (window.SAFE_MODE) {
            showNotification("Modo seguro ativo: operação de limpeza cancelada.", "warning");
            return;
          }
          transactions = [];
          payments = [];
          installments = [];
          try { localStorage.clear(); } catch (_) {}
          updateSettingsInfo();
          goHome();
          showNotification("Dados apagados após backup no Supabase.", "warning");
        }
      );
    }
  );
}

async function showBackupsList() {
  const backups = await getBackups();
  const modal = document.getElementById("backups-modal");
  const list = document.getElementById("backups-list");

  if (backups.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p>Nenhum backup encontrado</p>
      </div>
    `;
  } else {
    list.innerHTML = backups
      .sort((a, b) => new Date(b.created_at || b?.payload?.timestamp || 0) - new Date(a.created_at || a?.payload?.timestamp || 0))
      .map((backup) => {
        const size = JSON.stringify(backup).length;
        const sizeKB = (size / 1024).toFixed(1);
        const versionSafe = escapeHTML(backup?.payload?.version || "");
        const when = backup.created_at || backup?.payload?.timestamp || '';

        return `
          <div class="backup-item">
            <div class="backup-info-modal">
              <div class="backup-date">${formatDate(when)}</div>
              <div class="backup-size">${sizeKB} KB • Versão ${versionSafe}</div>
            </div>
            <div class="backup-actions">
              <button onclick="restoreBackupById('${backup.id}')" class="btn btn-primary">Restaurar</button>
              <button onclick="deleteBackup('${backup.id}')" class="btn btn-danger">🗑️</button>
            </div>
          </div>
        `;
      })
      .join("");
  }

  modal.style.display = "flex";
}

function closeModal() {
  document.getElementById("backups-modal").style.display = "none";
}

async function ensureJsPDFReady() {
  // Já disponível?
  if (window.jsPDF?.jsPDF) return window.jsPDF.jsPDF;
  if (window.jspdf?.jsPDF) {
    window.jsPDF = window.jspdf;
    return window.jsPDF.jsPDF;
  }
  // Priorizar CDN (evita 404/MIME locais)
  const loadScript = (src) => new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = src;
    s.crossOrigin = 'anonymous';
    s.referrerPolicy = 'no-referrer';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });

  // 1) CDN oficial
  await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
  if (window.jspdf?.jsPDF && !window.jsPDF) window.jsPDF = window.jspdf;
  if (window.jsPDF?.jsPDF) return window.jsPDF.jsPDF;

  // 2) Proxy local (caso service worker redirecione CDNs)
  await loadScript('/api/vendor/jspdf.js');
  if (window.jspdf?.jsPDF && !window.jsPDF) window.jsPDF = window.jspdf;
  if (window.jsPDF?.jsPDF) return window.jsPDF.jsPDF;

  // 3) Último recurso: tentar arquivo local (pode falhar por 404/MIME)
  await loadScript('/vendor/jspdf.umd.min.js');
  if (window.jspdf?.jsPDF && !window.jsPDF) window.jsPDF = window.jspdf;
  return window.jsPDF?.jsPDF;
}

async function generatePDFReport() {
  console.log("🔄 Iniciando geração de PDF...");
  const ctor = await ensureJsPDFReady();
  if (!ctor) {
    console.log("⚠️ jsPDF não disponível, gerando relatório em texto...");
    generateTextReport();
    return;
  }
  await generatePDFReportInternal(ctor);
}

async function generatePDFReportInternal(jsPDFCtor) {
  console.log("📄 Gerando PDF interno...");

  try {
    const jsPDF = jsPDFCtor || (await ensureJsPDFReady());
    console.log("✅ jsPDF constructor obtido");

    const doc = new jsPDF();
    console.log("✅ Documento PDF criado");

    // Configurações do documento
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Título (sem emoji para evitar caracteres inválidos)
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório Financeiro", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += lineHeight * 2;

    // Data
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString(
        "pt-BR"
      )} às ${new Date().toLocaleTimeString("pt-BR")}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += lineHeight * 2;

    // Resumo Geral (sem emoji)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Geral", margin, yPosition);
    yPosition += lineHeight * 1.5;

    // Calcular totais
    const safeArray = (v) => (Array.isArray(v) ? v : []);
    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransactions = 0;
    let totalPendingPayments = 0;

    Object.keys(transactions).forEach((category) => {
      const categoryTransactions = Array.isArray(transactions[category]) ? transactions[category] : [];
      totalTransactions += categoryTransactions.length;
      totalIncome += categoryTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      totalExpense += categoryTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);
    });

    Object.keys(payments).forEach((category) => {
      const categoryPayments = Array.isArray(payments[category]) ? payments[category] : [];
      totalPendingPayments += categoryPayments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);
    });

    Object.keys(installments).forEach((category) => {
      const categoryInstallments = installments[category] || [];
      totalPendingPayments += categoryInstallments
        .filter((i) => i.status === "active") // Apenas parcelamentos ativos
        .reduce(
          (sum, i) =>
            sum +
            safeArray(i.installments)
              .filter((item) => item && item.status === "pending")
              .reduce((sum, item) => sum + item.amount, 0),
          0
        );
    });

    // Calcular parcelamentos por tipo
    let totalPendingExpenses = 0;
    let totalPendingIncome = 0;

    Object.keys(installments).forEach((category) => {
      const categoryInstallments = Array.isArray(installments[category]) ? installments[category] : [];
      categoryInstallments
        .filter((i) => i && i.status === "active")
        .forEach((installment) => {
          const pendingAmount = safeArray(installment?.installments)
            .filter((item) => item && item.status === "pending")
            .reduce((sum, item) => sum + (item.amount || 0), 0);

          if (installment.type === "expense") {
            totalPendingExpenses += pendingAmount;
          } else {
            totalPendingIncome += pendingAmount;
          }
        });
    });

    const balance = totalIncome - totalExpense;

    // Estatísticas gerais
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Receitas Totais: ${formatCurrency(totalIncome)}`,
      margin,
      yPosition
    );
    yPosition += lineHeight;
    doc.text(
      `Despesas Totais: ${formatCurrency(totalExpense)}`,
      margin,
      yPosition
    );
    yPosition += lineHeight;
    doc.text(`Saldo Atual: ${formatCurrency(balance)}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(`Total de Transações: ${totalTransactions}`, margin, yPosition);
    yPosition += lineHeight;
    doc.text(
      `Pagamentos Pendentes: ${formatCurrency(totalPendingPayments)}`,
      margin,
      yPosition
    );
    yPosition += lineHeight * 2;

    // Por Categoria (sem emoji)
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Por Categoria", margin, yPosition);
    yPosition += lineHeight * 1.5;

    const categories = ["games", "bar", "personal"]; 
    const categoryNames = {
      games: "Casa de Jogos",
      bar: "Bar",
      personal: "Pessoal",
    };

    categories.forEach((category) => {
      const categoryTransactions = (Array.isArray(transactions[category]) ? transactions[category] : []).map(normalizeTransaction).filter(Boolean);
      const categoryPayments = Array.isArray(payments[category]) ? payments[category] : [];
      const categoryInstallments = Array.isArray(installments[category]) ? installments[category] : [];

      const categoryIncome = categoryTransactions
        .filter((t) => t && t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const categoryExpense = categoryTransactions
        .filter((t) => t && t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const categoryBalance = categoryIncome - categoryExpense;
      const pendingPayments = categoryPayments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);

      const pendingInstallments = categoryInstallments
        .filter((i) => i.status === "active") // Apenas parcelamentos ativos
        .reduce(
          (sum, i) =>
            sum +
            safeArray(i.installments)
              .filter((item) => item && item.status === "pending")
              .reduce((sum, item) => sum + item.amount, 0),
          0
        );

      // Verificar se há espaço suficiente na página
      if (yPosition > doc.internal.pageSize.height - 60) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(categoryNames[category], margin, yPosition);
      yPosition += lineHeight;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(
        `  Receitas: ${formatCurrency(categoryIncome)}`,
        margin,
        yPosition
      );
      yPosition += lineHeight;
      doc.text(
        `  Despesas: ${formatCurrency(categoryExpense)}`,
        margin,
        yPosition
      );
      yPosition += lineHeight;
      doc.text(
        `  Saldo: ${formatCurrency(categoryBalance)}`,
        margin,
        yPosition
      );
      yPosition += lineHeight;
      doc.text(
        `  Transações: ${categoryTransactions.length}`,
        margin,
        yPosition
      );
      yPosition += lineHeight;
      doc.text(
        `  Pagamentos Pendentes: ${formatCurrency(pendingPayments)}`,
        margin,
        yPosition
      );
      yPosition += lineHeight;
      doc.text(
        `  Parcelamentos Pendentes: ${formatCurrency(pendingInstallments)}`,
        margin,
        yPosition
      );
      yPosition += lineHeight;

      yPosition += lineHeight;
    });

    // Transações Recentes (tabela simples com truncamento)
    if (yPosition > doc.internal.pageSize.height - 80) {
      doc.addPage();
      yPosition = margin;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Transações Recentes", margin, yPosition);
    yPosition += lineHeight * 1.2;

    // Cabeçalho
    const colX = [margin, margin + 70, margin + 135, margin + 175];
    doc.setFontSize(11); doc.setFont('helvetica','bold');
    ['Categoria','Tipo','Valor','Data'].forEach((h,i)=>doc.text(h,colX[i],yPosition));
    yPosition += lineHeight - 2; doc.setFont('helvetica','normal');

    // Coletar todas as transações
    let allTransactions = [];
    Object.keys(transactions).forEach((category) => {
      const categoryTransactions = transactions[category] || [];
      categoryTransactions.forEach((t) => {
        allTransactions.push({
          ...t,
          category: category,
        });
      });
    });

    // Ordenar por data e pegar as últimas 5
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTransactions = allTransactions.slice(0, 8);

    if (recentTransactions.length > 0) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      recentTransactions.forEach((t) => {
        if (yPosition > doc.internal.pageSize.height - 40) {
          doc.addPage();
          yPosition = margin;
        }

        const cat = (categoryNames[t.category] || t.category).slice(0,18);
        const type = t.type === 'income' ? 'Receita' : 'Despesa';
        const val = formatCurrency(Number(t.amount||0));
        const d = new Date(t.date).toLocaleDateString('pt-BR');
        doc.text(cat, colX[0], yPosition);
        doc.text(type, colX[1], yPosition);
        doc.text(val, colX[2], yPosition);
        doc.text(d, colX[3], yPosition);
        yPosition += lineHeight - 1;
      });
    }

    // Seção: Parcelamentos (geral)
    if (yPosition > doc.internal.pageSize.height - 80) {
      doc.addPage();
      yPosition = margin;
    }
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("📅 Parcelamentos", margin, yPosition);
    yPosition += lineHeight * 1.5;

    const categoriesForInstallments = Object.keys(installments || {});
    for (const category of categoriesForInstallments) {
      const categoryInstallments = Array.isArray(installments[category]) ? installments[category] : [];
      if (categoryInstallments.length === 0) continue;

      if (yPosition > doc.internal.pageSize.height - 60) {
        doc.addPage();
        yPosition = margin;
      }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${category.toUpperCase()}`, margin, yPosition);
      yPosition += lineHeight;

      doc.setFont("helvetica", "normal");
      for (const inst of categoryInstallments) {
        if (yPosition > doc.internal.pageSize.height - 30) {
          doc.addPage();
          yPosition = margin;
        }
        let items = safeArray(inst?.installments);
        // Tentar buscar itens mais atualizados do Supabase
        try {
          if (typeof window.getInstallmentItemsFromSupabase === 'function' && inst?.id) {
            const fetched = await window.getInstallmentItemsFromSupabase(inst.id);
            if (Array.isArray(fetched) && fetched.length) items = fetched;
          }
        } catch (_) {}

        const paid = items
          .filter((it) => it && it.status === "paid")
          .reduce((s, it) => s + (it.paid_amount || it.amount || 0), 0);
        const total = Number(inst?.total_amount || 0);
        const pending = Math.max(total - paid, 0);
        const statusLabel = inst?.status || "active";
        const typeLabel = inst?.type === "income" ? "Receita" : "Despesa";
        const paidCount = items.filter((it) => it && it.status === 'paid').length;
        const pendingItems = items.filter((it) => it && it.status === 'pending');
        const pendingCount = pendingItems.length;
        let nextDue = '';
        try {
          if (pendingItems.length > 0) {
            const next = pendingItems
              .map((it) => new Date(it.due_date || it.dueDate))
              .filter((d) => !Number.isNaN(d.getTime()))
              .sort((a, b) => a - b)[0];
            if (next) nextDue = ` — Próx.: ${next.toLocaleDateString('pt-BR')}`;
          }
        } catch (_) {}
        const line = `${inst?.description || "(sem descrição)"} — ${typeLabel} — ${statusLabel} — Total: ${formatCurrency(total)} — Pago: ${formatCurrency(paid)} — Pendente: ${formatCurrency(pending)} — Itens: ${paidCount} pagos, ${pendingCount} pendentes${nextDue} — Parc.: ${(inst?.installments_count || inst?.installmentsCount || items.length)}×${formatCurrency(inst?.installment_amount || inst?.installmentAmount || 0)}`;
        doc.text(line, margin + 4, yPosition);
        yPosition += lineHeight - 2;

        // Listagem item a item (parcelas)
        try {
          if (Array.isArray(items) && items.length > 0) {
            const itemsSorted = items.slice().sort((a, b) => (a?.number || a?.installmentNumber || 0) - (b?.number || b?.installmentNumber || 0));
            doc.setFontSize(10);
            for (const it of itemsSorted) {
              if (yPosition > doc.internal.pageSize.height - 20) { doc.addPage(); yPosition = margin; }
              const num = it?.number || it?.installmentNumber || '?';
              const dueStr = formatDate(it?.due_date || it?.dueDate || '');
              const statusTxt = it?.status === 'paid' ? 'Pago' : (it?.status === 'pending' ? 'Pendente' : (it?.status || ''));
              const amountIt = formatCurrency(it?.paid_amount || it?.amount || 0);
              const lineIt = `#${num} ${dueStr} — ${statusTxt} — ${amountIt}`;
              doc.text(lineIt, margin + 8, yPosition);
              yPosition += lineHeight - 3;
            }
            doc.setFontSize(12);
          }
        } catch (_) {}
      }
      yPosition += 2;
    }

    // Salvar PDF
    const fileName = `relatorio_financeiro_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    doc.save(fileName);

    console.log("✅ PDF gerado com sucesso:", fileName);
    // showNotification("Relatório PDF gerado com sucesso!", "success"); // [REMOVIDO: Notificação não essencial]
  } catch (error) {
    console.error("❌ Erro ao gerar PDF:", error);
    // showNotification("Erro ao gerar PDF: " + error.message, "error"); // [REMOVIDO: Notificação não essencial]
  }
}

// Exportação do relatório mensal carregado do Supabase
async function exportMonthlyReportPDF() {
  try {
    showNotification?.('Gerando PDF mensal...', 'info');
    // Garantir jsPDF carregado sob demanda
    const ctor = await ensureJsPDFReady();
    if (!ctor) {
      showNotification?.('PDF não disponível, tente TXT', 'warning');
      return exportMonthlyReportText();
    }
    let ctx = window.__lastMonthlyReport;
    if (!ctx) {
      try {
        const yearSel = document.getElementById('report-year-select');
        const monthSel = document.getElementById('report-month-select');
        const now = new Date();
        const year = yearSel ? parseInt(yearSel.value, 10) || now.getFullYear() : now.getFullYear();
        const month = monthSel ? parseInt(monthSel.value, 10) || (now.getMonth() + 1) : (now.getMonth() + 1);
        const reports = await getReportsFromSupabase({ report_type: 'monthly', year, month });
        if (Array.isArray(reports) && reports.length) {
          ctx = { year, month, report: reports[0] };
          window.__lastMonthlyReport = ctx;
        }
      } catch (_) {}
    }
    if (!ctx) {
      showNotification?.('Nenhum relatório mensal carregado. Clique em "Ver relatório" antes de imprimir.', 'warning');
      return;
    }
    const jsPDF = ctor;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const line = 8;
    let y = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Relatório Mensal - ${getMonthName(ctx.month - 1)} ${ctx.year}`, pageWidth/2, y, { align: 'center' });
    y += line * 2;
    const stats = ctx.report?.stats || {};
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Receitas: ${formatCurrency(stats.totalIncome || 0)}`, margin, y); y += line;
    doc.text(`Despesas: ${formatCurrency(stats.totalExpense || 0)}`, margin, y); y += line;
    doc.text(`Saldo: ${formatCurrency((stats.balance != null ? stats.balance : (stats.totalIncome||0)-(stats.totalExpense||0)))}`, margin, y); y += line;
    doc.text(`Transações: ${stats.totalTransactions || 0}`, margin, y); y += line * 1.5;
    doc.setFont('helvetica', 'bold');
    doc.text('Detalhamento', margin, y); y += line;
    doc.setFont('helvetica', 'normal');
    const txByCat = ctx.report?.transactions || {};
    for (const [cat, list] of Object.entries(txByCat)) {
      if (y > doc.internal.pageSize.height - 30) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold'); doc.text(cat, margin, y); y += line;
      doc.setFont('helvetica', 'normal');
      (Array.isArray(list) ? list : []).forEach(t => {
        const text = `${formatDate(t.date)} - ${t.description || ''} - ${(t.type==='income'?'Receita':'Despesa')} - ${formatCurrency(t.amount||0)}`;
        if (y > doc.internal.pageSize.height - 20) { doc.addPage(); y = margin; }
        doc.text(text, margin+4, y); y += line - 2;
      });
      y += 4;
    }

    // Pagamentos do mês (do report ou fallback)
    const monthStart = new Date(ctx.year, (ctx.month || 1) - 1, 1);
    const monthEnd = new Date(ctx.year, (ctx.month || 1), 0);
    const pmByCat = (ctx.report?.payments && Object.keys(ctx.report.payments).length)
      ? ctx.report.payments
      : (() => {
          const out = {};
          Object.keys(payments || {}).forEach((cat) => {
            const list = Array.isArray(payments[cat]) ? payments[cat] : [];
            out[cat] = list.filter((p) => {
              const dstr = p?.due_date || p?.date || p?.created_at;
              const d = dstr ? new Date(dstr) : null;
              return d && d >= monthStart && d <= monthEnd;
            });
          });
          return out;
        })();

    if (y > doc.internal.pageSize.height - 30) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.text('Pagamentos do mês', margin, y); y += line;
    doc.setFont('helvetica', 'normal');
    for (const [cat, list] of Object.entries(pmByCat)) {
      if (!Array.isArray(list) || list.length === 0) continue;
      if (y > doc.internal.pageSize.height - 30) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold'); doc.text(cat, margin, y); y += line;
      doc.setFont('helvetica', 'normal');
      list.forEach((p) => {
        if (y > doc.internal.pageSize.height - 20) { doc.addPage(); y = margin; }
        const statusTxt = p?.status === 'received' ? 'Recebido' : 'Pendente';
        const d = formatDate(p?.due_date || p?.date || '');
        const txt = `${d} — ${escapeHTML(p?.debtor_name || p?.description || '')} — ${statusTxt} — ${formatCurrency(p?.amount || 0)}`;
        doc.text(txt, margin + 4, y); y += line - 2;
      });
      y += 2;
    }

    // Parcelamentos do mês (todas as parcelas, pagas e pendentes)
    if (y > doc.internal.pageSize.height - 30) { doc.addPage(); y = margin; }
    doc.setFont('helvetica', 'bold');
    doc.text('Parcelamentos do mês (todas as parcelas)', margin, y); y += line;
    doc.setFont('helvetica', 'normal');
    const instByCat = Object.keys(installments || {}).reduce((acc, cat) => {
      acc[cat] = (Array.isArray(installments[cat]) ? installments[cat] : []).map((inst) => ({
        ...inst,
        items: Array.isArray(inst?.installments) ? inst.installments : []
      }));
      return acc;
    }, {});
    const cats = Object.keys(instByCat);
    if (cats.length === 0) {
      doc.text('Sem parcelamentos', margin + 4, y); y += line;
    }
    for (const cat of cats) {
      const list = instByCat[cat] || [];
      if (list.length === 0) return;
      if (y > doc.internal.pageSize.height - 30) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.text(cat, margin, y); y += line;
      doc.setFont('helvetica', 'normal');
      for (const inst of list) {
        if (y > doc.internal.pageSize.height - 30) { doc.addPage(); y = margin; }
        let items = Array.isArray(inst.items) ? inst.items : [];
        // Buscar itens do Supabase para garantir detalhamento completo
        try {
          if (typeof window.getInstallmentItemsFromSupabase === 'function' && inst?.id) {
            const fetched = await window.getInstallmentItemsFromSupabase(inst.id);
            if (Array.isArray(fetched) && fetched.length) items = fetched;
          }
        } catch (_) {}
        const total = Number(inst.total_amount || inst.totalAmount || 0);
        const paid = items.filter(i => i?.status === 'paid').reduce((s,i)=>s+Number(i.paid_amount||i.amount||0),0);
        const pending = Math.max(total - paid, 0);
        const typeLabel = inst.type === 'income' ? 'Receita' : 'Despesa';
        const header = `${escapeHTML(inst.description || '(sem descrição)')} — ${typeLabel} — ${inst.status||''} — Total: ${formatCurrency(total)} — Pago: ${formatCurrency(paid)} — Pendente: ${formatCurrency(pending)} — Parc.: ${(inst.installments_count || items.length)}×${formatCurrency(inst.installment_amount || inst.installmentAmount || 0)}`;
        doc.text(header, margin + 4, y); y += line - 2;
        // Cabeçalho da tabela de parcelas
        const colX = [margin + 6, margin + 22, margin + 70, margin + 108, margin + 148];
        const headers = ['#', 'Venc.', 'Status', 'Valor', 'Pago em'];
        doc.setFont('helvetica', 'bold');
        headers.forEach((h, i) => doc.text(h, colX[i], y));
        y += line - 3;
        doc.setFont('helvetica', 'normal');
        // Itens (linhas)
        const rows = items.slice().sort((a,b)=> (a?.number||a?.installmentNumber||0)-(b?.number||b?.installmentNumber||0));
        for (const it of rows) {
          if (y > doc.internal.pageSize.height - 15) { doc.addPage(); y = margin; }
          const n = String(it?.number || it?.installmentNumber || '?');
          const due = it?.due_date || it?.dueDate || '';
          const dueTxt = due ? formatDate(due) : '-';
          const st = it?.status === 'paid' ? 'Pago' : (it?.status === 'pending' ? 'Pendente' : (it?.status||''));
          const val = formatCurrency(Number(it?.paid_amount || it?.amount || 0));
          const paidAt = it?.paid_at || it?.paidAt;
          const paidTxt = paidAt ? formatDate(paidAt) : '-';
          const cells = [n, dueTxt, st, val, paidTxt];
          cells.forEach((c, i) => doc.text(String(c), colX[i], y));
          y += line - 3;
        }
        y += 2;
      }
    }

    const file = `relatorio_mensal_${ctx.year}-${String(ctx.month).padStart(2,'0')}.pdf`;
    try {
      if (typeof doc.autoPrint === 'function') {
        doc.autoPrint();
      }
      const blobUrl = doc.output('bloburl');
      const w = window.open(blobUrl, '_blank');
      if (!w || w.closed || typeof w.closed === 'undefined') {
        // Popup bloqueado: fallback para download
        doc.save(file);
      }
      showNotification?.('PDF gerado', 'success');
    } catch (_) {
      // Fallback para download direto
      doc.save(file);
      showNotification?.('PDF salvo', 'success');
    }
  } catch (e) {
    console.warn('Falha ao exportar PDF mensal:', e);
    showNotification?.('Falha ao gerar PDF mensal', 'error');
  }
}

function exportMonthlyReportText() {
	try {
		const ctx = window.__lastMonthlyReport;
		if (!ctx) return;
		const stats = ctx.report?.stats || {};
		const monthName = getMonthName((ctx.month || 1) - 1);
		const safeArray = (v) => (Array.isArray(v) ? v : []);
		const fmtDate = (d) => (d ? formatDate(d) : "-");

		// Cabeçalho
		let txt = "📊 RELATÓRIO MENSAL\n";
		txt += "=".repeat(64) + "\n";
		txt += `${monthName.toUpperCase()} / ${ctx.year}\n\n`;

		// Resumo do mês
		txt += "Resumo do Mês\n";
		txt += "-".repeat(32) + "\n";
		txt += `• Receitas: ${formatCurrency(stats.totalIncome || 0)}\n`;
		txt += `• Despesas: ${formatCurrency(stats.totalExpense || 0)}\n`;
		txt += `• Saldo: ${formatCurrency((stats.balance != null ? stats.balance : (stats.totalIncome||0)-(stats.totalExpense||0)))}\n`;
		txt += `• Total de Transações: ${stats.totalTransactions || 0}\n\n`;

		// Transações por categoria
		txt += "Transações por Categoria\n";
		txt += "-".repeat(32) + "\n";
		const txByCat = ctx.report?.transactions || {};
		for (const [cat, list] of Object.entries(txByCat)) {
			txt += `\n[${cat}]\n`;
			const arr = safeArray(list);
			if (arr.length === 0) {
				txt += "  • Nenhuma transação\n";
			} else {
				arr.forEach((t) => {
					const tipo = t?.type === 'income' ? 'Receita' : 'Despesa';
					txt += `  • ${fmtDate(t?.date)} — ${t?.description || ''} — ${tipo} — ${formatCurrency(t?.amount || 0)}\n`;
				});
			}
		}
		txt += "\n";

		// Pagamentos do mês (pendentes e recebidos/pagos)
		txt += "Pagamentos do Mês\n";
		txt += "-".repeat(32) + "\n";
		const monthlyPm = getMonthlyPayments();
		let pendentesTotal = 0;
		let recebidosTotal = 0;
		for (const [cat, list] of Object.entries(monthlyPm)) {
			const arr = safeArray(list);
			if (arr.length === 0) continue;
			txt += `\n[${cat}]\n`;
			arr.forEach((p) => {
				const st = (p?.status || '').toLowerCase();
				const isPendente = st === 'pending';
				const isRecebido = st === 'received' || st === 'paid';
				if (isPendente) pendentesTotal += p?.amount || 0;
				if (isRecebido) recebidosTotal += p?.amount || 0;
				txt += `  • ${fmtDate(p?.date || p?.due_date)} — ${p?.description || ''} — ${st || '-'} — ${formatCurrency(p?.amount || 0)}\n`;
			});
		}
		if (pendentesTotal === 0 && recebidosTotal === 0) {
			txt += "  • Nenhum pagamento no período\n";
		}
		txt += `\n  Totais: pendentes ${formatCurrency(pendentesTotal)} | recebidos/pagos ${formatCurrency(recebidosTotal)}\n\n`;

		// Parcelamentos do mês (resumo + itens)
		txt += "Parcelamentos do Mês\n";
		txt += "-".repeat(32) + "\n";
		const monthlyInst = getMonthlyInstallments();
		let anyInst = false;
		for (const [cat, list] of Object.entries(monthlyInst)) {
			const arr = safeArray(list);
			if (arr.length === 0) continue;
			anyInst = true;
			txt += `\n[${cat}]\n`;
			arr.forEach((inst) => {
				const items = safeArray(inst?.installments);
				const total = inst?.total_amount || inst?.totalAmount || 0;
				const paidCount = items.filter((i) => i && i.status === 'paid').length;
				const pendingCount = items.filter((i) => i && i.status === 'pending').length;
				txt += `  • ${inst?.description || ''} — status: ${inst?.status || '-'} — total: ${formatCurrency(total)} — itens: ${items.length} (pagas: ${paidCount}, pendentes: ${pendingCount})\n`;
				items.forEach((it) => {
					const num = it?.installmentNumber || it?.number || '-';
					const due = fmtDate(it?.due_date || it?.dueDate);
					const paidAt = it?.paid_at || it?.paidAt;
					txt += `    - Parcela #${num} — venc.: ${due} — valor: ${formatCurrency(it?.amount || 0)} — status: ${it?.status || '-'}${paidAt ? ` — pago em: ${fmtDate(paidAt)}` : ''}\n`;
				});
			});
		}
		if (!anyInst) {
			txt += "  • Nenhum parcelamento no período\n";
		}
		txt += "\n";

		// Transações recentes do mês (top 10)
		txt += "Transações Recentes\n";
		txt += "-".repeat(32) + "\n";
		let recent = [];
		for (const [cat, list] of Object.entries(txByCat)) {
			const arr = safeArray(list);
			arr.forEach((t) => recent.push({ ...t, __cat: cat }));
		}
		recent.sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));
		recent.slice(0, 10).forEach((t) => {
			const tipo = t?.type === 'income' ? 'Receita' : 'Despesa';
			txt += `• ${fmtDate(t?.date)} — [${t.__cat}] ${t?.description || ''} — ${tipo} — ${formatCurrency(t?.amount || 0)}\n`;
		});
		if (recent.length === 0) {
			txt += "• Nenhuma transação no período\n";
		}

		// Download
		const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `relatorio_mensal_${ctx.year}-${String(ctx.month).padStart(2,'0')}.txt`;
		link.click();
	} catch (e) {
		console.warn('Falha ao exportar TXT mensal:', e);
	}
}

function generateDetailedReport() {
  // Relatório detalhado em JSON (mantido para compatibilidade)
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalCategories: Object.keys(transactions).length,
      totalTransactions: Object.values(transactions).reduce(
        (sum, cat) => sum + cat.length,
        0
      ),
      totalPayments: Object.values(payments).reduce(
        (sum, cat) => sum + cat.length,
        0
      ),
      totalInstallments: Object.values(installments).reduce(
        (sum, cat) => sum + cat.length,
        0
      ),
    },
    categories: {},
  };

  // Gerar relatório por categoria
  Object.keys(transactions).forEach((category) => {
    const categoryTransactions = transactions[category] || [];
    const categoryPayments = payments[category] || [];
    const categoryInstallments = installments[category] || [];

    const totalIncome = categoryTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = categoryTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingPayments = categoryPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingInstallments = categoryInstallments
      .filter((i) => i.status === "active") // Apenas parcelamentos ativos
      .reduce(
        (sum, i) =>
          sum +
          i.installments
            .filter((item) => item.status === "pending")
            .reduce((sum, item) => sum + item.amount, 0),
        0
      );

    report.categories[category] = {
      transactions: categoryTransactions.length,
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense,
      payments: categoryPayments.length,
      pendingPayments: pendingPayments,
      installments: categoryInstallments.length,
      pendingInstallments: pendingInstallments,
    };
  });

  // Exportar relatório
  const dataStr = JSON.stringify(report, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `relatorio_detalhado_${
    new Date().toISOString().split("T")[0]
  }.json`;
  link.click();

  // showNotification("Relatório detalhado gerado com sucesso!") // [REMOVIDO: Notificação não essencial]
}

function exportToCSV() {
  let csv = "Categoria,Tipo,Descrição,Valor,Data\n";

  Object.keys(transactions).forEach((category) => {
    const categoryTransactions = transactions[category] || [];

    categoryTransactions.forEach((transaction) => {
      csv += `"${category}","${transaction.type}","${transaction.description}","${transaction.amount}","${transaction.date}"\n`;
    });
  });

  Object.keys(payments).forEach((category) => {
    const categoryPayments = payments[category] || [];
    categoryPayments.forEach((payment) => {
      csv += `"${category}","${payment.type}","${payment.description}","${payment.amount}","${payment.date}"\n`;
    });
  });

  Object.keys(installments).forEach((category) => {
    const categoryInstallments = Array.isArray(installments[category]) ? installments[category] : [];
    categoryInstallments.forEach((installment) => {
      csv += `"${category}","${installment.description}","${installment.totalAmount}","${installment.firstDueDate}","${installment.status}"\n`;
      const items = Array.isArray(installment.installments) ? installment.installments : [];
      items.forEach((item) => {
        csv += `"${installment.id}","${item.installmentNumber}","${item.amount}","${item.dueDate}","${item.status}"\n`;
      });
    });
  });

  const dataBlob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(dataBlob);
  link.download = `transacoes_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();

  showNotification("Dados exportados para CSV!");
}

// Atalhos de teclado melhorados
document.addEventListener("keydown", (e) => {
  // Escape - Voltar para tela inicial
  if (e.key === "Escape" && currentCategory) {
    goHome();
  }

  // Ctrl + , - Configurações
  if (e.ctrlKey && e.key === ",") {
    e.preventDefault();
    showSettings();
  }

  // Ctrl + N - Nova transação (quando no dashboard)
  if (e.ctrlKey && e.key === "n" && currentCategory) {
    e.preventDefault();
    document.getElementById("transaction-amount").focus();
  }

  // Ctrl + P - Novo pagamento (quando na categoria pessoal)
  if (e.ctrlKey && e.key === "p" && currentCategory === "personal") {
    e.preventDefault();
    document.getElementById("debtor-name").focus();
  }

  // Ctrl + S - Salvar/Backup
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    createBackup();
    // showNotification("Backup manual criado!", "info") // [REMOVIDO: Notificação não essencial]
  }

  // Enter - Submeter formulário ativo
  if (e.key === "Enter") {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === "INPUT") {
      const form = activeElement.closest("form") || activeElement.parentElement;
      const submitButton = form.querySelector(
        "button[type='submit'], .btn-primary"
      );
      if (submitButton) {
        submitButton.click();
      }
    }
  }
});

// Funções para os botões da lateral
function showTransactions() {
  if (currentCategory) {
    // Se já estiver em uma categoria, vai para o dashboard
    showScreen("dashboard-screen");
  } else {
    // Se estiver na tela inicial, mostra mensagem
    // showNotification("Selecione uma categoria primeiro!", "info") // [REMOVIDO: Notificação não essencial]
  }
}

function showReports() {
  showScreen("reports-screen");
  generateReportsView();
}

// Tela de relatórios
async function generateReportsView() {
  const reportsContainer = document.getElementById("reports-container");

  if (!reportsContainer) {
    console.error("Container de relatórios não encontrado!");
    return;
  }

  // Calcular receitas e despesas das transações (tolerante a dados indefinidos)
  const safeArray = (v) => (Array.isArray(v) ? v : []);
  const allTransactionsByCat = Object.values(transactions || {});
  const totalTransactions = allTransactionsByCat.reduce(
    (sum, cat) => sum + safeArray(cat).length,
    0
  );
  let totalIncome = allTransactionsByCat.reduce((sum, cat) => {
    const arr = safeArray(cat);
    return (
      sum +
      arr
        .filter((t) => t && t.type === "income")
        .reduce((s, t) => s + Number(t.amount || 0), 0)
    );
  }, 0);
  let totalExpense = allTransactionsByCat.reduce((sum, cat) => {
    const arr = safeArray(cat);
    return (
      sum +
      arr
        .filter((t) => t && t.type === "expense")
        .reduce((s, t) => s + Number(t.amount || 0), 0)
    );
  }, 0);

  // Adicionar parcelamentos pagos (tolerante a ausência de itens em memória)
  Object.keys(installments || {}).forEach((category) => {
    const categoryInstallments = installments[category] || [];
    categoryInstallments.forEach((installment) => {
      if (!installment) return;
      if (installment.status === "active" || installment.status === "completed") {
        const items = safeArray(installment.installments);
        const paidAmount = items
          .filter((item) => item && item.status === "paid")
          .reduce((sum, item) => sum + Number(item.amount || item.paid_amount || 0), 0);
        if (installment.type === "income") {
          totalIncome += paidAmount;
        } else {
          totalExpense += paidAmount;
        }
      }
    });
  });

  const balance = totalIncome - totalExpense;

  reportsContainer.innerHTML = `
    <div class="reports-header">
      <h2>📊 Relatórios Financeiros</h2>
      <p>Relatório gerado em ${new Date().toLocaleDateString("pt-BR")}</p>
    </div>
    
    <div class="reports-history">
      <h3>📅 Relatórios Mensais</h3>
      <div class="history-controls">
        <label for="report-year-select">Ano:</label>
        <select id="report-year-select"></select>
        <label for="report-month-select">Mês:</label>
        <select id="report-month-select">
          <option value="1">Jan</option>
          <option value="2">Fev</option>
          <option value="3">Mar</option>
          <option value="4">Abr</option>
          <option value="5">Mai</option>
          <option value="6">Jun</option>
          <option value="7">Jul</option>
          <option value="8">Ago</option>
          <option value="9">Set</option>
          <option value="10">Out</option>
          <option value="11">Nov</option>
          <option value="12">Dez</option>
        </select>
        <button onclick="loadMonthlyReport()" class="btn btn-secondary">Ver relatório</button>
      </div>
      <div id="monthly-report-view" class="monthly-report-view">
        <!-- Relatório mensal carregado do Supabase será exibido aqui -->
      </div>
    </div>
    
    <div class="reports-summary">
      <div class="summary-card">
        <h3>💰 Resumo Geral</h3>
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Receitas Totais:</span>
            <span class="stat-value income">${formatCurrency(
              totalIncome
            )}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Despesas Totais:</span>
            <span class="stat-value expense">${formatCurrency(
              totalExpense
            )}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Saldo Atual:</span>
            <span class="stat-value ${
              balance >= 0 ? "income" : "expense"
            }">${formatCurrency(balance)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total de Transações:</span>
            <span class="stat-value">${totalTransactions}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="reports-actions">
      <button onclick="generatePDFReport()" class="btn btn-primary">📄 Gerar Relatório PDF</button>
      <button onclick="exportToCSV()" class="btn btn-success">📊 Exportar CSV</button>
      <button onclick="generateDetailedReport()" class="btn btn-warning">📋 Relatório Detalhado</button>
      <button onclick="showAutoReports()" class="btn btn-info">📅 Relatórios Automáticos</button>
    </div>
    
    <div class="reports-categories">
      <h3>📈 Por Categoria</h3>
      <div class="categories-report">
        ${generateCategoriesReport()}
      </div>
    </div>
  `;

  // Preencher anos disponíveis a partir do ano atual até 5 anos atrás
  const yearSel = document.getElementById('report-year-select');
  if (yearSel) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const years = Array.from({ length: 6 }, (_, i) => currentYear - i);
    yearSel.innerHTML = years.map((y) => `<option value="${y}">${y}</option>`).join('');
    const monthSel = document.getElementById('report-month-select');
    if (monthSel) {
      monthSel.value = String(now.getMonth() + 1);
    }
  }
}

// Carrega relatório mensal histórico do Supabase e exibe na UI
async function loadMonthlyReport() {
  try {
    const yearSel = document.getElementById('report-year-select');
    const monthSel = document.getElementById('report-month-select');
    if (!yearSel || !monthSel) return;
    const year = parseInt(yearSel.value, 10);
    const month = parseInt(monthSel.value, 10);
    if (!year || !month) return;

    const reports = await getReportsFromSupabase({ report_type: 'monthly', year, month });
    const target = document.getElementById('monthly-report-view');
    if (!target) return;

    if (!reports || reports.length === 0) {
      target.innerHTML = '<p class="no-data">Nenhum relatório encontrado para este mês.</p>';
      return;
    }

    const report = reports[0];
    // Recalcular ao vivo para alinhar com o Resumo Geral
    const stats = calculateMonthlyStats();
    const monthlyTx = getMonthlyTransactions();
    // Guardar última seleção
    window.__lastMonthlyReport = { year, month, report };
    // Dados adicionais para detalhamento (ao vivo)
    const monthlyPm = getMonthlyPayments();
    const monthStart = getMonthStart();
    const monthEnd = getMonthEnd();
    // Buscar itens de parcelamentos do Supabase para detalhar na UI
    const allInstallmentsByCategory = {};
    for (const cat of Object.keys(installments || {})) {
      const list = Array.isArray(installments[cat]) ? installments[cat] : [];
      const detailed = await Promise.all(list.map(async (inst) => {
        let items = Array.isArray(inst.installments) ? inst.installments : [];
        try {
          if (typeof window.getInstallmentItemsFromSupabase === 'function' && inst?.id) {
            const fetched = await window.getInstallmentItemsFromSupabase(inst.id);
            if (Array.isArray(fetched) && fetched.length) items = fetched;
          }
        } catch (_) {}
        const mapped = (Array.isArray(items) ? items : []).map((it) => ({
          ...it,
          due: it?.due_date || it?.dueDate || null,
          paidAt: it?.paid_at || it?.paidAt || null,
        }));
        return { ...inst, items: mapped };
      }));
      allInstallmentsByCategory[cat] = detailed;
    }
    const html = `
      <div class="monthly-report-card">
        <h4>${getMonthName(month - 1)} ${year}</h4>
        <div class="report-stats">
          <p><strong>Receitas:</strong> ${formatCurrency(stats.totalIncome || 0)}</p>
          <p><strong>Despesas:</strong> ${formatCurrency(stats.totalExpense || 0)}</p>
          <p><strong>Saldo:</strong> ${formatCurrency((stats.balance != null ? stats.balance : (stats.totalIncome || 0) - (stats.totalExpense || 0)))}</p>
          <p><strong>Transações:</strong> ${stats.totalTransactions || 0}</p>
        </div>
        
        <div class="report-details">
          <h5>Detalhamento de Transações</h5>
          <div class="details-grid">
            ${Object.entries(monthlyTx)
              .map(([cat, list]) => `
                <div class="detail-card">
                  <h6>${cat}</h6>
                  ${(Array.isArray(list) && list.length > 0)
                    ? `<ul class="detail-list detail-list--tx">
                        ${list.map(t => `<li>
                          <span>${escapeHTML(t.description || '')}</span>
                          <span>${formatDate(t.date)}</span>
                          <span class="${t.type === 'income' ? 'income' : 'expense'}">${formatCurrency(t.amount || 0)}</span>
                        </li>`).join('')}
                      </ul>`
                    : '<p class="muted">Sem transações</p>'}
                </div>
              `).join('')}
          </div>
        </div>
        <div class="report-details">
          <h5>Pagamentos do mês</h5>
          <div class="details-grid">
            ${(Object.entries(monthlyPm))
              .map(([cat, list]) => `
                <div class="detail-card">
                  <h6>${cat}</h6>
                  ${(Array.isArray(list) && list.length > 0)
                    ? `<ul class="detail-list detail-list--pm">
                        ${list.map(p => `<li>
                          <span>${escapeHTML(p.debtor_name || p.description || '')}</span>
                          <span>${p.status === 'received' ? 'Recebido' : 'Pendente'}</span>
                          <span>${formatDate(p.due_date || p.date)}</span>
                          <span class="${p.status === 'received' ? 'income' : ''}">${formatCurrency(p.amount || 0)}</span>
                        </li>`).join('')}
                      </ul>`
                    : '<p class="muted">Sem pagamentos</p>'}
                </div>
              `).join('')}
          </div>
        </div>
        <div class="report-details">
          <h5>Parcelamentos do mês (todas as parcelas)</h5>
          <div class="details-grid">
            ${Object.entries(allInstallmentsByCategory).map(([cat, list]) => `
              <div class="detail-card">
                <h6>${cat}</h6>
                ${(Array.isArray(list) && list.length > 0)
                  ? list.map(inst => {
                      const items = Array.isArray(inst.items) ? inst.items : [];
                      const total = Number(inst.total_amount || inst.totalAmount || 0);
                      const paid = items.filter(it => it.status === 'paid').reduce((s, it) => s + Number(it.paid_amount || it.amount || 0), 0);
                      const pending = Math.max(total - paid, 0);
                      const typeLabel = inst.type === 'income' ? 'Receita' : 'Despesa';
                      return `
                        <div class="detail-subcard">
                          <div class="detail-subheader">
                            <strong>${escapeHTML(inst.description || '(sem descrição)')}</strong>
                            <span class="badge ${inst.type === 'income' ? 'income' : 'expense'}">${typeLabel}</span>
                            <span class="badge ${inst.status}">${inst.status || ''}</span>
                          </div>
                          <div class="detail-meta">
                            <span>Total: ${formatCurrency(total)}</span>
                            <span>Pago: ${formatCurrency(paid)}</span>
                            <span>Pendente: ${formatCurrency(pending)}</span>
                            <span>Parcelas: ${inst.installments_count || inst.items.length}×${formatCurrency(inst.installment_amount || inst.installmentAmount || 0)}</span>
                          </div>
                          ${(Array.isArray(items) && items.length > 0)
                            ? `<ul class="detail-list">
                                ${items
                                  .slice()
                                  .sort((a,b) => ((a?.number||a?.installmentNumber||0) - (b?.number||b?.installmentNumber||0)))
                                  .map(it => {
                                    const n = it?.number || it?.installmentNumber || '?';
                                    const due = it?.due ?? it?.due_date ?? it?.dueDate;
                                    const dueTxt = due ? formatDate(due) : '-';
                                    const st = it?.status === 'paid' ? 'Pago' : (it?.status === 'pending' ? 'Pendente' : (it?.status || ''));
                                    const val = formatCurrency(Number(it?.paid_amount || it?.amount || 0));
                                    const paidTxt = it?.paidAt ? formatDate(it.paidAt) : (it?.paid_at ? formatDate(it.paid_at) : '-');
                                    return `<li>
                                      <span>#${n}</span>
                                      <span>${dueTxt}</span>
                                      <span class="${it?.status === 'paid' ? 'income' : (it?.status === 'pending' ? 'warning' : 'expense')}">${st}</span>
                                      <span>${val}</span>
                                      <span>${paidTxt}</span>
                                    </li>`;
                                  }).join('')}
                              </ul>`
                            : '<p class="muted">Sem parcelas cadastradas</p>'}
                        </div>`;
                    }).join('')
                  : '<p class="muted">Sem parcelamentos</p>'}
              </div>
            `).join('')}
          </div>
        </div>
        <p class="muted">Criado em: ${new Date(report.created_at).toLocaleString('pt-BR')}</p>
      </div>
    `;
    target.innerHTML = html;
  } catch (e) {
    const target = document.getElementById('monthly-report-view');
    if (target) target.innerHTML = `<p class="error">Erro ao carregar relatório: ${e?.message || e}</p>`;
  }
}

// Removidos exportadores diretos de relatório mensal (PDF/TXT) conforme solicitado

function generateCategoriesReport() {
  const categories = ["games", "bar", "personal"];
  let html = "";

  categories.forEach((category) => {
    const tx = (typeof transactions === 'object' && transactions) ? transactions : {};
    const py = (typeof payments === 'object' && payments) ? payments : {};
    const ins = (typeof installments === 'object' && installments) ? installments : {};

    const categoryTransactions = Array.isArray(tx[category]) ? tx[category] : [];
    const categoryPayments = Array.isArray(py[category]) ? py[category] : [];
    const categoryInstallments = Array.isArray(ins[category]) ? ins[category] : [];

    // Calcular receitas e despesas das transações
    let totalIncome = categoryTransactions
      .filter((t) => t && t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    let totalExpense = categoryTransactions
      .filter((t) => t && t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Adicionar parcelamentos pagos
    categoryInstallments.forEach((installment) => {
      if (
        installment.status === "active" ||
        installment.status === "completed"
      ) {
        const items = Array.isArray(installment.installments) ? installment.installments : [];
        const paidAmount = items
          .filter((item) => item && item.status === "paid")
          .reduce((sum, item) => sum + Number(item.amount || item.paid_amount || 0), 0);

        if (installment.type === "income") {
          totalIncome += paidAmount;
        } else {
          totalExpense += paidAmount;
        }
      }
    });

    const balance = totalIncome - totalExpense;
    const pendingPayments = categoryPayments
      .filter((p) => p && p.status === "pending")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const pendingInstallments = categoryInstallments
      .filter((i) => i && i.status === "active") // Apenas parcelamentos ativos
      .reduce((sum, i) => {
        const items = Array.isArray(i.installments) ? i.installments : [];
        const pend = items
          .filter((item) => item && item.status === "pending")
          .reduce((s, item) => s + Number(item.amount || 0), 0);
        return sum + pend;
      }, 0);

    const categoryNames = {
      games: "🎮 Casa de Jogos",
      bar: "🍺 Bar",
      personal: "👤 Pessoal",
    };

    html += `
      <div class="category-report">
        <h4>${categoryNames[category]}</h4>
        <div class="category-stats">
          <div class="stat-row">
            <span>Receitas: ${formatCurrency(totalIncome)}</span>
            <span>Despesas: ${formatCurrency(totalExpense)}</span>
          </div>
          <div class="stat-row">
            <span>Saldo: ${formatCurrency(balance)}</span>
            <span>Transações: ${categoryTransactions.length}</span>
          </div>
          <div class="stat-row">
            <span>Pagamentos Pendentes: ${formatCurrency(
              pendingPayments
            )}</span>
            <span>Parcelamentos Pendentes: ${formatCurrency(
              pendingInstallments
            )}</span>
          </div>
        </div>
      </div>
    `;
  });

  return html;
}

// Mostrar atalhos disponíveis
function showKeyboardShortcuts() {
  const shortcuts = [
    { key: "Escape", description: "Voltar para tela inicial" },
    { key: "Ctrl + ,", description: "Abrir configurações" },
    { key: "Ctrl + N", description: "Nova transação" },
    { key: "Ctrl + P", description: "Novo pagamento (pessoal)" },
    { key: "Ctrl + S", description: "Criar backup manual" },
    { key: "Enter", description: "Submeter formulário" },
  ];

  let message = "Atalhos de teclado disponíveis:\n\n";
  shortcuts.forEach((shortcut) => {
    message += `${shortcut.key}: ${shortcut.description}\n`;
  });

  // showNotification("Atalhos disponíveis - veja o console", "info") // [REMOVIDO: Notificação não essencial]
  console.log(message);
}

// Teste simples do jsPDF
function testPDF() {
  console.log("🧪 Iniciando teste PDF...");

  if (typeof window.jsPDF === "undefined") {
    console.log("⚠️ jsPDF não disponível");
    // showNotification('jsPDF não está disponível. Relatórios em texto funcionarão.', 'warning'); // [REMOVIDO: Notificação não essencial]
    return;
  }

  // Se está disponível, testar
  testPDFInternal();
}

function testPDFInternal() {
  console.log("🧪 Executando teste PDF interno...");

  try {
    const { jsPDF } = window.jsPDF;
    console.log("✅ jsPDF constructor obtido");

    const doc = new jsPDF();
    console.log("✅ Documento PDF criado");

    doc.text("Teste jsPDF - Dashboard Financeiro", 10, 10);
    console.log("✅ Texto adicionado ao PDF");

    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 10, 20);
    doc.text(`Hora: ${new Date().toLocaleTimeString("pt-BR")}`, 10, 30);
    console.log("✅ Informações adicionadas ao PDF");

    doc.save("teste_dashboard_financeiro.pdf");
    console.log("✅ PDF salvo com sucesso");

    // showNotification('Teste PDF realizado com sucesso!', 'success'); // [REMOVIDO: Notificação não essencial]
    return true;
  } catch (error) {
    console.error("❌ Erro no teste PDF:", error);
    // showNotification('Erro no teste PDF: ' + error.message, 'error'); // [REMOVIDO: Notificação não essencial]
    return false;
  }
}

// Função alternativa para gerar relatório em texto (fallback)
function generateTextReport() {
  console.log("📄 Gerando relatório em texto...");

  let report = "";
  report += "📊 RELATÓRIO FINANCEIRO\n";
  report += "=".repeat(50) + "\n\n";
  report += `Gerado em: ${new Date().toLocaleDateString(
    "pt-BR"
  )} às ${new Date().toLocaleTimeString("pt-BR")}\n\n`;

  // Calcular totais
  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransactions = 0;
  let totalPendingPayments = 0;
  let totalPendingInstallments = 0;

  Object.keys(transactions).forEach((category) => {
    const categoryTransactions = transactions[category] || [];
    totalTransactions += categoryTransactions.length;
    totalIncome += categoryTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    totalExpense += categoryTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  });

  Object.keys(payments).forEach((category) => {
    const categoryPayments = payments[category] || [];
    totalPendingPayments += categoryPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);
  });

  const safeArray = (v) => (Array.isArray(v) ? v : []);
  Object.keys(installments).forEach((category) => {
    const categoryInstallments = installments[category] || [];
    totalPendingInstallments += categoryInstallments
      .filter((i) => i.status === "active") // Apenas parcelamentos ativos
      .reduce(
        (sum, i) =>
          sum +
          safeArray(i.installments)
            .filter((item) => item && item.status === "pending")
            .reduce((sum, item) => sum + item.amount, 0),
        0
      );
  });

  const balance = totalIncome - totalExpense;

  // Resumo Geral
  report += "💰 RESUMO GERAL\n";
  report += "-".repeat(30) + "\n";
  report += `Receitas Totais: ${formatCurrency(totalIncome)}\n`;
  report += `Despesas Totais: ${formatCurrency(totalExpense)}\n`;
  report += `Saldo Atual: ${formatCurrency(balance)}\n`;
  report += `Total de Transações: ${totalTransactions}\n`;
  report += `Pagamentos Pendentes: ${formatCurrency(totalPendingPayments)}\n`;
  report += `Parcelamentos Pendentes: ${formatCurrency(
    totalPendingInstallments
  )}\n\n`;

  // Por Categoria
  report += "📈 POR CATEGORIA\n";
  report += "-".repeat(30) + "\n";

  const categories = ["games", "bar", "personal"];
  const categoryNames = {
    games: "🎮 Casa de Jogos",
    bar: "🍺 Bar",
    personal: "👤 Pessoal",
  };

  categories.forEach((category) => {
    const categoryTransactions = transactions[category] || [];
    const categoryPayments = payments[category] || [];
    const categoryInstallments = installments[category] || [];

    const categoryIncome = categoryTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryExpense = categoryTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBalance = categoryIncome - categoryExpense;
    const pendingPayments = categoryPayments
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingInstallments = categoryInstallments
      .filter((i) => i.status === "active") // Apenas parcelamentos ativos
      .reduce(
        (sum, i) =>
          sum +
          safeArray(i.installments)
            .filter((item) => item && item.status === "pending")
            .reduce((sum, item) => sum + item.amount, 0),
        0
      );

    report += `${categoryNames[category]}\n`;
    report += `  Receitas: ${formatCurrency(categoryIncome)}\n`;
    report += `  Despesas: ${formatCurrency(categoryExpense)}\n`;
    report += `  Saldo: ${formatCurrency(categoryBalance)}\n`;
    report += `  Transações: ${categoryTransactions.length}\n`;
    report += `  Pagamentos Pendentes: ${formatCurrency(pendingPayments)}\n`;
    report += `  Parcelamentos Pendentes: ${formatCurrency(
      pendingInstallments
    )}\n`;
    report += "\n";
  });

  // Transações Recentes
  report += "📋 TRANSAÇÕES RECENTES\n";
  report += "-".repeat(30) + "\n";

  let allTransactions = [];
  Object.keys(transactions).forEach((category) => {
    const categoryTransactions = transactions[category] || [];
    categoryTransactions.forEach((t) => {
      allTransactions.push({
        ...t,
        category: category,
      });
    });
  });

  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recentTransactions = allTransactions.slice(0, 10);

  if (recentTransactions.length > 0) {
    recentTransactions.forEach((t) => {
      const line = `${categoryNames[t.category] || t.category} - ${
        t.type === "income" ? "Receita" : "Despesa"
      } - ${formatCurrency(t.amount)} - ${new Date(t.date).toLocaleDateString(
        "pt-BR"
      )} - ${t.description}`;
      report += line + "\n";
    });
  } else {
    report += "Nenhuma transação encontrada.\n";
  }

  // Parcelamentos (detalhado)
  report += "\n📅 PARCELAMENTOS\n";
  report += "-".repeat(30) + "\n";
  try {
    const safeArray = (v) => (Array.isArray(v) ? v : []);
    const categoriesInstallments = Object.keys(installments || {});
    if (categoriesInstallments.length === 0) {
      report += "Nenhum parcelamento cadastrado.\n";
    } else {
      categoriesInstallments.forEach((category) => {
        const instList = Array.isArray(installments[category]) ? installments[category] : [];
        if (instList.length === 0) return;
        report += `\n[${category}]\n`;
        instList.forEach((inst) => {
          const items = safeArray(inst?.installments);
          const total = Number(inst?.total_amount ?? inst?.totalAmount ?? 0);
          const paid = items
            .filter((it) => it && it.status === "paid")
            .reduce((s, it) => s + Number(it?.paid_amount ?? it?.amount ?? 0), 0);
          const pending = Math.max(total - paid, 0);
          const paidCount = items.filter((it) => it && it.status === "paid").length;
          const pendingCount = items.filter((it) => it && it.status === "pending").length;
          // próxima parcela
          let nextDueStr = "";
          try {
            const next = items
              .filter((it) => it && it.status === "pending")
              .map((it) => new Date(it?.due_date || it?.dueDate))
              .filter((d) => !Number.isNaN(d.getTime()))
              .sort((a, b) => a - b)[0];
            if (next) nextDueStr = ` | Próx.: ${next.toLocaleDateString("pt-BR")}`;
          } catch (_) {}
          report += `• ${inst?.description || "(sem descrição)"} — status: ${inst?.status || "-"} — total: ${formatCurrency(total)} — pago: ${formatCurrency(paid)} — pendente: ${formatCurrency(pending)} — itens: ${paidCount} pagos, ${pendingCount} pendentes${nextDueStr}\n`;
          // itens
          items
            .slice()
            .sort((a, b) => (a?.number || a?.installmentNumber || 0) - (b?.number || b?.installmentNumber || 0))
            .forEach((it) => {
              const num = it?.number || it?.installmentNumber || "?";
              const due = it?.due_date || it?.dueDate || "";
              const paidAt = it?.paid_at || it?.paidAt;
              const statusTxt = it?.status === "paid" ? "Pago" : it?.status === "pending" ? "Pendente" : (it?.status || "-");
              report += `   - Parcela #${num} — venc.: ${due ? new Date(due).toLocaleDateString("pt-BR") : "-"} — valor: ${formatCurrency(Number(it?.paid_amount ?? it?.amount ?? 0))} — status: ${statusTxt}${paidAt ? ` — pago em: ${new Date(paidAt).toLocaleDateString("pt-BR")}` : ""}\n`;
            });
        });
      });
    }
  } catch (_) {
    report += "(Falha ao detalhar parcelamentos)\n";
  }

  // Salvar arquivo
  const fileName = `relatorio_financeiro_${
    new Date().toISOString().split("T")[0]
  }.txt`;
  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();

  console.log("✅ Relatório em texto gerado com sucesso:", fileName);
  // showNotification('Relatório em texto gerado com sucesso!', 'success'); // [REMOVIDO: Notificação não essencial]
}

// Função unificada que tenta PDF primeiro, depois texto
function generateReport() {
  console.log("🔄 Iniciando geração de relatório...");

  // Tentar PDF primeiro
  if (typeof window.jsPDF !== "undefined") {
    console.log("✅ jsPDF disponível, gerando PDF...");
    generatePDFReport();
  } else {
    console.log("⚠️ jsPDF não disponível, gerando relatório em texto...");
    generateTextReport();
  }
}

// Funções para gerenciar parcelamentos
async function addInstallment() {
  const installmentType = document.getElementById("installment-type").value;
  const totalAmount = parseFloat(
    document.getElementById("installment-total-amount").value
  );
  const description = document.getElementById("installment-description").value;
  const installmentsCount = parseInt(
    document.getElementById("installments-count").value
  );
  const firstDueDate = document.getElementById("first-due-date").value;
  const category = currentCategory;

  if (
    !installmentType ||
    !totalAmount ||
    !description ||
    !installmentsCount ||
    !firstDueDate ||
    !category
  ) {
    return;
  }

  if (totalAmount <= 0 || installmentsCount <= 0) {
    return;
  }

  const installmentAmount = totalAmount / installmentsCount;

  // Criar parcelamento
  const installment = {
    type: installmentType, // expense ou income
    total_amount: totalAmount,
    description: description,
    installments_count: installmentsCount,
    installment_amount: installmentAmount,
    first_due_date: firstDueDate,
    category_id: category,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: "active", // active, completed, cancelled
  };

  try {
    const inserted = await addInstallmentToSupabase(installment);

    // Criar installment_items automaticamente
    const firstDueDateObj = new Date(firstDueDate);
    for (let i = 0; i < installmentsCount; i++) {
      const dueDate = new Date(firstDueDateObj);
      dueDate.setMonth(dueDate.getMonth() + i);

      const item = {
        installment_id: inserted.id,
        number: i + 1,
        amount: installmentAmount,
        due_date: dueDate.toISOString().split("T")[0],
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await addInstallmentItemToSupabase(item);
    }

    if (!installments[category]) {
      installments[category] = [];
    }
    installments[category].push(inserted);
    // Limpar formulário
    document.getElementById("installment-type").value = "expense";
    document.getElementById("installment-total-amount").value = "";
    document.getElementById("installment-description").value = "";
    document.getElementById("installments-count").value = "";
    document.getElementById("first-due-date").value = "";
    displayInstallments();
    updateCategoryStats();
    // showNotification('Parcelamento adicionado no Supabase!', 'success') // [REMOVIDO: Notificação não essencial]
    console.log("Parcelamento adicionado no Supabase:", inserted);
    scheduleBackup();
  } catch (error) {
    showNotification("Erro ao salvar parcelamento no Supabase!", "error");
    console.error("Erro Supabase:", error);
  }
}

async function payInstallment(installmentId, installmentNumber) {
  try {
    // Buscar installment_items do Supabase
    const items = await getInstallmentItemsFromSupabase(installmentId);
    const item = items.find((i) => i.number === installmentNumber);

    if (!item) {
      showNotification("Parcela não encontrada!", "error");
      return;
    }

    if (item.status === "paid") {
      showNotification("Esta parcela já foi paga!", "warning");
      return;
    }

    // Marcar como paga
    const updates = {
      status: "paid",
      paid_at: new Date().toISOString(),
      paid_amount: item.amount,
      updated_at: new Date().toISOString(),
    };

    await updateInstallmentItemInSupabase(item.id, updates);

    // Verificar se todas as parcelas foram pagas
    const allItems = await getInstallmentItemsFromSupabase(installmentId);
    const paidItems = allItems.filter((i) => i.status === "paid");

    if (paidItems.length === allItems.length) {
      // Marcar installment como completed
      await updateInstallmentInSupabase(installmentId, {
        status: "completed",
        updated_at: new Date().toISOString(),
      });
    }

    // Atualizar display
    displayInstallments();
    updateBalance();
    updateSummary();
    updateCategoryStats();
    showNotification(
      `Parcela ${installmentNumber} marcada como paga!`,
      "success"
    );
    scheduleBackup();
  } catch (error) {
    showNotification("Erro ao marcar parcela como paga!", "error");
    console.error("Erro Supabase:", error);
  }
}

function cancelInstallment(installmentId) {
  const category = currentCategory;
  const categoryInstallments = installments[category] || [];
  const installment = categoryInstallments.find((i) => i.id === installmentId);
  if (installment) {
    showConfirmModal(
      `Tem certeza que deseja cancelar o parcelamento "${installment.description}"?`,
      async () => {
        try {
          await updateInstallmentInSupabase(installmentId, {
            status: "cancelled",
            updated_at: new Date().toISOString(),
          });
          installment.status = "cancelled";
          displayInstallments();
          updateCategoryStats();
          showNotification("Parcelamento cancelado!", "success");
          scheduleBackup();
        } catch (error) {
          showNotification(
            "Erro ao cancelar parcelamento no Supabase!",
            "error"
          );
          console.error("Erro Supabase:", error);
        }
      }
    );
  }
}

async function displayInstallments() {
  const container = document.getElementById("installments-list");
  if (!container) return;

  const category = currentCategory;
  let categoryInstallments = installments[category] || [];

  // Aplicar filtro
  if (currentInstallmentFilter !== "all") {
    categoryInstallments = categoryInstallments.filter(
      (installment) => installment.status === currentInstallmentFilter
    );
  }

  if (categoryInstallments.length === 0) {
    container.innerHTML =
      '<p class="no-data">Nenhum parcelamento encontrado.</p>';
    return;
  }

  let html = "";

  for (const installment of categoryInstallments) {
    // Buscar installment_items para este parcelamento
    let installmentItems = [];
    try {
      if (typeof window.getInstallmentItemsFromSupabase === "function") {
        installmentItems =
          (await window.getInstallmentItemsFromSupabase(installment.id)) || [];
      }
    } catch (error) {
      console.warn("Erro ao carregar parcelas:", error);
    }

    // Calcular progresso baseado nos installment_items
    const totalItems = installmentItems.length;
    const paidItems = installmentItems.filter(
      (item) => item.status === "paid"
    ).length;
    const progress = totalItems > 0 ? (paidItems / totalItems) * 100 : 0;

    // Calcular total pago
    const totalPaid = installmentItems
      .filter((item) => item.status === "paid")
      .reduce((sum, item) => sum + (item.paid_amount || item.amount), 0);

    const statusClass =
      installment.status === "completed"
        ? "completed"
        : installment.status === "cancelled"
        ? "cancelled"
        : "active";

    html += `
      <div class="installment-card ${statusClass} ${installment.type}">
        <div class="installment-header">
          <div class="installment-title">
            <h4>${escapeHTML(installment.description || "")}</h4>
            <span class="installment-type-badge ${installment.type}">${
      installment.type === "expense" ? "💸 Despesa" : "💰 Receita"
    }</span>
          </div>
          <span class="installment-status ${statusClass}">${getStatusText(
      installment.status
    )}</span>
        </div>
        
        <div class="installment-info">
          <p><strong>Total:</strong> ${formatCurrency(
            installment.total_amount
          )}</p>
          <p><strong>Parcelas:</strong> ${paidItems}/${
      installment.installments_count
    }</p>
          <p><strong>Valor da parcela:</strong> ${formatCurrency(
            installment.installment_amount
          )}</p>
          <p><strong>Total pago:</strong> ${formatCurrency(totalPaid)}</p>
        </div>
        
        <div class="installment-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <span class="progress-text">${Math.round(progress)}% concluído</span>
        </div>
        
        <div class="installment-details">
          <h5>Parcelas:</h5>
          <div class="installments-grid">
            ${
              installmentItems.length > 0
                ? installmentItems
                    .map(
                      (item) => `
                <div class="installment-item ${item.status}">
                  <span class="installment-number">${item.number}</span>
                  <span class="installment-amount">${formatCurrency(
                    item.amount
                  )}</span>
                  <span class="installment-date">${formatDate(
                    item.due_date
                  )}</span>
                  ${
                    item.status === "pending"
                      ? `<button onclick="payInstallment('${installment.id}', ${item.number})" class="btn btn-success btn-sm">Pagar</button>`
                      : `<span class="paid-badge">Pago</span>`
                  }
                </div>
              `
                    )
                    .join("")
                : "<p>Nenhuma parcela encontrada</p>"
            }
          </div>
        </div>
        
        ${
          installment.status === "active"
            ? `<button onclick="cancelInstallment('${installment.id}')" class="btn btn-danger btn-sm">Cancelar</button>`
            : ""
        }
      </div>
    `;
  }

  container.innerHTML = html;
}

function getStatusText(status) {
  switch (status) {
    case "active":
      return "Ativo";
    case "completed":
      return "Concluído";
    case "cancelled":
      return "Cancelado";
    default:
      return "Desconhecido";
  }
}

// Melhorias para dispositivos touch
if ("ontouchstart" in window) {
  // Adicionar classe para dispositivos touch
  document.body.classList.add("touch-device");

  // Melhorar scroll horizontal no menu
  const sidebarMenu = document.querySelector(".sidebar-menu");
  if (sidebarMenu) {
    let isScrolling = false;
    let startX = 0;
    let scrollLeft = 0;

    sidebarMenu.addEventListener("touchstart", (e) => {
      isScrolling = true;
      startX = e.touches[0].pageX - sidebarMenu.offsetLeft;
      scrollLeft = sidebarMenu.scrollLeft;
    });

    sidebarMenu.addEventListener("touchmove", (e) => {
      if (!isScrolling) return;
      e.preventDefault();
      const x = e.touches[0].pageX - sidebarMenu.offsetLeft;
      const walk = (x - startX) * 2;
      sidebarMenu.scrollLeft = scrollLeft - walk;
    });

    sidebarMenu.addEventListener("touchend", () => {
      isScrolling = false;
    });
  }
}

function forceReload() {
  showConfirmModal(
    "Deseja forçar uma atualização completa do app? Isso irá recarregar todos os arquivos.",
    () => {
      // Limpar cache do localStorage temporariamente
      const currentData = {
        transactions: transactions,
        payments: payments,
        installments: installments,
      };

      // Salvar dados temporariamente
      sessionStorage.setItem("tempData", JSON.stringify(currentData));

      // Forçar reload
      window.location.reload(true);
    }
  );
}

// Restaurar dados após reload
window.addEventListener("load", function () {
  const tempData = sessionStorage.getItem("tempData");
  if (tempData) {
    const data = JSON.parse(tempData);
    transactions = data.transactions || {};
    payments = data.payments || {};
    installments = data.installments || {};
    sessionStorage.removeItem("tempData");
    saveData();
    updateDisplay();
  }
});

// Inicializar sistema de relatórios automáticos
function initAutoReports() {
  // Verificar se já existe um relatório semanal desta semana
  const currentWeek = getWeekNumber(new Date());
  const savedWeeklyReport = localStorage.getItem("lastWeeklyReport");

  if (savedWeeklyReport) {
    const report = JSON.parse(savedWeeklyReport);
    if (report.weekNumber !== currentWeek) {
      // Nova semana - criar relatório semanal
      createWeeklyReport();
    }
  } else {
    // Primeira execução - criar relatório semanal
    createWeeklyReport();
  }

  // Verificar se já existe um relatório mensal deste mês
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const savedMonthlyReport = localStorage.getItem("lastMonthlyReport");

  if (savedMonthlyReport) {
    const report = JSON.parse(savedMonthlyReport);
    if (report.month !== currentMonth || report.year !== currentYear) {
      // Novo mês - criar relatório mensal (sem alterar dados)
      createMonthlyReport();
    }
  } else {
  // Primeira execução - criar relatório mensal (sem alterar dados)
  createMonthlyReport();
  }

  // Configurar verificação diária
  startAutoReportCheck();
}

// Obter número da semana do ano
function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Criar relatório semanal
async function createWeeklyReport() {
  const currentDate = new Date();
  const weekNumber = getWeekNumber(currentDate);

  // Calcular estatísticas da semana
  const weeklyStats = calculateWeeklyStats();

  const weeklyReport = {
    id: Date.now().toString(),
    type: "weekly",
    weekNumber: weekNumber,
    year: currentDate.getFullYear(),
    date: currentDate.toISOString(),
    stats: weeklyStats,
    transactions: getWeeklyTransactions(),
    payments: getWeeklyPayments(),
    installments: getWeeklyInstallments(),
  };

  // Salvar relatório (local)
  saveWeeklyReport(weeklyReport);
  // Persistir no Supabase
  try {
    await addReportToSupabase({
      report_type: 'weekly',
      year: currentDate.getFullYear(),
      week: weekNumber,
      stats: weeklyStats,
      created_at: currentDate.toISOString(),
    });
  } catch (e) {
    console.warn('Falha ao persistir relatório semanal no Supabase:', e);
  }

  // Notificar usuário
  // showNotification(`📊 Relatório semanal criado! Receitas: ${formatCurrency(weeklyStats.totalIncome)}, Despesas: ${formatCurrency(weeklyStats.totalExpense)}`, 'success') // [REMOVIDO: Notificação não essencial]

  console.log("📊 Relatório semanal criado:", weeklyReport);
}

// Criar relatório mensal
async function createMonthlyReport() {
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1; // 1..12 para persistência correta
  const year = currentDate.getFullYear();

  // Calcular estatísticas do mês
  const monthlyStats = calculateMonthlyStats();

  const monthlyReport = {
    id: Date.now().toString(),
    type: "monthly",
    month: month,
    year: year,
    date: currentDate.toISOString(),
    stats: monthlyStats,
    transactions: getMonthlyTransactions(),
    payments: getMonthlyPayments(),
    installments: getMonthlyInstallments(),
  };

  // Salvar relatório (local)
  saveMonthlyReport(monthlyReport);
  // Persistir no Supabase
  try {
    await addReportToSupabase({
      report_type: 'monthly',
      year,
      month,
      stats: monthlyStats,
      transactions: monthlyReport.transactions,
      payments: monthlyReport.payments,
      installments: monthlyReport.installments,
      created_at: currentDate.toISOString(),
    });
  } catch (e) {
    console.warn('Falha ao persistir relatório mensal no Supabase:', e);
  }

  // Notificar usuário
  // showNotification(`📈 Relatório mensal criado! Receitas: ${formatCurrency(monthlyStats.totalIncome)}, Despesas: ${formatCurrency(monthlyStats.totalExpense)}`, 'success') // [REMOVIDO: Notificação não essencial]

  console.log("📈 Relatório mensal criado:", monthlyReport);
}

// Desativado: não alteramos mais dados ao gerar relatório mensal
function resetMonthlyData() { /* noop */ }

// Calcular estatísticas semanais
function calculateWeeklyStats() {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  console.log("📊 Calculando estatísticas semanais:");
  console.log("Semana início:", weekStart.toLocaleDateString("pt-BR"));
  console.log("Semana fim:", weekEnd.toLocaleDateString("pt-BR"));

  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransactions = 0;

  Object.keys(transactions).forEach((category) => {
    const categoryTransactions = transactions[category] || [];
    console.log(
      `Categoria ${category}: ${categoryTransactions.length} transações`
    );

    categoryTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      console.log(
        `Transação: ${
          transaction.description
        } - ${transactionDate.toLocaleDateString("pt-BR")} - R$ ${
          transaction.amount
        }`
      );

      if (transactionDate >= weekStart && transactionDate <= weekEnd) {
        totalTransactions++;
        if (transaction.type === "income") {
          totalIncome += transaction.amount;
          console.log(`✅ Receita incluída: R$ ${transaction.amount}`);
        } else {
          totalExpense += transaction.amount;
          console.log(`✅ Despesa incluída: R$ ${transaction.amount}`);
        }
      } else {
        console.log(
          `❌ Transação fora da semana: ${transactionDate.toLocaleDateString(
            "pt-BR"
          )}`
        );
      }
    });
  });

  // Adicionar parcelamentos pagos na semana
  Object.keys(installments || {}).forEach((category) => {
    const categoryInstallments = Array.isArray(installments[category]) ? installments[category] : [];
    categoryInstallments.forEach((installment) => {
      const items = Array.isArray(installment?.installments) ? installment.installments : [];
      items.forEach((item) => {
        if (item && item.status === "paid" && (item.paidAt || item.paid_at)) {
          const paidDate = new Date(item.paidAt || item.paid_at);
          if (paidDate >= weekStart && paidDate <= weekEnd) {
            if (installment.type === "income") {
              totalIncome += Number(item.amount || item.paid_amount || 0);
            } else {
              totalExpense += Number(item.amount || item.paid_amount || 0);
            }
          }
        }
      });
    });
  });

  return {
    totalIncome,
    totalExpense,
    totalTransactions,
    balance: totalIncome - totalExpense,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
  };
}

// Calcular estatísticas mensais
function calculateMonthlyStats() {
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();

  let totalIncome = 0;
  let totalExpense = 0;
  let totalTransactions = 0;

  Object.keys(transactions).forEach((category) => {
    const categoryTransactions = transactions[category] || [];
    categoryTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate >= monthStart && transactionDate <= monthEnd) {
        totalTransactions++;
        const amt = Number(transaction.amount || 0);
        if (transaction.type === "income") {
          totalIncome += amt;
        } else {
          totalExpense += amt;
        }
      }
    });
  });

  // Adicionar parcelamentos pagos no mês
  Object.keys(installments || {}).forEach((category) => {
    const categoryInstallments = Array.isArray(installments[category]) ? installments[category] : [];
    categoryInstallments.forEach((installment) => {
      const items = Array.isArray(installment?.installments) ? installment.installments : [];
      items.forEach((item) => {
        if (item && item.status === "paid" && (item.paidAt || item.paid_at)) {
          const paidDate = new Date(item.paidAt || item.paid_at);
          if (paidDate >= monthStart && paidDate <= monthEnd) {
            const v = Number(item.paid_amount || item.amount || 0);
            if (installment.type === "income") {
              totalIncome += v;
            } else {
              totalExpense += v;
            }
          }
        }
      });
    });
  });

  return {
    totalIncome,
    totalExpense,
    totalTransactions,
    balance: totalIncome - totalExpense,
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
  };
}

// Obter início da semana (domingo)
function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek;
  const weekStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - dayOfWeek
  );
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

// Obter fim da semana (sábado)
function getWeekEnd() {
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
}

// Obter início do mês
function getMonthStart() {
  // Usar o mês/ano selecionado (se presente na UI) para filtros e geração
  const yearSel = document?.getElementById?.('report-year-select');
  const monthSel = document?.getElementById?.('report-month-select');
  const now = new Date();
  const year = yearSel ? parseInt(yearSel.value, 10) || now.getFullYear() : now.getFullYear();
  const month = monthSel ? (parseInt(monthSel.value, 10) - 1 || now.getMonth()) : now.getMonth();
  const d = new Date(year, month, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Obter fim do mês
function getMonthEnd() {
  const yearSel = document?.getElementById?.('report-year-select');
  const monthSel = document?.getElementById?.('report-month-select');
  const now = new Date();
  const year = yearSel ? parseInt(yearSel.value, 10) || now.getFullYear() : now.getFullYear();
  const month = monthSel ? (parseInt(monthSel.value, 10) - 1 || now.getMonth()) : now.getMonth();
  const d = new Date(year, month + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Obter transações da semana
function getWeeklyTransactions() {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const weeklyTransactions = {};

  Object.keys(transactions).forEach((category) => {
    weeklyTransactions[category] = (transactions[category] || []).filter(
      (transaction) => {
        const transactionDate = parseDateFlexible(transaction.date);
        return transactionDate >= weekStart && transactionDate <= weekEnd;
      }
    );
  });

  return weeklyTransactions;
}

// Obter transações do mês
function getMonthlyTransactions() {
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();
  const monthlyTransactions = {};

  Object.keys(transactions).forEach((category) => {
    monthlyTransactions[category] = (transactions[category] || []).filter(
      (transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      }
    );
  });

  return monthlyTransactions;
}

// Obter pagamentos da semana
function getWeeklyPayments() {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const weeklyPayments = {};

  Object.keys(payments).forEach((category) => {
    weeklyPayments[category] = (payments[category] || []).filter((payment) => {
      const paymentDate = new Date(payment.date);
      return paymentDate >= weekStart && paymentDate <= weekEnd;
    });
  });

  return weeklyPayments;
}

// Obter pagamentos do mês
function getMonthlyPayments() {
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();
  const monthlyPayments = {};

  Object.keys(payments).forEach((category) => {
    monthlyPayments[category] = (payments[category] || []).filter((payment) => {
      const d = payment?.due_date || payment?.date || payment?.created_at;
      const paymentDate = d ? parseDateFlexible(d) : null;
      return paymentDate && paymentDate >= monthStart && paymentDate <= monthEnd;
    });
  });

  return monthlyPayments;
}

// Obter parcelamentos da semana
function getWeeklyInstallments() {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const weeklyInstallments = {};

  Object.keys(installments).forEach((category) => {
    weeklyInstallments[category] = (installments[category] || []).filter(
      (installment) => {
        const installmentDate = new Date(installment.createdAt);
        return installmentDate >= weekStart && installmentDate <= weekEnd;
      }
    );
  });

  return weeklyInstallments;
}

// Obter parcelamentos do mês
function getMonthlyInstallments() {
  const monthStart = getMonthStart();
  const monthEnd = getMonthEnd();
  const monthlyInstallments = {};

  Object.keys(installments).forEach((category) => {
    monthlyInstallments[category] = (installments[category] || []).filter(
      (installment) => {
        const d = installment?.created_at || installment?.createdAt || installment?.date;
        const installmentDate = d ? parseDateFlexible(d) : null;
        return installmentDate && installmentDate >= monthStart && installmentDate <= monthEnd;
      }
    );
  });

  return monthlyInstallments;
}

// Salvar relatório semanal
function saveWeeklyReport(report) {
  const weeklyReports = getWeeklyReports();
  weeklyReports.push(report);
  localStorage.setItem("weeklyReports", JSON.stringify(weeklyReports));
  localStorage.setItem("lastWeeklyReport", JSON.stringify(report));
}

// Salvar relatório mensal
function saveMonthlyReport(report) {
  const monthlyReports = getMonthlyReports();
  monthlyReports.push(report);
  localStorage.setItem("monthlyReports", JSON.stringify(monthlyReports));
  localStorage.setItem("lastMonthlyReport", JSON.stringify(report));
}

// Obter relatórios semanais
function getWeeklyReports() {
  const reports = localStorage.getItem("weeklyReports");
  return reports ? JSON.parse(reports) : [];
}

// Obter relatórios mensais
function getMonthlyReports() {
  const reports = localStorage.getItem("monthlyReports");
  return reports ? JSON.parse(reports) : [];
}

// Iniciar verificação automática de relatórios
function startAutoReportCheck() {
  // Verificar a cada hora se precisa criar relatórios
  autoReportInterval = setInterval(() => {
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Verificar relatório semanal
    const savedWeeklyReport = localStorage.getItem("lastWeeklyReport");
    if (savedWeeklyReport) {
      const report = JSON.parse(savedWeeklyReport);
      if (report.weekNumber !== currentWeek) {
        createWeeklyReport();
      }
    }

    // Verificar relatório mensal
    const savedMonthlyReport = localStorage.getItem("lastMonthlyReport");
    if (savedMonthlyReport) {
      const report = JSON.parse(savedMonthlyReport);
      if (report.month !== currentMonth || report.year !== currentYear) {
        createMonthlyReport();
        resetMonthlyData();
      }
    }
  }, 60 * 60 * 1000); // Verificar a cada hora
}

// Mostrar relatórios automáticos

// Alternar entre abas de relatórios automáticos
function switchAutoReportTab(type) {
  // Atualizar botões
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  // Atualizar conteúdo
  document
    .querySelectorAll(".auto-reports-content")
    .forEach((content) => content.classList.remove("active"));
  document.getElementById(`${type}-reports`).classList.add("active");
}

// Gerar lista de relatórios semanais
function generateWeeklyReportsList(reports) {
  if (reports.length === 0) {
    return '<p class="empty-state">Nenhum relatório semanal encontrado</p>';
  }

  return reports
    .reverse()
    .map(
      (report) => `
    <div class="auto-report-item">
      <div class="report-header">
        <h4>Semana ${report.weekNumber} - ${new Date(
        report.date
      ).toLocaleDateString("pt-BR")}</h4>
        <button onclick="viewAutoReport('weekly', '${
          report.id
        }')" class="btn btn-primary">Ver Detalhes</button>
      </div>
      <div class="report-summary">
        <span>Receitas: ${formatCurrency(report.stats.totalIncome)}</span>
        <span>Despesas: ${formatCurrency(report.stats.totalExpense)}</span>
        <span>Saldo: ${formatCurrency(report.stats.balance)}</span>
        <span>Transações: ${report.stats.totalTransactions}</span>
      </div>
    </div>
  `
    )
    .join("");
}

// Gerar lista de relatórios mensais
function generateMonthlyReportsList(reports) {
  if (reports.length === 0) {
    return '<p class="empty-state">Nenhum relatório mensal encontrado</p>';
  }

  return reports
    .reverse()
    .map(
      (report) => `
    <div class="auto-report-item">
      <div class="report-header">
        <h4>${getMonthName(report.month)} ${report.year}</h4>
        <button onclick="viewAutoReport('monthly', '${
          report.id
        }')" class="btn btn-primary">Ver Detalhes</button>
      </div>
      <div class="report-summary">
        <span>Receitas: ${formatCurrency(report.stats.totalIncome)}</span>
        <span>Despesas: ${formatCurrency(report.stats.totalExpense)}</span>
        <span>Saldo: ${formatCurrency(report.stats.balance)}</span>
        <span>Transações: ${report.stats.totalTransactions}</span>
      </div>
    </div>
  `
    )
    .join("");
}

// Obter nome do mês
function getMonthName(month) {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[month];
}

// Visualizar relatório automático
function viewAutoReport(type, reportId) {
  const reports = type === "weekly" ? getWeeklyReports() : getMonthlyReports();
  const report = reports.find((r) => r.id === reportId);

  if (!report) {
    showNotification("Relatório não encontrado!", "error");
    return;
  }

  let html = `
    <div class="auto-report-detail">
      <div class="report-detail-header">
        <button onclick="showAutoReports()" class="btn btn-secondary">← Voltar</button>
        <h3>${type === "weekly" ? "Relatório Semanal" : "Relatório Mensal"}</h3>
      </div>
      
      <div class="report-detail-info">
        <p><strong>Data:</strong> ${new Date(report.date).toLocaleDateString(
          "pt-BR"
        )}</p>
        <p><strong>Receitas:</strong> ${formatCurrency(
          report.stats.totalIncome
        )}</p>
        <p><strong>Despesas:</strong> ${formatCurrency(
          report.stats.totalExpense
        )}</p>
        <p><strong>Saldo:</strong> ${formatCurrency(report.stats.balance)}</p>
        <p><strong>Transações:</strong> ${report.stats.totalTransactions}</p>
      </div>
      
      <div class="report-detail-actions">
        <button onclick="exportAutoReport('${type}', '${reportId}')" class="btn btn-success">📄 Exportar</button>
        ${window.SAFE_MODE ? '' : `<button onclick="deleteAutoReport('${type}', '${reportId}')" class="btn btn-danger">🗑️ Excluir</button>`}
      </div>
    </div>
  `;

  const reportsContainer = document.getElementById("reports-container");
  reportsContainer.innerHTML = html;
}

// Exportar relatório automático
function exportAutoReport(type, reportId) {
  const reports = type === "weekly" ? getWeeklyReports() : getMonthlyReports();
  const report = reports.find((r) => r.id === reportId);

  if (!report) {
    showNotification("Relatório não encontrado!", "error");
    return;
  }

  const dataStr = JSON.stringify(report, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio_${type}_${reportId}.json`;
  link.click();

  // showNotification('Relatório exportado com sucesso!', 'success') // [REMOVIDO: Notificação não essencial]
}

// Excluir relatório automático
function deleteAutoReport(type, reportId) {
  if (window.SAFE_MODE) {
    showNotification("Exclusão de relatório desativada no modo seguro.", "warning");
    return;
  }
  showConfirmModal("Tem certeza que deseja excluir este relatório?", async () => {
    try {
      await deleteReportFromSupabase(reportId);
      showNotification("Relatório excluído com sucesso!", "success");
      await updateReportsList();
    } catch (error) {
      showNotification("Erro ao excluir relatório no Supabase!", "error");
      console.error("Erro Supabase:", error);
    }
  });
}

// Adicionar indicadores de status do sistema de relatórios automáticos
function updateAutoReportStatus() {
  const weeklyReports = getWeeklyReports();
  const monthlyReports = getMonthlyReports();
  const currentWeek = getWeekNumber(new Date());
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Verificar último relatório semanal
  const lastWeeklyReport = localStorage.getItem("lastWeeklyReport");
  const weeklyStatus = lastWeeklyReport ? JSON.parse(lastWeeklyReport) : null;

  // Verificar último relatório mensal
  const lastMonthlyReport = localStorage.getItem("lastMonthlyReport");
  const monthlyStatus = lastMonthlyReport
    ? JSON.parse(lastMonthlyReport)
    : null;

  // Criar indicadores de status
  let statusHtml = `
    <div class="auto-report-status">
      <h4>📊 Status dos Relatórios Automáticos</h4>
      
      <div class="status-grid">
        <div class="status-item ${
          weeklyStatus && weeklyStatus.weekNumber === currentWeek
            ? "active"
            : "pending"
        }">
          <div class="status-icon">📅</div>
          <div class="status-info">
            <strong>Relatório Semanal</strong>
            <span>${
              weeklyStatus
                ? `Semana ${weeklyStatus.weekNumber} (${new Date(
                    weeklyStatus.date
                  ).toLocaleDateString("pt-BR")})`
                : "Nunca criado"
            }</span>
          </div>
        </div>
        
        <div class="status-item ${
          monthlyStatus &&
          monthlyStatus.month === currentMonth &&
          monthlyStatus.year === currentYear
            ? "active"
            : "pending"
        }">
          <div class="status-icon">📈</div>
          <div class="status-info">
            <strong>Relatório Mensal</strong>
            <span>${
              monthlyStatus
                ? `${getMonthName(monthlyStatus.month)} ${monthlyStatus.year}`
                : "Nunca criado"
            }</span>
          </div>
        </div>
        
        <div class="status-item ${autoReportInterval ? "active" : "pending"}">
          <div class="status-icon">⚙️</div>
          <div class="status-info">
            <strong>Sistema Automático</strong>
            <span>${autoReportInterval ? "Ativo" : "Inativo"}</span>
          </div>
        </div>
      </div>
      
      <div class="status-stats">
        <div class="stat-card">
          <span class="stat-number">${weeklyReports.length}</span>
          <span class="stat-label">Relatórios Semanais</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">${monthlyReports.length}</span>
          <span class="stat-label">Relatórios Mensais</span>
        </div>
      </div>
      
      <div class="status-actions">
        <button onclick="createWeeklyReport()" class="btn btn-primary">📅 Gerar Relatório Semanal</button>
        <button onclick="createMonthlyReport()" class="btn btn-warning">🗓️ Gerar Relatório Mensal</button>
        <button onclick="showNextScheduledReports()" class="btn btn-info">📆 Próximos Relatórios</button>
      </div>
    </div>
  `;

  // Retornar o HTML para ser inserido
  return statusHtml;
}

// Testar criação de relatório semanal
function testWeeklyReport() {
  // showNotification('🧪 Criando relatório semanal de teste...', 'info') // [REMOVIDO: Notificação não essencial]

  // Forçar criação de relatório semanal
  createWeeklyReport();

  // Atualizar status
  setTimeout(() => {
    updateAutoReportStatus();
    // showNotification('✅ Relatório semanal de teste criado!', 'success') // [REMOVIDO: Notificação não essencial]
  }, 1000);
}

// Testar criação de relatório mensal
function testMonthlyReport() {
  showConfirmModal(
    "⚠️ ATENÇÃO: Isso irá criar um relatório mensal e RESETAR todos os dados!\n\nTem certeza que deseja continuar?",
    () => {
      // showNotification('🧪 Criando relatório mensal de teste...', 'info') // [REMOVIDO: Notificação não essencial]

      // Forçar criação de relatório mensal
      createMonthlyReport();
      resetMonthlyData();

      // Atualizar status
      setTimeout(() => {
        updateAutoReportStatus();
        // showNotification('✅ Relatório mensal de teste criado e dados resetados!', 'success') // [REMOVIDO: Notificação não essencial]
      }, 1000);
    }
  );
}

// Mostrar próximos relatórios agendados
function showNextScheduledReports() {
  const now = new Date();
  const currentWeek = getWeekNumber(now);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calcular próximos relatórios
  const nextWeekStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekNumber = getWeekNumber(nextWeekStart);

  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  let html = `
    <div class="scheduled-reports">
      <h4>📅 Próximos Relatórios Agendados</h4>
      
      <div class="schedule-grid">
        <div class="schedule-item">
          <div class="schedule-icon">📅</div>
          <div class="schedule-info">
            <strong>Próximo Relatório Semanal</strong>
            <span>Semana ${nextWeekNumber} - ${nextWeekStart.toLocaleDateString(
    "pt-BR"
  )}</span>
            <small>Será criado automaticamente no final da semana atual</small>
          </div>
        </div>
        
        <div class="schedule-item">
          <div class="schedule-icon">📈</div>
          <div class="schedule-info">
            <strong>Próximo Relatório Mensal</strong>
            <span>${getMonthName(nextMonth)} ${nextYear}</span>
            <small>Será criado automaticamente no último dia do mês atual</small>
          </div>
        </div>
      </div>
      
      <div class="schedule-info-box">
        <h5>ℹ️ Informações do Sistema</h5>
        <ul>
          <li><strong>Verificação:</strong> A cada hora</li>
          <li><strong>Semana atual:</strong> ${currentWeek}</li>
          <li><strong>Mês atual:</strong> ${getMonthName(
            currentMonth
          )} ${currentYear}</li>
          <li><strong>Status:</strong> ${
            autoReportInterval ? "🟢 Ativo" : "🔴 Inativo"
          }</li>
        </ul>
      </div>
      
      <button onclick="updateAutoReportStatus()" class="btn btn-secondary">🔄 Atualizar Status</button>
    </div>
  `;

  // Substituir conteúdo do container
  const reportsContainer = document.getElementById("reports-container");
  if (reportsContainer) {
    reportsContainer.innerHTML = html;
  }
}

// Mostrar relatórios automáticos
function showAutoReports() {
  const weeklyReports = getWeeklyReports();
  const monthlyReports = getMonthlyReports();

  // Obter status HTML
  const statusHtml = updateAutoReportStatus();

  let html = `
    <div class="auto-reports-header">
      <h2>📊 Relatórios Automáticos</h2>
      <p>Relatórios gerados automaticamente pelo sistema</p>
    </div>
    
    ${statusHtml}
    
    <div class="auto-reports-tabs">
      <button class="tab-btn active" onclick="switchAutoReportTab('weekly')">📅 Semanais</button>
      <button class="tab-btn" onclick="switchAutoReportTab('monthly')">📈 Mensais</button>
    </div>
    
    <div id="weekly-reports" class="auto-reports-content active">
      <h3>📅 Relatórios Semanais</h3>
      ${generateWeeklyReportsList(weeklyReports)}
    </div>
    
    <div id="monthly-reports" class="auto-reports-content">
      <h3>📈 Relatórios Mensais</h3>
      ${generateMonthlyReportsList(monthlyReports)}
    </div>
  `;

  const reportsContainer = document.getElementById("reports-container");
  reportsContainer.innerHTML = html;
}

// Adicionar indicador visual na tela inicial
function addAutoReportIndicator() {
  const weeklyReports = getWeeklyReports();
  const monthlyReports = getMonthlyReports();
  const currentWeek = getWeekNumber(new Date());
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Verificar status
  const lastWeeklyReport = localStorage.getItem("lastWeeklyReport");
  const lastMonthlyReport = localStorage.getItem("lastMonthlyReport");

  const weeklyStatus = lastWeeklyReport ? JSON.parse(lastWeeklyReport) : null;
  const monthlyStatus = lastMonthlyReport
    ? JSON.parse(lastMonthlyReport)
    : null;

  const weeklyUpToDate =
    weeklyStatus && weeklyStatus.weekNumber === currentWeek;
  const monthlyUpToDate =
    monthlyStatus &&
    monthlyStatus.month === currentMonth &&
    monthlyStatus.year === currentYear;

  // Criar indicador se não existir
  if (!document.getElementById("auto-report-indicator")) {
    const indicator = document.createElement("div");
    indicator.id = "auto-report-indicator";
    indicator.className = "auto-report-indicator";
    indicator.innerHTML = `
      <div class="indicator-content">
        <span class="indicator-icon">📊</span>
        <span class="indicator-text">Relatórios Automáticos</span>
        <div class="indicator-status">
          <span class="status-dot ${
            weeklyUpToDate ? "active" : "pending"
          }" title="Semanal"></span>
          <span class="status-dot ${
            monthlyUpToDate ? "active" : "pending"
          }" title="Mensal"></span>
        </div>
      </div>
    `;

    // Adicionar ao sidebar
    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
      sidebar.appendChild(indicator);
    }
  } else {
    // Atualizar indicador existente
    const indicator = document.getElementById("auto-report-indicator");
    const weeklyDot = indicator.querySelector(".status-dot:nth-child(1)");
    const monthlyDot = indicator.querySelector(".status-dot:nth-child(2)");

    weeklyDot.className = `status-dot ${weeklyUpToDate ? "active" : "pending"}`;
    monthlyDot.className = `status-dot ${
      monthlyUpToDate ? "active" : "pending"
    }`;
  }
}

//
window.selectCategory = selectCategory;
window.goHome = goHome;
window.showTransactions = showTransactions;
window.showReports = showReports;
window.showSettings = showSettings;
window.showScreen = showScreen;
window.initAutoReports = initAutoReports;

