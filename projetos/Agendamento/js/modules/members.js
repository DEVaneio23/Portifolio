/**
 * ===========================================================================
 * MÓDULO DE MEMBROS DA BANCA - SISTEMA DE AGENDAMENTO DE BANCAS
 * ===========================================================================
 * 
 * Este módulo contém todas as funções relacionadas ao gerenciamento
 * de membros da banca (internos e externos):
 * - Inicialização de membros internos
 * - Gerenciamento de membros externos
 * - Validação de composição da banca
 * - Regras de negócio para membros
 * 
 * ===========================================================================
 */

/**
 * NOTAS DE PROJETO (para manutenção)
 * - Priorize funções pequenas e puras para regras de composição; facilita testes.
 * - Se surgirem novas restrições (ex.: área, titulação mínima), considere extrair
 *   utilitários para um `rules.js` e importar aqui, mantendo a UI simples.
 * - Comunicação com o usuário deve ocorrer via `showAlert/hideAlert` e classes
 *   de estado; evite montar HTML literal neste módulo além de pequenos trechos.
 */

import { PROFESSORES_INTERNOS, CURSOS, CONFIGURACOES } from './data.js';
import { showAlert, hideAlert } from './ui.js';

/**
 * Inicializa a interface de seleção de membros internos
 * Cria cards interativos para cada professor e configura os event listeners
 */
export function inicializarMembrosInternos() {
  const container = document.getElementById('membros-internos');
  if (!container) return;

  container.innerHTML = ''; // Limpa o container para reinicialização

  // Adiciona o contador de selecionados
  const contador = document.createElement('div');
  contador.id = 'contador-membros-internos';
  contador.className = 'contador-selecionados';
  container.parentElement.insertBefore(contador, container.nextSibling);
  window.contadorMembrosInternos = contador;

  // Itera sobre a lista de professores para criar os cards interativos
  PROFESSORES_INTERNOS.forEach(professor => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'membro-interno-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `membro-interno-${professor.id}`;
    checkbox.name = 'membroInterno';
    checkbox.value = professor.cpf;
    checkbox.dataset.genero = professor.genero;

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = professor.nome;

    // Adiciona evento de clique no card inteiro
    itemDiv.addEventListener('click', (e) => {
      if (checkbox.disabled) return;

      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });

    // Adiciona evento de mudança no checkbox
    checkbox.addEventListener('change', () => {
      itemDiv.classList.toggle('item-selected', checkbox.checked);
      atualizarSelecaoMembrosInternos();
    });
    
    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(label);
    container.appendChild(itemDiv);
  });

  // Adiciona os listeners aos controles que afetam a seleção de membros
  adicionarEventListenersControlesBanca();

  // Força uma atualização inicial
  atualizarSelecaoMembrosInternos();
}

/**
 * Adiciona event listeners aos controles que afetam a seleção de membros internos
 */
function adicionarEventListenersControlesBanca() {
  const cursoSelect = document.getElementById('curso');
  const tipoSelect = document.getElementById('tipo');

  if (cursoSelect) {
    cursoSelect.addEventListener('change', atualizarSelecaoMembrosInternos);
  }
  if (tipoSelect) {
    tipoSelect.addEventListener('change', atualizarSelecaoMembrosInternos);
  }
}

/**
 * Atualiza a interface e validações dos membros internos baseado nas regras de negócio
 */
export function atualizarSelecaoMembrosInternos() {
  const container = document.getElementById('membros-internos');
  const alertMembrosInternos = document.getElementById('alert-membros-internos');
  const cursoSelect = document.getElementById('curso');
  const tipoSelect = document.getElementById('tipo');
  
  if (!container || !alertMembrosInternos || !cursoSelect || !tipoSelect) return;

  const curso = cursoSelect.value;
  const tipo = tipoSelect.value;

  // Define o número TOTAL de membros da banca (excluindo o orientador)
  let totalMembrosBanca = 0;
  if (curso === 'mestrado') {
    totalMembrosBanca = 2; // 1 orientador + 2 membros = 3 no total
  } else if (curso === 'doutorado') {
    totalMembrosBanca = 4; // 1 orientador + 4 membros = 5 no total
  }

  // Calcula o máximo de membros internos permitidos
  const externosAdicionados = document.querySelectorAll('#membros-externos-container .membro-externo-card').length;
  let maxMembrosInternos = totalMembrosBanca - externosAdicionados;

  // Se nenhum curso foi selecionado, o limite é estritamente 0
  if (!curso) {
    maxMembrosInternos = 0;
  }

  const checkboxes = container.querySelectorAll('input[type="checkbox"][name="membroInterno"]');
  const selecionados = Array.from(checkboxes).filter(cb => cb.checked);

  // Atualiza o estado de cada checkbox (habilitado/desabilitado)
  checkboxes.forEach(checkbox => {
    const itemDiv = checkbox.closest('.membro-interno-item');
    if (!checkbox.checked && selecionados.length >= maxMembrosInternos) {
      itemDiv.classList.add('disabled');
      checkbox.disabled = true;
    } else {
      itemDiv.classList.remove('disabled');
      checkbox.disabled = false;
    }
  });

  // Atualiza o contador de membros selecionados
  if (window.contadorMembrosInternos) {
    window.contadorMembrosInternos.textContent = `${selecionados.length} professor(es) selecionado(s)`;
    window.contadorMembrosInternos.classList.toggle('limite-atingido', selecionados.length === maxMembrosInternos && maxMembrosInternos > 0);
  }

  // Verifica se há pelo menos uma mulher na banca
  if (selecionados.length > 0 && !temMulherNaBanca()) {
    showAlert('alert-membros-internos', 'É obrigatório incluir pelo menos uma mulher na banca.', 'warning');
  } else {
    hideAlert('alert-membros-internos');
  }
}

/**
 * Inicializa o sistema de gerenciamento de membros externos
 */
export function inicializarMembrosExternos() {
  console.log('Inicializando gerenciamento de membros externos...');
  
  const elementos = {
    cursoSelect: document.getElementById('curso'),
    tipoSelect: document.getElementById('tipo'),
    controleContainer: document.getElementById('controle-membros-externos'),
    desejaSimRadio: document.getElementById('membros-externos-sim'),
    membrosExternosGroup: document.querySelector('.form-group.membros-externos-group'),
    container: document.getElementById('membros-externos-container'),
    addButton: document.getElementById('add-membro-externo'),
    infoText: document.getElementById('info-membros-externos'),
    alertDiv: document.getElementById('alert-membros-externos'),
    contador: document.getElementById('contador-externos'),
    form: document.getElementById('agendamento-form')
  };

  // Verifica se todos os elementos necessários foram encontrados
  const elementosFaltantes = Object.entries(elementos).filter(([, el]) => !el).map(([nome]) => nome);
  if (elementosFaltantes.length > 0) {
    console.error('Elementos para membros externos não encontrados:', elementosFaltantes);
    return;
  }

  let maxMembros = 0;

  function atualizarLimitesMembros() {
    try {
      const curso = elementos.cursoSelect.value;
      const tipo = elementos.tipoSelect.value;
      const isDefesa = tipo === 'defesa';
      const isQualificacao = tipo === 'qualificacao';

      if (isDefesa) {
        maxMembros = (curso === 'mestrado') ? 1 : (curso === 'doutorado' ? 2 : 0);
        elementos.infoText.textContent = maxMembros > 0 ? 
          `${curso.charAt(0).toUpperCase() + curso.slice(1)} (Defesa) requer ${maxMembros} membro(s) externo(s)` : 
          'Selecione o curso para ver os requisitos.';
      } else if (isQualificacao) {
        const desejaExternos = elementos.desejaSimRadio.checked;
        if (desejaExternos) {
          const totalNaBanca = (curso === 'mestrado') ? 3 : 5;
          const internosSelecionados = document.querySelectorAll('#membros-internos input:checked').length;
          const orientador = document.getElementById('orientador')?.value.trim() !== '' ? 1 : 0;
          const vagasRestantes = totalNaBanca - orientador - internosSelecionados;
          
          maxMembros = Math.max(0, vagasRestantes);
          elementos.infoText.textContent = maxMembros > 0 ? 
            `Você pode adicionar até ${maxMembros} membro(s) externo(s) para qualificação.` : 
            'Não há vagas disponíveis para membros externos.';
        } else {
          maxMembros = 0;
          elementos.infoText.textContent = 'Membros externos não são obrigatórios para qualificação.';
        }
      } else {
        maxMembros = 0;
        elementos.infoText.textContent = 'Selecione o tipo de banca para ver os requisitos.';
      }
      
      if (typeof maxMembros !== 'number' || maxMembros < 0) {
        console.warn('Valor inválido para maxMembros:', maxMembros);
        maxMembros = 0;
      }
      
      atualizarContador();
      
    } catch (error) {
      console.error('Erro ao atualizar limites de membros:', error);
      maxMembros = 0;
      if (elementos.infoText) {
        elementos.infoText.textContent = 'Erro ao calcular limites. Tente novamente.';
      }
    }
  }

  function gerenciarVisibilidadeEInterface() {
    try {
      const curso = elementos.cursoSelect.value;
      const tipo = elementos.tipoSelect.value;
      const isDefesa = tipo === 'defesa';
      const isQualificacao = tipo === 'qualificacao';
      const desejaExternos = elementos.desejaSimRadio.checked;

      // Reinicia o estado para evitar vazamentos
      elementos.container.innerHTML = '';
      elementos.addButton.style.display = 'none';
      
      // Mostra controle apenas para qualificação
      const shouldShowControl = isQualificacao;
      
      // Mostra área de externos quando:
      // 1. É defesa (obrigatório)
      // 2. É qualificação E usuário escolheu "Sim"
      const shouldShowExternosArea = isDefesa || (isQualificacao && desejaExternos);

      elementos.controleContainer.style.display = shouldShowControl ? 'block' : 'none';
      elementos.membrosExternosGroup.style.display = shouldShowExternosArea ? 'block' : 'none';

      if (shouldShowExternosArea) {
        atualizarLimitesMembros();
        
        // Cria cards automaticamente APENAS para defesa
        if (isDefesa && maxMembros > 0) {
          for (let i = 0; i < maxMembros; i++) {
            elementos.container.appendChild(criarCardMembroExterno());
          }
          elementos.infoText.textContent = `${curso.charAt(0).toUpperCase() + curso.slice(1)} (Defesa) requer ${maxMembros} membro(s) externo(s) - ${maxMembros} card(s) criado(s) automaticamente`;
        } else if (isQualificacao && desejaExternos) {
          if (maxMembros > 0) {
            elementos.addButton.style.display = 'inline-block';
            elementos.infoText.textContent = `Qualificação permite até ${maxMembros} membro(s) externo(s). Clique em "Adicionar Membro Externo" para incluir.`;
          } else {
            elementos.infoText.textContent = 'Não há vagas disponíveis para membros externos.';
          }
        }
      } else {
        maxMembros = 0;
        atualizarContador();
      }
      
    } catch (error) {
      console.error('Erro ao gerenciar visibilidade e interface:', error);
      if (elementos.membrosExternosGroup) {
        elementos.membrosExternosGroup.style.display = 'none';
      }
      if (elementos.controleContainer) {
        elementos.controleContainer.style.display = 'none';
      }
    }
  }

  function criarCardMembroExterno() {
    try {
      const index = elementos.container.children.length;
      if (index < 0) return null;

      // Card Principal
      const card = document.createElement('div');
      card.className = 'membro-externo-card';

      // Cabeçalho do Card
      const header = document.createElement('div');
      header.className = 'membro-externo-header';
      const title = document.createElement('h3');
      title.textContent = `Membro Externo ${index + 1}`;
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn-remover';
      removeBtn.title = 'Remover membro';
      removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      header.appendChild(title);
      header.appendChild(removeBtn);

      // Corpo do Card
      const body = document.createElement('div');
      body.className = 'membro-externo-body';

      // Função auxiliar para criar campos
      const createField = (name, placeholder, type = 'text', fullWidth = false, options = []) => {
        const group = document.createElement('div');
        group.className = 'form-group';
        if (fullWidth) {
          group.classList.add('full-width');
        }

        let field;
        if (type === 'select') {
          field = document.createElement('select');
          options.forEach(opt => {
            const optionEl = document.createElement('option');
            optionEl.value = opt.value;
            optionEl.textContent = opt.text;
            field.appendChild(optionEl);
          });
        } else {
          field = document.createElement('input');
          field.type = type;
          field.placeholder = placeholder;
        }

        field.name = `membroExterno${name}${index}`;
        field.className = 'form-control';
        field.required = true;
        group.appendChild(field);
        return { group, field };
      };

      // Criando os campos
      const nome = createField('Nome', 'Nome completo', 'text', true);
      const email = createField('Email', 'E-mail', 'email');
      const cpf = createField('CPF', 'CPF', 'text');
      const instituicao = createField('Instituicao', 'Instituição', 'text', true);
      const titulacao = createField('Titulacao', 'Titulação', 'select', false, [
        { value: '', text: 'Titulação' },
        { value: 'doutor', text: 'Doutor' },
        { value: 'pos_doutor', text: 'Pós-Doutor' }
      ]);
      const genero = createField('Genero', 'Gênero', 'select', false, [
        { value: '', text: 'Gênero' },
        { value: 'feminino', text: 'Feminino' },
        { value: 'masculino', text: 'Masculino' }
      ]);

      // Adicionando campos ao corpo
      body.appendChild(nome.group);
      body.appendChild(email.group);
      body.appendChild(cpf.group);
      body.appendChild(instituicao.group);
      body.appendChild(titulacao.group);
      body.appendChild(genero.group);
      
      card.appendChild(header);
      card.appendChild(body);

      // Adicionando listeners e máscaras
      genero.field.addEventListener('change', () => {
        atualizarSelecaoMembrosInternos();
      });

      cpf.field.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 11);
        if (value.length > 9) value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4');
        else if (value.length > 6) value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        else if (value.length > 3) value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
        e.target.value = value;
        atualizarSelecaoMembrosInternos();
      });

      cpf.field.addEventListener('blur', async (e) => {
        const cpfValue = e.target.value.replace(/\D/g, '');
        const field = e.target;
        if (cpfValue.length > 0) {
          const { validarCPF } = await import('./validation.js');
          field.setCustomValidity(validarCPF(cpfValue) ? '' : 'CPF inválido');
        } else {
          field.setCustomValidity('');
        }
        field.classList.toggle('invalid', !field.checkValidity());
      });

      email.field.addEventListener('input', atualizarSelecaoMembrosInternos);

      removeBtn.addEventListener('click', () => {
        card.remove();
        atualizarContador();
        atualizarSelecaoMembrosInternos();
      });

      return card;
    } catch (error) {
      console.error('Erro ao criar card de membro externo:', error);
      return null;
    }
  }

  function atualizarContador() {
    try {
      const membros = elementos.container.querySelectorAll('.membro-externo-card');
      const membrosCount = membros.length;
      
      if (typeof maxMembros !== 'number' || maxMembros < 0) {
        console.warn('maxMembros inválido em atualizarContador:', maxMembros);
        maxMembros = 0;
      }
      
      elementos.contador.textContent = `${membrosCount}/${maxMembros} membro(s) externo(s)`;
      elementos.addButton.disabled = membrosCount >= maxMembros;
      
      if (membrosCount === maxMembros && maxMembros > 0) {
        elementos.contador.classList.add('limite-atingido');
      } else {
        elementos.contador.classList.remove('limite-atingido');
      }
      
    } catch (error) {
      console.error('Erro ao atualizar contador:', error);
      if (elementos.contador) {
        elementos.contador.textContent = 'Erro ao contar membros';
      }
    }
  }

  // Event Listeners
  elementos.cursoSelect.addEventListener('change', gerenciarVisibilidadeEInterface);
  elementos.tipoSelect.addEventListener('change', gerenciarVisibilidadeEInterface);
  document.querySelectorAll('input[name="deseja_membros_externos"]').forEach(radio => {
    radio.addEventListener('change', gerenciarVisibilidadeEInterface);
  });

  // Garante estado inicial correto dos radio buttons
  function garantirEstadoInicial() {
    const radioNao = document.getElementById('membros-externos-nao');
    if (radioNao && !radioNao.checked) {
      radioNao.checked = true;
    }
  }
  
  garantirEstadoInicial();

  elementos.addButton.addEventListener('click', () => {
    if (elementos.container.children.length < maxMembros) {
      const novoMembro = criarCardMembroExterno();
      if (novoMembro) {
        elementos.container.appendChild(novoMembro);
        atualizarContador();
        atualizarSelecaoMembrosInternos();
      }
    }
  });

  // Evento para mudança de membros internos
  const membrosInternosContainer = document.getElementById('membros-internos');
  if (membrosInternosContainer) {
    membrosInternosContainer.addEventListener('change', (e) => {
      try {
        if (e.target.type === 'checkbox') {
          atualizarLimitesMembros();
          atualizarSelecaoMembrosInternos();
        }
      } catch (error) {
        console.error('Erro ao atualizar limites após mudança de membros internos:', error);
      }
    });
  }

  // Evento para mudança do orientador
  const orientadorInput = document.getElementById('orientador');
  if (orientadorInput) {
    orientadorInput.addEventListener('input', () => {
      try {
        atualizarLimitesMembros();
      } catch (error) {
        console.error('Erro ao atualizar limites após mudança do orientador:', error);
      }
    });
  }

  gerenciarVisibilidadeEInterface();
}

/**
 * Verifica se há pelo menos uma mulher na banca
 * @returns {boolean} - True se há pelo menos uma mulher
 */
function temMulherNaBanca() {
  // Verifica membros internos
  const temMulherInterna = Array.from(document.querySelectorAll('#membros-internos input[type="checkbox"]:checked'))
    .some(cb => cb.dataset.genero === 'feminino');

  if (temMulherInterna) return true;

  // Verifica membros externos
  const temMulherExterna = Array.from(document.querySelectorAll('select[name*="Genero"]'))
    .some(select => select.value === 'feminino');

  return temMulherExterna;
} 