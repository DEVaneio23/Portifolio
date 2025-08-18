/**
 * SISTEMA DE AGENDAMENTO DE BANCAS - PPGD
 * 
 * Este arquivo contém a lógica principal do formulário de agendamento
 * com todas as funcionalidades integradas em um único arquivo.
 * 
 * Funcionalidades:
 * - Validação de formulários
 * - Gerenciamento de estado
 * - Interface responsiva
 * - Upload de arquivos
 * 
 * @author Dev Team
 * @version 1.0.0
 * @since 2025
 */

// --- FUNÇÕES DE VALIDAÇÃO ---
/**
 * Valida um CPF brasileiro usando o algoritmo oficial
 * @param {string} cpf - CPF a ser validado (pode conter máscara)
 * @returns {boolean} - True se o CPF for válido
 */
function validarCPF(cpf) {
  // Remove todos os caracteres não numéricos
  cpf = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) return false;
  // Verifica se não são todos os mesmos números (ex: 11111111111)
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  
  // Calcula o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digitoVerificador1 = resto > 9 ? 0 : resto;
  
  // Verifica se o primeiro dígito está correto
  if (digitoVerificador1 !== parseInt(cpf.charAt(9))) return false;
  
  // Calcula o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digitoVerificador2 = resto > 9 ? 0 : resto;
  
  // Verifica se o segundo dígito está correto
  return digitoVerificador2 === parseInt(cpf.charAt(10));
}

/**
 * Valida um endereço de email usando expressão regular
 * @param {string} email - Email a ser validado
 * @returns {boolean} - True se o email for válido
 */
function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// --- HELPER PARA ALERTAS VISUAIS ---
/**
 * Exibe um alerta visual para o usuário
 * @param {string} elementId - ID do elemento de alerta no HTML
 * @param {string} message - Mensagem a ser exibida
 * @param {string} type - Tipo de alerta: 'warning', 'error', 'success'
 */
function showAlert(elementId, message, type = 'warning') {
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
function hideAlert(elementId) {
  const alertEl = document.getElementById(elementId);
  if (!alertEl) return;
  alertEl.classList.add('hidden');
  alertEl.innerHTML = '';
}

// --- CONFIGURAÇÃO DE DADOS E CAMPOS OBRIGATÓRIOS ---

/**
 * Dicionário com os projetos de pesquisa disponíveis e suas palavras-chave
 * Usado para sugerir keywords no campo de resumo
 */
const PROJETOS_PESQUISA = {
direito_constitucional: {
  nome: 'Direito Constitucional',
  keywords: [
    'Constituição',
    'Direitos Fundamentais',
    'Controle de Constitucionalidade',
    'Federalismo'
  ]
},
direito_penal: {
  nome: 'Direito Penal',
  keywords: [
    'Teoria do Crime',
    'Penas',
    'Processo Penal',
    'Direito Penal Econômico'
  ]
},
direito_civil: {
  nome: 'Direito Civil',
  keywords: [
    'Direito das Obrigações',
    'Direito de Família',
    'Direito das Coisas',
    'Direito das Sucessões'
  ]
}
};

/**
 * Lista de todos os campos obrigatórios do formulário
 * Cada objeto define como o campo deve ser validado para o checklist
 */
const CAMPOS_OBRIGATORIOS = [
{ id: 'modalidade_banca', type: 'select' },
{ id: 'aluno', type: 'input' },
{ id: 'email_aluno', type: 'input', validacao: validarEmail },
{ id: 'cpf_aluno', type: 'input', validacao: validarCPF },
{ id: 'curso', type: 'select' },
{ id: 'tipo', type: 'select' },
{ id: 'titulo', type: 'input' },
{ id: 'resumo', type: 'textarea' },
{ id: 'trabalho_final', type: 'file' },
{ id: 'data', type: 'input' },
{ id: 'hora', type: 'input' },
{ id: 'orientador', type: 'input' },
{ id: 'membros-internos', type: 'checkbox' },
{ id: 'membros-externos', type: 'externos' },
{ id: 'projeto_pesquisa', type: 'select' },
{ id: 'envio_fisico', type: 'envio-fisico' },
{ id: 'confirmacao_envio', type: 'envio-fisico' },
{ id: 'mulher-na-banca', type: 'mulher-banca' }
];

// --- FUNÇÕES DE CHECKLIST E BARRA DE PROGRESSO ---
/**
 * Atualiza a barra de progresso e o checklist baseado no preenchimento dos campos
 * Esta função é chamada sempre que um campo é alterado
 */
function atualizarProgresso() {
let preenchidos = 0;
const total = CAMPOS_OBRIGATORIOS.length;

// Itera por todos os campos obrigatórios
CAMPOS_OBRIGATORIOS.forEach((campo) => {
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
        preenchido = campo.validacao(valor);
        
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
const bar = document.getElementById('form-progress');
const txt = document.getElementById('progress-text');
if (bar) bar.style.width = `${progresso}%`;
if (txt) {
  txt.textContent = `${progresso}% completo`;
} else if (bar) {
  // Fallback para caso o texto esteja dentro da barra
  bar.textContent = `${progresso}% completo`;
}
}

// --- FUNÇÕES DE VALIDAÇÃO ESPECÍFICAS ---
/**
 * Valida se a data de envio está pelo menos 15 dias antes da data de defesa
 * @param {string} dataEnvio - Data de envio do trabalho
 * @param {string} dataDefesa - Data da defesa
 * @returns {boolean} - True se o prazo for respeitado
 */
function validarDataEnvio(dataEnvio, dataDefesa) {
if (!dataEnvio || !dataDefesa) return false;
const umDia = 24 * 60 * 60 * 1000;
const diffDias = Math.round((new Date(dataDefesa) - new Date(dataEnvio)) / umDia);
return diffDias >= 15;
}

/**
 * Atualiza a validação da data de envio baseada na data de defesa
 * Garante que o envio seja feito pelo menos 15 dias antes da defesa
 */
function atualizarValidacaoDataEnvio() {
const dataEnvioInput = document.getElementById('data_envio');
const dataDefesaInput = document.getElementById('data');
const envioFisicoCheckbox = document.getElementById('envio_fisico');
const dataEnvioContainer = document.getElementById('data_envio_container');
if (!dataEnvioInput || !dataDefesaInput || !envioFisicoCheckbox || !dataEnvioContainer) return;

if (envioFisicoCheckbox.checked) {
  // Mostra o campo de data de envio
  dataEnvioContainer.style.display = 'block';
  if (dataDefesaInput.value) {
    // Calcula a data mínima (15 dias antes da defesa)
    const dataMinima = new Date(dataDefesaInput.value);
    dataMinima.setDate(dataMinima.getDate() - 15);
    const dataMinimaFormatada = dataMinima.toISOString().split('T')[0];
    
    // Define os limites do campo de data
    dataEnvioInput.min = dataMinimaFormatada;
    dataEnvioInput.max = dataDefesaInput.value;
    
    // Se a data atual for inválida, ajusta para a data mínima
    if (!dataEnvioInput.value || new Date(dataEnvioInput.value) < dataMinima) {
      dataEnvioInput.value = dataMinimaFormatada;
    }
    
    // Valida e mostra mensagem de erro se necessário
    const valido = validarDataEnvio(dataEnvioInput.value, dataDefesaInput.value);
    dataEnvioInput.setCustomValidity(
      valido ? '' : 'O envio deve ser feito com pelo menos 15 dias de antecedência'
    );
  }
} else {
  // Esconde o campo de data de envio se não for envio físico
  dataEnvioContainer.style.display = 'none';
  dataEnvioInput.value = '';
  dataEnvioInput.setCustomValidity('');
}
atualizarProgresso();
}

// --- PALAVRAS-CHAVE DO PROJETO DE PESQUISA ---
/**
 * Atualiza as palavras-chave sugeridas baseadas no projeto de pesquisa selecionado
 * Mostra/esconde o container de keywords e atualiza o checklist
 */
function atualizarKeywordsProjeto() {
const projetoSelecionado = document.getElementById('projeto_pesquisa').value;
const keywordsContainer = document.getElementById('keywords-container');
if (!keywordsContainer) return;

if (projetoSelecionado && PROJETOS_PESQUISA[projetoSelecionado]) {
  // Mostra as palavras-chave do projeto selecionado
  const { keywords } = PROJETOS_PESQUISA[projetoSelecionado];
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
atualizarProgresso();
}

// --- LISTENERS EFICIENTES E CENTRALIZADOS ---
/**
 * Adiciona todos os event listeners necessários para a interatividade do formulário
 * Centraliza a lógica de eventos para melhor performance
 */
function adicionarEventListeners() {
const form = document.getElementById('agendamento-form');
if (!form) return;

// Listeners para atualização automática do progresso
form.addEventListener('input', atualizarProgresso);
form.addEventListener('change', atualizarProgresso);

// Listener específico para membros da banca
form.addEventListener('input', (e) => {
  if (
    e.target.name &&
    (e.target.name.startsWith('membroInterno') ||
      e.target.name.startsWith('membroExterno'))
  ) {
    atualizarProgresso();
  }
});

// Listener para atualização de palavras-chave
const projetoSelect = document.getElementById('projeto_pesquisa');
if (projetoSelect) projetoSelect.addEventListener('change', atualizarKeywordsProjeto);

// Listeners para validação de data de envio
const envioFisicoCheckbox = document.getElementById('envio_fisico');
const dataEnvioInput = document.getElementById('data_envio');
const dataDefesaInput = document.getElementById('data');
if (envioFisicoCheckbox && dataEnvioInput && dataDefesaInput) {
  envioFisicoCheckbox.addEventListener('change', atualizarValidacaoDataEnvio);
  dataEnvioInput.addEventListener('change', atualizarValidacaoDataEnvio);
  dataDefesaInput.addEventListener('change', atualizarValidacaoDataEnvio);
}
}

// --- INICIALIZAÇÃO GERAL ---
/**
 * Inicializa o checklist e o progresso do formulário
 * Adiciona itens dinâmicos ao checklist se necessário
 */
function inicializarChecklistEProgresso() {
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
adicionarEventListeners();
setTimeout(() => {
  atualizarProgresso();
  atualizarKeywordsProjeto();
  atualizarValidacaoDataEnvio();
}, 100);
}

// --- VALIDAÇÃO DE DATA E HORA ---
// Configuração dos campos de data e hora para agendamento
const dataInput = document.getElementById('data');
const horaInput = document.getElementById('hora');

// Define a data mínima como hoje
const hoje = new Date();
const dataMinima = hoje.toISOString().split('T')[0];
if (dataInput) {
    dataInput.min = dataMinima;
}

// Validação de data
if (dataInput) {
    dataInput.addEventListener('change', function() {
        const dataSelecionada = new Date(this.value);
        const diaSemana = dataSelecionada.getDay();
        
        // Verifica se é fim de semana (0 = domingo, 6 = sábado)
        if (diaSemana === 0 || diaSemana === 6) {
            alert('Não é possível agendar para finais de semana. Por favor, selecione uma data entre segunda e sexta-feira.');
            this.value = '';
        }
    });
}

// Validação de hora
if (horaInput) {
    horaInput.addEventListener('change', function() {
        const hora = parseInt(this.value.split(':')[0]);
        
        // Verifica se está dentro do horário comercial (8h às 18h)
        if (hora < 8 || hora >= 18) {
            alert('O horário de agendamento é das 8h às 18h. Por favor, selecione um horário dentro deste período.');
            this.value = '';
        }
    });
}

// Validações específicas para mestrado/doutorado
const cursoSelect = document.getElementById('curso');
const membrosExternosContainer = document.getElementById('membros-externos-container');
const addMembroExternoBtn = document.getElementById('add-membro-externo');
const checklistMembrosExternos = document.querySelector('.checklist-item[data-field="membros-externos"]');

// Atualiza o formulário baseado no curso selecionado
if (cursoSelect) {
    cursoSelect.addEventListener('change', function() {
      const curso = this.value;
      if (!membrosExternosContainer) return;
      const membrosExternos = membrosExternosContainer.querySelectorAll('input[type="text"]');
      
      // Remove todos os campos de membros externos exceto o primeiro
      while (membrosExternos.length > 1) {
          membrosExternosContainer.removeChild(membrosExternos[membrosExternos.length - 1]);
      }
      
      // Atualiza o texto do checklist
      if (checklistMembrosExternos) {
          if (curso === 'mestrado') {
              checklistMembrosExternos.querySelector('span:last-child').textContent = '1 Membro Externo (Obrigatório)';
              if (addMembroExternoBtn) addMembroExternoBtn.style.display = 'none';
          } else if (curso === 'doutorado') {
              checklistMembrosExternos.querySelector('span:last-child').textContent = '2 Membros Externos (Obrigatórios)';
              if (addMembroExternoBtn) addMembroExternoBtn.style.display = 'block';
          }
      }
    });
}

// Adiciona novo campo de membro externo
if (addMembroExternoBtn) {
    addMembroExternoBtn.addEventListener('click', function() {
      if (!cursoSelect || !membrosExternosContainer) return;
      const curso = cursoSelect.value;
      const membrosExternos = membrosExternosContainer.querySelectorAll('input[type="text"]');
      
      if (curso === 'doutorado' && membrosExternos.length < 2) {
          const novoInput = document.createElement('input');
          novoInput.type = 'text';
          novoInput.name = `membroExterno${membrosExternos.length + 1}`;
          novoInput.placeholder = 'Nome do membro externo';
          novoInput.required = true;
          membrosExternosContainer.appendChild(novoInput);
      }
    });
}

// Validação do formulário
const form = document.getElementById('agendamento-form');
if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (!cursoSelect || !membrosExternosContainer) return;

      const curso = cursoSelect.value;
      const membrosExternos = membrosExternosContainer.querySelectorAll('input[type="text"]');
      let membrosExternosPreenchidos = 0;
      
      membrosExternos.forEach(input => {
          if (input.value.trim() !== '') {
              membrosExternosPreenchidos++;
          }
      });
      
      if (curso === 'mestrado' && membrosExternosPreenchidos < 1) {
          alert('Para mestrado, é necessário pelo menos 1 membro externo na banca.');
          return;
      }
      
      if (curso === 'doutorado' && membrosExternosPreenchidos < 2) {
          alert('Para doutorado, é necessário pelo menos 2 membros externos na banca.');
          return;
      }
      
      // Se passou nas validações, envia o formulário
      this.submit();
    });
}

// --- LISTA DE PROFESSORES INTERNOS ---
/**
 * Lista completa dos professores internos disponíveis para compor a banca
 * Cada professor tem: id, nome, email, CPF e gênero (usado para regras de diversidade)
 */
const PROFESSORES_INTERNOS = [
  // Professores de Direito Constitucional
          { id: 1, nome: 'Prof. Dr. Carlos Eduardo Silva Santos', email: 'carlos.santos@ppgd.edu.br', cpf: '123.456.789-01', genero: 'masculino' },
  { id: 2, nome: 'Profa. Dra. Ana Paula Oliveira Costa', email: 'ana.costa@ppgd.edu.br', cpf: '234.567.890-12', genero: 'feminino' },
  { id: 3, nome: 'Prof. Dr. Roberto Almeida Pereira', email: 'roberto.pereira@ppgd.edu.br', cpf: '345.678.901-23', genero: 'masculino' },
  
  // Professores de Direito Penal
  { id: 4, nome: 'Profa. Dra. Mariana Rodrigues Lima', email: 'mariana.lima@ppgd.edu.br', cpf: '456.789.012-34', genero: 'feminino' },
  { id: 5, nome: 'Prof. Dr. Fernando Costa Mendes', email: 'fernando.mendes@ppgd.edu.br', cpf: '567.890.123-45', genero: 'masculino' },
  { id: 6, nome: 'Prof. Dr. Leonardo Santos Barbosa', email: 'leonardo.barbosa@ppgd.edu.br', cpf: '678.901.234-56', genero: 'masculino' },
  
  // Professores de Direito Civil
  { id: 7, nome: 'Profa. Dra. Juliana Ferreira Martins', email: 'juliana.martins@ppgd.edu.br', cpf: '789.012.345-67', genero: 'feminino' },
  { id: 8, nome: 'Prof. Dr. Ricardo Alves Nascimento', email: 'ricardo.nascimento@ppgd.edu.br', cpf: '890.123.456-78', genero: 'masculino' },
  { id: 9, nome: 'Prof. Dr. Paulo Henrique Silva', email: 'paulo.silva@ppgd.edu.br', cpf: '901.234.567-89', genero: 'masculino' },
  
  // Professores de Direito Administrativo
  { id: 10, nome: 'Profa. Dra. Camila Santos Rocha', email: 'camila.rocha@ppgd.edu.br', cpf: '012.345.678-90', genero: 'feminino' },
  { id: 11, nome: 'Prof. Dr. André Luiz Costa', email: 'andre.costa@ppgd.edu.br', cpf: '111.222.333-44', genero: 'masculino' },
  { id: 12, nome: 'Prof. Dr. Marcelo Oliveira Pinto', email: 'marcelo.pinto@ppgd.edu.br', cpf: '222.333.444-55', genero: 'masculino' },
  
  // Professores de Direito Tributário
  { id: 13, nome: 'Profa. Dra. Fernanda Lima Costa', email: 'fernanda.costa@ppgd.edu.br', cpf: '333.444.555-66', genero: 'feminino' },
  { id: 14, nome: 'Prof. Dr. Thiago Santos Almeida', email: 'thiago.almeida@ppgd.edu.br', cpf: '444.555.666-77', genero: 'masculino' },
  { id: 15, nome: 'Prof. Dr. Rafael Costa Silva', email: 'rafael.silva@ppgd.edu.br', cpf: '555.666.777-88', genero: 'masculino' },
  
  // Professores de Direito do Trabalho
  { id: 16, nome: 'Profa. Dra. Beatriz Oliveira Santos', email: 'beatriz.santos@ppgd.edu.br', cpf: '666.777.888-99', genero: 'feminino' },
  { id: 17, nome: 'Prof. Dr. Gustavo Lima Costa', email: 'gustavo.costa@ppgd.edu.br', cpf: '777.888.999-00', genero: 'masculino' },
  { id: 18, nome: 'Prof. Dr. Diego Santos Oliveira', email: 'diego.oliveira@ppgd.edu.br', cpf: '888.999.000-11', genero: 'masculino' },
  
  // Professores de Direito Internacional
  { id: 19, nome: 'Profa. Dra. Larissa Costa Silva', email: 'larissa.silva@ppgd.edu.br', cpf: '999.000.111-22', genero: 'feminino' },
  { id: 20, nome: 'Prof. Dr. Bruno Santos Costa', email: 'bruno.costa@ppgd.edu.br', cpf: '000.111.222-33', genero: 'masculino' },
  { id: 21, nome: 'Prof. Dr. Alexandre Lima Santos', email: 'alexandre.santos@ppgd.edu.br', cpf: '111.222.333-44', genero: 'masculino' },
  
  // Professores de Direito Ambiental
  { id: 22, nome: 'Profa. Dra. Carolina Oliveira Costa', email: 'carolina.costa@ppgd.edu.br', cpf: '222.333.444-55', genero: 'feminino' },
  { id: 23, nome: 'Prof. Dr. Eduardo Santos Lima', email: 'eduardo.lima@ppgd.edu.br', cpf: '333.444.555-66', genero: 'masculino' }
];

// --- GERENCIAMENTO DE MEMBROS INTERNOS ---
/**
 * Inicializa a interface de seleção de membros internos
 * Cria cards interativos para cada professor e configura os event listeners
 */
function inicializarMembrosInternos() {
  const container = document.getElementById('membros-internos');
  if (!container) return;

  container.innerHTML = ''; // Limpa o container para reinicialização

  // Adiciona o contador de selecionados, que será atualizado pela lógica de validação
  const contador = document.createElement('div');
  contador.id = 'contador-membros-internos';
  contador.className = 'contador-selecionados'; // Estilo pode ser adicionado no CSS se necessário
  container.parentElement.insertBefore(contador, container.nextSibling);
  window.contadorMembrosInternos = contador; // Referência global para a função de atualização

  // Itera sobre a lista de professores para criar os cards interativos
  PROFESSORES_INTERNOS.forEach(professor => {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'membro-interno-item';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `membro-interno-${professor.id}`;
    checkbox.name = 'membroInterno';
    checkbox.value = professor.cpf; // Usa o CPF como valor, conforme original
    checkbox.dataset.genero = professor.genero; // Armazena o gênero para as regras da banca

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = professor.nome;

    // Adiciona evento de clique no card inteiro para marcar/desmarcar o checkbox
    itemDiv.addEventListener('click', (e) => {
      // Ignora o clique se o checkbox estiver desabilitado
      if (checkbox.disabled) {
        return;
      }

      // Se o clique for no label, o navegador já cuida de marcar o input.
      // Se for no próprio input, ele mesmo se marca.
      // Este código só roda se o clique for na área do div que não é o label nem o input,
      // para evitar o acionamento duplicado do evento 'change'.
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
        checkbox.checked = !checkbox.checked;
        // Dispara o evento 'change' para acionar a lógica de validação
        checkbox.dispatchEvent(new Event('change'));
      }
    });

    // Adiciona evento de mudança no checkbox para atualizar a interface e as validações
    checkbox.addEventListener('change', () => {
      itemDiv.classList.toggle('item-selected', checkbox.checked);
      atualizarSelecaoMembrosInternos(); // Chama a função de lógica/validação principal
    });
    
    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(label);
    container.appendChild(itemDiv);
  });

  // Adiciona os listeners aos controles que afetam a seleção de membros
  adicionarEventListenersControlesBanca();

  // Força uma atualização inicial para aplicar as regras com o formulário vazio
  atualizarSelecaoMembrosInternos();
}

/**
 * Adiciona event listeners aos controles que afetam a seleção de membros internos
 * (curso e tipo de banca)
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
 * REGRAS:
 * - Mestrado: 3 membros total (orientador + 2 membros)
 * - Doutorado: 5 membros total (orientador + 4 membros)
 * - O número de membros externos reduz o limite de internos
 * - Pelo menos 1 mulher deve estar na banca
 */
function atualizarSelecaoMembrosInternos() {
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
  // O limite é reduzido pelo número de membros externos já adicionados
  const externosAdicionados = document.querySelectorAll('#membros-externos-container .membro-externo-card').length;
  let maxMembrosInternos = totalMembrosBanca - externosAdicionados;

  // Se nenhum curso foi selecionado, o limite é estritamente 0.
  if (!curso) {
    maxMembrosInternos = 0;
  }

  const checkboxes = container.querySelectorAll('input[type="checkbox"][name="membroInterno"]');
  const selecionados = Array.from(checkboxes).filter(cb => cb.checked);

  // Atualiza o estado de cada checkbox (habilitado/desabilitado)
  checkboxes.forEach(checkbox => {
    const itemDiv = checkbox.closest('.membro-interno-item');
    // Desabilita se o limite foi alcançado E o checkbox atual não está marcado
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

  atualizarProgresso();
}

// --- GERENCIAMENTO DE MEMBROS EXTERNOS ---
/**
 * Inicializa o sistema de gerenciamento de membros externos
 * Configura a interface para adicionar/remover membros externos dinamicamente
 */
function inicializarMembrosExternos() {
  console.log('Inicializando gerenciamento de membros externos...');
  
  // Coleta todos os elementos necessários
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
          // Para defesa: obrigatório
          maxMembros = (curso === 'mestrado') ? 1 : (curso === 'doutorado' ? 2 : 0);
          elementos.infoText.textContent = maxMembros > 0 ? 
              `${curso.charAt(0).toUpperCase() + curso.slice(1)} (Defesa) requer ${maxMembros} membro(s) externo(s)` : 
              'Selecione o curso para ver os requisitos.';
      } else if (isQualificacao) {
          // Para qualificação: opcional, baseado na escolha do usuário
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
      
      // Validação adicional
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
      elementos.addButton.style.display = 'none'; // Esconde o botão por padrão
      
      // LÓGICA CORRIGIDA:
      // Mostra controle apenas para qualificação
      const shouldShowControl = isQualificacao;
      
      // Mostra área de externos quando:
      // 1. É defesa (obrigatório)
      // 2. É qualificação E usuário escolheu "Sim"
      const shouldShowExternosArea = isDefesa || (isQualificacao && desejaExternos);

      elementos.controleContainer.style.display = shouldShowControl ? 'block' : 'none';
      elementos.membrosExternosGroup.style.display = shouldShowExternosArea ? 'block' : 'none';

      if (shouldShowExternosArea) {
          // Atualiza limites antes de criar cards
          atualizarLimitesMembros();
          
          // Cria cards automaticamente APENAS para defesa
          if (isDefesa && maxMembros > 0) {
              for (let i = 0; i < maxMembros; i++) {
                  elementos.container.appendChild(criarCardMembroExterno());
              }
              elementos.infoText.textContent = `${curso.charAt(0).toUpperCase() + curso.slice(1)} (Defesa) requer ${maxMembros} membro(s) externo(s) - ${maxMembros} card(s) criado(s) automaticamente`;
          } else if (isQualificacao && desejaExternos) {
            if (maxMembros > 0) {
                elementos.addButton.style.display = 'inline-block'; // Mostra o botão
                elementos.infoText.textContent = `Qualificação permite até ${maxMembros} membro(s) externo(s). Clique em "Adicionar Membro Externo" para incluir.`;
            } else {
                elementos.infoText.textContent = 'Não há vagas disponíveis para membros externos.';
            }
          }
      } else {
          maxMembros = 0;
          atualizarContador();
          
          // Feedback quando a área está oculta
          if (isQualificacao && !desejaExternos) {
              console.log('Área de membros externos oculta: usuário escolheu "Não" para qualificação');
          }
      }
      
      atualizarProgresso();
      
    } catch (error) {
      console.error('Erro ao gerenciar visibilidade e interface:', error);
      // Fallback: esconde a área de externos em caso de erro
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
        atualizarProgresso();
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

      cpf.field.addEventListener('blur', (e) => {
        const cpfValue = e.target.value.replace(/\D/g, '');
        const field = e.target;
        if (cpfValue.length > 0) {
            field.setCustomValidity(validarCPF(cpfValue) ? '' : 'CPF inválido');
        } else {
            field.setCustomValidity(''); // Campo vazio é válido até o submit
        }
        field.classList.toggle('invalid', !field.checkValidity());
      });

      email.field.addEventListener('input', atualizarSelecaoMembrosInternos);

      removeBtn.addEventListener('click', () => {
        card.remove();
        atualizarContador();
        atualizarSelecaoMembrosInternos();
        atualizarProgresso();
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
          
          // Validação do maxMembros
          if (typeof maxMembros !== 'number' || maxMembros < 0) {
              console.warn('maxMembros inválido em atualizarContador:', maxMembros);
              maxMembros = 0;
          }
          
          elementos.contador.textContent = `${membrosCount}/${maxMembros} membro(s) externo(s)`;
          elementos.addButton.disabled = membrosCount >= maxMembros;
          
          // Feedback visual adicional
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

  function validarFormulario(event) {
      event.preventDefault();

      const form = event.target;
      if(!form) return;

      const curso = form.querySelector('#curso') ? form.querySelector('#curso').value : null;
      const tipo = form.querySelector('#tipo') ? form.querySelector('#tipo').value : null;
      const membrosInternos = Array.from(form.querySelectorAll('#membros-internos input[type="checkbox"]:checked'));
      const membrosExternosCards = form.querySelectorAll('#membros-externos-container .membro-externo-card');
      const confirmacaoEnvio = form.querySelector('#confirmacao_envio');
      const erroConfirmacao = document.getElementById('erro-confirmacao');
      const checkboxWrapper = confirmacaoEnvio ? confirmacaoEnvio.closest('.checkbox-wrapper') : null;
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
      if (!temMulherNaBanca()) {
        showAlert('alert-membros-internos', 'É necessário selecionar pelo menos uma mulher na banca.', 'error');
        formularioValido = false;
      }

      // Validação da confirmação de envio
      if (confirmacaoEnvio && confirmacaoEnvio.required && !confirmacaoEnvio.checked) {
        showAlert('erro-confirmacao', 'É necessário confirmar o envio do trabalho físico.', 'error');
        confirmacaoEnvio.scrollIntoView({ behavior: 'smooth', block: 'center' });
        formularioValido = false;
      }

      // Se todas as validações passarem, envia o formulário
      if (formularioValido) {
        form.submit();
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
  
  // Chama a função no início
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

  // Evento para mudança de membros internos (CRÍTICO PARA A NOVA LÓGICA)
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

  // Adiciona evento para validação do formulário
  elementos.form.addEventListener('submit', validarFormulario);

  gerenciarVisibilidadeEInterface();
}

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
  
  atualizarProgresso();
}

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
  atualizarProgresso();
}

// Palavras-chave por projeto de pesquisa
const PALAVRAS_CHAVE = {
  direito_constitucional: [
      'constituição', 'constitucional', 'direitos fundamentais', 'controle de constitucionalidade',
      'jurisdição constitucional', 'interpretação constitucional', 'garantias constitucionais',
      'princípios constitucionais', 'reforma constitucional', 'emenda constitucional'
  ],
  direito_penal: [
      'penal', 'crime', 'pena', 'processo penal', 'direito penal', 'tipicidade', 'culpabilidade',
      'antijuridicidade', 'imputabilidade', 'exclusão de ilicitude', 'causas de exclusão',
      'penalização', 'despenalização', 'princípios penais'
  ],
  direito_civil: [
      'civil', 'contrato', 'obrigação', 'responsabilidade civil', 'direito civil', 'direito de família',
      'direito das sucessões', 'direito das coisas', 'direito das obrigações', 'direito contratual',
      'direito de propriedade', 'direito real', 'direito pessoal'
  ]
};

// Função para inicializar o verificador de resumo
function inicializarVerificadorResumo() {
  console.log('Inicializando verificador de resumo...');
  
  const resumoInput = document.getElementById('resumo');
  const contadorPalavras = document.getElementById('contador-palavras');
  const contadorKeywords = document.getElementById('contador-keywords');
  const keywordsFound = document.getElementById('keywords-found');
  const resumoAlert = document.getElementById('resumo-alert');
  const progressIndicator = document.getElementById('progress-indicator');
  const projetoSelect = document.getElementById('projeto_pesquisa');

  console.log('Elementos encontrados:', {
      resumoInput: !!resumoInput,
      contadorPalavras: !!contadorPalavras,
      contadorKeywords: !!contadorKeywords,
      keywordsFound: !!keywordsFound,
      resumoAlert: !!resumoAlert,
      progressIndicator: !!progressIndicator,
      projetoSelect: !!projetoSelect
  });

  if (!resumoInput || !contadorPalavras || !contadorKeywords || !keywordsFound || !resumoAlert || !progressIndicator || !projetoSelect) {
      console.error('Alguns elementos necessários não foram encontrados');
      return;
  }

  // Função para contar palavras
  function contarPalavras(texto) {
      const palavras = texto.trim().split(/\s+/).filter(palavra => palavra.length > 0);
      console.log('Contagem de palavras:', palavras.length);
      return palavras.length;
  }

  // Função para verificar palavras-chave
  function verificarPalavrasChave(texto, projeto) {
      console.log('Verificando palavras-chave para projeto:', projeto);
      if (!projeto || !PALAVRAS_CHAVE[projeto]) {
          console.log('Projeto inválido ou sem palavras-chave definidas');
          return [];
      }
      
      const palavrasChave = PALAVRAS_CHAVE[projeto];
      const textoLower = texto.toLowerCase();
      const encontradas = palavrasChave.filter(palavra => 
          textoLower.includes(palavra.toLowerCase())
      );
      
      console.log('Palavras-chave encontradas:', encontradas);
      return encontradas;
  }

  // Função para atualizar o contador e verificação
  function atualizarVerificacao() {
      console.log('Atualizando verificação...');
      const texto = resumoInput.value;
      const numPalavras = contarPalavras(texto);
      const projeto = projetoSelect.value;
      const palavrasChaveEncontradas = verificarPalavrasChave(texto, projeto);
      
      // Atualiza contador de palavras
      contadorPalavras.textContent = `${numPalavras} palavras`;
      console.log('Contador de palavras atualizado:', numPalavras);
      
      // Atualiza contador de palavras-chave
      contadorKeywords.textContent = `${palavrasChaveEncontradas.length}/2 termos encontrados`;
      console.log('Contador de keywords atualizado:', palavrasChaveEncontradas.length);
      
      // Atualiza lista de palavras-chave encontradas
      if (palavrasChaveEncontradas.length > 0) {
          keywordsFound.innerHTML = palavrasChaveEncontradas
              .map(palavra => `<span class="keyword-tag">${palavra}</span>`)
              .join('');
          keywordsFound.classList.remove('hidden');
          console.log('Palavras-chave exibidas:', palavrasChaveEncontradas);
      } else {
          keywordsFound.classList.add('hidden');
      }

      // Verifica requisitos mínimos
      const temPalavrasSuficientes = numPalavras >= 100;
      const temKeywordsSuficientes = palavrasChaveEncontradas.length >= 2;
      
      console.log('Requisitos:', {
          palavrasSuficientes: temPalavrasSuficientes,
          keywordsSuficientes: temKeywordsSuficientes
      });

      // Atualiza indicador de progresso
      if (temPalavrasSuficientes && temKeywordsSuficientes) {
          progressIndicator.classList.remove('hidden');
          progressIndicator.style.width = '100%';
          resumoAlert.classList.add('hidden');
      } else {
          progressIndicator.classList.remove('hidden');
          const progresso = ((numPalavras / 100) + (palavrasChaveEncontradas.length / 2)) * 50;
          progressIndicator.style.width = `${Math.min(progresso, 100)}%`;
          
          // Mostra alerta se necessário
          if (!temPalavrasSuficientes || !temKeywordsSuficientes) {
              const message = !temPalavrasSuficientes ? 
                  'O resumo deve ter pelo menos 100 palavras.' : 
                  'É necessário incluir pelo menos 2 termos-chave do projeto.';
              showAlert('resumo-alert', message, 'warning');
          } else {
              resumoAlert.classList.add('hidden');
          }
      }
  }

  // Adiciona event listeners
  resumoInput.addEventListener('input', atualizarVerificacao);
  projetoSelect.addEventListener('change', atualizarVerificacao);

  // Executa a verificação inicial
  atualizarVerificacao();
}

// --- Gerenciamento de Upload (versão corrigida e aprimorada) ---
function inicializarUpload() {
  const fileInput = document.getElementById('trabalho_final');
  const uploadArea = document.getElementById('upload-area');
  const uploadContent = uploadArea?.querySelector('.upload-content');
  const fileInfo = document.getElementById('file-info');
  const fileNameEl = document.getElementById('file-name');
  const fileSizeEl = document.getElementById('file-size');
  const removeFileBtn = document.getElementById('remove-file');

  if (!fileInput || !uploadArea || !uploadContent || !fileInfo || !removeFileBtn) {
    console.warn('Elementos de upload não encontrados. A funcionalidade estará desabilitada.');
    return;
  }

  // Listener para seleção de arquivo
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      displayFileInfo(fileInput.files[0]);
    }
  });

  // Listener para o botão de remover
  removeFileBtn.addEventListener('click', () => {
    clearFile();
  });

  // Listeners para Drag and Drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragging');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragging'));
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragging');
    if (e.dataTransfer.files.length > 0 && e.dataTransfer.files[0].type === "application/pdf") {
      fileInput.files = e.dataTransfer.files;
      displayFileInfo(fileInput.files[0]);
    } else {
      alert("Por favor, envie apenas arquivos PDF.");
    }
  });

  function displayFileInfo(file) {
    uploadContent.style.display = 'none';
    fileInfo.style.display = 'flex';
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);
    atualizarProgresso();
  }

  function clearFile() {
    fileInput.value = ''; // Limpa o input
    uploadContent.style.display = 'block';
    fileInfo.style.display = 'none';
    if (fileNameEl) fileNameEl.textContent = '';
    if (fileSizeEl) fileSizeEl.textContent = '';
    atualizarProgresso();
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Adiciona a chamada da função de verificação de resumo de volta ao DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
  inicializarChecklistEProgresso();
  inicializarMembrosInternos();
  inicializarVerificadorResumo();
  inicializarMembrosExternos();
  inicializarUpload();

  // Adiciona listener para o tipo de banca e chama a função inicial
  const tipoBancaSelect = document.getElementById('tipo');
  if (tipoBancaSelect) {
    tipoBancaSelect.addEventListener('change', atualizarVisibilidadeEnvioFisico);
    tipoBancaSelect.addEventListener('change', atualizarChecklistMembrosExternos);
  }
  atualizarVisibilidadeEnvioFisico();
  atualizarChecklistMembrosExternos();
});
// Função utilitária para validar presença de mulher na banca
function temMulherNaBanca() {
  // Verifica membros internos
  const temMulherInterna = Array.from(document.querySelectorAll('#membros-internos input[type="checkbox"]:checked'))
    .some(cb => cb.dataset.genero === 'feminino');

  if (temMulherInterna) return true;

  // Verifica membros externos
  const temMulherExterna = Array.from(document.querySelectorAll('select.membro-externo-genero'))
    .some(select => select.value === 'feminino');

  return temMulherExterna;
}

