/**
 * ===========================================================================
 * DASHBOARD DO PROFESSOR - PPGD
 * ===========================================================================
 *
 * Este arquivo gerencia o dashboard dos professores, mostrando:
 * - Visão geral das bancas participadas
 * - Filtros e busca avançada
 * - Dados fictícios para demonstração
 *
 * NOTAS IMPORTANTES (Juniro):
 * - Sempre verificar autenticação antes de mostrar dados
 * - Implementar logout para limpar sessão
 * - Usar dados fictícios para demonstração em portfólio
 * - Adicionar filtros úteis para navegação
 *
 * ===========================================================================
 */

// Dados fictícios de bancas para demonstração
const BANCAS_FICTICIAS = [
  {
    id: 1,
    protocolo: 'BAN-2025-001',
    aluno: 'Maria Silva Santos',
    curso: 'Mestrado',
    tipo: 'Qualificação',
    modalidade: 'Presencial',
    data: '2025-02-15',
    hora: '14:00',
    titulo: 'A Proteção dos Direitos Fundamentais na Era Digital',
    status: 'confirmada',
    papel: 'Presidente',
    local: 'Sala 101 - Bloco A'
  },
  {
    id: 2,
    protocolo: 'BAN-2025-002',
    aluno: 'João Pedro Oliveira',
    curso: 'Doutorado',
    tipo: 'Defesa',
    modalidade: 'Online',
    data: '2025-02-20',
    hora: '10:00',
    titulo: 'Análise Crítica da Jurisprudência do STF sobre Direitos Sociais',
    status: 'confirmada',
    papel: 'Membro',
    local: 'Plataforma Zoom'
  },
  {
    id: 3,
    protocolo: 'BAN-2025-003',
    aluno: 'Ana Carolina Costa',
    curso: 'Mestrado',
    tipo: 'Qualificação',
    modalidade: 'Presencial',
    data: '2025-02-25',
    hora: '16:00',
    titulo: 'O Direito à Moradia e a Função Social da Propriedade',
    status: 'confirmada',
    papel: 'Membro',
    local: 'Sala 203 - Bloco B'
  },
  {
    id: 4,
    protocolo: 'BAN-2025-004',
    aluno: 'Carlos Eduardo Ferreira',
    curso: 'Doutorado',
    tipo: 'Defesa',
    modalidade: 'Híbrida',
    data: '2025-03-05',
    hora: '09:00',
    titulo: 'A Efetividade dos Direitos Humanos no Sistema Internacional',
    status: 'confirmada',
    papel: 'Presidente',
    local: 'Auditório Principal + Zoom'
  },
  {
    id: 5,
    protocolo: 'BAN-2025-005',
    aluno: 'Fernanda Lima Rodrigues',
    curso: 'Mestrado',
    tipo: 'Qualificação',
    modalidade: 'Presencial',
    data: '2025-03-10',
    hora: '15:00',
    titulo: 'Direito Ambiental e Desenvolvimento Sustentável',
    status: 'confirmada',
    papel: 'Membro',
    local: 'Sala 105 - Bloco A'
  }
];

// Elementos do DOM
const welcomeMessage = document.getElementById('welcome-message');
const userInfo = document.getElementById('user-info');
const bancasContainer = document.getElementById('bancas-container');
const filtroStatus = document.getElementById('filtro-status');
const filtroTipo = document.getElementById('filtro-tipo');
const filtroData = document.getElementById('filtro-data');
const buscaInput = document.getElementById('busca-input');
const btnLogout = document.getElementById('btn-logout');
const estatisticasContainer = document.getElementById('estatisticas-container');

// Verificar autenticação
function verificarAutenticacao() {
      const token = localStorage.getItem('ppgd_auth_token');
    const userInfo = localStorage.getItem('ppgd_user_info');
  
  if (!token || !userInfo) {
    // Não autenticado, redirecionar para login
    window.location.href = 'login-professor.html';
    return null;
  }
  
  try {
    const tokenData = JSON.parse(atob(token));
    const user = JSON.parse(userInfo);
    
    // Verificar se token não expirou
    if (tokenData.exp < Date.now()) {
      localStorage.removeItem('ppgd_auth_token');
      localStorage.removeItem('ppgd_user_info');
      window.location.href = 'login-professor.html';
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    localStorage.removeItem('ppgd_auth_token');
    localStorage.removeItem('ppgd_user_info');
    window.location.href = 'login-professor.html';
    return null;
  }
}

// Mostrar informações do usuário
function mostrarUsuario(user) {
  if (welcomeMessage) {
    welcomeMessage.textContent = `Bem-vindo(a), ${user.nome}!`;
  }
  
  if (userInfo) {
    userInfo.innerHTML = `
      <div class="user-card">
        <div class="user-avatar">
          <i class="fas fa-user-graduate"></i>
        </div>
        <div class="user-details">
          <h3>${user.nome}</h3>
          <p><strong>Área:</strong> ${user.area}</p>
          <p><strong>E-mail:</strong> ${user.email || 'teste@ppgd.edu.br'}</p>
        </div>
      </div>
    `;
  }
}

// Mostrar estatísticas
function mostrarEstatisticas() {
  if (!estatisticasContainer) return;
  
  const totalBancas = BANCAS_FICTICIAS.length;
  const bancasPresenciais = BANCAS_FICTICIAS.filter(b => b.modalidade === 'Presencial').length;
  const bancasOnline = BANCAS_FICTICIAS.filter(b => b.modalidade === 'Online').length;
  const bancasHibridas = BANCAS_FICTICIAS.filter(b => b.modalidade === 'Híbrida').length;
  
  estatisticasContainer.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-calendar-check"></i>
        </div>
        <div class="stat-content">
          <h3>${totalBancas}</h3>
          <p>Total de Bancas</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <h3>${bancasPresenciais}</h3>
          <p>Presenciais</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-video"></i>
        </div>
        <div class="stat-content">
          <h3>${bancasOnline}</h3>
          <p>Online</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fas fa-laptop-house"></i>
        </div>
        <div class="stat-content">
          <h3>${bancasHibridas}</h3>
          <p>Híbridas</p>
        </div>
      </div>
    </div>
  `;
}

// Formatar data para exibição
function formatarData(dataString) {
  const data = new Date(dataString);
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return data.toLocaleDateString('pt-BR', options);
}

// Formatar hora
function formatarHora(hora) {
  return hora;
}

// Criar card de banca
function criarCardBanca(banca) {
  const statusClass = banca.status === 'confirmada' ? 'status-confirmada' : 'status-pendente';
  const modalidadeIcon = banca.modalidade === 'Presencial' ? 'fas fa-users' : 
                        banca.modalidade === 'Online' ? 'fas fa-video' : 'fas fa-laptop-house';
  
  return `
    <div class="banca-card" data-id="${banca.id}">
      <div class="banca-header">
        <div class="protocolo">${banca.protocolo}</div>
        <div class="status ${statusClass}">
          <i class="fas fa-check-circle"></i>
          ${banca.status.charAt(0).toUpperCase() + banca.status.slice(1)}
        </div>
      </div>
      
      <div class="banca-content">
        <h3 class="titulo">${banca.titulo}</h3>
        
        <div class="banca-info">
          <div class="info-item">
            <i class="fas fa-user-graduate"></i>
            <span><strong>Aluno:</strong> ${banca.aluno}</span>
          </div>
          
          <div class="info-item">
            <i class="fas fa-graduation-cap"></i>
            <span><strong>Curso:</strong> ${banca.curso}</span>
          </div>
          
          <div class="info-item">
            <i class="fas fa-file-alt"></i>
            <span><strong>Tipo:</strong> ${banca.tipo}</span>
          </div>
          
          <div class="info-item">
            <i class="fas fa-user-tie"></i>
            <span><strong>Seu Papel:</strong> ${banca.papel}</span>
          </div>
        </div>
        
        <div class="banca-details">
          <div class="detail-item">
            <i class="fas fa-calendar"></i>
            <span>${formatarData(banca.data)}</span>
          </div>
          
          <div class="detail-item">
            <i class="fas fa-clock"></i>
            <span>${formatarHora(banca.hora)}</span>
          </div>
          
          <div class="detail-item">
            <i class="${modalidadeIcon}"></i>
            <span>${banca.modalidade}</span>
          </div>
          
          <div class="detail-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>${banca.local}</span>
          </div>
        </div>
      </div>
      
      <div class="banca-actions">
        <button class="btn-detalhes" onclick="verDetalhesBanca(${banca.id})">
          <i class="fas fa-eye"></i> Ver Detalhes
        </button>
        <button class="btn-calendario" onclick="adicionarCalendario(${banca.id})">
          <i class="fas fa-calendar-plus"></i> Calendário
        </button>
      </div>
    </div>
  `;
}

// Filtrar bancas
function filtrarBancas() {
  const status = filtroStatus ? filtroStatus.value : '';
  const tipo = filtroTipo ? filtroTipo.value : '';
  const data = filtroData ? filtroData.value : '';
  const busca = buscaInput ? buscaInput.value.toLowerCase() : '';
  
  let bancasFiltradas = BANCAS_FICTICIAS;
  
  // Filtro por status
  if (status && status !== 'todos') {
    bancasFiltradas = bancasFiltradas.filter(b => b.status === status);
  }
  
  // Filtro por tipo
  if (tipo && tipo !== 'todos') {
    bancasFiltradas = bancasFiltradas.filter(b => b.tipo === tipo);
  }
  
  // Filtro por data
  if (data) {
    bancasFiltradas = bancasFiltradas.filter(b => b.data === data);
  }
  
  // Filtro por busca
  if (busca) {
    bancasFiltradas = bancasFiltradas.filter(b => 
      b.aluno.toLowerCase().includes(busca) ||
      b.titulo.toLowerCase().includes(busca) ||
      b.protocolo.toLowerCase().includes(busca)
    );
  }
  
  mostrarBancas(bancasFiltradas);
}

// Mostrar bancas filtradas
function mostrarBancas(bancas) {
  if (!bancasContainer) return;
  
  if (bancas.length === 0) {
    bancasContainer.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>Nenhuma banca encontrada</h3>
        <p>Tente ajustar os filtros ou termos de busca</p>
      </div>
    `;
    return;
  }
  
  bancasContainer.innerHTML = bancas.map(criarCardBanca).join('');
}

// Ver detalhes da banca
function verDetalhesBanca(id) {
  const banca = BANCAS_FICTICIAS.find(b => b.id === id);
  if (!banca) return;
  
  alert(`
    DETALHES DA BANCA - ${banca.protocolo}
    
    Título: ${banca.titulo}
    Aluno: ${banca.aluno}
    Curso: ${banca.curso}
    Tipo: ${banca.tipo}
    Data: ${formatarData(banca.data)}
    Hora: ${formatarHora(banca.hora)}
    Modalidade: ${banca.modalidade}
    Local: ${banca.local}
    Seu Papel: ${banca.papel}
    Status: ${banca.status}
    
    Esta é uma demonstração para portfólio.
  `);
}

// Adicionar ao calendário
function adicionarCalendario(id) {
  const banca = BANCAS_FICTICIAS.find(b => b.id === id);
  if (!banca) return;
  
  alert(`
    📅 ADICIONADO AO CALENDÁRIO
    
    Banca: ${banca.protocolo}
    Data: ${formatarData(banca.data)}
    Hora: ${formatarHora(banca.hora)}
    
    Lembrete configurado para 1 hora antes.
    (Funcionalidade de demonstração)
  `);
}

// Fazer logout
function fazerLogout() {
  if (confirm('Tem certeza que deseja sair do sistema?')) {
    localStorage.removeItem('ppgd_auth_token');
    localStorage.removeItem('ppgd_user_info');
    window.location.href = 'login-professor.html';
  }
}

// Configurar event listeners
function configurarEventListeners() {
  // Filtros
  if (filtroStatus) {
    filtroStatus.addEventListener('change', filtrarBancas);
  }
  
  if (filtroTipo) {
    filtroTipo.addEventListener('change', filtrarBancas);
  }
  
  if (filtroData) {
    filtroData.addEventListener('change', filtrarBancas);
  }
  
  // Busca
  if (buscaInput) {
    buscaInput.addEventListener('input', filtrarBancas);
  }
  
  // Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', fazerLogout);
  }
}

// Inicializar dashboard
function inicializarDashboard() {
  const user = verificarAutenticacao();
  if (!user) return;
  
  // Mostrar informações do usuário
  mostrarUsuario(user);
  
  // Mostrar estatísticas
  mostrarEstatisticas();
  
  // Mostrar todas as bancas inicialmente
  mostrarBancas(BANCAS_FICTICIAS);
  
  // Configurar event listeners
  configurarEventListeners();
  
  console.log('Dashboard inicializado com sucesso');
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', inicializarDashboard);
