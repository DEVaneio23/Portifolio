/**
 * ===========================================================================
 * MÓDULO DE INTERFACE DO USUÁRIO - SISTEMA DE AGENDAMENTO DE BANCAS
 * ===========================================================================
 * 
 * Este módulo contém todas as funções relacionadas à interface do usuário:
 * - Gerenciamento de alertas
 * - Barra de progresso
 * - Checklist
 * - Elementos visuais
 * 
 * ===========================================================================
 */
/**
 * DIRETRIZES DE MANUTENÇÃO
 * - Este módulo não deve conter regras de negócio. Apenas apresentação e orquestração visual.
 * - Sempre que adicionar novos campos obrigatórios, inclua-os em `CAMPOS_OBRIGATORIOS` e
 *   garanta o tratamento no switch de `atualizarProgresso`.
 * - Evite acessar o DOM por ids espalhados; padronize ids e classes no HTML
 *   para reduzir acoplamento (já foi feito na maior parte).
 */
import { validarCPF, validarEmail, temMulherNaBanca, validarPalavrasChave } from './validation.js';

/**
 * Exibe um alerta visual para o usuário
 * @param {string} elementId - ID do elemento de alerta no HTML
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de alerta: 'warning', 'error', 'success'
 */
export function showAlert(elementId, message, type = 'warning') {
  const alertEl = document.getElementById(elementId);
  if (!alertEl) return;

  // Configuração dos tipos de alerta com cores e ícones
  const alertTypes = {
    warning: { class: 'alert-warning', icon: 'fa-exclamation-triangle' },
    error: { class: 'alert-danger', icon: 'fa-times-circle' },
    success: { class: 'alert-success', icon: 'fa-check-circle' }
  };
  
  const alertInfo = alertTypes[type] || alertTypes.warning;

  // Aplica as classes e conteúdo
  alertEl.className = 'alert'; // Reseta para a classe base
  alertEl.classList.add(alertInfo.class);
  alertEl.innerHTML = `<i class="fas ${alertInfo.icon}"></i> <span>${message}</span>`;
  alertEl.classList.remove('hidden');
}

/**
 * Oculta um alerta visual
 * @param {string} elementId - ID do elemento de alerta
 */
export function hideAlert(elementId) {
  const alertEl = document.getElementById(elementId);
  if (!alertEl) return;
  alertEl.classList.add('hidden');
  alertEl.innerHTML = '';
}

/**
 * Atualiza a barra de progresso e o checklist baseado no preenchimento dos campos
 * @param {Array} camposObrigatorios - Lista de campos obrigatórios
 */
export function atualizarProgresso(camposObrigatorios) {
  let preenchidos = 0;
  const total = camposObrigatorios.length;

  // Itera por todos os campos obrigatórios
  camposObrigatorios.forEach((campo) => {
    let preenchido = false;
    const item = document.querySelector(
      `.checklist-item[data-field="${campo.id}"]`
    );

    // Valida cada campo de acordo com seu tipo
    switch (campo.type) {
      case 'input':
      case 'textarea': {
        const input = document.getElementById(campo.id);
        const valor = input ? input.value.trim() : '';
        preenchido = valor !== '';
        
        // Aplica validação adicional se existir (ex: CPF, email)
        if (preenchido && campo.validacao) {
          const validators = { validarCPF, validarEmail, validarPalavrasChave };
          const validatorFunction =
            typeof campo.validacao === 'function'
              ? campo.validacao
              : validators[campo.validacao];

          if (typeof validatorFunction === 'function') {
            preenchido = validatorFunction(valor);
          }
          
          // Adiciona ou remove classe de erro no input
          if (input) {
            if (preenchido) {
              input.classList.remove('erro-validacao');
            } else if (valor !== '') {
              input.classList.add('erro-validacao');
            }
          }
        }
        break;
      }
      case 'file': {
        const input = document.getElementById(campo.id);
        preenchido = input && input.files.length > 0;
        break;
      }
      case 'select': {
        const select = document.getElementById(campo.id);
        preenchido = select && select.value !== '';
        break;
      }
      case 'checkbox': {
        // Verifica se pelo menos um membro interno foi selecionado
        preenchido =
          document.querySelectorAll(
            'input[type="checkbox"][name^="membroInterno"]:checked'
          ).length > 0;
        break;
      }
      case 'externos': {
        // Verifica se pelo menos um membro externo foi adicionado
        preenchido = Array.from(
          document.querySelectorAll('input[name^="membroExterno"]')
        ).some((inp) => inp.value.trim() !== '');
        break;
      }
      case 'envio-fisico': {
        // Verifica se o checkbox de confirmação de envio está marcado
        const envioFisico = document.getElementById('confirmacao_envio');
        preenchido = envioFisico && envioFisico.checked;
        break;
      }
      case 'mulher-banca': {
        // Verifica se há pelo menos uma mulher na banca
        preenchido = temMulherNaBanca();
        break;
      }
    }

    // Atualiza o visual do item no checklist
    if (item) item.classList.toggle('completed', preenchido);
    if (preenchido) preenchidos++;
  });

  // Calcula e atualiza a barra de progresso
  const progresso = Math.round((preenchidos / total) * 100);
  const bar = document.getElementById('progress-indicator') || document.getElementById('form-progress');
  const txt = document.getElementById('progress-text');
  if (bar) {
    bar.classList.remove('hidden');
    bar.style.width = `${progresso}%`;
    // Fallback: escrever texto dentro da barra se não houver elemento específico
    if (!txt) bar.textContent = `${progresso}% completo`;
  }
  if (txt) txt.textContent = `${progresso}% completo`;
}

/**
 * Inicializa o checklist e o progresso do formulário
 * @param {Array} camposObrigatorios - Lista de campos obrigatórios
 */
export function inicializarChecklistEProgresso(camposObrigatorios) {
  const checklist = document.querySelector('.checklist');

  // Adiciona item para verificação de mulher na banca se não existir
  if (checklist && !document.querySelector('.checklist-item[data-field="mulher-na-banca"]')) {
    const item = document.createElement('div');
    item.className = 'checklist-item';
    item.setAttribute('data-field', 'mulher-na-banca');
    item.innerHTML = '<span class="checkmark">✓</span><span>Ao menos uma professora na banca</span>';
    checklist.appendChild(item);
  }

  // Adiciona item para modalidade da banca se não existir
  if (checklist && !document.querySelector('.checklist-item[data-field="modalidade_banca"]')) {
    const item = document.createElement('div');
    item.className = 'checklist-item';
    item.setAttribute('data-field', 'modalidade_banca');
    item.innerHTML = '<span class="checkmark">✓</span><span>Modalidade da banca selecionada</span>';
    checklist.appendChild(item);
  }

  // Inicializa os listeners e atualiza o estado inicial
  setTimeout(() => {
    atualizarProgresso(camposObrigatorios);
  }, 100);
}

/**
 * Atualiza as palavras-chave sugeridas baseadas no projeto de pesquisa selecionado
 * @param {Object} projetosPesquisa - Objeto com os projetos de pesquisa
 */
export function atualizarKeywordsProjeto(projetosPesquisa) {
  const projetoSelecionado = document.getElementById('projeto_pesquisa').value;
  const keywordsContainer = document.getElementById('keywords-container');
  if (!keywordsContainer) return;

  if (projetoSelecionado && projetosPesquisa[projetoSelecionado]) {
    // Mostra as palavras-chave do projeto selecionado
    const { keywords } = projetosPesquisa[projetoSelecionado];
    keywordsContainer.innerHTML = `<p>Palavras-chave sugeridas: ${keywords.join(', ')}</p>`;
    keywordsContainer.style.display = 'block';
    
    // Marca o item como completo no checklist
    const item = document.querySelector(
      '.checklist-item[data-field="projeto_pesquisa"]'
    );
    if (item) item.classList.add('completed');
  } else {
    // Esconde o container se nenhum projeto foi selecionado
    keywordsContainer.style.display = 'none';
    const item = document.querySelector(
      '.checklist-item[data-field="projeto_pesquisa"]'
    );
    if (item) item.classList.remove('completed');
  }
}

/**
 * Formata o tamanho de um arquivo para exibição
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} - Tamanho formatado
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Aplica máscara de CPF no input
 * @param {HTMLInputElement} input - Elemento input
 */
export function aplicarMascaraCPF(input) {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 11);
    if (value.length > 9) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
    else if (value.length > 6) value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (value.length > 3) value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    e.target.value = value;
  });
}

/**
 * Aplica máscara de telefone no input
 * @param {HTMLInputElement} input - Elemento input
 */
export function aplicarMascaraTelefone(input) {
  input.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 11);
    if (value.length > 10) value = value.replace(/(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
    else if (value.length > 6) value = value.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
    else if (value.length > 2) value = value.replace(/(\d{2})(\d{1,4})/, '($1) $2');
    e.target.value = value;
  });
} 