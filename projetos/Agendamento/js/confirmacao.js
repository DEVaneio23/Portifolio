// Importa dados dos professores internos do módulo
import { PROFESSORES_INTERNOS } from './modules/data.js';

/**
 * Página de confirmação
 * - Lê parâmetros da URL (GET) e preenche o comprovante
 * - Usa PROFESSORES_INTERNOS do módulo de dados para resolver nomes/emails
 *
 * Dicas de manutenção
 * - Para exibir novos campos enviados pelo formulário, adicione a leitura em
 *   carregarDadosAgendamento() e crie um bloco .detalhe-item correspondente no HTML
 * - Evite duplicar dados; sempre que possível leia de js/modules/data.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Função para formatar a data
    function formatarData(dataString) {
        if (!dataString) return '';
        
        const data = new Date(dataString);
        if (isNaN(data.getTime())) return dataString;
        
        return data.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Função para formatar o tipo de banca
    function formatarTipoBanca(tipo) {
        const tipos = {
            'qualificacao': 'Qualificação',
            'defesa': 'Defesa'
        };
        return tipos[tipo] || tipo;
    }


    // Função para formatar o curso
    function formatarCurso(curso) {
        const cursos = {
            'mestrado': 'Mestrado',
            'doutorado': 'Doutorado'
        };
        return cursos[curso] || curso;
    }

    // Função para carregar os dados do agendamento
    function carregarDadosAgendamento() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Dados básicos
        document.getElementById('aluno').textContent = urlParams.get('aluno') || '-';
        document.getElementById('curso').textContent = formatarCurso(urlParams.get('curso'));
        document.getElementById('tipo').textContent = formatarTipoBanca(urlParams.get('tipo'));
        document.getElementById('modalidade_banca').textContent = urlParams.get('modalidade_banca');
        document.getElementById('titulo').textContent = urlParams.get('titulo') || '-';
        
        const trabalhoFinal = urlParams.get('trabalho_final');
        if (trabalhoFinal) {
            const nomeArquivo = trabalhoFinal.split('\\').pop().split('/').pop();
            document.getElementById('trabalho_final').textContent = nomeArquivo;
        }

        // Formatação da data e hora
        const data = urlParams.get('data');
        const hora = urlParams.get('hora');
        if (data && hora) {
            const [ano, mes, dia] = data.split('-');
            document.getElementById('data-hora').textContent = `${dia}/${mes}/${ano} às ${hora}`;
        } else {
            document.getElementById('data-hora').textContent = '-';
        }

        // Gera um número de protocolo baseado na data/hora
        const protocolo = gerarProtocolo();
        document.getElementById('protocolo').textContent = protocolo;

        // Processa membros internos
        const membrosInternosContainer = document.getElementById('membros-internos');
        membrosInternosContainer.innerHTML = '';
        
        const membrosInternos = [];
        urlParams.forEach((value, key) => {
            if (key.startsWith('membroInterno') && value) {
                const professor = PROFESSORES_INTERNOS.find(p => p.cpf === value);
                if (professor) {
                    membrosInternos.push(professor);
                }
            }
        });

        if (membrosInternos.length > 0) {
            membrosInternos.forEach(professor => {
                const div = document.createElement('div');
                div.className = 'detalhe-item';
                div.innerHTML = `
                    <span class="detalhe-label">${professor.nome}</span>
                    <span class="detalhe-valor">${professor.email}</span>
                `;
                membrosInternosContainer.appendChild(div);
            });
        } else {
            membrosInternosContainer.innerHTML = '<p>Nenhum membro interno cadastrado.</p>';
        }

        // Processa membros externos
        const membrosExternosContainer = document.getElementById('membros-externos');
        membrosExternosContainer.innerHTML = '';
        
        const membrosExternos = [];
        const indices = new Set();
        
        // Coleta todos os índices de membros externos
        urlParams.forEach((value, key) => {
            if (key.startsWith('membroExternoNome')) {
                const index = key.replace('membroExternoNome', '');
                indices.add(index);
            }
        });

        // Processa cada membro externo
        indices.forEach(index => {
            const nome = urlParams.get(`membroExternoNome${index}`);
            const email = urlParams.get(`membroExternoEmail${index}`);
            const cpf = urlParams.get(`membroExternoCPF${index}`);
            const instituicao = urlParams.get(`membroExternoInstituicao${index}`);
            const titulacao = urlParams.get(`membroExternoTitulacao${index}`);

            if (nome && email) {
                const div = document.createElement('div');
                div.className = 'detalhe-item';
                div.innerHTML = `
                    <span class="detalhe-label">${nome}</span>
                    <span class="detalhe-valor">
                        ${email} - ${instituicao || 'Sem instituição'}
                        ${titulacao ? ` (${formatarTitulacao(titulacao)})` : ''}
                    </span>
                `;
                membrosExternosContainer.appendChild(div);
            }
        });

        if (membrosExternosContainer.children.length === 0) {
            membrosExternosContainer.innerHTML = '<p>Nenhum membro externo cadastrado.</p>';
        }
    }

    // Função para formatar a titulação
    function formatarTitulacao(titulacao) {
        const formatos = {
            'doutor': 'Doutor',
            'pos_doutor': 'Pós-Doutor'
        };
        return formatos[titulacao] || titulacao;
    }

    // Função para gerar número de protocolo
    function gerarProtocolo() {
        const data = new Date();
        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');
        const hora = String(data.getHours()).padStart(2, '0');
        const minuto = String(data.getMinutes()).padStart(2, '0');
        const segundo = String(data.getSeconds()).padStart(2, '0');
        
        return `PROT-${ano}${mes}${dia}-${hora}${minuto}${segundo}`;
    }

    // Inicializa a página
    carregarDadosAgendamento();
    
    // Adiciona estilos para impressão
    const style = document.createElement('style');
    style.textContent = `
        @media print {
            .header, .footer, .confirmacao-acoes, .confirmacao-alerta {
                display: none !important;
            }
            
            .confirmacao-card {
                box-shadow: none !important;
                border: 1px solid #ddd;
                padding: 20px;
            }
            
            .checkmark {
                display: none !important;
            }
            
            h1 {
                margin-top: 0;
            }
            
            .detalhe-item {
                page-break-inside: avoid;
            }
        }
    `;
    document.head.appendChild(style);

    // Configura o botão de impressão
    document.getElementById('imprimir').addEventListener('click', function() {
        window.print();
    });
    
    // Configura o botão de enviar por e-mail
    document.getElementById('enviar-email').addEventListener('click', function() {
        const email = prompt('Digite o e-mail para envio do comprovante:');
        if (email) {
            alert('Comprovante enviado com sucesso para ' + email);
        }
    });
});
