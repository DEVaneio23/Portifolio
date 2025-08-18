/**
 * ===========================================================================
 * MÓDULO DE DADOS - SISTEMA DE AGENDAMENTO DE BANCAS
 * ===========================================================================
 * 
 * Este módulo contém todas as constantes e dados utilizados no sistema:
 * - Lista de professores internos (DADOS FICTÍCIOS PARA PORTFÓLIO)
 * - Projetos de pesquisa
 * - Campos obrigatórios
 * - Configurações do sistema
 * 
 * ===========================================================================
 */

/**
 * NOTAS IMPORTANTES (Juniro):
 * - Este arquivo centraliza constantes e evita "valores mágicos" espalhados pelo código
 * - Sempre que criar novos campos, registre em `CAMPOS_OBRIGATORIOS` para que o
 *   checklist e a progressBar reflitam corretamente o estado do formulário
 * - Os nomes dos professores são FICTÍCIOS para demonstração em portfólio
 * - Cada professor tem um ID único para controle interno do sistema
 */

/**
 * Lista completa dos professores internos disponíveis para compor a banca
 * 
 * ESTRUTURA DE CADA PROFESSOR:
 * - id: identificador único (não alterar após criação)
 * - nome: nome completo do professor
 * - email: e-mail institucional (padrão @ppgd.edu.br)
 * - cpf: CPF fictício para demonstração (formato: XXX.XXX.XXX-XX)
 * - genero: usado para regras de diversidade na composição da banca
 * 
 * IMPORTANTE: Estes são dados fictícios para demonstração em portfólio!
 */
export const PROFESSORES_INTERNOS = [
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
  { id: 16, nome: 'Profa. Dra. Beatriz Oliveira Santos', email: 'beatriz.santos@ppgd.edu.br', cpf: '444.555.666-77', genero: 'feminino' },
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

/**
 * Dicionário com os projetos de pesquisa disponíveis e suas palavras-chave
 * 
 * FUNCIONALIDADE: Usado para sugerir keywords no campo de resumo
 * ESTRUTURA: Cada projeto tem um nome e uma lista de palavras-chave relacionadas
 * 
 * COMO FUNCIONA: Quando o usuário seleciona um projeto, as palavras-chave
 * são exibidas como sugestões para o campo de palavras-chave
 */
export const PROJETOS_PESQUISA = {
  direito_constitucional: {
    nome: 'Direito Constitucional',
    keywords: [
      'Constituição',
      'Direitos Fundamentais',
      'Controle de Constitucionalidade',
      'Federalismo',
      'Separação de Poderes',
      'Democracia',
      'Cidadania'
    ]
  },
  direito_penal: {
    nome: 'Direito Penal',
    keywords: [
      'Teoria do Crime',
      'Penas',
      'Processo Penal',
      'Direito Penal Econômico',
      'Criminologia',
      'Execução Penal',
      'Medidas de Segurança'
    ]
  },
  direito_civil: {
    nome: 'Direito Civil',
    keywords: [
      'Direito das Obrigações',
      'Direito de Família',
      'Direito das Coisas',
      'Direito das Sucessões',
      'Responsabilidade Civil',
      'Contratos',
      'Propriedade'
    ]
  }
};

/**
 * Lista de todos os campos obrigatórios do formulário
 * 
 * FUNCIONALIDADE: Define quais campos são obrigatórios para o checklist
 * ESTRUTURA: Cada objeto define como o campo deve ser validado
 * 
 * TIPOS DE VALIDAÇÃO:
 * - select: campo de seleção (deve ter uma opção selecionada)
 * - input: campo de texto (deve ter conteúdo)
 * - textarea: área de texto (deve ter conteúdo)
 * - file: arquivo (deve ser selecionado)
 * - checkbox: caixas de seleção (pelo menos uma deve estar marcada)
 * - externos: membros externos (regras especiais de validação)
 * - mulher-banca: validação de diversidade de gênero
 * - envio-fisico: confirmação de envio físico do trabalho
 */
export const CAMPOS_OBRIGATORIOS = [
  { id: 'modalidade_banca', type: 'select' },
  { id: 'aluno', type: 'input' },
  { id: 'email_aluno', type: 'input', validacao: 'validarEmail' },
  { id: 'cpf_aluno', type: 'input', validacao: 'validarCPF' },
  { id: 'curso', type: 'select' },
  { id: 'tipo', type: 'select' },
  { id: 'titulo', type: 'input' },
  { id: 'resumo', type: 'textarea' },
  { id: 'palavras_chave', type: 'input', validacao: 'validarPalavrasChave' },
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

/**
 * Configurações do sistema
 * 
 * FUNCIONALIDADE: Centraliza todas as configurações em um só lugar
 * VANTAGEM: Facilita manutenção e alteração de parâmetros
 * 
 * NOTA: Todas as medidas estão em unidades padrão (MB, palavras, dias, horas)
 */
export const CONFIGURACOES = {
  // Limites de arquivo (Juniro: sempre usar constantes para evitar "números mágicos")
  TAMANHO_MAXIMO_ARQUIVO: 10 * 1024 * 1024, // 10MB em bytes
  TIPOS_ARQUIVO_PERMITIDOS: ['application/pdf'], // Apenas PDF por segurança
  
  // Limites de texto (Juniro: validações importantes para qualidade do trabalho)
  MIN_PALAVRAS_RESUMO: 100, // Resumo deve ser substancial
  MIN_KEYWORDS_RESUMO: 2,    // Pelo menos 2 palavras-chave
  
  // Prazos (Juniro: regras de negócio para organização das bancas)
  DIAS_MINIMOS_ENVIO: 15,    // Trabalho deve ser enviado com antecedência
  
  // Horários (Juniro: horário comercial para agendamentos)
  HORA_INICIO_AGENDAMENTO: 8,  // 8h da manhã
  HORA_FIM_AGENDAMENTO: 18,    // 6h da tarde
  
  // Composição da banca (Juniro: regras importantes para validar formulário)
  MEMBROS_MESTRADO: 3,        // orientador + 2 membros
  MEMBROS_DOUTORADO: 5,       // orientador + 4 membros
  MIN_MULHERES_BANCA: 1,      // Regra de diversidade obrigatória
  
  // Configurações de contato (Juniro: dados para suporte ao usuário)
  EMAIL_SUPORTE: 'suporte@ppgd.edu.br',
  TELEFONE_SUPORTE: '(11) 99999-9999'
};

/**
 * Mensagens de erro e sucesso padronizadas
 * 
 * FUNCIONALIDADE: Centraliza todas as mensagens do sistema
 * VANTAGEM: Facilita manutenção e padronização da comunicação
 * 
 * ESTRUTURA: Organizado por tipo (ERRO, SUCESSO, AVISO) para facilitar uso
 */
export const MENSAGENS = {
  ERRO: {
    CPF_INVALIDO: 'CPF inválido. Verifique os números digitados.',
    EMAIL_INVALIDO: 'E-mail inválido. Digite um e-mail válido.',
    DATA_FIM_SEMANA: 'Não é possível agendar para finais de semana.',
    HORA_INVALIDA: 'O horário de agendamento é das 8h às 18h.',
    ARQUIVO_INVALIDO: 'Apenas arquivos PDF são aceitos.',
    ARQUIVO_GRANDE: 'O arquivo deve ter no máximo 10MB.',
    MULHER_OBRIGATORIA: 'É necessário selecionar pelo menos uma mulher na banca.',
    MEMBROS_INSUFICIENTES: 'Selecione o número correto de membros para o curso.',
    ENVIO_FISICO_OBRIGATORIO: 'É necessário confirmar o envio do trabalho físico.'
  },
  SUCESSO: {
    FORMULARIO_VALIDO: 'Formulário preenchido corretamente.',
    ARQUIVO_ENVIADO: 'Arquivo enviado com sucesso.',
    AGENDAMENTO_CONFIRMADO: 'Agendamento realizado com sucesso.'
  },
  AVISO: {
    RESUMO_INCOMPLETO: 'O resumo deve ter pelo menos 100 palavras.',
    KEYWORDS_INSUFICIENTES: 'É necessário incluir pelo menos 2 termos-chave do projeto.',
    SELECIONE_PROJETO: 'Selecione um projeto de pesquisa para ver as palavras-chave.'
  }
};

/**
 * Opções de cursos disponíveis
 * 
 * FUNCIONALIDADE: Define as características de cada curso
 * USO: Validação de formulário e cálculo de membros da banca
 * 
 * ESTRUTURA: Cada curso tem nome, duração e regras de composição
 */
export const CURSOS = {
  mestrado: {
    nome: 'Mestrado',
    duracao: '24 meses',
    membros: 3,      // orientador + 2 membros
    externos: 1      // 1 membro externo obrigatório
  },
  doutorado: {
    nome: 'Doutorado',
    duracao: '48 meses',
    membros: 5,      // orientador + 4 membros
    externos: 2      // 2 membros externos obrigatórios
  }
};

/**
 * Opções de tipos de banca
 * 
 * FUNCIONALIDADE: Define os tipos de apresentação disponíveis
 * USO: Validação e organização do agendamento
 * 
 * NOTA: Cada tipo tem regras específicas de preparação e documentação
 */
export const TIPOS_BANCA = {
  qualificacao: {
    nome: 'Qualificação',
    descricao: 'Apresentação do projeto de pesquisa (etapa intermediária)'
  },
  defesa: {
    nome: 'Defesa',
    descricao: 'Apresentação do trabalho final (etapa final)'
  }
};

/**
 * Opções de modalidade de banca
 * 
 * FUNCIONALIDADE: Define como a banca será realizada
 * USO: Organização logística e preparação dos participantes
 * 
 * NOTA: Modalidade online requer preparação técnica adicional
 */
export const MODALIDADES_BANCA = {
  presencial: {
    nome: 'Presencial',
    descricao: 'Banca realizada presencialmente na universidade'
  },
  online: {
    nome: 'Online',
    descricao: 'Banca realizada por videoconferência (Zoom/Teams)'
  }
}; 