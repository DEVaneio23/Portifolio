# **SISTEMA DE AGENDAMENTO DE BANCAS - PORTFÓLIO**

## **SOBRE ESTE PROJETO**

Este é um sistema de agendamento de bancas de qualificação e defesa para programas de pós-graduação em Direito. Desenvolvido como projeto de portfólio para demonstrar habilidades de desenvolvimento web.

## **DEMO RÁPIDA**

- **Página Principal**: [index.html](../index.html)
- **Formulário**: [agendar.html](../pgs/agendar.html)
- **Login Professor**: [login-professor.html](../pgs/login-professor.html)
- **Dashboard**: [dashboard-professor.html](../pgs/dashboard-professor.html)

## **TECNOLOGIAS UTILIZADAS**

### **Frontend**

- HTML5 semântico
- CSS3 com variáveis e design responsivo
- JavaScript ES6+ com módulos
- Font Awesome para ícones

### **Backend**

- Node.js com Express.js
- MongoDB para banco de dados
- JWT para autenticação
- Middleware de segurança

## **ESTRUTURA DO PROJETO**

```
Agendamento/
├── index.html                 # Página principal
├── pgs/                       # Páginas do sistema
│   ├── agendar.html          # Formulário de agendamento
│   ├── login-professor.html  # Login dos professores
│   ├── dashboard-professor.html # Dashboard dos professores
│   ├── suporte.html          # Página de suporte
│   └── confirmacao.html      # Confirmação de agendamento
├── js/                       # JavaScript modular
│   ├── modules/              # Módulos ES6
│   └── [outros arquivos JS]
├── css/                      # Estilos CSS
├── backend/                  # Servidor Node.js
└── relatório/                # Documentação técnica
```

## **FUNCIONALIDADES PRINCIPAIS**

### **Para Alunos**

- Agendamento de bancas com validação em tempo real
- Upload de trabalhos finais (PDF)
- Seleção de membros da banca
- Confirmação de agendamento

### **Para Professores**

- Login seguro com JWT
- Dashboard com visão geral das bancas
- Filtros e busca avançada

### **Sistema**

- Validação de regras de negócio acadêmicas
- Controle de diversidade de gênero na banca
- Interface responsiva para todos os dispositivos

## **SEGURANÇA IMPLEMENTADA**

- **JWT**: Autenticação stateless
- **Helmet**: Headers de segurança HTTP
- **CORS**: Controle de origens permitidas
- **Rate Limiting**: Proteção contra ataques
- **Validação**: Schemas para todos os campos

## **REGRAS DE NEGÓCIO**

### **Composição da Banca**

- **Mestrado**: 3 membros (orientador + 2 membros)
- **Doutorado**: 5 membros (orientador + 4 membros)
- **Diversidade**: Mínimo 1 mulher na banca
- **Externos**: 1 para mestrado, 2 para doutorado

### **Validações**

- Resumo mínimo: 100 palavras
- Arquivo máximo: 10MB (PDF)
- Antecedência: 15 dias para envio
- Horário: 8h às 18h (segunda a sexta)

## **DESIGN E UX**

- **Paleta**: Vermelho institucional (#59110b)
- **Responsivo**: Mobile-first design
- **Acessível**: ARIA labels e estrutura semântica
- **Consistente**: Sistema de variáveis CSS

## **COMO EXECUTAR**

### **Frontend (Estático)**

1. Clone o repositório
2. Abra `index.html` em um navegador
3. Navegue pelas páginas do sistema

### **Backend (Opcional)**

1. Entre na pasta `backend/`
2. Execute `npm install`
3. Configure o arquivo `.env` baseado em `env.example`
4. Execute `npm start`

## **DOCUMENTAÇÃO TÉCNICA**

- **Documentação Completa**: [DOCUMENTACAO-TECNICA.md](relatório/DOCUMENTACAO-TECNICA.md)
- **Documentação para Recrutadores**: [DOCUMENTACAO-RECRUTADOR.md](DOCUMENTACAO-RECRUTADOR.md)

## **OBJETIVOS DO PORTFÓLIO**

1. **Demonstrar Competências Técnicas**

   - Desenvolvimento full-stack
   - Arquitetura modular
   - Design responsivo
   - Segurança de aplicações

2. **Mostrar Boas Práticas**

   - Código bem documentado
   - Separação de responsabilidades
   - Validações robustas
   - Interface acessível

3. **Exibir Conhecimentos**
   - JavaScript moderno (ES6+)
   - CSS avançado
   - Node.js e Express
   - MongoDB e JWT

## **CONTATO PARA PORTFÓLIO**

- **Desenvolvedor**: [Anderson]
- **E-mail**: [andersonfms32@gmail.com]

## **LICENÇA**

Este projeto foi criado para uma instituição real que ainda está em desenvolvimento, mas a versão apresentada é apenas fins de demonstração em portfólio. Todos os dados são fictícios e não representam uma instituição real.

---

**Nota**: Este sistema demonstra um projeto completo e funcional.
