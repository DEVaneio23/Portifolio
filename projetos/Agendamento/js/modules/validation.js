/**
 * ===========================================================================
 * MÓDULO DE VALIDAÇÃO - SISTEMA DE AGENDAMENTO DE BANCAS
 * ===========================================================================
 * 
 * Este módulo contém todas as funções de validação utilizadas no sistema:
 * - Validação de CPF
 * - Validação de email
 * - Validação de datas
 * - Validação de arquivos
 * - Validação de regras de negócio
 * 
 * ===========================================================================
 */

/**
 * NOTAS DE MANUTENÇÃO E MELHORIAS
 * - Centralizar limites (ex.: tamanho de arquivo, horários) em `CONFIGURACOES` e referenciar aqui via import,
 *   evitando valores mágicos (já fazemos em parte, mas vale revisar sempre que mudar regras).
 * - Internacionalização: as mensagens hoje estão em `MENSAGENS`. Se formos internacionalizar,
 *   mantenha apenas booleans e objetos de resultado aqui; o mapeamento para strings deve acontecer na camada de UI.
 * - Testes: este arquivo é ótimo candidato a testes unitários (CPF, horas, datas, etc.).
 */

/**
 * Valida um CPF brasileiro usando o algoritmo oficial
 * @param {string} cpf - CPF a ser validado (pode conter máscara)
 * @returns {boolean} - True se o CPF for válido
 */
export function validarCPF(cpf) {
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
export function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Valida se a data de envio está pelo menos 15 dias antes da data de defesa
 * @param {string} dataEnvio - Data de envio do trabalho
 * @param {string} dataDefesa - Data da defesa
 * @returns {boolean} - True se o prazo for respeitado
 */
export function validarDataEnvio(dataEnvio, dataDefesa) {
  if (!dataEnvio || !dataDefesa) return false;
  const umDia = 24 * 60 * 60 * 1000;
  const diffDias = Math.round((new Date(dataDefesa) - new Date(dataEnvio)) / umDia);
  return diffDias >= 15;
}

/**
 * Valida se uma data é válida para agendamento (não fim de semana)
 * @param {string} data - Data a ser validada
 * @returns {boolean} - True se a data for válida
 */
export function validarDataAgendamento(data) {
  const dataSelecionada = new Date(data);
  const diaSemana = dataSelecionada.getDay();
  
  // Verifica se é fim de semana (0 = domingo, 6 = sábado)
  return diaSemana !== 0 && diaSemana !== 6;
}

/**
 * Valida se uma hora está dentro do horário comercial
 * @param {string} hora - Hora a ser validada (formato HH:MM)
 * @returns {boolean} - True se a hora for válida
 */
export function validarHoraAgendamento(hora) {
  const horaNum = parseInt(hora.split(':')[0]);
  return horaNum >= 8 && horaNum < 18;
}

/**
 * Valida se um arquivo é um PDF válido
 * @param {File} arquivo - Arquivo a ser validado
 * @returns {boolean} - True se o arquivo for válido
 */
export function validarArquivoPDF(arquivo) {
  if (!arquivo) return false;
  
  // Verifica se é um arquivo PDF
  if (arquivo.type !== 'application/pdf') return false;
  
  // Verifica se o tamanho é menor que 10MB
  const tamanhoMaximo = 10 * 1024 * 1024; // 10MB
  if (arquivo.size > tamanhoMaximo) return false;
  
  return true;
}

/**
 * Valida se há pelo menos uma mulher na banca
 * @returns {boolean} - True se há pelo menos uma mulher
 */
export function temMulherNaBanca() {
  // Verifica membros internos
  const temMulherInterna = Array.from(document.querySelectorAll('#membros-internos input[type="checkbox"]:checked'))
    .some(cb => cb.dataset.genero === 'feminino');

  if (temMulherInterna) return true;

  // Verifica membros externos
  const temMulherExterna = Array.from(document.querySelectorAll('select[name*="Genero"]'))
    .some(select => select.value === 'feminino');

  return temMulherExterna;
}

/**
 * Valida se o resumo atende aos requisitos mínimos
 * @param {string} texto - Texto do resumo
 * @param {string} projeto - Projeto de pesquisa selecionado
 * @returns {object} - Objeto com resultado da validação
 */
export function validarResumo(texto) {
  const palavras = texto.trim().split(/\s+/).filter(palavra => palavra.length > 0);
  const numPalavras = palavras.length;

  return {
    valido: numPalavras >= 100,
    numPalavras,
    requisitos: {
      palavrasMinimas: 100
    }
  };
}

/**
 * Valida o campo de palavras-chave fornecido pelo aluno
 * Regras: separar por vírgulas; exige pelo menos 2 termos não vazios
 * @param {string} texto - Conteúdo do campo de palavras-chave
 * @returns {boolean} - True se atender ao mínimo de keywords
 */
export function validarPalavrasChave(texto) {
  if (!texto) return false;
  const termos = texto
    .split(/[,;\n]/)
    .map(t => t.trim())
    .filter(t => t.length >= 2);
  return termos.length >= 2;
}