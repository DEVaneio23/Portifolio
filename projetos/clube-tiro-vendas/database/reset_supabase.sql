-- =====================================================
-- SCHEMA PARA RESETAR COMPLETAMENTE O SUPABASE
-- RangeClub Demo - Reset Total
-- =====================================================
-- ATENÇÃO: Este script irá APAGAR TODOS os dados!
-- Execute apenas em ambiente de desenvolvimento/teste
-- =====================================================
-- 1. DESABILITAR VERIFICAÇÕES DE INTEGRIDADE
-- =====================================================
SET session_replication_role = replica;
-- =====================================================
-- 2. APAGAR TODOS OS DADOS DAS TABELAS
-- =====================================================
-- Apagar itens de comanda
TRUNCATE TABLE itens_comanda RESTART IDENTITY CASCADE;
-- Apagar comandas
TRUNCATE TABLE comandas RESTART IDENTITY CASCADE;
-- Apagar produtos
TRUNCATE TABLE produtos RESTART IDENTITY CASCADE;
-- Apagar filiados
TRUNCATE TABLE filiados RESTART IDENTITY CASCADE;
-- =====================================================
-- 3. RESETAR SEQUÊNCIAS DE ID
-- =====================================================
-- Resetar sequência de filiados
ALTER SEQUENCE IF EXISTS filiados_id_seq RESTART WITH 1;
-- Resetar sequência de produtos
ALTER SEQUENCE IF EXISTS produtos_id_seq RESTART WITH 1;
-- Resetar sequência de comandas
ALTER SEQUENCE IF EXISTS comandas_id_seq RESTART WITH 1;
-- Resetar sequência de itens_comanda
ALTER SEQUENCE IF EXISTS itens_comanda_id_seq RESTART WITH 1;
-- =====================================================
-- 4. REABILITAR VERIFICAÇÕES DE INTEGRIDADE
-- =====================================================
SET session_replication_role = DEFAULT;
-- =====================================================
-- 5. VERIFICAR RESET
-- =====================================================
-- Verificar se as tabelas estão vazias
SELECT 'filiados' as tabela,
    COUNT(*) as total
FROM filiados
UNION ALL
SELECT 'produtos' as tabela,
    COUNT(*) as total
FROM produtos
UNION ALL
SELECT 'comandas' as tabela,
    COUNT(*) as total
FROM comandas
UNION ALL
SELECT 'itens_comanda' as tabela,
    COUNT(*) as total
FROM itens_comanda;
-- Verificar sequências
SELECT 'filiados_id_seq' as sequencia,
    last_value
FROM filiados_id_seq
UNION ALL
SELECT 'produtos_id_seq' as sequencia,
    last_value
FROM produtos_id_seq
UNION ALL
SELECT 'comandas_id_seq' as sequencia,
    last_value
FROM comandas_id_seq
UNION ALL
SELECT 'itens_comanda_id_seq' as sequencia,
    last_value
FROM itens_comanda_id_seq;
-- =====================================================
-- 6. INSERIR DADOS INICIAIS (OPCIONAL)
-- =====================================================
-- Inserir alguns produtos de exemplo
INSERT INTO produtos (
        nome,
        preco_filiado,
        preco_nao_filiado,
        categoria
    )
VALUES ('Munição 9mm', 4.59, 5.99, 'Munição'),
    ('Munição .45 ACP', 6.99, 8.99, 'Munição'),
    ('Munição .38 Special', 5.49, 6.99, 'Munição'),
    ('Alvo de Papel', 0.50, 0.75, 'Acessórios'),
    ('Protetor Auditivo', 15.00, 20.00, 'Segurança');
-- Inserir alguns filiados de exemplo
INSERT INTO filiados (nome, cpf, cr, email, telefone, data_filiacao)
VALUES (
        'João Silva',
        '12345678901',
        'CR001',
        'joao@demo.dev',
        '(11) 99999-9999',
        CURRENT_DATE
    ),
    (
        'Maria Santos',
        '98765432100',
        'CR002',
        'maria@demo.dev',
        '(11) 88888-8888',
        CURRENT_DATE
    ),
    (
        'Pedro Costa',
        '11122233344',
        'CR003',
        'pedro@demo.dev',
        '(11) 77777-7777',
        CURRENT_DATE
    );
-- =====================================================
-- 7. VERIFICAR DADOS INSERIDOS
-- =====================================================
-- Verificar produtos inseridos
SELECT 'Produtos inseridos:' as info;
SELECT id,
    nome,
    preco_filiado,
    preco_nao_filiado
FROM produtos
ORDER BY id;
-- Verificar filiados inseridos
SELECT 'Filiados inseridos:' as info;
SELECT id,
    nome,
    cpf,
    cr
FROM filiados
ORDER BY id;
-- =====================================================
-- 8. MENSAGEM DE CONFIRMAÇÃO
-- =====================================================
DO $$ BEGIN RAISE NOTICE 'RESET COMPLETO REALIZADO COM SUCESSO!';
RAISE NOTICE 'Todas as tabelas foram limpas';
RAISE NOTICE '🔄 Todas as sequências foram resetadas';
RAISE NOTICE '📝 Dados de exemplo foram inseridos';
RAISE NOTICE '🚀 Sistema pronto para novos testes!';
END $$;