// Script específico para resolver problemas de cache no iOS
(function() {
  'use strict';
  
  // Detectar se é iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
  if (isIOS) {
    console.log('iOS detectado - aplicando correções de cache');
    
    // Versão atual do app
    const APP_VERSION = '1.0.6';
    
    // Função para fazer backup dos dados importantes
    function backupImportantData() {
      const importantData = {
        financeData: localStorage.getItem('financeData'),
        financialManager_backups: localStorage.getItem('financialManager_backups'),
        weeklyReports: localStorage.getItem('weeklyReports'),
        monthlyReports: localStorage.getItem('monthlyReports'),
        lastWeeklyReport: localStorage.getItem('lastWeeklyReport'),
        lastMonthlyReport: localStorage.getItem('lastMonthlyReport'),
        financialManager_version: localStorage.getItem('financialManager_version')
      };
      
      // Salvar backup temporário
      sessionStorage.setItem('tempBackup', JSON.stringify(importantData));
      console.log('Backup dos dados importantes criado');
    }
    
    // Função para restaurar dados importantes
    function restoreImportantData() {
      const tempBackup = sessionStorage.getItem('tempBackup');
      if (tempBackup) {
        try {
          const backup = JSON.parse(tempBackup);
          
          // Restaurar dados importantes
          Object.keys(backup).forEach(key => {
            if (backup[key]) {
              localStorage.setItem(key, backup[key]);
            }
          });
          
          // Limpar backup temporário
          sessionStorage.removeItem('tempBackup');
          console.log('Dados importantes restaurados');
        } catch (error) {
          console.error('Erro ao restaurar dados:', error);
        }
      }
    }
    
    // Função para limpar cache (sem apagar dados importantes)
    function clearCache() {
      // Fazer backup antes de limpar
      backupImportantData();
      
      // Limpar apenas dados não importantes
      const keysToKeep = [
        'financeData',
        'financialManager_backups', 
        'weeklyReports',
        'monthlyReports',
        'lastWeeklyReport',
        'lastMonthlyReport',
        'financialManager_version'
      ];
      
      // Salvar dados importantes temporariamente
      const importantData = {};
      keysToKeep.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          importantData[key] = value;
        }
      });
      
      // Limpar localStorage
      if (window.localStorage) {
        localStorage.clear();
        console.log('localStorage limpo (dados importantes preservados)');
      }
      
      // Restaurar dados importantes
      Object.keys(importantData).forEach(key => {
        localStorage.setItem(key, importantData[key]);
      });
      
      // Limpar sessionStorage (exceto backup temporário)
      if (window.sessionStorage) {
        const tempBackup = sessionStorage.getItem('tempBackup');
        sessionStorage.clear();
        if (tempBackup) {
          sessionStorage.setItem('tempBackup', tempBackup);
        }
        console.log('sessionStorage limpo');
      }
      
      // Limpar IndexedDB se disponível
      if (window.indexedDB) {
        const request = indexedDB.deleteDatabase('financeiro-db');
        request.onsuccess = function() {
          console.log('IndexedDB limpo');
        };
      }
    }
    
    // Função para forçar atualização
    function forceUpdate() {
      const storedVersion = localStorage.getItem('app_version');
      
      if (storedVersion !== APP_VERSION) {
        console.log('Nova versão detectada, forçando atualização');
        localStorage.setItem('app_version', APP_VERSION);
        
        // Limpar cache (preservando dados importantes)
        clearCache();
        
        // Restaurar dados após limpeza
        restoreImportantData();
        
        // Forçar reload apenas se for uma versão diferente
        if (storedVersion && storedVersion !== APP_VERSION) {
          setTimeout(() => {
            window.location.reload(true);
          }, 100);
        }
      }
    }
    
    // Função para verificar e atualizar service worker
    function updateServiceWorker() {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => {
            // Força atualização do service worker
            registration.update();
            
            // Se há um service worker esperando, força ativação
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            
            // Listener para quando o service worker for atualizado
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Força reload quando o novo service worker estiver pronto
                  window.location.reload();
                }
              });
            });
          });
        });
      }
    }
    
    // Função para adicionar headers de cache
    function addCacheHeaders() {
      // Adicionar meta tags dinamicamente se não existirem
      const metaTags = [
        { name: 'Cache-Control', content: 'no-cache, no-store, must-revalidate, max-age=0' },
        { name: 'Pragma', content: 'no-cache' },
        { name: 'Expires', content: '0' }
      ];
      
      metaTags.forEach(tag => {
        if (!document.querySelector(`meta[http-equiv="${tag.name}"]`)) {
          const meta = document.createElement('meta');
          meta.setAttribute('http-equiv', tag.name);
          meta.setAttribute('content', tag.content);
          document.head.appendChild(meta);
        }
      });
    }
    
    // Executar correções quando o DOM estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        addCacheHeaders();
        forceUpdate();
        updateServiceWorker();
      });
    } else {
      addCacheHeaders();
      forceUpdate();
      updateServiceWorker();
    }
    
    // Adicionar listener para mudanças de conectividade
    window.addEventListener('online', function() {
      console.log('Conexão restaurada - verificando atualizações');
      updateServiceWorker();
    });
    
    // Forçar verificação periódica de atualizações
    setInterval(() => {
      updateServiceWorker();
    }, 30000); // Verificar a cada 30 segundos
  }
})(); 