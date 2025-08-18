#  **DOCUMENTAÇÃO TÉCNICA - SISTEMA DE AGENDAMENTO DE BANCAS**

##  **VISÃO GERAL DO PROJETO**

### **Objetivo Principal**

Sistema web para agendamento de bancas de qualificação e defesa de programas de pós-graduação em Direito.

### **Público-Alvo**

- **Alunos**: Pós-graduandos que precisam agendar bancas
- **Professores**: Membros de bancas e orientadores

### **Escopo do Sistema**

- Agendamento de bancas de qualificação e defesa
- Gestão de membros internos e externos
- Upload e validação de trabalhos acadêmicos
- Sistema de autenticação e autorização
- Dashboard para acompanhamento de agendamentos

##  **ARQUITETURA DO SISTEMA**

### **Padrão Arquitetural**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (CLIENT-SIDE)                   │
├─────────────────────────────────────────────────────────────┤
│  HTML5 + CSS3 + JavaScript ES6+ (Módulos)                   │
│  • Interface responsiva                                     │
│  • Validação em tempo real                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS
                              │
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (SERVER-SIDE)                    │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Express.js                                       │
│  • API RESTful                                              │
│  • Middleware de segurança                                  │
│  • Autenticação JWT                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ MongoDB
                              │
┌─────────────────────────────────────────────────────────────┐
│                    BANCO DE DADOS                           │
├─────────────────────────────────────────────────────────────┤
│  MongoDB                                                    │
│  • Coleções: usuários, agendamentos, bancas                 │
└─────────────────────────────────────────────────────────────┘
```

### **Princípios de Design**

1. **Separação de Responsabilidades**: Frontend, Backend e Dados isolados
2. **Modularidade**: Código organizado em módulos reutilizáveis
3. **Responsividade**: Interface adaptável a diferentes dispositivos
4. **Segurança**: Múltiplas camadas de proteção

## 🎨 **FRONTEND - IMPLEMENTAÇÃO**

### **Estrutura de Arquivos**

```
js/
├── modules/                    # Módulos ES6 organizados por funcionalidade
│   ├── auth.js               # Autenticação e autorização
│   ├── data.js               # Dados e configurações do sistema
│   ├── form.js               # Lógica do formulário principal
│   ├── members.js            # Gerenciamento de membros da banca
│   ├── ui.js                 # Interface do usuário e componentes
│   ├── upload.js             # Sistema de upload de arquivos
│   └── validation.js         # Validações e regras de negócio
├── formulario.js             # Script principal do formulário
├── dashboard-professor.js     # Dashboard dos professores
├── login-professor.js         # Sistema de login
└── suporte.js                # Funcionalidades de suporte
```

### **Tecnologias Frontend**

#### **HTML5 Semântico**

- **Estrutura**: Uso de tags semânticas (`<header>`, `<main>`, `<section>`)
- **Acessibilidade**: ARIA labels e estrutura hierárquica

#### **CSS3 Avançado**

```css
/* Sistema de variáveis CSS para consistência */
:root {
  --primary: #59110b; /* Vermelho escuro principal */
  --secondary: #7f1c14; /* Vermelho médio secundário */
  --accent: #9f2e1c; /* Vermelho claro de destaque */
  --text: #333; /* Cor do texto principal */
}

/* Design responsivo com breakpoints */
@media (max-width: 768px) {
  .header {
    flex-direction: column;
  }
  .programs-container {
    grid-template-columns: 1fr;
  }
}
```

#### **JavaScript ES6+ Modular**

```javascript
// Sistema de módulos ES6
import { PROFESSORES_INTERNOS, CAMPOS_OBRIGATORIOS } from "./data.js";
import { validarFormulario, mostrarErro } from "./validation.js";

// Classes para organização do código
class FormularioManager {
  constructor() {
    this.campos = new Map();
    this.validacoes = new Set();
  }

  adicionarCampo(id, tipo, validacao) {
    this.campos.set(id, { tipo, validacao });
  }
}
```

### **Componentes da Interface**

#### **1. Header de Navegação**

- **Logo institucional** com identidade visual
- **Menu responsivo** com navegação principal

#### **2. Formulário de Agendamento**

- **Validação em tempo real** com feedback visual
- **Progress bar** mostrando campos preenchidos
- **Upload de arquivos** com drag & drop
- **Seleção de membros** com filtros inteligentes

#### **3. Dashboard do Professor**

- **Visão geral** das bancas participadas
- **Filtros avançados** por data, tipo e status

## **BACKEND - SERVIDOR E API**

### **Stack Tecnológica**

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Banco de Dados**: MongoDB com Mongoose
- **Autenticação**: JWT (JSON Web Tokens)
- **Segurança**: Helmet, CORS, Rate Limiting

### **Estrutura do Servidor**

```javascript
// server.js - Arquivo principal
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

// Middleware de segurança
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
  })
);

// Rate limiting para proteção
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
});
app.use("/api/", limiter);
```

### **Arquitetura da API**

#### **Rotas Organizadas por Recurso**

```
/api/
├── auth/                     # Autenticação
│   ├── POST /login          # Login do usuário
│   ├── POST /refresh        # Renovação de token
│   └── POST /logout         # Logout
├── agendamentos/            # Gestão de agendamentos
│   ├── GET /                # Listar agendamentos
│   ├── POST /               # Criar novo agendamento
│   ├── PUT /:id             # Atualizar agendamento
│   └── DELETE /:id          # Cancelar agendamento
├── professores/             # Gestão de professores
│   ├── GET /                # Listar professores
│   └── GET /:id             # Detalhes do professor
└── uploads/                 # Sistema de arquivos
    ├── POST /               # Upload de arquivo
    └── GET /:filename       # Download de arquivo
```

#### **Middleware de Segurança**

```javascript
// middleware/auth.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      error: "Token de acesso necessário",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: "Token inválido ou expirado",
    });
  }
};
```

### **Modelos de Dados (MongoDB)**

#### **Schema de Agendamento**

```javascript
// models/Agendamento.js
const agendamentoSchema = new mongoose.Schema({
  protocolo: {
    type: String,
    required: true,
    unique: true,
    default: () => gerarProtocolo(),
  },
  aluno: {
    nome: { type: String, required: true },
    email: { type: String, required: true },
    cpf: { type: String, required: true },
    curso: { type: String, enum: ["mestrado", "doutorado"], required: true },
  },
  banca: {
    tipo: { type: String, enum: ["qualificacao", "defesa"], required: true },
    modalidade: {
      type: String,
      enum: ["presencial", "online"],
      required: true,
    },
    data: { type: Date, required: true },
    hora: { type: String, required: true },
  },
  membros: {
    orientador: { type: String, required: true },
    internos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Professor" }],
    externos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Professor" }],
  },
  trabalho: {
    titulo: { type: String, required: true },
    resumo: { type: String, required: true, minlength: 100 },
    palavrasChave: [{ type: String }],
    arquivo: { type: String, required: true },
  },
  status: {
    type: String,
    enum: ["pendente", "aprovado", "rejeitado", "cancelado"],
    default: "pendente",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
```

##  **SISTEMA DE SEGURANÇA**

### **Camadas de Proteção**

#### **1. Autenticação JWT**

- **Tokens de acesso** com expiração configurável
- **Refresh tokens** para renovação automática

#### **2. Autorização Baseada em Roles**

```javascript
const roles = {
  ADMIN: ["create", "read", "update", "delete"],
  PROFESSOR: ["read", "update"],
  ALUNO: ["create", "read"],
};

const checkPermission = (action) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    if (roles[userRole]?.includes(action)) {
      next();
    } else {
      res.status(403).json({ error: "Acesso negado" });
    }
  };
};
```

#### **3. Proteção contra Ataques**

- **Helmet**: Headers de segurança HTTP
- **CORS**: Controle de origens permitidas
- **Rate Limiting**: Proteção contra DDoS

## 📊 **REGRAS DE NEGÓCIO IMPLEMENTADAS**

### **Composição da Banca**

#### **Mestrado**

- **Total de membros**: 3 (orientador + 2 membros)
- **Membros externos**: 1 obrigatório
- **Diversidade**: Mínimo 1 mulher

#### **Doutorado**

- **Total de membros**: 5 (orientador + 4 membros)
- **Membros externos**: 2 obrigatórios
- **Diversidade**: Mínimo 1 mulher

### **Validações de Negócio**

#### **Datas e Horários**

```javascript
const validarDataHora = (data, hora) => {
  const dataAgendamento = new Date(data + "T" + hora);
  const hoje = new Date();

  // Mínimo 15 dias de antecedência
  const diasMinimos = 15;
  const dataMinima = new Date(
    hoje.getTime() + diasMinimos * 24 * 60 * 60 * 1000
  );

  if (dataAgendamento < dataMinima) {
    throw new Error(
      `Agendamento deve ser feito com pelo menos ${diasMinimos} dias de antecedência`
    );
  }

  // Horário comercial (8h às 18h)
  const horaNum = parseInt(hora.split(":")[0]);
  if (horaNum < 8 || horaNum >= 18) {
    throw new Error("Horário deve ser entre 8h e 18h");
  }

  // Não permitir finais de semana
  const diaSemana = dataAgendamento.getDay();
  if (diaSemana === 0 || diaSemana === 6) {
    throw new Error("Não é possível agendar para finais de semana");
  }
};
```

#### **Arquivos e Documentos**

- **Formato**: Apenas PDF
- **Tamanho máximo**: 10MB

#### **Diversidade de Gênero**

```javascript
const validarDiversidadeGenero = (membrosInternos, membrosExternos) => {
  const todosMembros = [...membrosInternos, ...membrosExternos];
  const mulheres = todosMembros.filter((m) => m.genero === "feminino");

  if (mulheres.length === 0) {
    throw new Error("É necessário selecionar pelo menos uma mulher na banca");
  }

  return true;
};
```

## **CONCLUSÕES**

### **Sucessos Alcançados**

1. **Arquitetura robusta** com separação clara de responsabilidades
2. **Interface intuitiva** com validação em tempo real
3. **Sistema seguro** com múltiplas camadas de proteção
4. **Código limpo** e bem documentado

### **Valor para o Portfólio**

- **Demonstra competências** técnicas completas
- **Mostra boas práticas** de desenvolvimento
- **Exibe conhecimento** de tecnologias modernas
- **Apresenta solução** para problema real

---

**Documentação gerada em**: julho de 2025  
**Versão**: 1.0.0  
**Responsável**: Desenvolvedor Anderson
