/**
 * ===========================================================================
 * MÓDULO PRINCIPAL DO FORMULÁRIO - SISTEMA DE AGENDAMENTO DE BANCAS
 * ===========================================================================
 * 
 * Este módulo é o orquestrador principal que coordena todos os outros módulos:
 * - Inicialização de todos os componentes
 * - Gerenciamento de eventos
 * - Validação final do formulário
 * - Submissão dos dados
 * 
 * ===========================================================================
 */
/**
 * COMO ESTE MÓDULO ESTÁ ORGANIZADO
 * - inicializarFormulario(): ponto de entrada. Chama inicializações de UI, membros e upload.
 * - inicializarVerificadorResumo(): cuida de contagem de palavras no resumo e alerta.
 * - adicionarEventListenersValidacao(): validações pontuais (CPF, email, data, hora).
 * - adicionarEventListenersVisibilidade(): mostra/esconde seções conforme tipo/curso.
 * - adicionarEventListenersFormulario(): submissão final com validação completa.
 *
 * DICAS PARA EVOLUIR
 * - Evite regras novas aqui; extraia para `validation.js` ou um futuro `rules.js`.
 * - Se o HTML mudar, mantenha ids coerentes para não quebrar seletores.
 * - Adicione testes de integração simples: simule preenchimento e verifique o checklist.
 */

import { CAMPOS_OBRIGATORIOS, PROJETOS_PESQUISA, CONFIGURACOES, MENSAGENS } from './data.js';
import { validarCPF, validarEmail, validarDataAgendamento, validarHoraAgendamento, validarResumo, validarPalavrasChave } from './validation.js';
import { showAlert, hideAlert, atualizarProgresso, inicializarChecklistEProgresso } from './ui.js';
import { inicializarMembrosInternos, inicializarMembrosExternos } from './members.js';
import { inicializarUpload } from './upload.js';

/**
 * Inicializa todos os componentes do formulário
 */
export function inicializarFormulario() {
  console.log('Inicializando formulário de agendamento...');

  // Inicializa o checklist e progresso
  inicializarChecklistEProgresso(CAMPOS_OBRIGATORIOS);

  // Inicializa os membros da banca
  inicializarMembrosInternos();
  inicializarMembrosExternos();

  // Inicializa o sistema de upload
  inicializarUpload();

  // Inicializa o verificador de resumo
  inicializarVerificadorResumo();

  // Adiciona event listeners para validações específicas
  adicionarEventListenersValidacao();

  // Adiciona event listeners para controles de visibilidade
  adicionarEventListenersVisibilidade();

  // Adiciona event listener para submissão do formulário
  adicionarEventListenersFormulario();

  // Força uma atualização inicial
  setTimeout(() => {
    atualizarProgresso(CAMPOS_OBRIGATORIOS);
  }, 100);
}

/**
 * Inicializa o verificador de resumo
 */
function inicializarVerificadorResumo() {
  console.log('Inicializando verificador de resumo...');
  
  const resumoInput = document.getElementById('resumo');
  const contadorPalavras = document.getElementById('contador-palavras');
  const palavrasChaveInput = document.getElementById('palavras_chave');
  const erroPalavrasChave = document.getElementById('erro-palavras-chave');
  const resumoAlert = document.getElementById('resumo-alert');
  const progressIndicator = document.getElementById('progress-indicator');
  const projetoSelect = document.getElementById('projeto_pesquisa');

  if (!resumoInput || !contadorPalavras || !resumoAlert || !progressIndicator) {
    console.error('Alguns elementos necessários não foram encontrados');
    return;
  }

  function atualizarVerificacao() {
    const texto = resumoInput.value;
    const resultado = validarResumo(texto);
    
    // Atualiza contador de palavras
    contadorPalavras.textContent = `${resultado.numPalavras} palavras`;
    
    // Verifica requisitos mínimos (apenas contagem de palavras no resumo)
    const temPalavrasSuficientes = resultado.numPalavras >= resultado.requisitos.palavrasMinimas;
    
    // Atualiza indicador de progresso
    if (temPalavrasSuficientes) {
      progressIndicator.classList.remove('hidden');
      progressIndicator.style.width = '100%';
      resumoAlert.classList.add('hidden');
    } else {
      progressIndicator.classList.remove('hidden');
      const progresso = (resultado.numPalavras / resultado.requisitos.palavrasMinimas) * 100;
      progressIndicator.style.width = `${Math.min(progresso, 100)}%`;
      
      // Mostra alerta se necessário
      if (!temPalavrasSuficientes) {
        const message = MENSAGENS.AVISO.RESUMO_INCOMPLETO;
        showAlert('resumo-alert', message, 'warning');
      } else {
        resumoAlert.classList.add('hidden');
      }
    }
  }

  // Adiciona event listeners
  resumoInput.addEventListener('input', atualizarVerificacao);
  
  // Validação das palavras-chave inseridas pelo aluno
  if (palavrasChaveInput) {
    palavrasChaveInput.addEventListener('blur', () => {
      if (!validarPalavrasChave(palavrasChaveInput.value)) {
        showAlert('erro-palavras-chave', 'Informe ao menos 2 palavras-chave separadas por vírgula.', 'warning');
      } else {
        hideAlert('erro-palavras-chave');
      }
      atualizarProgresso(CAMPOS_OBRIGATORIOS);
    });
    palavrasChaveInput.addEventListener('input', () => atualizarProgresso(CAMPOS_OBRIGATORIOS));
  }

  // Executa a verificação inicial
  atualizarVerificacao();
}

/**
 * Adiciona event listeners para validações específicas
 */
function adicionarEventListenersValidacao() {
  // Validação de CPF
  const cpfInput = document.getElementById('cpf_aluno');
  if (cpfInput) {
    cpfInput.addEventListener('blur', (e) => {
      const cpf = e.target.value;
      if (cpf && !validarCPF(cpf)) {
        showAlert('erro-cpf', MENSAGENS.ERRO.CPF_INVALIDO, 'error');
      } else {
        hideAlert('erro-cpf');
      }
    });
  }

  // Validação de email
  const emailInput = document.getElementById('email_aluno');
  if (emailInput) {
    emailInput.addEventListener('blur', (e) => {
      const email = e.target.value;
      if (email && !validarEmail(email)) {
        showAlert('erro-email', MENSAGENS.ERRO.EMAIL_INVALIDO, 'error');
      } else {
        hideAlert('erro-email');
      }
    });
  }

  // Validação de data
  const dataInput = document.getElementById('data');
  if (dataInput) {
    // Define a data mínima como hoje
    const hoje = new Date();
    const dataMinima = hoje.toISOString().split('T')[0];
    dataInput.min = dataMinima;

    dataInput.addEventListener('change', function() {
      if (this.value && !validarDataAgendamento(this.value)) {
        alert(MENSAGENS.ERRO.DATA_FIM_SEMANA);
        this.value = '';
      }
    });
  }

  // Validação de hora
  const horaInput = document.getElementById('hora');
  if (horaInput) {
    horaInput.addEventListener('change', function() {
      if (this.value && !validarHoraAgendamento(this.value)) {
        alert(MENSAGENS.ERRO.HORA_INVALIDA);
        this.value = '';
      }
    });
  }
}

/**
 * Adiciona event listeners para controles de visibilidade
 */
function adicionarEventListenersVisibilidade() {
  // Controle de visibilidade do envio físico
  const tipoBancaSelect = document.getElementById('tipo');
  if (tipoBancaSelect) {
    tipoBancaSelect.addEventListener('change', atualizarVisibilidadeEnvioFisico);
    tipoBancaSelect.addEventListener('change', atualizarChecklistMembrosExternos);
  }

  // Inicializa os controles
  atualizarVisibilidadeEnvioFisico();
  atualizarChecklistMembrosExternos();
}

/**
 * Atualiza a visibilidade do campo de envio físico
 */
function atualizarVisibilidadeEnvioFisico() {
  const tipoBanca = document.getElementById('tipo')?.value;
  const containerEnvioFisico = document.querySelector('.form-group.envio-check');
  const checklistItemEnvioFisico = document.querySelector('[data-visibility="defesa-only"]');
  const checkboxConfirmacao = document.getElementById('confirmacao_envio');

  const isDefesa = tipoBanca === 'defesa';

  if (containerEnvioFisico) containerEnvioFisico.style.display = isDefesa ? 'block' : 'none';
  if (checklistItemEnvioFisico) checklistItemEnvioFisico.style.display = isDefesa ? 'flex' : 'none';
  if (checkboxConfirmacao) {
    checkboxConfirmacao.required = isDefesa;
    if (!isDefesa) {
      checkboxConfirmacao.checked = false;
    }
  }
  
  atualizarProgresso(CAMPOS_OBRIGATORIOS);
}

/**
 * Atualiza a visibilidade do checklist de membros externos
 */
function atualizarChecklistMembrosExternos() {
  const tipoBanca = document.getElementById('tipo').value;
  const checklistItem = document.querySelector('.checklist-item[data-field="membros-externos"]');

  if (checklistItem) {
    if (tipoBanca === 'defesa') {
      checklistItem.style.display = 'block';
    } else {
      checklistItem.style.display = 'none';
    }
  }
  atualizarProgresso(CAMPOS_OBRIGATORIOS);
}

/**
 * Adiciona event listeners para o formulário
 */
function adicionarEventListenersFormulario() {
  const form = document.getElementById('agendamento-form');
  if (!form) return;

  // Listeners para atualização automática do progresso
  form.addEventListener('input', () => atualizarProgresso(CAMPOS_OBRIGATORIOS));
  form.addEventListener('change', () => atualizarProgresso(CAMPOS_OBRIGATORIOS));

  // Listener específico para membros da banca
  form.addEventListener('input', (e) => {
    if (
      e.target.name &&
      (e.target.name.startsWith('membroInterno') ||
        e.target.name.startsWith('membroExterno'))
    ) {
      atualizarProgresso(CAMPOS_OBRIGATORIOS);
    }
  });

  // Listener para atualização de palavras-chave
  const projetoSelect = document.getElementById('projeto_pesquisa');
  if (projetoSelect) {
    projetoSelect.addEventListener('change', () => atualizarKeywordsProjeto(PROJETOS_PESQUISA));
  }

  // Listener para submissão do formulário
  form.addEventListener('submit', validarFormulario);
}

/**
 * Valida o formulário antes da submissão
 * @param {Event} event - Evento de submissão
 */
async function validarFormulario(event) {
  event.preventDefault();

  const form = event.target;
  if (!form) return;

  const curso = form.querySelector('#curso')?.value;
  const tipo = form.querySelector('#tipo')?.value;
  const membrosInternos = Array.from(form.querySelectorAll('#membros-internos input[type="checkbox"]:checked'));
  const membrosExternosCards = form.querySelectorAll('#membros-externos-container .membro-externo-card');
  const confirmacaoEnvio = form.querySelector('#confirmacao_envio');
  const erroConfirmacao = document.getElementById('erro-confirmacao');
  const alertMembrosInternos = document.getElementById('alert-membros-internos');

  // Resetar estados de erro
  let formularioValido = true;
  hideAlert('erro-confirmacao');
  hideAlert('alert-membros-internos');

  // Validação para Mestrado Qualificação
  if (curso === 'mestrado' && tipo === 'qualificacao') {
    const totalDeMembros = membrosInternos.length + membrosExternosCards.length;
    if (totalDeMembros !== 2) {
      showAlert('alert-membros-internos', 'A banca de qualificação de mestrado deve ter 2 membros (internos e/ou externos), além do orientador.', 'error');
      formularioValido = false;
    }
  } else { // Validação para outros cursos/tipos
    const minMembros = curso === 'mestrado' ? 1 : 2;
    if (membrosInternos.length < minMembros) {
      showAlert('alert-membros-internos', `Selecione pelo menos ${minMembros} membro(s) interno(s).`, 'error');
      formularioValido = false;
    }
  }

  // Validação de gênero
  const { temMulherNaBanca } = await import('./validation.js');
  if (!temMulherNaBanca()) {
    showAlert('alert-membros-internos', MENSAGENS.ERRO.MULHER_OBRIGATORIA, 'error');
    formularioValido = false;
  }

  // Validação da confirmação de envio
  if (confirmacaoEnvio && confirmacaoEnvio.required && !confirmacaoEnvio.checked) {
    showAlert('erro-confirmacao', MENSAGENS.ERRO.ENVIO_FISICO_OBRIGATORIO, 'error');
    confirmacaoEnvio.scrollIntoView({ behavior: 'smooth', block: 'center' });
    formularioValido = false;
  }

  // Se todas as validações passarem, envia o formulário
  if (formularioValido) {
    form.submit();
  }
} 