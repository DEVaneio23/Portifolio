/**
 * Arquivo principal do frontend (RangeClub Demo)
 * Mantém tudo funcionando no navegador (sem backend) no modo DEMO
 */
// Lista inicial de produtos de exemplo (modo DEMO sem servidor)
// Dados de exemplo (DEMO) — carregados quando não há Supabase ativo
let produtos = [
  { id: 1, nome: "Munição .38 (DEMO)", precoFiliado: 2.5, precoNaoFiliado: 3.0 },
  { id: 2, nome: "Munição 9mm (DEMO)", precoFiliado: 2.8, precoNaoFiliado: 3.3 },
  { id: 3, nome: "Munição .40 (DEMO)", precoFiliado: 3.2, precoNaoFiliado: 3.8 },
  { id: 4, nome: "Aluguel Arma (DEMO)", precoFiliado: 15.0, precoNaoFiliado: 20.0 },
  { id: 5, nome: "Protetor Auricular (DEMO)", precoFiliado: 5.0, precoNaoFiliado: 7.0 },
  { id: 6, nome: "Óculos de Proteção (DEMO)", precoFiliado: 3.0, precoNaoFiliado: 5.0 }
];

// Lista de filiados de exemplo (modo DEMO)
let filiados = [
  { id: 1, nome: "Ana Vitória", cpf: "123.456.789-00", cr: "CR102938", telefone: "(11) 90000-0001", email: "ana.vitoria@demo.dev", dataCadastro: "2024-01-15" },
  { id: 2, nome: "Bruno Ferreira", cpf: "987.654.321-00", cr: "CR564738", telefone: "(21) 98888-8802", email: "bruno.ferreira@demo.dev", dataCadastro: "2024-02-20" },
  { id: 3, nome: "Carla Menezes", cpf: "456.789.123-00", cr: "CR918273", telefone: "(31) 97777-7703", email: "carla.menezes@demo.dev", dataCadastro: "2024-03-10" }
];

// Comandas ficam nesta variável enquanto a página estiver aberta
let comandas = [];
let proximoIdComanda = 1;
let proximoIdProduto = 7;
let proximoIdFiliado = 4;
let comandaAtual = null;
let filiadoSelecionado = null;

// Controle de visualização por comanda
const visualizacaoPorComanda = {};

// Salva o estado visual no navegador (localStorage)
function saveVisualState() {
  try {
    localStorage.setItem(
      "clubeTiroVisual",
      JSON.stringify(visualizacaoPorComanda)
    );
  } catch (_) {}
}

// Carrega o estado visual salvo anteriormente
function loadVisualState() {
  try {
    const raw = localStorage.getItem("clubeTiroVisual");
    if (raw) {
      const obj = JSON.parse(raw);
      Object.keys(obj || {}).forEach((k) => {
        visualizacaoPorComanda[k] = obj[k];
      });
    }
  } catch (_) {}
}

// Gera um id aleatório para itens
function genEntryId() {
  return (
    "e" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  );
}

// Integração com Supabase (opcional)
// Se o Supabase estiver ligado, usa banco; senão, fica no modo DEMO
const USE_DB = typeof window !== "undefined" && window.DB && window.DB.isEnabled;

// Converte produto do banco para o formato da tela
function mapDbProdutoToApp(row) {
  return {
    id: row.id,
    nome: row.nome,
    precoFiliado: Number.parseFloat(row.preco_filiado),
    precoNaoFiliado: Number.parseFloat(row.preco_nao_filiado),
    ativo: row.ativo !== false,
  };
}

// Converte produto da tela para o formato do banco
function mapAppProdutoToDb(prod) {
  return {
    nome: prod.nome,
    preco_filiado: prod.precoFiliado,
    preco_nao_filiado: prod.precoNaoFiliado,
    ativo: true,
  };
}

// Converte filiado do banco para o formato da tela
function mapDbFiliadoToApp(row) {
  return {
    id: row.id,
    nome: row.nome,
    cpf: row.cpf,
    cr: row.cr,
    telefone: row.telefone || "",
    email: row.email || "",
    dataCadastro: row.data_cadastro
      ? new Date(row.data_cadastro).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  };
}

function mapDbComandaToApp(row) {
  console.log('[DEBUG] Mapeando comanda do banco:', row);
  
  const comanda = {
    id: row.id,
    cliente: {
      nome: row.cliente_nome,
      cpf: row.cliente_cpf,
      cr: row.cliente_cr,
      filiado: !!row.cliente_filiado,
      filiadoId: row.filiado_id || null,
    },
    itens: [],
    total: Number.parseFloat(row.total || 0),
    formaPagamento: row.forma_pagamento || null,
    dataAbertura: row.data_abertura ? new Date(row.data_abertura) : new Date(),
    status: row.status || "aberta",
  };
  
  console.log('[DEBUG] Comanda mapeada:', comanda);
  return comanda;
}

async function carregarDadosDoSupabase() {
  try {
    const produtosDb = await window.DB.list("produtos");
    if (Array.isArray(produtosDb)) {
      produtos = produtosDb
        .filter((p) => p.ativo !== false)
        .map(mapDbProdutoToApp);
      const maxProdId = produtos.reduce((m, p) => Math.max(m, p.id || 0), 0);
      if (maxProdId > 0) proximoIdProduto = maxProdId + 1;
    }
  } catch (e) {
    console.error("[DB] Erro ao carregar produtos:", e);
  }
  try {
    const filiadosDb = await window.DB.list("filiados");
    if (Array.isArray(filiadosDb)) {
      filiados = filiadosDb.map(mapDbFiliadoToApp);
      const maxFilId = filiados.reduce((m, f) => Math.max(m, f.id || 0), 0);
      if (maxFilId > 0) proximoIdFiliado = maxFilId + 1;
    }
  } catch (e) {
    console.error("[DB] Erro ao carregar filiados:", e);
  }
  try {
    const comandasDb = await window.DB.list("comandas");
    const todas = Array.isArray(comandasDb) ? comandasDb : [];
    comandas = todas.map(mapDbComandaToApp);
    const itensDb = await window.DB.list("itens_comanda");
    if (Array.isArray(itensDb)) {
      comandas.forEach((c) => {
        const itens = itensDb.filter((i) => i.comanda_id === c.id);
        c.itens = itens.map((i) => ({
          produtoId: i.produto_id,
          nome: i.produto_nome,
          preco: Number.parseFloat(i.preco),
          quantidade: i.quantidade,
          subtotal: Number.parseFloat(i.subtotal),
        }));
        c.total = c.itens.reduce((t, it) => t + it.subtotal, 0);
      });
    }
    const maxComId = comandas.reduce((m, c) => Math.max(m, c.id || 0), 0);
    if (maxComId > 0) proximoIdComanda = maxComId + 1;
  } catch (e) {
    console.error("[DB] Erro ao carregar comandas:", e);
  }
}

async function carregarItensDaComandaDoSupabase(comanda) {
  try {
    const itensDb = await window.DB.list("itens_comanda");
    console.log(`[DEBUG] Todos os itens do banco:`, itensDb);
    
    const itens = Array.isArray(itensDb)
      ? itensDb.filter((i) => i.comanda_id === comanda.id)
      : [];
    console.log(`[DEBUG] Itens filtrados para comanda ${comanda.id}:`, itens);
    
    comanda.itens = itens.map((i) => ({
      produtoId: i.produto_id,
      nome: i.produto_nome,
      preco: Number.parseFloat(i.preco),
      quantidade: i.quantidade,
      subtotal: Number.parseFloat(i.subtotal),
    }));
    console.log(`[DEBUG] Itens mapeados para comanda ${comanda.id}:`, comanda.itens);
    
    // Atualizar o total da comanda
    comanda.total = comanda.itens.reduce((total, item) => total + item.subtotal, 0);
  } catch (e) {
    console.error("[DB] Erro ao carregar itens da comanda:", e);
  }
}

async function atualizarTotalDaComandaNoSupabase(comanda) {
  try {
    await window.DB.update(
      "comandas",
      { id: comanda.id },
      { total: comanda.total }
    );
  } catch (e) {
    console.error("[DB] Erro ao atualizar total da comanda:", e);
  }
}

// Formas de pagamento disponíveis
const formasPagamento = [
  { id: "dinheiro", nome: "Dinheiro", descricao: "Pagamento em espécie" },
  {
    id: "credito",
    nome: "Cartão de Crédito",
    descricao: "Visa, Mastercard, etc.",
  },
  { id: "debito", nome: "Cartão de Débito", descricao: "Débito automático" },
  { id: "pix", nome: "PIX", descricao: "Transferência instantânea" },
  { id: "transferencia", nome: "Transferência Bancária", descricao: "TED/DOC" },
  { id: "boleto", nome: "Boleto Bancário", descricao: "Pagamento via boleto" },
];

// Utils CPF
function normalizeCpf(cpfStr) {
  return (cpfStr || "").replace(/\D/g, "");
}

function formatCpf(cpfDigits) {
  const d = normalizeCpf(cpfDigits);
  if (d.length !== 11) return cpfDigits || "";
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function escapeHtml(value) {
  const str = String(value ?? "");
  return str.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return ch;
    }
  });
}

function isComandaAberta() {
  return !!(comandaAtual && comandaAtual.status === "aberta");
}

function isValidCpf(cpfStr) {
  const cpf = normalizeCpf(cpfStr);
  if (!cpf || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.charAt(10));
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email || "").toLowerCase());
}

function isValidPhone(brPhone) {
  const digits = (brPhone || "").replace(/\D/g, "");
  return digits.length === 11 || digits.length === 10;
}

function showVisualFeedback(element, message, type = "success") {
  console.log(`[${type.toUpperCase()}] ${message}`);
  if (type === "success" && element) {
    element.classList.add("feedback-success");
    setTimeout(() => {
      element.classList.remove("feedback-success");
    }, 1500);
  }
}

function findRelatedElement(action, data) {
  switch (action) {
    case "comanda":
      return (
        document.querySelector(`[data-comanda-id="${data}"]`) ||
        document.querySelector(".comanda-item:last-child")
      );
    case "produto":
      return (
        document.querySelector(`[data-produto-id="${data}"]`) ||
        document.querySelector(".produto-item:last-child")
      );
    case "filiado":
      return (
        document.querySelector(`[data-filiado-id="${data}"]`) ||
        document.querySelector(".filiados-section")
      );
    case "form":
      return document.querySelector("form");
    default:
      return null;
  }
}

// Feedback visual para produtos adicionados
function showProductAddedFeedback(produtoNome) {
  const produtoCards = document.querySelectorAll(".produto-card");
  produtoCards.forEach((card) => {
    if (card.textContent.includes(produtoNome)) {
      showVisualFeedback(
        card,
        `${produtoNome} foi adicionado à comanda!`,
        "success"
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  if (USE_DB) {
    await carregarDadosDoSupabase();
  } else {
    carregarDados();
  }
  loadVisualState();
  configurarEventos();
  atualizarListaProdutos();
  await atualizarComandasAbertas();

  document.getElementById("cpf").addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = value;
  });

  document.getElementById("cpfFiliado").addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    e.target.value = value;
  });

  document.getElementById("telefoneFiliado").addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(\d{2})(\d)/, "($1) $2");
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    e.target.value = value;
  });

  window.addEventListener("resize", () => {
    document.querySelectorAll(".quantidade-input").forEach((input) => {
      ajustarTamanhoInput(input);
    });
  });
});

function debounce(fn, delay = 250) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), delay);
  };
}

const buscarFiliadosDebounced = debounce((termo) => buscarFiliados(termo), 300);

function configurarEventos() {
  document.getElementById("clienteForm").addEventListener("submit", (e) => {
    e.preventDefault();
    criarNovaComanda();
  });

  document.getElementById("produtoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    adicionarProduto();
  });

  document.getElementById("buscarFiliado").addEventListener("input", (e) => {
    const term = e.target.value;
    renderBuscaFiliadosLoading();
    buscarFiliadosDebounced(term);
  });

  // Fechar painel de resultados ao clicar fora
  document.addEventListener("click", (ev) => {
    const panel = document.getElementById("buscarFiliadoResultados");
    const input = document.getElementById("buscarFiliado");
    if (!panel || !input) return;
    if (!panel.contains(ev.target) && ev.target !== input) {
      panel.classList.remove("open");
      panel.innerHTML = "";
    }
  });

  // Seleção de filiado
  document.getElementById("listaFiliados").addEventListener("change", (e) => {
    selecionarFiliado(e.target.value);
  });

  // Formulário de filiado
  document.getElementById("filiadoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    adicionarFiliado();
  });

  // Botões de backup (se existirem no HTML)
  const exportBtn = document.getElementById("exportarDadosBtn");
  const importBtn = document.getElementById("importarDadosBtn");
  const importFile = document.getElementById("importarDadosFile");
  if (exportBtn) exportBtn.onclick = exportarBackupJSON;
  if (importBtn && importFile) {
    importBtn.onclick = () => importFile.click();
    importFile.onchange = importarBackupJSON;
  }
}

// Alterna seção ativa e atualiza dados
function showSection(sectionName, buttonEl) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  document.getElementById(sectionName).classList.add("active");

  if (buttonEl) {
    buttonEl.classList.add("active");
  }

  if (sectionName === "comandas") {
    atualizarComandasAbertas();
  } else if (sectionName === "produtos") {
    atualizarListaProdutos();
  } else if (sectionName === "cadastro") {
    atualizarListaFiliados();
  } else if (sectionName === "filiados") {
    atualizarListaFiliadosGerenciamento();
  }
}

function buscarFiliados(termo) {
  const termoBusca = (termo || "").trim().toLowerCase();
  if (!USE_DB) {
    const filiadosFiltrados = filiados.filter(
      (filiado) =>
        filiado.nome.toLowerCase().includes(termoBusca) ||
        filiado.cpf.replace(/\D/g, "").includes(termoBusca) ||
        filiado.cr.toLowerCase().includes(termoBusca)
    );
    atualizarListaFiliados(filiadosFiltrados);
    return;
  }
  (async () => {
    try {
      if (!termoBusca) {
        atualizarListaFiliados(filiados);
        return;
      }
      const data = await window.DB.searchFiliados(termoBusca);
      const list = Array.isArray(data) ? data.map(mapDbFiliadoToApp) : [];
      atualizarListaFiliados(list);
    } catch (e) {
      console.error("[DB] Erro na busca de filiados:", e);
    }
  })();
}

function renderBuscaFiliadosLoading() {
  const panel = document.getElementById("buscarFiliadoResultados");
  if (!panel) return;
  panel.classList.add("open");
  panel.innerHTML = `<div class="autocomplete-loading">Buscando...</div>`;
}

function renderPainelResultadosFiliados(list) {
  const panel = document.getElementById("buscarFiliadoResultados");
  if (!panel) return;
  const term = (document.getElementById("buscarFiliado")?.value || "").trim();
  if (!term) {
    panel.classList.remove("open");
    panel.innerHTML = "";
    return;
  }
  panel.classList.add("open");
  if (!list || list.length === 0) {
    panel.innerHTML = `<div class="autocomplete-empty">Sem resultados</div>`;
    return;
  }
  panel.innerHTML = list
    .map(
      (f) => `
    <div class="autocomplete-item" data-filiado-id="${f.id}">
      <div class="autocomplete-name">${f.nome}</div>
      <div class="autocomplete-meta">CPF: ${f.cpf} • CR: ${f.cr}</div>
    </div>
  `
    )
    .join("");
  panel.querySelectorAll(".autocomplete-item").forEach((item) => {
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-filiado-id");
      if (!id) return;
      // Preenche seleção e formulário
      const select = document.getElementById("listaFiliados");
      if (select) {
        select.value = id;
        selecionarFiliado(id);
      }
      panel.classList.remove("open");
      panel.innerHTML = "";
      const input = document.getElementById("buscarFiliado");
      if (input) input.value = "";
    });
  });
}

function atualizarListaFiliados(filiadosParaMostrar = filiados) {
  const container = document.getElementById("listaFiliados");

  container.innerHTML = '<option value="">Selecione um filiado...</option>';

  filiadosParaMostrar.forEach((filiado) => {
    const option = document.createElement("option");
    option.value = filiado.id;
    option.textContent = `${filiado.nome} - ${filiado.cpf}`;
    container.appendChild(option);
  });

  // Render painel de autocomplete (resultado rápido)
  renderPainelResultadosFiliados(filiadosParaMostrar);
}

function selecionarFiliado(filiadoId) {
  if (!filiadoId) {
    filiadoSelecionado = null;
    limparFormularioCliente();
    return;
  }

  const filiado = filiados.find((f) => f.id == filiadoId);
  if (!filiado) return;

  filiadoSelecionado = filiado;

  // Preencher formulário automaticamente
  document.getElementById("nome").value = filiado.nome;
  document.getElementById("cpf").value = filiado.cpf;
  document.getElementById("cr").value = filiado.cr;
  document.getElementById("filiado").value = "true";

  // Desabilitar campos para filiados
  document.getElementById("nome").disabled = true;
  document.getElementById("cpf").disabled = true;
  document.getElementById("cr").disabled = true;
  document.getElementById("filiado").disabled = true;

  const filiadosSection = document.querySelector(".filiados-section");
  showVisualFeedback(
    filiadosSection,
    `${filiado.nome} foi selecionado automaticamente!`,
    "success"
  );
}

function limparFormularioCliente() {
  document.getElementById("nome").disabled = false;
  document.getElementById("cpf").disabled = false;
  document.getElementById("cr").disabled = false;
  document.getElementById("filiado").disabled = false;

  document.getElementById("nome").value = "";
  document.getElementById("cpf").value = "";
  document.getElementById("cr").value = "";
  document.getElementById("filiado").value = "";
  document.getElementById("buscarFiliado").value = "";
  document.getElementById("listaFiliados").value = "";
}

function adicionarFiliado() {
  const nome = document.getElementById("nomeFiliado").value;
  const cpfInput = document.getElementById("cpfFiliado").value;
  const cpf = normalizeCpf(cpfInput);
  const cr = document.getElementById("crFiliado").value;
  const telefone = document.getElementById("telefoneFiliado").value;
  const email = document.getElementById("emailFiliado").value;
  const errorBox = document.getElementById("filiadoFormErrors");
  if (errorBox) errorBox.textContent = "";

  // Validação
  if (!nome || !cpf || !cr || !telefone || !email) {
    console.log(
      "[ERROR] Erro no Cadastro: Por favor, preencha todos os campos do filiado."
    );
    return;
  }
  if (!isValidCpf(cpf)) {
    const msg = "CPF inválido.";
    console.log("[ERROR]", msg);
    if (errorBox) errorBox.textContent = msg;
    return;
  }
  if (!isValidEmail(email)) {
    const msg = "E-mail inválido.";
    console.log("[ERROR]", msg);
    if (errorBox) errorBox.textContent = msg;
    return;
  }
  if (!isValidPhone(telefone)) {
    const msg = "Telefone inválido. Use (00) 00000-0000.";
    console.log("[ERROR]", msg);
    if (errorBox) errorBox.textContent = msg;
    return;
  }

  // Verificar se CPF já existe (comparando normalizado)
  const cpfExistente = filiados.find((f) => normalizeCpf(f.cpf) === cpf);
  if (cpfExistente) {
    const msg = "CPF já cadastrado.";
    console.log("[ERROR]", msg);
    if (errorBox) errorBox.textContent = msg;
    return;
  }

  console.log("[INFO] Adicionando filiado...");

  if (USE_DB) {
    (async () => {
      try {
        // checar duplicidade no Supabase também
        const existing = await window.DB.listWhere("filiados", {
          cpf: normalizeCpf(cpf),
        });
        if (Array.isArray(existing) && existing.length > 0) {
          const msg = "CPF já cadastrado no banco.";
          console.log("[ERROR]", msg);
          if (errorBox) errorBox.textContent = msg;
          return;
        }
        const payload = {
          nome: nome,
          cpf: normalizeCpf(cpf),
          cr: cr,
          telefone: telefone,
          email: email,
        };
        const data = await window.DB.insert("filiados", payload);
        const inserted = Array.isArray(data) ? data[0] : data;
        const novo = mapDbFiliadoToApp(inserted);
        filiados.push(novo);
        document.getElementById("filiadoForm").reset();
        atualizarListaFiliados();
        atualizarListaFiliadosGerenciamento();
        const filiadosSection = document.querySelector(".filiados-section");
        showVisualFeedback(
          filiadosSection,
          `${nome} foi cadastrado com sucesso!`,
          "success"
        );
      } catch (err) {
        console.error("[DB] Erro ao inserir filiado:", err);
        if (errorBox)
          errorBox.textContent = "Erro ao cadastrar no banco. Tente novamente.";
      }
    })();
    return;
  }

  setTimeout(() => {
    const novoFiliado = {
      id: proximoIdFiliado++,
      nome: nome,
      cpf: formatCpf(cpf),
      cr: cr,
      telefone: telefone,
      email,
      dataCadastro: new Date().toISOString().split("T")[0],
    };

    filiados.push(novoFiliado);
    salvarDados();

    document.getElementById("filiadoForm").reset();
    atualizarListaFiliados();
    atualizarListaFiliadosGerenciamento();

    const filiadosSection = document.querySelector(".filiados-section");
    showVisualFeedback(
      filiadosSection,
      `${nome} foi cadastrado com sucesso!`,
      "success"
    );
  }, 1000);
}

function atualizarListaFiliadosGerenciamento() {
  const container = document.getElementById("listaFiliadosGerenciamento");

  container.innerHTML = `
    <h3>Filiados Cadastrados</h3>
    ${filiados
      .map(
        (filiado) => `
      <div class="produto-item">
        <div class="produto-info">
          <strong>${filiado.nome}</strong><br>
          <small>CPF: ${filiado.cpf} | CR: ${filiado.cr}</small><br>
          <small>Tel: ${filiado.telefone} | Email: ${filiado.email}</small><br>
          <small>Cadastrado em: ${filiado.dataCadastro}</small>
        </div>
        <div class="produto-precos">
          <button class="btn btn-danger" onclick="removerFiliado(${filiado.id})">Remover</button>
        </div>
      </div>
    `
      )
      .join("")}
  `;
}

function removerFiliado(filiadoId) {
  const filiado = filiados.find((f) => f.id === filiadoId);
  if (!filiado) return;

  if (confirm(`Tem certeza que deseja remover o filiado "${filiado.nome}"?`)) {
    console.log("[INFO] Removendo filiado...");

    if (USE_DB) {
      (async () => {
        try {
          await window.DB.delete("filiados", { id: filiadoId });
          filiados = filiados.filter((f) => f.id !== filiadoId);
          atualizarListaFiliados();
          atualizarListaFiliadosGerenciamento();
          const filiadosSection = document.querySelector(".filiados-section");
          showVisualFeedback(
            filiadosSection,
            `${filiado.nome} foi removido com sucesso!`,
            "success"
          );
        } catch (err) {
          console.error("[DB] Erro ao remover filiado:", err);
        }
      })();
      return;
    }

    setTimeout(() => {
      filiados = filiados.filter((f) => f.id !== filiadoId);
      atualizarListaFiliados();
      atualizarListaFiliadosGerenciamento();
      salvarDados();

      const filiadosSection = document.querySelector(".filiados-section");
      showVisualFeedback(
        filiadosSection,
        `${filiado.nome} foi removido com sucesso!`,
        "success"
      );
    }, 1000);
  }
}

function criarNovaComanda() {
  const nome = document.getElementById("nome").value;
  const cpfInput = document.getElementById("cpf").value;
  const cpf = normalizeCpf(cpfInput);
  const cr = document.getElementById("cr").value;
  const filiado = document.getElementById("filiado").value === "true";

  // Validação básica
  if (!nome || !cpf || !cr) {
    console.log(
      "[ERROR] Erro no Cadastro: Por favor, preencha todos os campos obrigatórios."
    );
    return;
  }
  if (!isValidCpf(cpf)) {
    console.log("[ERROR] CPF inválido.");
    return;
  }

  console.log("[INFO] Criando comanda...");

  if (USE_DB) {
    (async () => {
      try {
        const payload = {
          cliente_nome: nome,
          cliente_cpf: normalizeCpf(cpf),
          cliente_cr: cr,
          cliente_filiado: filiado,
          filiado_id: filiadoSelecionado ? filiadoSelecionado.id : null,
          total: 0,
          status: "aberta",
        };
        const data = await window.DB.insert("comandas", payload);
        const inserted = Array.isArray(data) ? data[0] : data;
        const nova = mapDbComandaToApp(inserted);
        comandas.push(nova);
        limparFormularioCliente();
        filiadoSelecionado = null;
        await abrirComanda(nova.id);
        showSection("comandas");
        const comandaSection = document.querySelector(".section.active");
        showVisualFeedback(
          comandaSection,
          `Comanda #${nova.id} criada com sucesso para ${nome}!`,
          "success"
        );
      } catch (err) {
        console.error("[DB] Erro ao criar comanda:", err);
      }
    })();
    return;
  }

  setTimeout(() => {
    const novaComanda = {
      id: proximoIdComanda++,
      cliente: {
        nome: nome,
        cpf: formatCpf(cpf),
        cr: cr,
        filiado: filiado,
        filiadoId: filiadoSelecionado ? filiadoSelecionado.id : null,
      },
      itens: [],
      total: 0,
      formaPagamento: null,
      dataAbertura: new Date(),
      status: "aberta",
    };

    comandas.push(novaComanda);
    salvarDados();

    limparFormularioCliente();
    filiadoSelecionado = null;

    abrirComanda(novaComanda.id);
    showSection("comandas");

    const comandaSection = document.querySelector(".section.active");
    showVisualFeedback(
      comandaSection,
      `Comanda #${novaComanda.id} criada com sucesso para ${nome}!`,
      "success"
    );
  }, 1000);
}

async function abrirComanda(comandaId) {
  try {
    const comanda = comandas.find((c) => c.id === comandaId);
    if (!comanda) return;

    comandaAtual = comanda;

    // Abre o modal o quanto antes para o usuário perceber a ação
    const modalEl = document.getElementById("comandaModal");
    if (modalEl) modalEl.style.display = "block";

    if (USE_DB) {
      await carregarItensDaComandaDoSupabase(comandaAtual);
    }

    // Garantir que cada item possua um identificador de entrada único para ações no front
    (comandaAtual.itens || []).forEach((it) => {
      if (!it.entryId) it.entryId = genEntryId();
      if (typeof it._isVisualSplit !== "boolean") it._isVisualSplit = false;
    });

    // Inicializar estado de visualização para a comanda, se ainda não existir
    if (!visualizacaoPorComanda[comanda.id]) {
      visualizacaoPorComanda[comanda.id] = {
        sessionMode: false,
        activeSessionId: null,
        splitLines: [],
      };
      saveVisualState();
    }

    // Reconstruir linhas visuais persistidas
    const visState = visualizacaoPorComanda[comanda.id];
    if (visState && Array.isArray(visState.splitLines) && visState.splitLines.length > 0) {
      const produtoIdToSplits = new Map();
      visState.splitLines.forEach((sl) => {
        const prev = produtoIdToSplits.get(sl.produtoId) || 0;
        produtoIdToSplits.set(sl.produtoId, prev + sl.quantidade);
      });
      (comandaAtual.itens || []).forEach((base) => {
        const splitQty = produtoIdToSplits.get(base.produtoId) || 0;
        const novaBaseQtd = Math.max(0, (base.quantidade || 0) - splitQty);
        base.quantidade = novaBaseQtd;
        base.subtotal = (base.preco || 0) * novaBaseQtd;
      });
      const existingEntryIds = new Set((comandaAtual.itens || []).map((i) => i.entryId));
      visState.splitLines.forEach((sl) => {
        if (!existingEntryIds.has(sl.entryId)) {
          (comandaAtual.itens || []).push({
            entryId: sl.entryId,
            _sessionId: sl._sessionId,
            produtoId: sl.produtoId,
            nome: sl.nome,
            preco: sl.preco,
            quantidade: sl.quantidade,
            subtotal: sl.subtotal,
            _isVisualSplit: true,
          });
        }
      });
    }

    // Atualizar título
    const titleEl = document.getElementById("comandaTitle");
    if (titleEl) titleEl.textContent = `Comanda #${comanda.id}`;

    // Mostrar informações do cliente
    const clienteInfo = document.getElementById("clienteInfo");
    if (clienteInfo) {
      clienteInfo.innerHTML = `
          <div class="cliente-info">
              <h4>Informações do Cliente</h4>
              <p><strong>Nome:</strong> ${escapeHtml(comanda.cliente?.nome || '')}</p>
              <p><strong>CPF:</strong> ${escapeHtml(formatCpf(comanda.cliente?.cpf || ''))}</p>
              <p><strong>CR:</strong> ${escapeHtml(comanda.cliente?.cr || '')}</p>
              <p><strong>Status:</strong> ${comanda.cliente?.filiado ? "Filiado" : "Não Filiado"}</p>
          </div>
      `;
    }

    // Mostrar produtos disponíveis e itens
    atualizarProdutosDisponiveis();
    atualizarItensComanda();
  } catch (err) {
    console.error('[UI] Erro ao abrir comanda:', err);
    // Garantir que o modal esteja visível para permitir fechar se algo falhar
    const modalEl = document.getElementById("comandaModal");
    if (modalEl) modalEl.style.display = "block";
  }
}

function atualizarProdutosDisponiveis() {
  const container = document.getElementById("produtosDisponiveis");
  const filiado = comandaAtual.cliente.filiado;

  if (!isComandaAberta()) {
    container.innerHTML = `<div class="produtos-grid"><p>Comanda fechada. Não é possível adicionar itens.</p></div>`;
    return;
  }

  container.innerHTML = `
        <div class="produtos-grid">
            ${produtos
              .map(
                (produto) => `
                <div class="produto-card" onclick="adicionarItemComanda(${ 
                  produto.id 
                })">
                    <h5>${escapeHtml(produto.nome)}</h5>
                    <p class="preco-${filiado ? "filiado" : "nao-filiado"}">
                        R$ ${(filiado
                          ? produto.precoFiliado
                          : produto.precoNaoFiliado
                        ).toFixed(2)}
                    </p>
                </div>
            `
              )
              .join("")}
        </div>
    `;
}

function atualizarEstadoFecharComanda() {
  const btn = document.getElementById("fecharComandaBtn");
  if (!btn) return;
  const hasItensPositivos = !!(
    comandaAtual &&
    Array.isArray(comandaAtual.itens) &&
    comandaAtual.itens.some((i) => (i?.quantidade || 0) > 0)
  );
  const podeFechar =
    comandaAtual && hasItensPositivos && !!comandaAtual.formaPagamento;
  btn.disabled = !podeFechar;
}

function calcularTotalComanda(itens = null) {
  // Se itens for fornecido, calcular total dos itens fornecidos
  if (itens) {
    return itens.reduce((total, item) => {
      const preco = item.precoFiliado || item.preco || 0;
      const quantidade = item.quantidade || 1;
      return total + (preco * quantidade);
    }, 0);
  }
  
  // Caso contrário, calcular total da comanda atual
  comandaAtual.total = comandaAtual.itens.reduce(
    (total, item) => total + item.subtotal,
    0
  );
  document.getElementById("totalComanda").textContent =
    comandaAtual.total.toFixed(2);
  if (USE_DB) {
    atualizarTotalDaComandaNoSupabase(comandaAtual);
  }
  atualizarEstadoFecharComanda();
}

function selecionarFormaPagamento(formaId) {
  comandaAtual.formaPagamento = formaId;
  document
    .querySelectorAll(".forma-pagamento-btn")
    .forEach((btn) => btn.classList.remove("selected"));
  document
    .querySelector(`[data-forma="${formaId}"]`)
    ?.classList.add("selected");
  const formaPagamento = formasPagamento.find((fp) => fp.id === formaId);
  const formaSelSpan = document.getElementById("formaSelecionadaTexto");
  if (formaSelSpan) {
    formaSelSpan.textContent = formaPagamento?.nome || "Não selecionada";
  }
  const pagamentoSection = document.querySelector(".pagamento-section");
  showVisualFeedback(
    pagamentoSection,
    `${formaPagamento.nome} selecionada!`,
    "success"
  );
  if (USE_DB) {
    window.DB.update(
      "comandas",
      { id: comandaAtual.id },
      { forma_pagamento: formaId }
    ).catch((err) =>
      console.error("[DB] Erro ao definir forma de pagamento:", err)
    );
  }
  atualizarEstadoFecharComanda();
}

async function fecharComanda() {
  if (comandaAtual.itens.length === 0) {
    console.log(
      "[ERROR] Comanda Vazia: Adicione pelo menos um item antes de fechar a comanda!"
    );
    return;
  }

  // Verificar se forma de pagamento foi selecionada
  if (!comandaAtual.formaPagamento) {
    console.log(
      "[ERROR] Forma de Pagamento: Selecione uma forma de pagamento antes de fechar a comanda!"
    );
    return;
  }

  console.log("[INFO] Fechando comanda...");

  const finalize = async () => {
    comandaAtual.status = "fechada";
    comandaAtual.dataFechamento = new Date();
    gerarImpressaoComanda();
    fecharModal();
    await atualizarComandasAbertas();
    salvarDados();
    // Limpa estado visual persistido desta comanda
    if (visualizacaoPorComanda[comandaAtual.id]) {
      delete visualizacaoPorComanda[comandaAtual.id];
      try {
        localStorage.setItem(
          "clubeTiroVisual",
          JSON.stringify(visualizacaoPorComanda)
        );
      } catch (_) {}
    }
    const formaPagamento = formasPagamento.find(
      (fp) => fp.id === comandaAtual.formaPagamento
    );
    const modalContent = document.querySelector(".modal-content");
    showVisualFeedback(
      modalContent,
      `Comanda #${
        comandaAtual.id
      } fechada com sucesso! Total: R$ ${comandaAtual.total.toFixed(2)} - ${
        formaPagamento?.nome || ""
      }`,
      "success"
    );
  };

  if (USE_DB) {
    try {
      await window.DB.update(
        "comandas",
        { id: comandaAtual.id },
        { status: "fechada", data_fechamento: new Date().toISOString() }
      );
      await finalize();
    } catch (err) {
      console.error("[DB] Erro ao fechar comanda:", err);
    }
    return;
  }

  setTimeout(() => {
    finalize();
  }, 2000);
}

function gerarImpressaoComanda() {
  const impressaoArea = document.getElementById("impressaoArea");
  const dataFormatada = new Date().toLocaleString("pt-BR");
  const formaPagamento = comandaAtual.formaPagamento
    ? formasPagamento.find((fp) => fp.id === comandaAtual.formaPagamento).nome
    : "Não informada";

  impressaoArea.innerHTML = `
        <div class="comanda-impressao">
            <h2>🎯 CLUBE DE TIRO</h2>
            <div style="text-align: center; margin-bottom: 20px;">
                <strong>COMANDA #${comandaAtual.id}</strong><br>
                ${dataFormatada}
            </div>
            
            <div style="margin-bottom: 15px;">
                <div class="info-linha"><span>Cliente:</span><span>${escapeHtml(
                  comandaAtual.cliente.nome
                )}</span></div>
                <div class="info-linha"><span>CPF:</span><span>${escapeHtml(
                  formatCpf(comandaAtual.cliente.cpf)
                )}</span></div>
                <div class="info-linha"><span>CR:</span><span>${escapeHtml(
                  comandaAtual.cliente.cr
                )}</span></div>
                <div class="info-linha"><span>Status:</span><span>${
                  comandaAtual.cliente.filiado ? "Filiado" : "Não Filiado"
                }</span></div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <strong>ITENS:</strong>
                ${comandaAtual.itens
                  .map(
                    (item) => `
                    <div class="item-linha">
                        <span>${item.quantidade}x ${escapeHtml(item.nome)}</span>
                        <span>R$ ${item.subtotal.toFixed(2)}</span>
                    </div>
                `
                  )
                  .join("")}
            </div>
            
            <div class="total-linha">
                <span>TOTAL:</span>
                <span>R$ ${comandaAtual.total.toFixed(2)}</span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div class="info-linha"><span>Forma de Pagamento:</span><span>${formaPagamento}</span></div>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px;">
                Obrigado pela preferência!<br>
                Bom tiro e volte sempre!
            </div>
        </div>
    `;

  // Garantir que área de impressão esteja visível no momento da impressão
  impressaoArea.classList.remove("hidden");

  // Dar um pequeno atraso para o navegador renderizar o conteúdo antes de imprimir
  setTimeout(() => {
    const after = () => {
      // Após imprimir, limpar a área e ocultar novamente
      impressaoArea.innerHTML = "";
      impressaoArea.classList.add("hidden");
      window.removeEventListener("afterprint", after);
    };
    window.addEventListener("afterprint", after);
    window.print();
  }, 150);
}

function fecharModal() {
  document.getElementById("comandaModal").style.display = "none";
  comandaAtual = null;
}

async function atualizarComandasAbertas() {
  const container = document.getElementById("comandasAbertas");
  if (USE_DB) {
    await carregarDadosDoSupabase();
  }
  const comandasAbertas = comandas
    .filter((c) => c.status === "aberta")
    .sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));

  if (comandasAbertas.length === 0) {
    container.innerHTML = "<p>Nenhuma comanda aberta no momento.</p>";
    return;
  }

  container.innerHTML = comandasAbertas
    .map((comanda) => {
      const formaPagamento = comanda.formaPagamento
        ? formasPagamento.find((fp) => fp.id === comanda.formaPagamento).nome
        : "Não selecionada";

      return `
          <div class="comanda-item">
              <div class="comanda-header">
                  <h4>Comanda #${comanda.id} - ${escapeHtml(comanda.cliente.nome)}</h4>
                  <span class="status-badge status-aberta">Aberta</span>
              </div>
              <div class="comanda-info">
                  <p><strong>CPF:</strong> ${escapeHtml(formatCpf(comanda.cliente.cpf))} | <strong>CR:</strong> ${escapeHtml(comanda.cliente.cr)}</p>
                  <p><strong>Status:</strong> ${
                    comanda.cliente.filiado ? "Filiado" : "Não Filiado"
                  }</p>
                  <p><strong>Itens:</strong> ${
                    comanda.itens.length
                  } | <strong>Total:</strong> R$ ${comanda.total.toFixed(2)}</p>
                  <p><strong>Pagamento:</strong> ${formaPagamento}</p>
                  <p><strong>Aberta em:</strong> ${new Date(
                    comanda.dataAbertura
                  ).toLocaleString("pt-BR")}</p>
                  
              </div>
              <button class="btn btn-primary" onclick="abrirComanda(${
                comanda.id
              })">Gerenciar Comanda</button>
          </div>
        `;
    })
    .join("");
}

function adicionarProduto() {
  const nome = document.getElementById("nomeProduto").value;
  const precoFiliado = Number.parseFloat(
    document.getElementById("precoFiliado").value
  );
  const precoNaoFiliado = Number.parseFloat(
    document.getElementById("precoNaoFiliado").value
  );

  // Validação
  if (!nome || !precoFiliado || !precoNaoFiliado) {
    console.log(
      "[ERROR] Erro no Produto: Por favor, preencha todos os campos do produto."
    );
    return;
  }

  if (precoFiliado <= 0 || precoNaoFiliado <= 0) {
    console.log(
      "[ERROR] Preços Inválidos: Os preços devem ser maiores que zero."
    );
    return;
  }

  console.log("[INFO] Adicionando produto...");
  if (USE_DB) {
    (async () => {
      try {
        const payload = mapAppProdutoToDb({
          nome,
          precoFiliado,
          precoNaoFiliado,
        });
        const data = await window.DB.insert("produtos", payload);
        const inserted = Array.isArray(data) ? data[0] : data;
        const novo = mapDbProdutoToApp(inserted);
        produtos.push(novo);
        document.getElementById("produtoForm").reset();
        atualizarListaProdutos();
        const produtosSection = document.querySelector("#produtos");
        showVisualFeedback(
          produtosSection,
          `${nome} foi adicionado com sucesso!`,
          "success"
        );
      } catch (err) {
        console.error("[DB] Erro ao inserir produto:", err);
      }
    })();
    return;
  }

  setTimeout(() => {
    produtos.push({
      id: proximoIdProduto++,
      nome: nome,
      precoFiliado: precoFiliado,
      precoNaoFiliado: precoNaoFiliado,
    });

    document.getElementById("produtoForm").reset();
    atualizarListaProdutos();
    salvarDados();

    const produtosSection = document.querySelector("#produtos");
    showVisualFeedback(
      produtosSection,
      `${nome} foi adicionado com sucesso!`,
      "success"
    );
  }, 1000);
}

// Atualizar lista de produtos
function atualizarListaProdutos() {
  const container = document.getElementById("listaProdutos");

  container.innerHTML = `
        <h3>Produtos Cadastrados</h3>
        ${produtos
          .map(
            (produto) => `
            <div class="produto-item">
                <div class="produto-info">
                    <strong>${produto.nome}</strong>
                </div>
                <div class="produto-precos">
                    <span class="preco-filiado">Filiado: R$ ${produto.precoFiliado.toFixed(
                      2
                    )}</span>
                    <span class="preco-nao-filiado">Não Filiado: R$ ${produto.precoNaoFiliado.toFixed(
                      2
                    )}</span>
                    <button class="btn btn-danger" onclick="removerProduto(${
                      produto.id
                    })">Remover</button>
                </div>
            </div>
        `
          )
          .join("")}
    `;
}

function removerProduto(produtoId) {
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) return;

  if (confirm(`Tem certeza que deseja remover o produto "${produto.nome}"?`)) {
    console.log("[INFO] Removendo produto...");

    if (USE_DB) {
      (async () => {
        try {
          await window.DB.update(
            "produtos",
            { id: produtoId },
            { ativo: false }
          );
          produtos = produtos.filter((p) => p.id !== produtoId);
          atualizarListaProdutos();
          const produtosSection = document.querySelector("#produtos");
          showVisualFeedback(
            produtosSection,
            `${produto.nome} foi removido com sucesso!`,
            "success"
          );
        } catch (err) {
          console.error("[DB] Erro ao remover produto:", err);
        }
      })();
      return;
    }

    setTimeout(() => {
      produtos = produtos.filter((p) => p.id !== produtoId);
      atualizarListaProdutos();
      salvarDados();

      const produtosSection = document.querySelector("#produtos");
      showVisualFeedback(
        produtosSection,
        `${produto.nome} foi removido com sucesso!`,
        "success"
      );
    }, 1000);
  }
}

async function gerarRelatorioVendas() {
  console.log("[INFO] Gerando relatório...");

  const hoje = new Date();
  const hojeStr = hoje.toDateString();

  // Coletar dados (DB quando disponível)
  let abertas = [];
  let fechadas = [];
  let itensById = new Map();

  if (USE_DB) {
    try {
      const [abertasDb, fechadasDb] = await Promise.all([
        window.DB.comandasAbertasHoje(),
        window.DB.comandasFechadasHoje(),
      ]);
      abertas = Array.isArray(abertasDb)
        ? abertasDb.map(mapDbComandaToApp)
        : [];
      fechadas = Array.isArray(fechadasDb)
        ? fechadasDb.map(mapDbComandaToApp)
        : [];
      const ids = [...abertas, ...fechadas].map((c) => c.id);
      if (ids.length > 0) {
        const itensDb = await window.DB.itensByComandaIds(ids);
        const map = new Map();
        (itensDb || []).forEach((i) => {
          const arr = map.get(i.comanda_id) || [];
          arr.push(i);
          map.set(i.comanda_id, arr);
        });
        itensById = map;
      }
    } catch (err) {
      console.error("[DB] Erro ao gerar relatório:", err);
    }
  } else {
    const doDia = (c) => new Date(c.dataAbertura).toDateString() === hojeStr;
    abertas = comandas.filter((c) => c.status === "aberta" && doDia(c));
    fechadas = comandas.filter((c) => c.status === "fechada" && doDia(c));
  }

  const totalVendas = fechadas.reduce((t, c) => t + (c.total || 0), 0);
  const totalItens = (() => {
    if (USE_DB) {
      // Somar quantidades dos itens das fechadas
      return fechadas.reduce((acc, c) => {
        const itens = itensById.get(c.id) || [];
        const qtd = itens.reduce((s, it) => s + (it.quantidade || 0), 0);
        return acc + qtd;
      }, 0);
    }
    return fechadas.reduce(
      (acc, c) =>
        acc + c.itens.reduce((s, it) => s + (it.quantidade || 0), 0),
      0
    );
  })();

  const relatorioContent = document.getElementById("relatorioContent");
  relatorioContent.innerHTML = `
        <div class="relatorio-content">
            <h3>Relatório de Vendas - ${new Date().toLocaleDateString(
              "pt-BR"
            )}</h3>
            <p><strong>Total de Itens Vendidos (fechadas):</strong> ${totalItens}</p>
            <p><strong>Faturamento Total (fechadas):</strong> R$ ${totalVendas.toFixed(
              2
            )}</p>
            ${fechadas.length > 0 ? `
              <h4>Comandas Fechadas de Hoje</h4>
              <table class="relatorio-table">
                <thead>
                  <tr>
                    <th>Comanda</th>
                    <th>Cliente</th>
                    <th>Itens</th>
                    <th>Total</th>
                    <th>Fechamento</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  ${fechadas.map((comanda) => {
                    const itensCount = USE_DB
                      ? (itensById.get(comanda.id) || []).length
                      : comanda.itens.length;
                    const fechamento = new Date(
                      comanda.dataFechamento || comanda.dataAbertura
                    ).toLocaleString("pt-BR");
                    return `
                      <tr>
                        <td data-label="Comanda">#${comanda.id}</td>
                        <td data-label="Cliente">${escapeHtml(comanda.cliente.nome)}</td>
                        <td data-label="Itens">${itensCount}</td>
                        <td data-label="Total">R$ ${(comanda.total || 0).toFixed(2)}</td>
                        <td data-label="Fechamento">${fechamento}</td>
                        <td data-label="Ações"><button class="btn btn-secondary" onclick="abrirComanda(${comanda.id})">Abrir</button></td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
              </table>
            ` : '<p>Nenhuma comanda fechada hoje.</p>'}
        </div>
    `;

  const relatorioSection = document.querySelector("#relatorios");
  showVisualFeedback(relatorioSection, `Relatório do dia atualizado.`, "success");
}

// Função para gerar relatório de comandas para impressão
async function gerarRelatorioComandasImpressao() {
  try {
    const hoje = new Date();
    const start = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    // Buscar comandas do dia
    let comandasAbertas = [];
    let comandasFechadas = [];
    if (USE_DB) {
      // Quando o banco estiver ligado
      comandasAbertas = await window.DB.comandasAbertasHoje(start, end);
      comandasFechadas = await window.DB.comandasFechadasHoje(start, end);
    } else {
      // Fallback DEMO: uso os dados em memória filtrando por data
      const isSameDay = (d) => {
        const dt = new Date(d);
        return dt >= start && dt < end;
      };
      comandasAbertas = (comandas || []).filter(c => c.status === 'aberta' && isSameDay(c.dataAbertura));
      comandasFechadas = (comandas || []).filter(c => c.status === 'fechada' && isSameDay(c.dataAbertura));
    }

    console.log('[DEBUG] Comandas abertas do banco:', comandasAbertas);
    console.log('[DEBUG] Comandas fechadas do banco:', comandasFechadas);

    // Combinar todas as comandas
    const todasComandas = [
      ...(comandasAbertas || []),
      ...(comandasFechadas || [])
    ];

    if (!todasComandas || todasComandas.length === 0) {
      showVisualFeedback('Nenhuma comanda encontrada para hoje', 'error');
      return;
    }

    // Mapear comandas para o formato da aplicação
    const comandasMapeadas = USE_DB ? todasComandas.map(mapDbComandaToApp) : todasComandas;

    // Carregar itens para cada comanda
    if (USE_DB) {
      for (const comanda of comandasMapeadas) {
        await carregarItensDaComandaDoSupabase(comanda);
        console.log(`[DEBUG] Comanda ${comanda.id} - Itens carregados:`, comanda.itens);
      }
    }

    // Gerar HTML do relatório
    const htmlRelatorio = gerarHTMLRelatorioComandasImpressao(comandasMapeadas, hoje);
    
    // Mostrar no modal
    mostrarRelatorioComandasImpressao(htmlRelatorio);
    
    showVisualFeedback(`Relatório gerado com ${comandasMapeadas.length} comandas`, 'success');
  } catch (error) {
    showVisualFeedback('Erro ao gerar relatório: ' + error.message, 'error');
  }
}

// Função para gerar HTML do relatório de comandas para impressão
function gerarHTMLRelatorioComandasImpressao(comandas, data) {
  console.log('[DEBUG] Gerando HTML para comandas:', comandas);
  
  const dataFormatada = data.toLocaleDateString('pt-BR');
  const horaFormatada = data.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  let html = `
    <div class="relatorio-comandas-impressao">
      <h2>RELATÓRIO DE COMANDAS</h2>
      <div class="data-info">
        Data: ${dataFormatada} | Hora: ${horaFormatada}
      </div>
  `;

  let totalGeral = 0;
  let totalComandas = comandas.length;
  let comandasAbertas = 0;
  let comandasFechadas = 0;
  let totalItens = 0;

  comandas.forEach((comanda, index) => {
    console.log(`[DEBUG] Processando comanda ${comanda.id}:`, comanda);
    
    const isAberta = comanda.status === 'aberta';
    const statusClass = isAberta ? 'status-aberta' : 'status-fechada';
    const statusText = isAberta ? 'ABERTA' : 'FECHADA';
    
    if (isAberta) comandasAbertas++;
    else comandasFechadas++;

    const totalComanda = calcularTotalComanda(comanda.itens || []);
    totalGeral += totalComanda;
    
    if (comanda.itens) {
      totalItens += comanda.itens.reduce((sum, item) => sum + (item.quantidade || 1), 0);
    }

    html += `
      ${index > 0 ? '<div class="comanda-separador"></div>' : ''}
      
      <div class="comanda-header">
        <span>📋 Comanda #${comanda.id}</span>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      
      <div class="comanda-info">
        <div>Cliente: ${comanda.nomeCliente || comanda.cliente?.nome || 'N/A'}</div>
        <div>CPF: ${comanda.cpfCliente || comanda.cliente?.cpf || 'N/A'}</div>
        <div>CR: ${comanda.crCliente || comanda.cliente?.cr || 'N/A'}</div>
        <div>Data Abertura: ${new Date(comanda.data_abertura || comanda.dataAbertura).toLocaleDateString('pt-BR')}</div>
        ${!isAberta ? `<div>🔒 Data Fechamento: ${new Date(comanda.data_fechamento || comanda.dataFechamento).toLocaleDateString('pt-BR')}</div>` : ''}
        <div>💰 Total: R$ ${totalComanda.toFixed(2)}</div>
      </div>
    `;

    if (comanda.itens && comanda.itens.length > 0) {
      html += '<div class="comanda-items">';
      html += '<div class="item-linha" style="background: #e8e8e8; font-weight: bold; border-bottom: 2px solid #000;">';
      html += '<span>Item</span><span>Preço</span>';
      html += '</div>';
      
      comanda.itens.forEach((item, itemIndex) => {
        const preco = item.precoFiliado || item.preco;
        const subtotal = preco * (item.quantidade || 1);
        html += `
          <div class="item-linha">
            <span>${item.quantidade || 1}x ${item.nome}</span>
            <span>R$ ${subtotal.toFixed(2)}</span>
          </div>
        `;
      });
      html += '</div>';
    } else {
      html += '<div class="comanda-items">';
      html += '<div class="item-linha" style="text-align: center; color: #666; font-style: italic;">';
      html += 'Nenhum item registrado';
      html += '</div>';
      html += '</div>';
    }

    html += `
      <div class="comanda-total">
        <span>Total da Comanda:</span>
        <span>R$ ${totalComanda.toFixed(2)}</span>
      </div>
    `;
  });

  // Resumo geral
  html += `
    <div class="resumo-geral">
      <h3>Resumo Geral</h3>
      <div class="resumo-linha">
        <span>📋 Total de Comandas:</span>
        <span>${totalComandas}</span>
      </div>
      <div class="resumo-linha">
        <span>Comandas Abertas:</span>
        <span>${comandasAbertas}</span>
      </div>
      <div class="resumo-linha">
        <span>Comandas Fechadas:</span>
        <span>${comandasFechadas}</span>
      </div>
      <div class="resumo-linha">
        <span>📦 Total de Itens:</span>
        <span>${totalItens}</span>
      </div>
      <div class="resumo-total">
        <span>Valor Total:</span>
        <span>R$ ${totalGeral.toFixed(2)}</span>
      </div>
    </div>
  </div>
  `;

  return html;
}

// Função para mostrar o relatório de comandas para impressão
function mostrarRelatorioComandasImpressao(html) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'block';
  
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
      <div class="modal-header">
        <h3>Relatório de Comandas para Impressão</h3>
        <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
      </div>
      <div class="modal-body">
        <div style="margin-bottom: 20px;">
          <button class="btn btn-primary" onclick="imprimirRelatorioComandas()">
            Imprimir Relatório
          </button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
            Fechar
          </button>
        </div>
        <div id="relatorioComandasImpressao">
          ${html}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// Função para imprimir o relatório de comandas
function imprimirRelatorioComandas() {
  const relatorio = document.getElementById('relatorioComandasImpressao');
  if (!relatorio) return;

  const impressaoArea = document.getElementById('impressaoArea');
  impressaoArea.innerHTML = relatorio.innerHTML;
  impressaoArea.classList.remove('hidden');
  
  window.print();
  
  impressaoArea.classList.add('hidden');
}

// Função para criar ícone na área de trabalho
function criarIconeAreaTrabalho() {
  try {
    // URL atual do sistema (local ou produção)
    const urlSistema = window.location.href;
    
    // Conteúdo do arquivo .url
    const conteudoUrl = `[InternetShortcut]
URL=${urlSistema}
IconFile=C:\\Windows\\System32\\shell32.dll,0
IconIndex=0`;

    // Criar blob com o conteúdo
    const blob = new Blob([conteudoUrl], { type: 'text/plain' });
    
    // Criar link de download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'RangeClub Demo.url';
    
    // Adicionar ao DOM e clicar
    document.body.appendChild(link);
    link.click();
    
    // Limpar
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    
    // Mostrar feedback visual com ícone de download
    showVisualFeedback('Arquivo baixado com sucesso. Salve o arquivo na área de trabalho.', 'success');
    
  } catch (error) {
    console.error('Erro ao criar ícone:', error);
    showVisualFeedback('❌ Erro ao baixar arquivo. Tente novamente.', 'error');
  }
}

async function gerarRelatorioClientes() {
  console.log("[INFO] Gerando relatório de clientes...");

  let abertas = [];
  let fechadas = [];
  
  if (USE_DB) {
    try {
      const [abertasDb, fechadasDb] = await Promise.all([
        window.DB.comandasAbertasHoje(),
        window.DB.comandasFechadasHoje(),
      ]);
      abertas = Array.isArray(abertasDb)
        ? abertasDb.map(mapDbComandaToApp)
        : [];
      fechadas = Array.isArray(fechadasDb)
        ? fechadasDb.map(mapDbComandaToApp)
        : [];
    } catch (err) {
      console.error("[DB] Erro no relatório de clientes:", err);
      abertas = [];
      fechadas = [];
    }
  } else {
    const hoje = new Date().toDateString();
    abertas = comandas.filter(
      (c) => c.status === "aberta" && new Date(c.dataAbertura).toDateString() === hoje
    );
    fechadas = comandas.filter(
      (c) => c.status === "fechada" && new Date(c.dataAbertura).toDateString() === hoje
    );
  }

  const totalClientes = abertas.length + fechadas.length;
  const filiados = [...abertas, ...fechadas].filter((c) => c.cliente.filiado).length;
  const naoFiliados = totalClientes - filiados;

  const relatorioContent = document.getElementById("relatorioContent");
  const hasRows = totalClientes > 0;
  
  relatorioContent.innerHTML = `
        <div class="relatorio-content">
            <h3>Relatório de Clientes - ${new Date().toLocaleDateString("pt-BR")}</h3>
            
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${totalClientes}</div>
                <div class="stat-label">Total de Clientes</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${filiados}</div>
                <div class="stat-label">Filiados</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${naoFiliados}</div>
                <div class="stat-label">Não Filiados</div>
              </div>
            </div>

            ${abertas.length > 0 ? `
              <h4>Comandas Abertas (Ativos)</h4>
              <table class="relatorio-table">
                <thead>
                  <tr>
                    <th>Comanda</th>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>CR</th>
                    <th>Situação</th>
                    <th>Entrada</th>
                  </tr>
                </thead>
                <tbody>
                  ${abertas.map((comanda) => `
                    <tr>
                      <td data-label="Comanda">#${comanda.id}</td>
                      <td data-label="Nome">${escapeHtml(comanda.cliente.nome)}</td>
                      <td data-label="CPF">${escapeHtml(formatCpf(comanda.cliente.cpf))}</td>
                      <td data-label="CR">${escapeHtml(comanda.cliente.cr)}</td>
                      <td data-label="Situação">${comanda.cliente.filiado ? "Filiado" : "Não Filiado"}</td>
                      <td data-label="Entrada">${new Date(comanda.dataAbertura).toLocaleString("pt-BR")}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : '<p>Nenhuma comanda aberta hoje.</p>'}

            ${fechadas.length > 0 ? `
              <h4>Comandas Fechadas (Finalizados)</h4>
              <table class="relatorio-table">
                <thead>
                  <tr>
                    <th>Comanda</th>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>CR</th>
                    <th>Situação</th>
                    <th>Entrada</th>
                    <th>Fechamento</th>
                  </tr>
                </thead>
                <tbody>
                  ${fechadas.map((comanda) => `
                    <tr>
                      <td data-label="Comanda">#${comanda.id}</td>
                      <td data-label="Nome">${escapeHtml(comanda.cliente.nome)}</td>
                      <td data-label="CPF">${escapeHtml(formatCpf(comanda.cliente.cpf))}</td>
                      <td data-label="CR">${escapeHtml(comanda.cliente.cr)}</td>
                      <td data-label="Situação">${comanda.cliente.filiado ? "Filiado" : "Não Filiado"}</td>
                      <td data-label="Entrada">${new Date(comanda.dataAbertura).toLocaleString("pt-BR")}</td>
                      <td data-label="Fechamento">${new Date(comanda.dataFechamento || comanda.dataAbertura).toLocaleString("pt-BR")}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            ` : '<p>Nenhuma comanda fechada hoje.</p>'}
        </div>
    `;

  // Mostrar botão de export (quando houver dados)
  const relatorioActions = document.getElementById("relatorioActions");
  if (relatorioActions) {
    relatorioActions.classList.toggle("hidden", !hasRows);
  }

  const relatorioSection = document.querySelector("#relatorios");
  showVisualFeedback(
    relatorioSection,
    `Relatório de clientes do dia com ${totalClientes} atendimentos.`,
    "success"
  );
}

// Wrappers chamados pelo HTML existente
function mostrarRelatorioVendasDia() {
  return gerarRelatorioVendas();
}

function mostrarTodasComandasFechadas() {
  return gerarRelatorioVendas();
}

function mostrarRelatorioClientes() {
  return gerarRelatorioClientes();
}

function salvarDados() {
  if (USE_DB) return;
  localStorage.setItem("clubeTiroComandas", JSON.stringify(comandas));
  localStorage.setItem("clubeTiroProdutos", JSON.stringify(produtos));
  localStorage.setItem("clubeTiroFiliados", JSON.stringify(filiados));
  localStorage.setItem("clubeTiroProximoId", proximoIdComanda.toString());
  localStorage.setItem(
    "clubeTiroProximoIdProduto",
    proximoIdProduto.toString()
  );
  localStorage.setItem(
    "clubeTiroProximoIdFiliado",
    proximoIdFiliado.toString()
  );
}

function carregarDados() {
  try {
    const comandasSalvas = localStorage.getItem("clubeTiroComandas");
    if (comandasSalvas) comandas = JSON.parse(comandasSalvas);
  } catch (e) {
    console.error("[STORAGE] Erro ao ler comandas:", e);
    comandas = [];
  }

  try {
    const produtosSalvos = localStorage.getItem("clubeTiroProdutos");
    if (produtosSalvos) produtos = JSON.parse(produtosSalvos);
  } catch (e) {
    console.error("[STORAGE] Erro ao ler produtos:", e);
    produtos = [];
  }

  try {
    const filiadosSalvos = localStorage.getItem("clubeTiroFiliados");
    if (filiadosSalvos) filiados = JSON.parse(filiadosSalvos);
  } catch (e) {
    console.error("[STORAGE] Erro ao ler filiados:", e);
    filiados = [];
  }

  const proximoId = localStorage.getItem("clubeTiroProximoId");
  if (proximoId) proximoIdComanda = parseInt(proximoId);
  const proximoIdProd = localStorage.getItem("clubeTiroProximoIdProduto");
  if (proximoIdProd) proximoIdProduto = parseInt(proximoIdProd);
  const proximoIdFil = localStorage.getItem("clubeTiroProximoIdFiliado");
  if (proximoIdFil) proximoIdFiliado = parseInt(proximoIdFil);
}

window.onclick = (event) => {
  const modal = document.getElementById("comandaModal");
  if (event.target === modal) {
    fecharModal();
  }
};

function adicionarItemComanda(produtoId) {
  if (!isComandaAberta()) return;
  const produto = produtos.find((p) => p.id === produtoId);
  if (!produto) return;

  const filiado = comandaAtual.cliente.filiado;
  const preco = filiado ? produto.precoFiliado : produto.precoNaoFiliado;
  const quantidade = 1;
  const subtotal = preco * quantidade;

  const vis = visualizacaoPorComanda[comandaAtual.id];
  const sessionMode = !!(vis && vis.sessionMode);
  const itensMesmoProduto = comandaAtual.itens.filter(
    (i) => i.produtoId === produtoId
  );

  if (!sessionMode) {
    // Comportamento padrão: mesclar no mesmo item
    const itemExistente = itensMesmoProduto[0];
    if (itemExistente) {
      itemExistente.quantidade++;
      itemExistente.subtotal = preco * itemExistente.quantidade;
      if (USE_DB) {
        window.DB.update(
          "itens_comanda",
          { comanda_id: comandaAtual.id, produto_id: produtoId },
          {
            quantidade: itemExistente.quantidade,
            subtotal: itemExistente.subtotal,
          }
        ).catch((err) => console.error("[DB] Erro ao atualizar item:", err));
      }
    } else {
      const novo = {
        entryId: genEntryId(),
        produtoId: produtoId,
        nome: produto.nome,
        preco: preco,
        quantidade: quantidade,
        subtotal: subtotal,
        _isVisualSplit: false,
      };
      comandaAtual.itens.push(novo);
      if (USE_DB) {
        window.DB.insert("itens_comanda", {
          comanda_id: comandaAtual.id,
          produto_id: produtoId,
          produto_nome: produto.nome,
          preco: preco,
          quantidade: quantidade,
          subtotal: subtotal,
        }).catch((err) => console.error("[DB] Erro ao inserir item:", err));
      }
    }
  } else {
    // Modo sessão: separar visualmente com persistência por sessão
    const visState = visualizacaoPorComanda[comandaAtual.id];
    if (!visState.activeSessionId) visState.activeSessionId = genEntryId();
    const sessId = visState.activeSessionId;
    // procura linha visual da sessão + produto
    const existenteVisual = (visState.splitLines || []).find(
      (l) => l._sessionId === sessId && l.produtoId === produtoId
    );
    const haviaAntes = itensMesmoProduto.length > 0;
    if (existenteVisual) {
      existenteVisual.quantidade += 1;
      existenteVisual.subtotal =
        existenteVisual.preco * existenteVisual.quantidade;
      // refletir na lista renderizada
      const inMem = comandaAtual.itens.find(
        (i) => i.entryId === existenteVisual.entryId
      );
      if (inMem) {
        inMem.quantidade = existenteVisual.quantidade;
        inMem.subtotal = existenteVisual.subtotal;
      } else {
        // Se não encontrou na memória, pode ser que o item foi perdido
        // Recriar o item na memória
        comandaAtual.itens.push({
          entryId: existenteVisual.entryId,
          _sessionId: existenteVisual._sessionId,
          produtoId: existenteVisual.produtoId,
          nome: existenteVisual.nome,
          preco: existenteVisual.preco,
          quantidade: existenteVisual.quantidade,
          subtotal: existenteVisual.subtotal,
          _isVisualSplit: true,
        });
      }
    } else {
      const entrada = {
        entryId: genEntryId(),
        _sessionId: sessId,
        produtoId: produtoId,
        nome: produto.nome,
        preco: preco,
        quantidade: quantidade,
        subtotal: subtotal,
        _isVisualSplit: true,
      };
      visState.splitLines = visState.splitLines || [];
      visState.splitLines.push({ ...entrada });
      comandaAtual.itens.push(entrada);
    }
    saveVisualState();
    const quantidadeTotal = comandaAtual.itens
      .filter((i) => i.produtoId === produtoId)
      .reduce((acc, i) => acc + i.quantidade, 0);
    if (USE_DB) {
      if (haviaAntes) {
        window.DB.update(
          "itens_comanda",
          { comanda_id: comandaAtual.id, produto_id: produtoId },
          { quantidade: quantidadeTotal, subtotal: quantidadeTotal * preco }
        ).catch((err) =>
          console.error("[DB] Erro ao atualizar item (split visual):", err)
        );
      } else {
        window.DB.insert("itens_comanda", {
          comanda_id: comandaAtual.id,
          produto_id: produtoId,
          produto_nome: produto.nome,
          preco: preco,
          quantidade: quantidadeTotal,
          subtotal: quantidadeTotal * preco,
        }).catch((err) =>
          console.error("[DB] Erro ao inserir item (split visual):", err)
        );
      }
    }
  }

  calcularTotalComanda();
  atualizarItensComanda();
  showProductAddedFeedback(produto.nome);
}

function toggleLoadingIndicator(entryId, isLoading) {
  const itemContainer = document.querySelector(
    `[data-entry-id="${entryId || ""}"], [data-produto-id="${entryId}"]`
  );
  if (itemContainer) {
    const loadingIndicator = itemContainer.querySelector(".loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? "block" : "none";
    }

    // Desabilitar controles durante carregamento
    const controls = itemContainer.querySelectorAll(
      ".quantidade-btn, .quantidade-input, .btn-remove-item"
    );
    controls.forEach((control) => {
      control.disabled = isLoading;
    });
  }
}

function ajustarTamanhoInput(input) {
  if (!input) return;

  // Tamanho baseado em número de caracteres (mais estável e leve)
  const valueStr = String(input.value || "0");
  const styles = window.getComputedStyle(input);
  const fontSizePx = parseFloat(styles.fontSize) || 16;
  const avgCharWidth = fontSizePx * 0.62; // aproximação para fontes padrão
  const paddingLeft = parseFloat(styles.paddingLeft) || 0;
  const paddingRight = parseFloat(styles.paddingRight) || 0;
  const borders = (parseFloat(styles.borderLeftWidth) || 0) + (parseFloat(styles.borderRightWidth) || 0);
  const calcWidth = Math.ceil(valueStr.length * avgCharWidth + paddingLeft + paddingRight + borders + 8);

  const maxWidth = window.innerWidth <= 480 ? 120 : window.innerWidth <= 768 ? 160 : 200;
  const minWidth = window.innerWidth <= 480 ? 64 : window.innerWidth <= 768 ? 70 : 80;

  input.style.width = Math.min(Math.max(calcWidth, minWidth), maxWidth) + "px";
}

function validarQuantidadeInput(input) {
  const value = input.value;
  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed < 1) {
    // Restaurar valor anterior válido
    const item = comandaAtual.itens.find(
      (i) =>
        i.entryId === input.getAttribute("data-entry-id") ||
        i.produtoId === parseInt(input.getAttribute("data-produto-id"))
    );
    if (item) {
      input.value = item.quantidade;
    } else {
      input.value = 1;
    }
    return false;
  }

  return true;
}

const debounceQuantidade = debounce((produtoId, value, entryId) => {
  onQuantidadeInputChange(produtoId, value, entryId);
}, 300);

function alterarQuantidade(produtoId, delta, entryId) {
  if (!isComandaAberta()) return;
  const item = entryId
    ? comandaAtual.itens.find((i) => i.entryId === entryId)
    : comandaAtual.itens.find((i) => i.produtoId === produtoId);
  if (!item) return;

  const quantidadeAtual = item.quantidade;
  const novaQuantidade = quantidadeAtual + delta;

  if (novaQuantidade < 1) {
    removerItem(produtoId, entryId);
    return;
  }

  // Atualizar o item imediatamente
  item.quantidade = novaQuantidade;
  item.subtotal = item.preco * novaQuantidade;

  // Feedback visual imediato
  const itemContainer = document.querySelector(
    `[data-entry-id="${entryId || ""}"], [data-produto-id="${produtoId}"]`
  );
  if (itemContainer) {
    // Atualizar input de quantidade
    const quantidadeInput = itemContainer.querySelector(".quantidade-input");
    if (quantidadeInput) {
      quantidadeInput.value = novaQuantidade;
      quantidadeInput.classList.add("quantidade-updated");
      setTimeout(
        () => quantidadeInput.classList.remove("quantidade-updated"),
        500
      );

      // Ajustar tamanho do input automaticamente
      ajustarTamanhoInput(quantidadeInput);
    }

    // Atualizar subtotal
    const subtotalElement = itemContainer.querySelector(".item-subtotal");
    if (subtotalElement) {
      subtotalElement.textContent = `R$ ${item.subtotal.toFixed(2)}`;
      subtotalElement.classList.add("quantidade-updated");
      setTimeout(
        () => subtotalElement.classList.remove("quantidade-updated"),
        500
      );
    }
  }

  // Sincronizar com o estado visual se estiver no modo sessão
  const vis = visualizacaoPorComanda[comandaAtual.id];
  if (vis && vis.sessionMode && item._isVisualSplit) {
    // Atualizar o item correspondente no splitLines
    const splitItem = vis.splitLines.find((sl) => sl.entryId === item.entryId);
    if (splitItem) {
      splitItem.quantidade = novaQuantidade;
      splitItem.subtotal = item.subtotal;
      saveVisualState();
    }

    const preco = item.preco;
    const quantidadeTotal = comandaAtual.itens
      .filter((i) => i.produtoId === produtoId)
      .reduce((acc, i) => acc + i.quantidade, 0);
    if (USE_DB) {
      window.DB.update(
        "itens_comanda",
        { comanda_id: comandaAtual.id, produto_id: produtoId },
        { quantidade: quantidadeTotal, subtotal: quantidadeTotal * preco }
      ).catch((err) =>
        console.error("[DB] Erro ao alterar quantidade (split visual):", err)
      );
    }
  } else if (USE_DB) {
    window.DB.update(
      "itens_comanda",
      { comanda_id: comandaAtual.id, produto_id: produtoId },
      { quantidade: item.quantidade, subtotal: item.subtotal }
    ).catch((err) => console.error("[DB] Erro ao alterar quantidade:", err));
  }

  // Atualizar apenas o total e o estado do botão fechar, sem re-renderizar toda a lista
  calcularTotalComanda();
  atualizarEstadoFecharComanda();
}

function onQuantidadeInputChange(produtoId, value, entryId) {
  if (!isComandaAberta()) return;
  const parsed = String(value).replace(/\D+/g, "");
  const novaQtd = parseInt(parsed, 10);
  if (!Number.isFinite(novaQtd) || novaQtd < 1) return;

  const item = entryId
    ? comandaAtual.itens.find((i) => i.entryId === entryId)
    : comandaAtual.itens.find((i) => i.produtoId === produtoId);
  if (!item) return;

  const delta = novaQtd - item.quantidade;
  if (delta === 0) return;

  // Atualizar o item diretamente para feedback imediato
  item.quantidade = novaQtd;
  item.subtotal = item.preco * novaQtd;

  // Ajustar tamanho do input automaticamente
  const input = document
    .querySelector(
      `[data-entry-id="${entryId || ""}"], [data-produto-id="${produtoId}"]`
    )
    ?.querySelector(".quantidade-input");
  if (input) {
    ajustarTamanhoInput(input);
  }

  // Sincronizar com o estado visual se estiver no modo sessão
  const vis = visualizacaoPorComanda[comandaAtual.id];
  if (vis && vis.sessionMode && item._isVisualSplit) {
    const splitItem = vis.splitLines.find((sl) => sl.entryId === item.entryId);
    if (splitItem) {
      splitItem.quantidade = novaQtd;
      splitItem.subtotal = item.subtotal;
      saveVisualState();
    }
  }

  // Atualizar apenas o total e o estado do botão fechar
  calcularTotalComanda();
  atualizarEstadoFecharComanda();

  // Atualizar apenas o subtotal do item específico na UI
  atualizarSubtotalItem(item.entryId || item.produtoId, item.subtotal);

  // Atualizar o banco de dados de forma assíncrona
  if (USE_DB) {
    const preco = item.preco;
    const quantidadeTotal = comandaAtual.itens
      .filter((i) => i.produtoId === produtoId)
      .reduce((acc, i) => acc + i.quantidade, 0);

    window.DB.update(
      "itens_comanda",
      { comanda_id: comandaAtual.id, produto_id: produtoId },
      { quantidade: quantidadeTotal, subtotal: quantidadeTotal * preco }
    ).catch((err) => console.error("[DB] Erro ao atualizar quantidade:", err));
  }
}

function atualizarSubtotalItem(entryId, subtotal) {
  // Encontrar o container do item específico
  const itemContainer =
    document.querySelector(`[data-entry-id="${entryId}"]`) ||
    document.querySelector(`[data-produto-id="${entryId}"]`);

  if (itemContainer) {
    const subtotalElement = itemContainer.querySelector(".item-subtotal");
    if (subtotalElement) {
      // Adicionar feedback visual temporário
      subtotalElement.classList.add("quantidade-updated");
      subtotalElement.textContent = `R$ ${subtotal.toFixed(2)}`;

      // Remover classe de feedback após animação
      setTimeout(() => {
        subtotalElement.classList.remove("quantidade-updated");
      }, 500);
    }

    // Atualizar também o input de quantidade se existir
    const quantidadeInput = itemContainer.querySelector(".quantidade-input");
    if (quantidadeInput) {
      const item = comandaAtual.itens.find(
        (i) => i.entryId === entryId || i.produtoId === entryId
      );
      if (item && parseInt(quantidadeInput.value) !== item.quantidade) {
        quantidadeInput.value = item.quantidade;
      }
    }
  }
}

function removerItem(produtoId, entryId) {
  if (!isComandaAberta()) return;
  const vis = visualizacaoPorComanda[comandaAtual.id];
  if (vis && vis.sessionMode) {
    const idxSplit = entryId
      ? comandaAtual.itens.findIndex((i) => i.entryId === entryId)
      : comandaAtual.itens.findIndex(
          (i) => i.produtoId === produtoId && i._isVisualSplit
        );
    if (idxSplit >= 0) {
      const removed = comandaAtual.itens.splice(idxSplit, 1)[0];
      // Também remover do estado persistido se existir
      if (vis.splitLines && removed?.entryId) {
        vis.splitLines = vis.splitLines.filter(
          (sl) => sl.entryId !== removed.entryId
        );
        saveVisualState();
      }
      const preco = removed.preco;
      const quantidadeTotal = comandaAtual.itens
        .filter((i) => i.produtoId === produtoId)
        .reduce((acc, i) => acc + i.quantidade, 0);
      if (USE_DB) {
        if (quantidadeTotal > 0) {
          window.DB.update(
            "itens_comanda",
            { comanda_id: comandaAtual.id, produto_id: produtoId },
            { quantidade: quantidadeTotal, subtotal: quantidadeTotal * preco }
          ).catch((err) =>
            console.error("[DB] Erro ao remover item (split visual):", err)
          );
        } else {
          window.DB.delete("itens_comanda", {
            comanda_id: comandaAtual.id,
            produto_id: produtoId,
          }).catch((err) => console.error("[DB] Erro ao remover item:", err));
        }
      }
    } else {
      comandaAtual.itens = comandaAtual.itens.filter(
        (item) => item.produtoId !== produtoId
      );
      if (USE_DB) {
        window.DB.delete("itens_comanda", {
          comanda_id: comandaAtual.id,
          produto_id: produtoId,
        }).catch((err) => console.error("[DB] Erro ao remover item:", err));
      }
    }
  } else {
    if (entryId) {
      const idx = comandaAtual.itens.findIndex((i) => i.entryId === entryId);
      if (idx >= 0) comandaAtual.itens.splice(idx, 1);
    } else {
      // Sem entryId: se houver linhas split, confirmar remoção total ou apenas linhas separadas
      const hasSplits = comandaAtual.itens.some(
        (i) => i.produtoId === produtoId && i._isVisualSplit
      );
      if (hasSplits) {
        // Pergunta: remover tudo do produto (base + splits) ou somente splits
        const removerTudo = confirm(
          "Remover TODAS as linhas deste produto?\nOK = remover base + linhas separadas.\nCancelar = remover apenas as linhas separadas."
        );
        if (removerTudo) {
          // Remover tudo
          comandaAtual.itens = comandaAtual.itens.filter(
            (i) => i.produtoId !== produtoId
          );
          if (vis && vis.splitLines) {
            vis.splitLines = vis.splitLines.filter(
              (sl) => sl.produtoId !== produtoId
            );
            saveVisualState();
          }
          if (USE_DB) {
            window.DB.delete("itens_comanda", {
              comanda_id: comandaAtual.id,
              produto_id: produtoId,
            }).catch((err) => console.error("[DB] Erro ao remover item:", err));
          }
          calcularTotalComanda();
          atualizarItensComanda();
          return;
        }
        const toRemove = comandaAtual.itens
          .filter((i) => i.produtoId === produtoId && i._isVisualSplit)
          .map((i) => i.entryId);
        comandaAtual.itens = comandaAtual.itens.filter(
          (i) => !(i.produtoId === produtoId && i._isVisualSplit)
        );
        if (vis && vis.splitLines) {
          vis.splitLines = vis.splitLines.filter(
            (sl) => !toRemove.includes(sl.entryId)
          );
          saveVisualState();
        }
      } else {
        comandaAtual.itens = comandaAtual.itens.filter(
          (item) => item.produtoId !== produtoId
        );
      }
    }
    if (USE_DB) {
      window.DB.delete("itens_comanda", {
        comanda_id: comandaAtual.id,
        produto_id: produtoId,
      }).catch((err) => console.error("[DB] Erro ao remover item:", err));
    }
  }
  calcularTotalComanda();
  atualizarItensComanda();
}

function atualizarItensComanda() {
  const container = document.getElementById("itensComanda");
  if (comandaAtual.itens.length === 0) {
    container.innerHTML = "<p>Nenhum item adicionado</p>";
    atualizarEstadoFecharComanda();
    return;
  }
  // Reconstrói a lista trocando itens por versões de sessão quando existirem
  const visState = visualizacaoPorComanda[comandaAtual.id];
  const byEntry = new Map(
    (visState && visState.splitLines ? visState.splitLines : []).map((l) => [
      l.entryId,
      l,
    ])
  );

  // Garantir que todos os itens tenham entryId válido
  const itensParaMostrar = comandaAtual.itens
    .map((i) => {
      // Se o item tem entryId e existe nas linhas de sessão, usar a versão da sessão
      if (i.entryId && byEntry.has(i.entryId)) {
        return byEntry.get(i.entryId);
      }
      // Caso contrário, usar o item original, mas garantir que tenha entryId
      if (!i.entryId) {
        i.entryId = genEntryId();
      }
      return i;
    })
    .filter((i) => i.quantidade > 0);
  container.innerHTML = itensParaMostrar
    .map(
      (item) => `
    <div class="item-comanda" data-entry-id="${
      item.entryId || ""
    }" data-produto-id="${item.produtoId}">
      <div>
        <strong>${escapeHtml(item.nome)}</strong><br>
        <small>R$ ${item.preco.toFixed(2)} cada</small>
      </div>
      <div class="quantidade-controls">
        <button class="quantidade-btn" ${!isComandaAberta() ? 'disabled' : ''} onclick="alterarQuantidade(${ 
          item.produtoId
        }, -1, '${item.entryId || ""}')">-</button>
        <div class="quantidade-input-container">
          <input class="quantidade-input" ${!isComandaAberta() ? 'disabled' : ''} type="number" min="1" value="${
            item.quantidade
          }" data-entry-id="${item.entryId || ""}" data-produto-id="${
        item.produtoId
      }" onchange="onQuantidadeInputChange(${item.produtoId}, this.value, '${
        item.entryId || ""
      }')" oninput="debounceQuantidade(${item.produtoId}, this.value, '${
        item.entryId || ""
      }')" onblur="validarQuantidadeInput(this)" />
          <div class="loading-indicator" style="display: none;">
            <div class="spinner"></div>
          </div>
        </div>
        <button class="quantidade-btn" ${!isComandaAberta() ? 'disabled' : ''} onclick="alterarQuantidade(${ 
          item.produtoId
        }, 1, '${item.entryId || ""}')">+</button>
        <button class="btn btn-danger btn-remove-item" ${!isComandaAberta() ? 'disabled' : ''} onclick="removerItem(${ 
          item.produtoId
        }, '${item.entryId || ""}')">Remover</button>
      </div>
      <div class="item-subtotal">
        <strong>R$ ${item.subtotal.toFixed(2)}</strong>
      </div>
    </div>
  `
    )
    .join("");

  // Ajustar tamanho dos inputs após renderização
  setTimeout(() => {
    container.querySelectorAll(".quantidade-input").forEach((input) => {
      ajustarTamanhoInput(input);
    });
  }, 0);

  // Seção de pagamento (inalterada)
  const formaPagamentoSelecionada = comandaAtual.formaPagamento
    ? formasPagamento.find((fp) => fp.id === comandaAtual.formaPagamento).nome
    : "Não selecionada";
  const pagamentoSection = document.getElementById("pagamentoSection");
  if (pagamentoSection) {
    pagamentoSection.innerHTML = `
      <div class="pagamento-section">
        <h4>Forma de Pagamento</h4>
        <div class="formas-pagamento">
          ${formasPagamento
            .map(
              (forma) => `
            <button class="forma-pagamento-btn ${
              comandaAtual.formaPagamento === forma.id ? "selected" : ""
            }" 
              data-forma="${forma.id}" onclick="selecionarFormaPagamento('${
                forma.id
              }')">
              <strong>${forma.nome}</strong><br>
              <small>${forma.descricao}</small>
            </button>
          `
            )
            .join("")}
        </div>
        <div class="pagamento-selecionado">
          <strong>Forma Selecionada:</strong> <span id="formaSelecionadaTexto">${formaPagamentoSelecionada}</span>
        </div>
      </div>
    `;
  }
  atualizarEstadoFecharComanda();
}

function continuarAtirando() {
  if (!isComandaAberta()) return;
  if (!comandaAtual) return;
  const cid = comandaAtual.id;
  // Inicia uma nova sessão e preserva linhas de sessões anteriores
  if (!visualizacaoPorComanda[cid])
    visualizacaoPorComanda[cid] = {
      sessionMode: true,
      activeSessionId: null,
      splitLines: [],
    };
  visualizacaoPorComanda[cid].sessionMode = true;
  visualizacaoPorComanda[cid].activeSessionId = genEntryId();
  saveVisualState();
  fecharModal();
}

function exportarBackupJSON() {
  const payload = {
    produtos,
    filiados,
    comandas,
    proximoIdComanda,
    proximoIdProduto,
    proximoIdFiliado,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-rangeclub-demo-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  console.log("[BACKUP] Exportado com sucesso");
}

function importarBackupJSON(evt) {
  const file = evt.target.files && evt.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data) return;
      produtos = Array.isArray(data.produtos) ? data.produtos : produtos;
      filiados = Array.isArray(data.filiados) ? data.filiados : filiados;
      comandas = Array.isArray(data.comandas) ? data.comandas : comandas;
      proximoIdComanda = Number.isInteger(data.proximoIdComanda)
        ? data.proximoIdComanda
        : proximoIdComanda;
      proximoIdProduto = Number.isInteger(data.proximoIdProduto)
        ? data.proximoIdProduto
        : proximoIdProduto;
      proximoIdFiliado = Number.isInteger(data.proximoIdFiliado)
        ? data.proximoIdFiliado
        : proximoIdFiliado;
      salvarDados();
      atualizarListaProdutos();
      atualizarComandasAbertas();
      atualizarListaFiliados();
      console.log("[BACKUP] Importado com sucesso");
    } catch (err) {
      console.error("[BACKUP] Erro ao importar JSON:", err);
    }
  };
  reader.readAsText(file);
}

// Abrir modal de filiado rápido
function abrirQuickFiliado() {
  const modal = document.getElementById("quickFiliadoModal");
  if (!modal) return;
  modal.style.display = "block";
  const nome = document.getElementById("qNomeFiliado");
  if (nome) nome.focus();
  // Máscaras leves (anexar uma vez)
  if (!modal.dataset.masksApplied) {
    const qCpf = document.getElementById("qCpfFiliado");
    if (qCpf) {
      qCpf.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = value;
      });
    }
    const qTel = document.getElementById("qTelefoneFiliado");
    if (qTel) {
      qTel.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        value = value.replace(/(\d{2})(\d)/, "($1) $2");
        value = value.replace(/(\d{5})(\d)/, "$1-$2");
        e.target.value = value;
      });
    }
    modal.dataset.masksApplied = "true";
  }
}

// Fechar modal de filiado rápido
function fecharQuickFiliado() {
  const modal = document.getElementById("quickFiliadoModal");
  if (!modal) return;
  modal.style.display = "none";
  const ids = [
    "qNomeFiliado",
    "qCpfFiliado",
    "qCrFiliado",
    "qTelefoneFiliado",
    "qEmailFiliado",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  const err = document.getElementById("qFiliadoErrors");
  if (err) err.textContent = "";
}

// Salvar filiado a partir do modal rápido
function salvarQuickFiliado() {
  const nome = document.getElementById("qNomeFiliado")?.value || "";
  const cpfInput = document.getElementById("qCpfFiliado")?.value || "";
  const cpf = normalizeCpf(cpfInput);
  const cr = document.getElementById("qCrFiliado")?.value || "";
  const telefone = document.getElementById("qTelefoneFiliado")?.value || "";
  const email = document.getElementById("qEmailFiliado")?.value || "";
  const errorBox = document.getElementById("qFiliadoErrors");
  if (errorBox) errorBox.textContent = "";

  if (!nome || !cpf || !cr || !telefone || !email) {
    if (errorBox) errorBox.textContent = "Preencha todos os campos.";
    return;
  }
  if (!isValidCpf(cpf)) {
    if (errorBox) errorBox.textContent = "CPF inválido.";
    return;
  }
  if (!isValidEmail(email)) {
    if (errorBox) errorBox.textContent = "E-mail inválido.";
    return;
  }
  if (!isValidPhone(telefone)) {
    if (errorBox) errorBox.textContent = "Telefone inválido.";
    return;
  }

  // Duplicidade local
  const cpfExisteLocal = filiados.find((f) => normalizeCpf(f.cpf) === cpf);
  if (cpfExisteLocal) {
    if (errorBox) errorBox.textContent = "CPF já cadastrado.";
    return;
  }

  const finishOk = (novo) => {
    filiados.push(novo);
    atualizarListaFiliados();
    atualizarListaFiliadosGerenciamento();
    fecharQuickFiliado();
    const section = document.querySelector(".filiados-section");
    showVisualFeedback(section, `${novo.nome} foi cadastrado com sucesso!`, "success");
  };

  if (USE_DB) {
    (async () => {
      try {
        const existing = await window.DB.listWhere("filiados", { cpf: cpf });
        if (Array.isArray(existing) && existing.length > 0) {
          if (errorBox) errorBox.textContent = "CPF já cadastrado no banco.";
          return;
        }
        const payload = { nome, cpf, cr, telefone, email };
        const data = await window.DB.insert("filiados", payload);
        const inserted = Array.isArray(data) ? data[0] : data;
        const novo = mapDbFiliadoToApp(inserted);
        finishOk(novo);
      } catch (err) {
        console.error("[DB] Erro ao inserir filiado (rápido):", err);
        if (errorBox) errorBox.textContent = "Erro ao cadastrar no banco.";
      }
    })();
    return;
  }

  setTimeout(() => {
    const novo = {
      id: proximoIdFiliado++,
      nome,
      cpf: formatCpf(cpf),
      cr,
      telefone,
      email,
      dataCadastro: new Date().toISOString().split("T")[0],
    };
    finishOk(novo);
    salvarDados();
  }, 500);
}

// Exportar relatório atual em CSV
function exportarRelatorioCSV() {
  const container = document.getElementById("relatorioContent");
  if (!container) return;
  const table = container.querySelector(".relatorio-table");
  let csv = "";
  if (table) {
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll("th,td")).map((c) => {
        const text = (c.textContent || "").replace(/\s+/g, " ").trim();
        const escaped = '"' + text.replace(/"/g, '""') + '"';
        return escaped;
      });
      csv += cells.join(",") + "\n";
    });
  } else {
    // Fallback: gerar CSV de comandas fechadas do dia
    const hoje = new Date().toDateString();
    const vendasHoje = comandas.filter(
      (c) => c.status === "fechada" && new Date(c.dataFechamento).toDateString() === hoje
    );
    csv += "Comanda,Cliente,Status,Itens,Total,Fechamento\n";
    vendasHoje.forEach((c) => {
      const itens = c.itens.length;
      const total = (c.total || 0).toFixed(2);
      const fechamento = c.dataFechamento
        ? new Date(c.dataFechamento).toLocaleString("pt-BR")
        : "";
      const line = [
        c.id,
        c.cliente?.nome || "",
        c.cliente?.filiado ? "Filiado" : "Não Filiado",
        itens,
        total,
        fechamento,
      ]
        .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
        .join(",");
      csv += line + "\n";
    });
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Função para gerar PDF das vendas do dia
async function gerarPDFVendasDia() {
    try {
        // Mostrar loading
        const btn = (typeof event !== 'undefined' && event?.target) ? event.target : null;
        const originalText = btn ? btn.textContent : '';
        if (btn) { btn.textContent = '⏳ Gerando...'; btn.disabled = true; }
        
        // Buscar vendas do dia do Supabase/localStorage
        const hoje = new Date();
        const vendas = await buscarVendasDoDia(hoje);
        
        if (vendas.length === 0) {
            mostrarNotificacao('❌ Nenhuma venda encontrada para hoje', 'warning');
            return;
        }
        
        // Gerar PDF usando o gerador local
        if (!window.PDFGenerator) {
            console.warn('PDFGenerator não encontrado. Ignorando geração de PDF.');
            mostrarNotificacao('❌ Gerador de PDF não disponível', 'error');
            return;
        }
        const pdfGenerator = new window.PDFGenerator();
        const resultado = pdfGenerator.generateDailySalesPDF(vendas, hoje);
        
        if (resultado.success) {
            mostrarNotificacao('PDF gerado com sucesso.', 'success');
        } else {
            mostrarNotificacao(`❌ Erro ao gerar PDF: ${resultado.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        mostrarNotificacao('❌ Erro ao gerar PDF', 'error');
    } finally {
        // Restaurar botão
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
    }
}



// Função para gerar PDF das vendas por período
async function gerarPDFVendasPeriodo() {
    if (!window.periodoSelecionado) {
        mostrarNotificacao('❌ Selecione um período primeiro', 'error');
        return;
    }
    
    try {
        // Mostrar loading
        const btn = (typeof event !== 'undefined' && event?.target) ? event.target : null;
        const originalText = btn ? btn.textContent : '';
        if (btn) { btn.textContent = '⏳ Gerando...'; btn.disabled = true; }
        
        // Buscar vendas do período do Supabase/localStorage
        const vendas = await buscarVendasPorPeriodo(
            window.periodoSelecionado.inicio,
            window.periodoSelecionado.fim
        );
        
        if (vendas.length === 0) {
            mostrarNotificacao('❌ Nenhuma venda encontrada para o período selecionado', 'warning');
            return;
        }
        
        // Gerar PDF usando o gerador local
        if (!window.PDFGenerator) {
            console.warn('PDFGenerator não encontrado. Ignorando geração de PDF.');
            mostrarNotificacao('❌ Gerador de PDF não disponível', 'error');
            return;
        }
        const pdfGenerator = new window.PDFGenerator();
        const resultado = pdfGenerator.generatePeriodSalesPDF(
            vendas,
            window.periodoSelecionado.inicio,
            window.periodoSelecionado.fim
        );
        
        if (resultado.success) {
            mostrarNotificacao('PDF gerado com sucesso.', 'success');
        } else {
            mostrarNotificacao(`❌ Erro ao gerar PDF: ${resultado.error}`, 'error');
        }
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        mostrarNotificacao('❌ Erro ao gerar PDF', 'error');
    } finally {
        // Restaurar botão
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
    }
}



// Função para buscar vendas do dia
async function buscarVendasDoDia(data = new Date()) {
    try {
        if (USE_DB && window.DB) {
            // Buscar do Supabase
            const start = moment(data).startOf('day').toISOString();
            const end = moment(data).endOf('day').toISOString();
            
            const { data: vendas, error } = await window.DB.list('comandas', {
                where: {
                    data_abertura: { gte: start, lte: end }
                },
                orderBy: { column: 'data_abertura', ascending: false }
            });
            
            if (error) throw error;
            
            // Buscar itens das comandas
            const comandaIds = vendas.map(c => c.id);
            let itens = [];
            
            if (comandaIds.length > 0) {
                const { data: itensData, error: itensError } = await window.DB.list('itens_comanda', {
                    where: { comanda_id: { in: comandaIds } }
                });
                
                if (itensError) throw itensError;
                itens = itensData;
            }
            
            // Mapear dados para o formato esperado
            return vendas.map(comanda => {
                const comandaItens = itens.filter(item => item.comanda_id === comanda.id);
                
                return {
                    id: comanda.id,
                    cliente: {
                        nome: comanda.cliente_nome,
                        cpf: comanda.cliente_cpf,
                        cr: comanda.cliente_cr,
                        filiado: comanda.cliente_filiado
                    },
                    itens: comandaItens.map(item => ({
                        produtoId: item.produto_id,
                        nome: item.produto_nome,
                        preco: parseFloat(item.preco),
                        quantidade: item.quantidade,
                        subtotal: parseFloat(item.subtotal)
                    })),
                    total: parseFloat(comanda.total || 0),
                    formaPagamento: comanda.forma_pagamento,
                    status: comanda.status,
                    dataAbertura: comanda.data_abertura,
                    dataFechamento: comanda.data_fechamento
                };
            });
            
        } else {
            // Usar localStorage como fallback
            const start = moment(data).startOf('day').valueOf();
            const end = moment(data).endOf('day').valueOf();
            
            return comandas.filter(comanda => {
                const dataComanda = moment(comanda.dataAbertura).valueOf();
                return dataComanda >= start && dataComanda <= end;
            });
        }
        
    } catch (error) {
        console.error('Erro ao buscar vendas do dia:', error);
        return [];
    }
}

// Função para buscar vendas por período
async function buscarVendasPorPeriodo(dataInicio, dataFim) {
    try {
        if (USE_DB && window.DB) {
            // Buscar do Supabase
            const start = moment(dataInicio).startOf('day').toISOString();
            const end = moment(dataFim).endOf('day').toISOString();
            
            const { data: vendas, error } = await window.DB.list('comandas', {
                where: {
                    data_abertura: { gte: start, lte: end }
                },
                orderBy: { column: 'data_abertura', ascending: false }
            });
            
            if (error) throw error;
            
            // Buscar itens das comandas
            const comandaIds = vendas.map(c => c.id);
            let itens = [];
            
            if (comandaIds.length > 0) {
                const { data: itensData, error: itensError } = await window.DB.list('itens_comanda', {
                    where: { comanda_id: { in: comandaIds } }
                });
                
                if (itensError) throw itensError;
                itens = itensData;
            }
            
            // Mapear dados para o formato esperado
            return vendas.map(comanda => {
                const comandaItens = itens.filter(item => item.comanda_id === comanda.id);
                
                return {
                    id: comanda.id,
                    cliente: {
                        nome: comanda.cliente_nome,
                        cpf: comanda.cliente_cpf,
                        cr: comanda.cliente_cr,
                        filiado: comanda.cliente_filiado
                    },
                    itens: comandaItens.map(item => ({
                        produtoId: item.produto_id,
                        nome: item.produto_nome,
                        preco: parseFloat(item.preco),
                        quantidade: item.quantidade,
                        subtotal: parseFloat(item.subtotal)
                    })),
                    total: parseFloat(comanda.total || 0),
                    formaPagamento: comanda.forma_pagamento,
                    status: comanda.status,
                    dataAbertura: comanda.data_abertura,
                    dataFechamento: comanda.data_fechamento
                };
            });
            
        } else {
            // Usar localStorage como fallback
            const start = moment(dataInicio).startOf('day').valueOf();
            const end = moment(dataFim).endOf('day').valueOf();
            
            return comandas.filter(comanda => {
                const dataComanda = moment(comanda.dataAbertura).valueOf();
                return dataComanda >= start && dataComanda <= end;
            });
        }
        
    } catch (error) {
        console.error('Erro ao buscar vendas por período:', error);
        return [];
    }
}

// Função para mostrar notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Criar elemento de notificação
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao notificacao-${tipo}`;
    notificacao.textContent = mensagem;
    
    // Adicionar ao body
    document.body.appendChild(notificacao);
    
    // Mostrar com animação
    setTimeout(() => notificacao.classList.add('show'), 100);
    
    // Remover após 5 segundos
    setTimeout(() => {
        notificacao.classList.remove('show');
        setTimeout(() => document.body.removeChild(notificacao), 100);
    }, 5000);
}
