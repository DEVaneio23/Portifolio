/**
 * ===========================================================================
 * SISTEMA DE LOGIN DO PROFESSOR - PPGD
 * ===========================================================================
 *
 * Este arquivo gerencia o login dos professores no sistema de agendamento.
 * Inclui validação de campos, autenticação e redirecionamento para o dashboard.
 *
 * NOTAS IMPORTANTES (Juniro):
 * - Sempre validar campos antes de enviar dados
 * - Usar localStorage para persistir sessão do usuário
 * - Implementar logout para limpar dados da sessão
 * - Adicionar credenciais de teste para demonstração
 *
 * ===========================================================================
 */

// Credenciais de teste para demonstração
const CREDENCIAIS_TESTE = {
  'professor.teste@ppgd.edu.br': {
    senha: '123456',
    nome: 'Prof. Dr. Carlos Eduardo Silva Santos',
    area: 'Direito Constitucional',
    id: 1
  },
  'ana.costa@ppgd.edu.br': {
    senha: '123456',
    nome: 'Profa. Dra. Ana Paula Oliveira Costa',
    area: 'Direito Penal',
    id: 2
  },
  'teste@ppgd.edu.br': {
    senha: '123456',
    nome: 'Prof. Dr. João Silva',
    area: 'Direito Civil',
    id: 3
  }
};

// Elementos do DOM
const formLogin = document.getElementById('form-login');
const emailInput = document.getElementById('email');
const senhaInput = document.getElementById('senha');
const btnEntrar = document.getElementById('btn-entrar');
const mensagemErro = document.getElementById('mensagem-erro');
const loadingSpinner = document.getElementById('loading-spinner');

// Validação de email institucional
function validarEmailInstitucional(email) {
  const dominio = email.split('@')[1];
      return dominio === 'ppgd.edu.br';
}

// Função de login
async function fazerLogin(email, senha) {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verificar credenciais de teste
  if (CREDENCIAIS_TESTE[email] && CREDENCIAIS_TESTE[email].senha === senha) {
    const usuario = CREDENCIAIS_TESTE[email];
    
    // Criar token fictício
    const token = btoa(JSON.stringify({
      id: usuario.id,
      email: email,
      nome: usuario.nome,
      area: usuario.area,
      role: 'professor',
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    }));
    
    // Salvar no localStorage
    localStorage.setItem('ppgd_auth_token', token);
    localStorage.setItem('ppgd_user_info', JSON.stringify(usuario));
    
    return { success: true, usuario };
  }
  
  return { success: false, error: 'Credenciais inválidas' };
}

// Manipulador de envio do formulário
async function handleSubmit(event) {
  event.preventDefault();
  
  // Limpar mensagens anteriores
  mensagemErro.textContent = '';
  mensagemErro.style.display = 'none';
  
  // Obter valores dos campos
  const email = emailInput.value.trim();
  const senha = senhaInput.value;
  
  // Validações básicas
  if (!email || !senha) {
    mostrarErro('Por favor, preencha todos os campos.');
    return;
  }
  
  if (!validarEmailInstitucional(email)) {
          mostrarErro('Por favor, use um e-mail institucional válido (@ppgd.edu.br)');
    return;
  }
  
  // Mostrar loading
  btnEntrar.disabled = true;
  loadingSpinner.style.display = 'inline-block';
  btnEntrar.textContent = 'Entrando...';
  
  try {
    // Tentar fazer login
    const resultado = await fazerLogin(email, senha);
    
    if (resultado.success) {
      // Login bem-sucedido
      mostrarSucesso(`Bem-vindo(a), ${resultado.usuario.nome}!`);
      
      // Redirecionar para o dashboard após 1 segundo
      setTimeout(() => {
        window.location.href = 'dashboard-professor.html';
      }, 1000);
      
    } else {
      // Login falhou
      mostrarErro(resultado.error || 'Erro ao fazer login. Tente novamente.');
    }
    
  } catch (error) {
    console.error('Erro no login:', error);
    mostrarErro('Erro interno do sistema. Tente novamente.');
  } finally {
    // Restaurar botão
    btnEntrar.disabled = false;
    loadingSpinner.style.display = 'none';
    btnEntrar.textContent = 'Entrar';
  }
}

// Função para mostrar erro
function mostrarErro(mensagem) {
  mensagemErro.textContent = mensagem;
  mensagemErro.style.display = 'block';
  mensagemErro.className = 'mensagem erro';
}

// Função para mostrar sucesso
function mostrarSucesso(mensagem) {
  mensagemErro.textContent = mensagem;
  mensagemErro.style.display = 'block';
  mensagemErro.className = 'mensagem sucesso';
}

// Validação em tempo real do email
emailInput.addEventListener('blur', function() {
  const email = this.value.trim();
  
  if (email && !validarEmailInstitucional(email)) {
    this.classList.add('erro');
          mostrarErro('Use um e-mail institucional válido (@ppgd.edu.br)');
  } else {
    this.classList.remove('erro');
    mensagemErro.style.display = 'none';
  }
});

// Limpar erro quando usuário começar a digitar
emailInput.addEventListener('input', function() {
  this.classList.remove('erro');
  mensagemErro.style.display = 'none';
});

senhaInput.addEventListener('input', function() {
  mensagemErro.style.display = 'none';
});

// Event listener para o formulário
formLogin.addEventListener('submit', handleSubmit);

// Adicionar credenciais de teste na interface
function mostrarCredenciaisTeste() {
  const container = document.createElement('div');
  container.className = 'credenciais-teste';
  container.innerHTML = `
    <h3>🔑 Credenciais de Teste</h3>
            <p><strong>E-mail:</strong> teste@ppgd.edu.br</p>
    <p><strong>Senha:</strong> 123456</p>
    <p><em>Clique em "Entrar" para acessar o dashboard</em></p>
  `;
  
  // Inserir antes do formulário
  formLogin.parentNode.insertBefore(container, formLogin);
  
  // Preencher automaticamente os campos
        emailInput.value = 'teste@ppgd.edu.br';
  senhaInput.value = '123456';
}

// Mostrar credenciais de teste quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  mostrarCredenciaisTeste();
  
  // Verificar se já está logado
      const token = localStorage.getItem('ppgd_auth_token');
  if (token) {
    try {
      const userInfo = JSON.parse(atob(token));
      if (userInfo.exp > Date.now()) {
        // Token válido, redirecionar para dashboard
        window.location.href = 'dashboard-professor.html';
      } else {
        // Token expirado, limpar
              localStorage.removeItem('ppgd_auth_token');
      localStorage.removeItem('ppgd_user_info');
      }
    } catch (error) {
      // Token inválido, limpar
      localStorage.removeItem('ppgd_auth_token');
      localStorage.removeItem('ppgd_user_info');
    }
  }
});
