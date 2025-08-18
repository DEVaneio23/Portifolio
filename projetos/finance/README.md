# Dashboard Financeiro - Gerenciador de Finanças Pessoais

## Descrição

Aplicação web responsiva para gerenciamento de finanças pessoais, desenvolvida como PWA (Progressive Web App) com funcionalidades offline e interface moderna. Permite controle de receitas, despesas e categorização de gastos.

## Funcionalidades

### **Gestão Financeira**

- **Categorias**: Jogos, Alimentação, Transporte, Lazer, Saúde, Educação
- **Transações**: Adicionar, editar e remover receitas/despesas
- **Categorização**: Sistema inteligente de classificação automática
- **Filtros**: Por data, categoria, tipo e valor

### **Dashboard e Relatórios**

- **Visão Geral**: Resumo financeiro com gráficos
- **Estatísticas**: Balanço mensal e anual
- **Tendências**: Análise de gastos por período
- **Métricas**: Saldo atual e projeções

### **Recursos Técnicos**

- **PWA**: Funciona offline e pode ser instalado
- **Responsivo**: Design mobile-first
- **Local Storage**: Dados salvos localmente
- **Service Worker**: Cache inteligente

## Tecnologias Utilizadas

### **Frontend**

- **HTML5**: Estrutura semântica e acessível
- **CSS3**: Design responsivo com CSS Grid e Flexbox
- **JavaScript ES6+**: Lógica de negócio e interações
- **PWA**: Service Worker e Manifest

### **Bibliotecas Externas**

- **Moment.js**: Formatação e manipulação de datas
- **Numeral.js**: Formatação de valores monetários
- **Supabase**: Backend-as-a-Service (opcional)

### **Arquitetura**

- **Component-based**: Interface modular e reutilizável
- **State Management**: Gerenciamento de estado local
- **Event-driven**: Sistema de eventos para interações

## Como Executar

### **Pré-requisitos**

- Navegador moderno com suporte a PWA
- Servidor web local (recomendado)

### **Instalação**

1. Clone o repositório

```bash
git clone [URL_DO_REPOSITORIO]
cd projetos/finance
```

2. Instale as dependências (se houver)

```bash
npm install
```

3. Execute em um servidor web

```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# VS Code Live Server
# Instale a extensão e clique em "Go Live"
```

4. Acesse `http://localhost:8000`

### **Instalação como PWA**

1. Abra a aplicação no navegador
2. Clique no ícone de instalação na barra de endereços
3. A aplicação será instalada como app nativo

## Estrutura do Projeto

```
finance/
├── 📄 index.html              # Página principal
├── 📄 styles.css              # Estilos principais
├── 📄 script.js               # Lógica da aplicação
├── 📄 manifest.json           # Configuração PWA
├── 📄 sw.js                   # Service Worker
├── 📄 ios-cache-fix.js        # Correção para iOS
├── 📁 api/                    # APIs e serviços
│   ├── 📄 supabase.js         # Cliente Supabase
│   └── 📄 vendor/             # Bibliotecas externas
├── 📁 icons/                  # Ícones PWA
│   ├── 📄 icon-192.png        # Ícone 192x192
│   ├── 📄 icon-512.png        # Ícone 512x512
│   └── 📄 apple-icon-180.png  # Ícone Apple
└── 📄 README.md               # Este arquivo
```

## Design System

### **Paleta de Cores**

- **Primária**: `#667eea` (Azul)
- **Secundária**: `#764ba2` (Roxo)
- **Sucesso**: `#28a745` (Verde)
- **Erro**: `#dc3545` (Vermelho)
- **Aviso**: `#ffc107` (Amarelo)

### **Tipografia**

- **Fonte**: Segoe UI (sistema)
- **Hierarquia**: Títulos grandes, texto legível
- **Contraste**: Alto contraste para acessibilidade

### **Componentes**

- **Cards**: Glassmorphism com backdrop-filter
- **Botões**: Gradientes com hover effects
- **Formulários**: Validação visual em tempo real
- **Sidebar**: Navegação lateral responsiva

## Funcionalidades Técnicas

### **Sistema de Categorias**

- **Jogos**: Entretenimento e lazer
- **Alimentação**: Restaurantes e mercado
- **Transporte**: Combustível e passagens
- **Lazer**: Cinema, shows e eventos
- **Saúde**: Consultas e medicamentos
- **Educação**: Cursos e materiais

### **Gestão de Transações**

- **Adição**: Formulário com validação
- **Edição**: Modificação de transações existentes
- **Remoção**: Exclusão com confirmação
- **Busca**: Filtros avançados

### **Armazenamento Local**

- **LocalStorage**: Dados persistidos localmente
- **IndexedDB**: Para grandes volumes de dados
- **Cache**: Service Worker para funcionalidade offline

## Responsividade

### **Breakpoints**

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### **Adaptações**

- Sidebar colapsável em mobile
- Grid responsivo para transações
- Cards empilhados em telas pequenas
- Touch-friendly em dispositivos móveis

## Testes e Qualidade

### **Funcionalidades Testadas**

- ✅ Adição de transações
- ✅ Categorização automática
- ✅ Filtros e busca
- ✅ Responsividade
- ✅ Funcionamento offline
- ✅ Instalação PWA

### **Compatibilidade**

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (com limitações PWA)
- ✅ Mobile browsers

## Roadmap

### **Versão Atual (v1.0.5)**

- ✅ PWA funcional
- ✅ Gestão básica de transações
- ✅ Interface responsiva
- ✅ Armazenamento local

### **Próximas Versões**

- 🔄 **v1.1.0**: Sincronização com backend
- 🔄 **v1.2.0**: Relatórios avançados
- 🔄 **v1.3.0**: Metas financeiras
- 🔄 **v1.4.0**: Exportação de dados

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

- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 90+
- **SEO**: 85+

### **Core Web Vitals**

- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

## Segurança e Privacidade

### **Dados Locais**

- Todas as informações ficam no dispositivo
- Nenhum dado é enviado para servidores externos
- Criptografia local para dados sensíveis

### **Permissões**

- Apenas permissões essenciais para PWA
- Sem acesso a câmera ou localização
- Transparente sobre uso de dados

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

- **PWA Completo**: Funciona offline e pode ser instalado
- **Design Moderno**: Interface glassmorphism e responsiva
- **Performance**: Carregamento rápido e interações fluidas
- **Acessibilidade**: Navegação por teclado e screen readers
- **Modularidade**: Código organizado e reutilizável

**Desenvolvido com para controle financeiro pessoal**
