# Sistema de Agendamento de Bancas - Estrutura Modular

## Visão Geral

O sistema foi modularizado para melhorar a manutenibilidade, reutilização e organização do código. Cada módulo tem uma responsabilidade específica e pode ser desenvolvido/testado independentemente.

## Estrutura de Módulos

```
js/modules/
├── README.md              # Esta documentação
├── config.js              # Configurações globais do sistema
├── data.js                # Dados e constantes
├── validation.js          # Funções de validação
├── ui.js                  # Interface do usuário
├── members.js             # Gerenciamento de membros da banca
├── upload.js              # Sistema de upload de arquivos
└── form.js                # Lógica principal do formulário
```

## Descrição dos Módulos

### 1. `config.js` - Configurações Globais
**Responsabilidade:** Centralizar todas as configurações do sistema
- Configurações de desenvolvimento
- Configurações de validação
- Configurações de interface
- Configurações de performance
- Configurações de segurança

**Exemplo de uso:**
```javascript
import { VALIDATION_CONFIG, UI_CONFIG } from './config.js';

if (VALIDATION_CONFIG.CPF_ENABLE_MASK) {
  // Aplicar máscara de CPF
}
```

### 2. `data.js` - Dados e Constantes
**Responsabilidade:** Centralizar todos os dados estáticos do sistema
- Lista de professores internos
- Projetos de pesquisa
- Campos obrigatórios
- Mensagens de erro/sucesso
- Configurações do sistema

**Exemplo de uso:**
```javascript
import { PROFESSORES_INTERNOS, MENSAGENS } from './data.js';

const professor = PROFESSORES_INTERNOS.find(p => p.id === 1);
showAlert('erro', MENSAGENS.ERRO.CPF_INVALIDO);
```

### 3. `validation.js` - Validações
**Responsabilidade:** Todas as funções de validação do sistema
- Validação de CPF
- Validação de email
- Validação de datas
- Validação de arquivos
- Validação de resumo

**Exemplo de uso:**
```javascript
import { validarCPF, validarEmail } from './validation.js';

if (validarCPF(cpf) && validarEmail(email)) {
  // Dados válidos
}
```

### 4. `ui.js` - Interface do Usuário
**Responsabilidade:** Elementos visuais e interação com o usuário
- Gerenciamento de alertas
- Barra de progresso
- Checklist
- Formatação de dados
- Máscaras de input

**Exemplo de uso:**
```javascript
import { showAlert, atualizarProgresso } from './ui.js';

showAlert('erro', 'Mensagem de erro', 'error');
atualizarProgresso(camposObrigatorios);
```

### 5. `members.js` - Membros da Banca
**Responsabilidade:** Gerenciamento de membros internos e externos
- Inicialização de membros internos
- Gerenciamento de membros externos
- Validação de composição da banca
- Regras de negócio para membros

**Exemplo de uso:**
```javascript
import { inicializarMembrosInternos } from './members.js';

inicializarMembrosInternos();
```

### 6. `upload.js` - Upload de Arquivos
**Responsabilidade:** Sistema de upload e gerenciamento de arquivos
- Validação de arquivos PDF
- Drag and drop
- Preview de arquivos
- Compressão de arquivos

**Exemplo de uso:**
```javascript
import { inicializarUpload, validarArquivoUpload } from './upload.js';

inicializarUpload();
const resultado = validarArquivoUpload(arquivo);
```

### 7. `form.js` - Lógica Principal
**Responsabilidade:** Orquestração de todos os módulos
- Inicialização de todos os componentes
- Gerenciamento de eventos
- Validação final do formulário
- Submissão dos dados

**Exemplo de uso:**
```javascript
import { inicializarFormulario } from './form.js';

inicializarFormulario();
```

## Arquivo Principal

O arquivo `formulario-modular.js` é o ponto de entrada principal que importa e inicializa todos os módulos:

```javascript
import { inicializarFormulario } from './modules/form.js';

document.addEventListener('DOMContentLoaded', function() {
  inicializarFormulario();
});
```

## Vantagens da Modularização

### 1. **Manutenibilidade**
- Código organizado por responsabilidade
- Fácil localização de funcionalidades
- Redução de dependências circulares

### 2. **Reutilização**
- Módulos podem ser reutilizados em outras partes do sistema
- Fácil importação de funcionalidades específicas
- Redução de duplicação de código

### 3. **Testabilidade**
- Cada módulo pode ser testado independentemente
- Isolamento de responsabilidades
- Facilita testes unitários

### 4. **Escalabilidade**
- Fácil adição de novos módulos
- Modificação de módulos sem afetar outros
- Configuração flexível

### 5. **Performance**
- Carregamento sob demanda (lazy loading)
- Redução de código desnecessário
- Melhor cache do navegador

## Migração do Sistema Original

Para migrar do sistema original para o modular:

1. **Substitua o script no HTML:**
```html
<!-- Antes -->
<script src="../js/formulario.js"></script>

<!-- Depois -->
<script type="module" src="../js/formulario-modular.js"></script>
```

2. **Atualize as referências:**
- Todas as funções agora são importadas dos módulos
- Configurações centralizadas no `config.js`
- Dados centralizados no `data.js`

3. **Teste a funcionalidade:**
- Verifique se todas as validações funcionam
- Teste o upload de arquivos
- Confirme a seleção de membros da banca

## Configuração

As configurações podem ser facilmente modificadas no arquivo `config.js`:

```javascript
// Exemplo: Desabilitar animações
UI_CONFIG.ENABLE_ANIMATIONS = false;

// Exemplo: Alterar tamanho máximo de arquivo
VALIDATION_CONFIG.FILE_MAX_SIZE = 5 * 1024 * 1024; // 5MB
```

## Desenvolvimento

Para adicionar novas funcionalidades:

1. **Identifique o módulo apropriado**
2. **Adicione a funcionalidade no módulo**
3. **Exporte a função se necessário**
4. **Importe no módulo que precisa usar**
5. **Teste a funcionalidade**

## Troubleshooting

### Problemas Comuns

1. **Erro de importação:**
   - Verifique se o script tem `type="module"`
   - Confirme que os caminhos dos imports estão corretos

2. **Função não encontrada:**
   - Verifique se a função está sendo exportada
   - Confirme se está sendo importada corretamente

3. **Configuração não aplicada:**
   - Verifique se a configuração está sendo importada
   - Confirme se está sendo usada no código

### Debug

Para debug, use o console do navegador:

```javascript
// Verificar se os módulos estão carregados
console.log('Módulos carregados:', import.meta.url);

// Verificar configurações
import { VALIDATION_CONFIG } from './modules/config.js';
console.log('Configurações:', VALIDATION_CONFIG);
```

## Próximos Passos

1. **Implementar testes unitários** para cada módulo
2. **Adicionar documentação JSDoc** completa
3. **Implementar sistema de logging** estruturado
4. **Adicionar validação de tipos** com TypeScript
5. **Implementar sistema de cache** para melhor performance 