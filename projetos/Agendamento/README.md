# Sistema de Agendamento de Bancas - PPGD FADISP

## Descrição

Sistema completo de agendamento de bancas para programas de Mestrado e Doutorado em Direito. Desenvolvido com foco em usabilidade, acessibilidade e validação robusta de dados.

## Funcionalidades

### **Agendamento de Bancas**

- Formulário dinâmico com validação em tempo real
- Seleção de curso (Mestrado/Doutorado)
- Tipos de banca: Qualificação e Defesa
- Modalidades: Presencial e Online
- Upload de trabalho final em PDF
- Validação de membros da banca (internos e externos)

### **Gestão de Usuários**

- Área do professor com dashboard
- Sistema de login para membros de bancas
- Controle de acesso e permissões
- Histórico de agendamentos

### **Relatórios e Acompanhamento**

- Dashboard com estatísticas
- Filtros por status, tipo e data
- Sistema de protocolos únicos
- Confirmações automáticas por e-mail

## Tecnologias Utilizadas

### **Frontend**

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design responsivo com variáveis CSS e animações
- **JavaScript ES6+**: Módulos ES6, validações e interações dinâmicas

### **Arquitetura**

- **Modular**: Código organizado em módulos reutilizáveis
- **Responsivo**: Mobile-first design com breakpoints otimizados
- **Acessível**: ARIA labels e navegação por teclado

### **Validações**

- CPF com algoritmo oficial
- E-mail institucional
- Palavras-chave com contagem automática
- Resumo com contador de palavras
- Validação de membros da banca

## Como Executar

### **Pré-requisitos**

- Navegador moderno (Chrome 80+, Firefox 75+, Safari 13+)
- Servidor web local (recomendado)

### **Instalação**

1. Clone o repositório

```bash
git clone [URL_DO_REPOSITORIO]
cd projetos/Agendamento
```

2. Abra o arquivo `index.html` em um servidor web

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# VS Code Live Server
# Instale a extensão e clique em "Go Live"
```

3. Acesse `http://localhost:8000`

## Estrutura do Projeto

```
Agendamento/
├──  index.html              # Página principal
├──  pgs/                    # Páginas do sistema
│   ├──  agendar.html        # Formulário de agendamento
│   ├──  confirmacao.html    # Confirmação do agendamento
│   ├──  suporte.html        # Central de suporte
│   ├──  login-professor.html # Login para professores
│   └──  dashboard-professor.html # Dashboard do professor
├──  css/                    # Estilos organizados
│   ├──  _variables.css      # Variáveis CSS globais
│   ├──  global.css          # Estilos globais
│   ├──  header.css          # Estilos do cabeçalho
│   ├──  agendamento.css     # Estilos do formulário
│   └──  ...                 # Outros estilos específicos
├──  js/                     # JavaScript modular
│   ├──  formulario-modular.js # Ponto de entrada principal
│   └──  modules/            # Módulos do sistema
│       ├──  validation.js   # Validações de formulário
│       ├──  ui.js           # Interface e interações
│       ├──  data.js         # Gerenciamento de dados
│       ├──  members.js      # Lógica dos membros da banca
│       ├──  upload.js       # Sistema de upload
│       └──  form.js         # Lógica principal do formulário
├──  relatório/              # Documentação técnica
│   └──  relatorio.html      # Relatório de desenvolvimento
└──  README.md               # Este arquivo
```

## Design System

### **Paleta de Cores**

- **Primária**: `#59110b` (Vermelho escuro)
- **Secundária**: `#7f1c14` (Vermelho médio)
- **Destaque**: `#9f2e1c` (Vermelho claro)
- **Texto**: `#333` (Cinza escuro)
- **Fundo**: Gradiente vermelho com transparências

### **Tipografia**

- **Fonte**: Inter (Google Fonts)
- **Hierarquia**: Títulos em negrito, texto legível
- **Responsividade**: Escala de tamanhos para diferentes telas

### **Componentes**

- **Botões**: Gradientes com hover effects
- **Cards**: Glassmorphism com backdrop-filter
- **Formulários**: Validação visual em tempo real
- **Navegação**: Header fixo com menu responsivo

## Funcionalidades Técnicas

### **Validação de Formulário**

- Validação em tempo real
- Barra de progresso visual
- Mensagens de erro contextuais
- Prevenção de envio com dados inválidos

### **Sistema de Upload**

- Aceita apenas arquivos PDF
- Validação de tamanho e formato
- Preview do arquivo selecionado
- Remoção de arquivos

### **Lógica de Bancas**

- **Mestrado**: 3 membros (1 orientador + 2 outros)
- **Doutorado**: 5 membros (1 orientador + 4 outros)
- Validação de membros internos/externos
- Garantia de pelo menos uma mulher na banca

## Responsividade

### **Breakpoints**

- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Desktop**: > 768px

### **Adaptações**

- Menu colapsável em mobile
- Grid responsivo para formulários
- Cards empilhados em telas pequenas
- Touch-friendly em dispositivos móveis

## Testes e Qualidade

### **Validações Implementadas**

- CPF válido
- E-mail institucional
- Resumo com mínimo de palavras
- Palavras-chave separadas por vírgula
- Upload de PDF obrigatório
- Seleção de membros da banca
- Data e hora válidas

### **Compatibilidade**

- Chrome/Edge (Chromium)
- Firefox
- Safari (com fallbacks)
- Mobile browsers

## Roadmap

### **Fase Atual (v1.7.0)**

- Sistema modular implementado
- Validações robustas
- Interface responsiva
- Upload de arquivos

### **Próximas Fases**

- **v1.8.0**: Sistema de notificações
- **v1.9.0**: API REST para backend
- **v2.0.0**: PWA com offline support
- **v2.1.0**: Integração com calendários

## Contribuição

### **Como Contribuir**

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### **Padrões de Código**

- Use ES6+ features
- Mantenha a modularidade
- Documente funções complexas
- Teste em diferentes navegadores

## Suporte

### **Contato**

- **E-mail**: suporte@ppgd.edu.br
- **Telefone**: (11) 99999-9999
- **Horário**: Segunda a Sexta, 8h às 18h

### **Issues**

- Reporte bugs via GitHub Issues
- Inclua detalhes do ambiente
- Adicione screenshots quando possível

## Licença

Este projeto é desenvolvido para o PPGD FADISP. Todos os direitos reservados.

---

## Destaques do Projeto

- **Arquitetura Modular**: Código organizado e reutilizável
- **Validação Robusta**: Sistema de validação em tempo real
- **Design Responsivo**: Funciona perfeitamente em todos os dispositivos
- **Acessibilidade**: Navegação por teclado e screen readers
- **Performance**: Carregamento rápido e interações fluidas

**Desenvolvido com para a comunidade acadêmica**
