-- Schema do banco de dados para Sistema de Vendas — RangeClub Demo (Portfólio)
-- PostgreSQL (Supabase) — opcional.
-- Tabela de Filiados
CREATE TABLE IF NOT EXISTS filiados (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  cr VARCHAR(20) NOT NULL,
  telefone VARCHAR(15),
  email VARCHAR(100),
  data_cadastro DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  preco_filiado DECIMAL(10, 2) NOT NULL CHECK (preco_filiado > 0),
  preco_nao_filiado DECIMAL(10, 2) NOT NULL CHECK (preco_nao_filiado > 0),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de Comandas
CREATE TABLE IF NOT EXISTS comandas (
  id SERIAL PRIMARY KEY,
  cliente_nome VARCHAR(100) NOT NULL,
  cliente_cpf VARCHAR(11) NOT NULL,
  cliente_cr VARCHAR(20) NOT NULL,
  cliente_filiado BOOLEAN DEFAULT false,
  filiado_id INTEGER REFERENCES filiados(id),
  total DECIMAL(10, 2) DEFAULT 0.00,
  forma_pagamento VARCHAR(50),
  status VARCHAR(20) DEFAULT 'aberta',
  data_abertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_fechamento TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de Itens da Comanda
CREATE TABLE IF NOT EXISTS itens_comanda (
  id SERIAL PRIMARY KEY,
  comanda_id INTEGER REFERENCES comandas(id) ON DELETE CASCADE,
  produto_id INTEGER REFERENCES produtos(id),
  produto_nome VARCHAR(100) NOT NULL,
  preco DECIMAL(10, 2) NOT NULL CHECK (preco > 0),
  quantidade INTEGER NOT NULL DEFAULT 1 CHECK (quantidade > 0),
  subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_filiados_cpf ON filiados(cpf);
CREATE INDEX IF NOT EXISTS idx_filiados_nome ON filiados(nome);
CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
CREATE INDEX IF NOT EXISTS idx_comandas_data_abertura ON comandas(data_abertura);
CREATE INDEX IF NOT EXISTS idx_itens_comanda_id ON itens_comanda(comanda_id);
-- Evitar duplicidade do mesmo produto na mesma comanda
CREATE UNIQUE INDEX IF NOT EXISTS uniq_itens_comanda ON itens_comanda(comanda_id, produto_id);
-- Normalização de CPF para somente dígitos (idempotente)
-- Filiados
UPDATE filiados
SET cpf = regexp_replace(cpf, '\\D', '', 'g')
WHERE cpf ~ '[^0-9]';
-- Comandas
UPDATE comandas
SET cliente_cpf = regexp_replace(cliente_cpf, '\\D', '', 'g')
WHERE cliente_cpf ~ '[^0-9]';
-- Garantir constraints de 11 dígitos (adiciona se não existir)
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_constraint
  WHERE conname = 'filiados_cpf_digits_chk'
) THEN
ALTER TABLE filiados
ADD CONSTRAINT filiados_cpf_digits_chk CHECK (cpf ~ '^[0-9]{11}$');
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_constraint
  WHERE conname = 'comandas_cliente_cpf_digits_chk'
) THEN
ALTER TABLE comandas
ADD CONSTRAINT comandas_cliente_cpf_digits_chk CHECK (cliente_cpf ~ '^[0-9]{11}$');
END IF;
END $$;
-- Ajuste de FK para permitir exclusão de filiado sem quebrar comandas existentes
DO $$
DECLARE conname text;
BEGIN
SELECT pc.conname INTO conname
FROM pg_constraint pc
  JOIN pg_class rc ON pc.conrelid = rc.oid
WHERE rc.relname = 'comandas'
  AND pc.contype = 'f'
  AND pc.conkey = ARRAY [
      (
        SELECT attnum FROM pg_attribute
        WHERE attrelid = rc.oid AND attname = 'filiado_id'
      )
    ];
IF conname IS NOT NULL THEN EXECUTE format(
  'ALTER TABLE comandas DROP CONSTRAINT %I',
  conname
);
END IF;
END $$;
ALTER TABLE comandas
ADD CONSTRAINT comandas_filiado_id_fkey FOREIGN KEY (filiado_id) REFERENCES filiados(id) ON DELETE
SET NULL;
-- =============================
-- RLS (Row Level Security) e Políticas
-- =============================
-- Habilitar RLS
ALTER TABLE filiados ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_comanda ENABLE ROW LEVEL SECURITY;
-- FILIADOS: CRUD básico (ajuste depois se quiser restringir)
DROP POLICY IF EXISTS filiados_select_anon ON filiados;
DROP POLICY IF EXISTS filiados_insert_anon ON filiados;
DROP POLICY IF EXISTS filiados_update_anon ON filiados;
DROP POLICY IF EXISTS filiados_delete_anon ON filiados;
CREATE POLICY filiados_select_anon ON filiados FOR
SELECT USING (true);
CREATE POLICY filiados_insert_anon ON filiados FOR
INSERT WITH CHECK (true);
CREATE POLICY filiados_update_anon ON filiados FOR
UPDATE USING (true) WITH CHECK (true);
CREATE POLICY filiados_delete_anon ON filiados FOR DELETE USING (true);
-- PRODUTOS: leitura + criação + atualização (remoção lógica via ativo=false)
DROP POLICY IF EXISTS produtos_select_anon ON produtos;
DROP POLICY IF EXISTS produtos_insert_anon ON produtos;
DROP POLICY IF EXISTS produtos_update_anon ON produtos;
CREATE POLICY produtos_select_anon ON produtos FOR
SELECT USING (true);
CREATE POLICY produtos_insert_anon ON produtos FOR
INSERT WITH CHECK (true);
CREATE POLICY produtos_update_anon ON produtos FOR
UPDATE USING (true) WITH CHECK (true);
-- COMANDAS: leitura + criação + atualização SOMENTE quando comanda estiver ABERTA
-- Permite atualizar totais, forma_pagamento e fechar (status -> 'fechada') enquanto status atual é 'aberta'.
DROP POLICY IF EXISTS comandas_select_anon ON comandas;
DROP POLICY IF EXISTS comandas_insert_anon ON comandas;
DROP POLICY IF EXISTS comandas_update_open_only ON comandas;
CREATE POLICY comandas_select_anon ON comandas FOR
SELECT USING (true);
CREATE POLICY comandas_insert_anon ON comandas FOR
INSERT WITH CHECK (true);
-- USING avalia a linha antiga (OLD); só permite UPDATE se a comanda estiver aberta no momento da operação
CREATE POLICY comandas_update_open_only ON comandas FOR
UPDATE USING (status = 'aberta') WITH CHECK (true);
-- ITENS_COMANDA: operações permitidas apenas se a comanda estiver ABERTA
DROP POLICY IF EXISTS itens_select_anon ON itens_comanda;
DROP POLICY IF EXISTS itens_insert_open_comanda ON itens_comanda;
DROP POLICY IF EXISTS itens_update_open_comanda ON itens_comanda;
DROP POLICY IF EXISTS itens_delete_open_comanda ON itens_comanda;
CREATE POLICY itens_select_anon ON itens_comanda FOR
SELECT USING (true);
CREATE POLICY itens_insert_open_comanda ON itens_comanda FOR
INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM comandas c
      WHERE c.id = itens_comanda.comanda_id
        AND c.status = 'aberta'
    )
  );
CREATE POLICY itens_update_open_comanda ON itens_comanda FOR
UPDATE USING (
    EXISTS (
      SELECT 1
      FROM comandas c
      WHERE c.id = itens_comanda.comanda_id
        AND c.status = 'aberta'
    )
  ) WITH CHECK (true);
CREATE POLICY itens_delete_open_comanda ON itens_comanda FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM comandas c
    WHERE c.id = itens_comanda.comanda_id
      AND c.status = 'aberta'
  )
);
-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'update_filiados_updated_at'
    AND c.relname = 'filiados'
) THEN CREATE TRIGGER update_filiados_updated_at BEFORE
UPDATE ON filiados FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'update_produtos_updated_at'
    AND c.relname = 'produtos'
) THEN CREATE TRIGGER update_produtos_updated_at BEFORE
UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
DO $$ BEGIN IF NOT EXISTS (
  SELECT 1
  FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'update_comandas_updated_at'
    AND c.relname = 'comandas'
) THEN CREATE TRIGGER update_comandas_updated_at BEFORE
UPDATE ON comandas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END IF;
END $$;
-- Inserir dados de exemplo
-- Dados fictícios para portfólio
INSERT INTO filiados (nome, cpf, cr, telefone, email)
VALUES (
    'Ana Vitória',
    '123.456.789-00',
    'CR102938',
    '(11) 90000-0001',
    'ana.vitoria@demo.dev'
  ),
  (
    'Bruno Ferreira',
    '987.654.321-00',
    'CR564738',
    '(21) 98888-8802',
    'bruno.ferreira@demo.dev'
  ),
  (
    'Carla Menezes',
    '456.789.123-00',
    'CR918273',
    '(31) 97777-7703',
    'carla.menezes@demo.dev'
  ) ON CONFLICT (cpf) DO NOTHING;
INSERT INTO produtos (nome, preco_filiado, preco_nao_filiado)
VALUES ('Munição .38 (DEMO)', 2.50, 3.00),
  ('Munição 9mm (DEMO)', 2.80, 3.30),
  ('Munição .40 (DEMO)', 3.20, 3.80),
  ('Aluguel Arma (DEMO)', 15.00, 20.00),
  ('Protetor Auricular (DEMO)', 5.00, 7.00),
  ('Óculos de Proteção (DEMO)', 3.00, 5.00) ON CONFLICT DO NOTHING;