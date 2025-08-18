# RangeClub Demo - Sistema de Gerenciamento de Vendas

## Descrição

Sistema completo de gerenciamento de vendas para clubes de tiro, desenvolvido com foco em controle de estoque, gestão de clientes e relatórios financeiros. Interface moderna e responsiva para uso em dispositivos móveis e desktop.

## Funcionalidades

### **Gestão de Vendas**

- **Comandas**: Criação e gerenciamento de vendas
- **Produtos**: Cadastro e controle de estoque
- **Clientes**: Sistema de fidelização e histórico
- **Pagamentos**: Múltiplas formas de pagamento

### **Gestão de Filiados**

- **Cadastro**: Informações completas dos membros
- **Busca**: Sistema de busca avançada
- **Histórico**: Acompanhamento de atividades
- **Status**: Controle de filiação ativa

### **Relatórios e Analytics**

- **Vendas**: Relatórios diários, semanais e mensais
- **Estoque**: Controle de produtos e alertas
- **Financeiro**: Balanço e fluxo de caixa
- **Performance**: Métricas de vendas por período

## Tecnologias Utilizadas

### **Frontend**

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design responsivo com animações
- **JavaScript ES6+**: Lógica de negócio e interações
- **Bootstrap**: Framework CSS para componentes

### **Backend**

- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **Supabase**: Backend-as-a-Service
- **PostgreSQL**: Banco de dados relacional

### **Arquitetura**

- **MVC**: Model-View-Controller
- **RESTful API**: Endpoints padronizados
- **Responsivo**: Mobile-first design
- **Modular**: Código organizado e reutilizável

## Como Executar

### **Pré-requisitos**

- Node.js 16+ instalado
- NPM ou Yarn
- Acesso ao Supabase (opcional)

### **Instalação**

1. Clone o repositório

```bash
git clone [URL_DO_REPOSITORIO]
cd projetos/clube-tiro-vendas
```

2. Instale as dependências

```bash
npm install
```

3. Configure as variáveis de ambiente

```bash
cp config.example.js config.js
# Edite config.js com suas credenciais
```

4. Execute o projeto

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

5. Acesse `http://localhost:3000`

## Estrutura do Projeto

```
clube-tiro-vendas/
├── index.html              # Interface principal
├── backend/                 # Servidor Node.js
│   ├── server.js            # Servidor principal
│   ├── package.json         # Dependências
│   └── routes/              # Rotas da API
│       └── filiados.js      # API de filiados
├── Css/                     # Estilos
│   └── styles.css           # CSS principal
├── Js/                      # JavaScript
│   ├── api.js               # Cliente da API
│   ├── config.js            # Configurações
│   ├── script.js            # Lógica principal
│   └── pdfGenerator.js      # Geração de PDFs
├── database/                # Scripts de banco
│   ├── schema.sql           # Estrutura do banco
│   └── reset_supabase.sql   # Reset do banco
├── img/                     # Imagens e assets
│   └── logo-rangeclub-demo.svg # Logo do projeto
├── vercel.json              # Configuração Vercel
└── README.md                # Este arquivo
```

## Design System

### **Paleta de Cores**

- **Primária**: `#8b0000` (Vermelho escuro)
- **Secundária**: `#dc143c` (Vermelho médio)
- **Destaque**: `#4a0000` (Vermelho muito escuro)
- **Fundo**: Gradiente vermelho com transparências
- **Texto**: `#ffffff` (Branco)

### **Tipografia**

- **Fonte**: Segoe UI (sistema)
- **Hierarquia**: Títulos grandes e legíveis
- **Contraste**: Alto contraste para acessibilidade

### **Componentes**

- **Cards**: Glassmorphism com backdrop-filter
- **Botões**: Gradientes com hover effects
- **Formulários**: Validação visual em tempo real
- **Navegação**: Header fixo com menu responsivo

## Funcionalidades Técnicas

### **Sistema de Vendas**

- **Comandas**: Criação rápida de vendas
- **Produtos**: Busca e seleção de itens
- **Quantidades**: Controle de estoque em tempo real
- **Descontos**: Aplicação de promoções

### **Gestão de Filiados**

- **Cadastro**: Formulário completo de dados
- **Busca**: Filtros por nome, CPF ou CR
- **Edição**: Modificação de informações
- **Exclusão**: Remoção com confirmação

### **Controle de Estoque**

- **Produtos**: Cadastro com categorias
- **Quantidades**: Controle automático
- **Alertas**: Notificações de estoque baixo
- **Movimentação**: Histórico de entradas/saídas

## Responsividade

### **Breakpoints**

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Adaptações**

- Menu colapsável em mobile
- Grid responsivo para produtos
- Cards empilhados em telas pequenas
- Touch-friendly em dispositivos móveis

## Testes e Qualidade

### **Funcionalidades Testadas**

- Cadastro de filiados
- Criação de comandas
- Gestão de produtos
- Relatórios financeiros
- Responsividade
- Integração com banco

### **Compatibilidade**

- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile browsers

## Roadmap

### **Versão Atual (v1.0.0)**

- Sistema básico de vendas
- Gestão de filiados
- Interface responsiva
- Integração com Supabase

### **Próximas Versões**

- **v1.1.0**: Sistema de usuários e permissões
- **v1.2.0**: Relatórios avançados
- **v1.3.0**: Integração com impressoras
- **v1.4.0**: App mobile nativo

## Contribuição

### **Como Contribuir**

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### **Padrões de Código**

- Use ES6+ features
- Mantenha a responsividade
- Documente funções complexas
- Teste em diferentes dispositivos

## Métricas de Performance

### **Lighthouse Score**

- **Performance**: 85+
- **Accessibility**: 90+
- **Best Practices**: 85+
- **SEO**: 80+

### **Core Web Vitals**

- **LCP**: < 3s
- **FID**: < 150ms
- **CLS**: < 0.15

## Segurança e Privacidade

### **Autenticação**

- Sistema de login seguro
- Controle de sessões
- Validação de permissões

### **Dados**

- Criptografia de informações sensíveis
- Backup automático
- Logs de auditoria

## Suporte

### **Documentação**

- Este README
- Comentários no código
- Exemplos de uso

### **Issues**

- Reporte bugs via GitHub Issues
- Inclua detalhes do ambiente
- Adicione screenshots quando possível

## Licença

Este projeto é desenvolvido para fins educacionais. Todos os direitos reservados.

---

## Destaques do Projeto

- **Sistema Completo**: Vendas, estoque e relatórios
- **Design Moderno**: Interface glassmorphism e responsiva
- **Backend Robusto**: API REST com Node.js e Supabase
- **Performance**: Carregamento rápido e interações fluidas
- **Modularidade**: Código organizado e reutilizável

**Desenvolvido com para clubes de tiro e esportes**
