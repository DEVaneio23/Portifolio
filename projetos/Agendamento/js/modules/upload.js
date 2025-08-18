/**
 * ===========================================================================
 * MÓDULO DE UPLOAD - SISTEMA DE AGENDAMENTO DE BANCAS
 * ===========================================================================
 * 
 * Este módulo contém todas as funções relacionadas ao upload de arquivos:
 * - Validação de arquivos PDF
 * - Drag and drop
 * - Exibição de informações do arquivo
 * - Gerenciamento de upload
 * 
 * ===========================================================================
 */
/**
 * ROADMAP DE MELHORIAS
 * - Preview de PDF (usar PDF.js em modo leve para exibir primeira página).
 * - Compressão client-side (p.ex.: pdf-lib) quando > limite, com confirmação do usuário.
 * - Barra de progresso real ao enviar para backend (fetch com streams).
 * - Validações no servidor: repetir regras e checar MIME real (não só extensão).
 */

import { validarArquivoPDF } from './validation.js';
import { formatFileSize } from './ui.js';
import { CONFIGURACOES, MENSAGENS } from './data.js';

/**
 * Inicializa o sistema de upload de arquivos
 */
export function inicializarUpload() {
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
      const arquivo = fileInput.files[0];
      if (validarArquivoPDF(arquivo)) {
        displayFileInfo(arquivo);
      } else {
        alert(MENSAGENS.ERRO.ARQUIVO_INVALIDO);
        clearFile();
      }
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

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragging');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragging');
    
    if (e.dataTransfer.files.length > 0) {
      const arquivo = e.dataTransfer.files[0];
      if (validarArquivoPDF(arquivo)) {
        fileInput.files = e.dataTransfer.files;
        displayFileInfo(arquivo);
      } else {
        alert(MENSAGENS.ERRO.ARQUIVO_INVALIDO);
      }
    }
  });

  function displayFileInfo(file) {
    uploadContent.style.display = 'none';
    fileInfo.style.display = 'flex';
    
    if (fileNameEl) fileNameEl.textContent = file.name;
    if (fileSizeEl) fileSizeEl.textContent = formatFileSize(file.size);
    
    // Dispara evento para atualizar progresso
    fileInput.dispatchEvent(new Event('change'));
  }

  function clearFile() {
    fileInput.value = '';
    uploadContent.style.display = 'block';
    fileInfo.style.display = 'none';
    
    if (fileNameEl) fileNameEl.textContent = '';
    if (fileSizeEl) fileSizeEl.textContent = '';
    
    // Dispara evento para atualizar progresso
    fileInput.dispatchEvent(new Event('change'));
  }
}

/**
 * Valida se um arquivo é válido para upload
 * @param {File} arquivo - Arquivo a ser validado
 * @returns {object} - Resultado da validação
 */
export function validarArquivoUpload(arquivo) {
  const resultado = {
    valido: false,
    erros: []
  };

  if (!arquivo) {
    resultado.erros.push('Nenhum arquivo selecionado');
    return resultado;
  }

  // Verifica tipo do arquivo
  if (!CONFIGURACOES.TIPOS_ARQUIVO_PERMITIDOS.includes(arquivo.type)) {
    resultado.erros.push(MENSAGENS.ERRO.ARQUIVO_INVALIDO);
  }

  // Verifica tamanho do arquivo
  if (arquivo.size > CONFIGURACOES.TAMANHO_MAXIMO_ARQUIVO) {
    resultado.erros.push(MENSAGENS.ERRO.ARQUIVO_GRANDE);
  }

  resultado.valido = resultado.erros.length === 0;
  return resultado;
}

/**
 * Formata o tamanho de um arquivo para exibição
 * @param {number} bytes - Tamanho em bytes
 * @returns {string} - Tamanho formatado
 */
export function formatarTamanhoArquivo(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Cria um preview do arquivo PDF (se possível)
 * @param {File} arquivo - Arquivo PDF
 * @param {HTMLElement} container - Container para o preview
 */
export function criarPreviewPDF(arquivo, container) {
  if (!arquivo || arquivo.type !== 'application/pdf') {
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const pdfUrl = e.target.result;
    
    // Cria um iframe para mostrar o PDF
    const iframe = document.createElement('iframe');
    iframe.src = pdfUrl;
    iframe.style.width = '100%';
    iframe.style.height = '400px';
    iframe.style.border = '1px solid #ddd';
    iframe.style.borderRadius = '8px';
    
    container.innerHTML = '';
    container.appendChild(iframe);
  };
  
  reader.readAsDataURL(arquivo);
}

/**
 * Comprime um arquivo PDF se necessário
 * @param {File} arquivo - Arquivo PDF original
 * @param {number} tamanhoMaximo - Tamanho máximo em bytes
 * @returns {Promise<File>} - Arquivo comprimido
 */
export async function comprimirPDF(arquivo, tamanhoMaximo = CONFIGURACOES.TAMANHO_MAXIMO_ARQUIVO) {
  if (arquivo.size <= tamanhoMaximo) {
    return arquivo;
  }

  try {
    // Aqui você pode implementar a lógica de compressão
    // Por enquanto, apenas retorna o arquivo original
    console.warn('Compressão de PDF não implementada. Arquivo pode ser muito grande.');
    return arquivo;
  } catch (error) {
    console.error('Erro ao comprimir PDF:', error);
    return arquivo;
  }
}

/**
 * Envia o arquivo para o servidor
 * @param {File} arquivo - Arquivo a ser enviado
 * @param {string} url - URL do endpoint de upload
 * @returns {Promise<object>} - Resposta do servidor
 */
export async function enviarArquivo(arquivo, url) {
  const formData = new FormData();
  formData.append('arquivo', arquivo);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erro no upload: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao enviar arquivo:', error);
    throw error;
  }
} 