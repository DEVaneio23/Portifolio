/**
 * SISTEMA DE SUPORTE - PPGD
 * 
 * Este arquivo gerencia a funcionalidade de suporte e contato,
 * incluindo envio de mensagens e validação de formulários.
 * 
 * Funcionalidades:
 * - Formulário de contato
 * - Validação de campos
 * - Envio de mensagens
 * - Interface responsiva
 * 
 * @author Dev Team
 * @version 1.0.0
 * @since 2025
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('Sistema de Suporte - Inicializando...');
  
  // Inicializa o sistema de FAQ
  inicializarFAQ();
  
  // Inicializa o formulário de suporte
  inicializarFormularioSuporte();
  
  // Inicializa máscaras de input
  inicializarMascaras();
  
  // Inicializa validações em tempo real
  inicializarValidacoes();
});

/**
 * Inicializa o sistema de FAQ
 */
function inicializarFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    
    if (question && answer) {
      question.addEventListener('click', function() {
        const isActive = item.classList.contains('active');
        
        // Fecha todos os outros itens
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('active');
          }
        });
        
        // Alterna o item atual
        if (isActive) {
          item.classList.remove('active');
        } else {
          item.classList.add('active');
        }
      });
    }
  });
  
  console.log('FAQ inicializado com', faqItems.length, 'itens');
}

/**
 * Inicializa o formulário de suporte
 */
function inicializarFormularioSuporte() {
  const form = document.querySelector('.form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (validarFormularioSuporte()) {
      enviarMensagemSuporte();
    }
  });
}

/**
 * Valida o formulário de suporte
 * @returns {boolean} - True se o formulário for válido
 */
function validarFormularioSuporte() {
  const nome = document.getElementById('nome')?.value.trim();
  const telefone = document.getElementById('telefone')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const mensagem = document.getElementById('mensagem')?.value.trim();
  
  let valido = true;
  
  // Validação do nome
  if (!nome || nome.length < 3) {
    mostrarErro('nome', 'Nome deve ter pelo menos 3 caracteres');
    valido = false;
  } else {
    removerErro('nome');
  }
  
  // Validação do telefone
  if (!telefone || telefone.length < 14) {
    mostrarErro('telefone', 'Telefone deve estar completo');
    valido = false;
  } else {
    removerErro('telefone');
  }
  
  // Validação do email
  if (!email || !validarEmail(email)) {
    mostrarErro('email', 'E-mail inválido');
    valido = false;
  } else {
    removerErro('email');
  }
  
  // Validação da mensagem
  if (!mensagem || mensagem.length < 10) {
    mostrarErro('mensagem', 'Mensagem deve ter pelo menos 10 caracteres');
    valido = false;
  } else {
    removerErro('mensagem');
  }
  
  return valido;
}

/**
 * Valida um endereço de email
 * @param {string} email - Email a ser validado
 * @returns {boolean} - True se o email for válido
 */
function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Mostra erro de validação
 * @param {string} campoId - ID do campo com erro
 * @param {string} mensagem - Mensagem de erro
 */
function mostrarErro(campoId, mensagem) {
  const campo = document.getElementById(campoId);
  if (!campo) return;
  
  // Remove erro anterior
  removerErro(campoId);
  
  // Adiciona classe de erro
  campo.classList.add('erro-validacao');
  
  // Cria elemento de erro
  const erroElement = document.createElement('div');
  erroElement.className = 'erro-mensagem';
  erroElement.textContent = mensagem;
  erroElement.style.color = '#dc3545';
  erroElement.style.fontSize = '0.875rem';
  erroElement.style.marginTop = '0.25rem';
  
  // Insere após o campo
  campo.parentNode.insertBefore(erroElement, campo.nextSibling);
}

/**
 * Remove erro de validação
 * @param {string} campoId - ID do campo
 */
function removerErro(campoId) {
  const campo = document.getElementById(campoId);
  if (!campo) return;
  
  // Remove classe de erro
  campo.classList.remove('erro-validacao');
  
  // Remove elemento de erro
  const erroElement = campo.parentNode.querySelector('.erro-mensagem');
  if (erroElement) {
    erroElement.remove();
  }
}

/**
 * Inicializa máscaras de input
 */
function inicializarMascaras() {
  // Máscara de telefone
  const telefoneInput = document.getElementById('telefone');
  if (telefoneInput) {
    telefoneInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      value = value.substring(0, 11);
      
      if (value.length > 10) {
        value = value.replace(/(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
      } else if (value.length > 6) {
        value = value.replace(/(\d{2})(\d{4})(\d{1,4})/, '($1) $2-$3');
      } else if (value.length > 2) {
        value = value.replace(/(\d{2})(\d{1,4})/, '($1) $2');
      }
      
      e.target.value = value;
    });
  }
}

/**
 * Inicializa validações em tempo real
 */
function inicializarValidacoes() {
  const campos = ['nome', 'telefone', 'email', 'mensagem'];
  
  campos.forEach(campoId => {
    const campo = document.getElementById(campoId);
    if (!campo) return;
    
    campo.addEventListener('blur', function() {
      validarCampo(campoId);
    });
    
    campo.addEventListener('input', function() {
      // Remove erro quando o usuário começa a digitar
      if (this.value.trim()) {
        removerErro(campoId);
      }
    });
  });
}

/**
 * Valida um campo específico
 * @param {string} campoId - ID do campo a ser validado
 */
function validarCampo(campoId) {
  const campo = document.getElementById(campoId);
  if (!campo) return;
  
  const valor = campo.value.trim();
  
  switch (campoId) {
    case 'nome':
      if (valor && valor.length < 3) {
        mostrarErro(campoId, 'Nome deve ter pelo menos 3 caracteres');
      }
      break;
      
    case 'telefone':
      if (valor && valor.length < 14) {
        mostrarErro(campoId, 'Telefone deve estar completo');
      }
      break;
      
    case 'email':
      if (valor && !validarEmail(valor)) {
        mostrarErro(campoId, 'E-mail inválido');
      }
      break;
      
    case 'mensagem':
      if (valor && valor.length < 10) {
        mostrarErro(campoId, 'Mensagem deve ter pelo menos 10 caracteres');
      }
      break;
  }
}

/**
 * Envia a mensagem de suporte
 */
function enviarMensagemSuporte() {
  const form = document.querySelector('.form');
  const submitBtn = form?.querySelector('button[type="submit"]');
  
  if (!form || !submitBtn) return;
  
  // Desabilita o botão e mostra loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  
  // Simula envio (em produção, seria uma requisição AJAX)
  setTimeout(() => {
    // Sucesso
    mostrarSucesso();
    
    // Reseta o formulário
    form.reset();
    
    // Reabilita o botão
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar Mensagem';
  }, 2000);
}

/**
 * Mostra mensagem de sucesso
 */
function mostrarSucesso() {
  // Remove mensagens anteriores
  const mensagensAnteriores = document.querySelectorAll('.mensagem-suporte');
  mensagensAnteriores.forEach(msg => msg.remove());
  
  // Cria mensagem de sucesso
  const mensagem = document.createElement('div');
  mensagem.className = 'mensagem-suporte';
  mensagem.innerHTML = `
    <div style="
      background: rgba(40, 167, 69, 0.1);
      border: 1px solid rgba(40, 167, 69, 0.2);
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
      color: #1c7430;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    ">
      <i class="fas fa-check-circle"></i>
      <span>Mensagem enviada com sucesso! Entraremos em contato em breve.</span>
    </div>
  `;
  
  // Insere após o formulário
  const form = document.querySelector('.form');
  if (form) {
    form.parentNode.insertBefore(mensagem, form.nextSibling);
  }
  
  // Remove a mensagem após 5 segundos
  setTimeout(() => {
    mensagem.remove();
  }, 5000);
}

/**
 * Adiciona estilos CSS para validação
 */
function adicionarEstilosValidacao() {
  const style = document.createElement('style');
  style.textContent = `
    .erro-validacao {
      border-color: #dc3545 !important;
      box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
    }
    
    .erro-mensagem {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }
    
    .form-control:focus {
      border-color: #59110b;
      box-shadow: 0 0 0 0.2rem rgba(89, 17, 11, 0.25);
    }
  `;
  document.head.appendChild(style);
}

// Adiciona estilos quando o DOM carrega
document.addEventListener('DOMContentLoaded', adicionarEstilosValidacao);
