-- =====================================================
-- RESET SIMPLES - APENAS LIMPEZA
-- RangeClub Demo - Reset Básico
-- =====================================================
-- ATENÇÃO: Este script irá APAGAR TODOS os dados!
-- Execute apenas em ambiente de desenvolvimento/teste
-- =====================================================
-- 1. LIMPEZA COMPLETA DAS TABELAS
-- =====================================================
-- Desabilitar verificações temporariamente
SET session_replication_role = replica;
-- Limpar todas as tabelas
TRUNCATE TABLE itens_comanda RESTART IDENTITY CASCADE;
TRUNCATE TABLE comandas RESTART IDENTITY CASCADE;
TRUNCATE TABLE produtos RESTART IDENTITY CASCADE;
TRUNCATE TABLE filiados RESTART IDENTITY CASCADE;
-- Reabilitar verificações
SET session_replication_role = DEFAULT;
-- =====================================================
-- 2. RESETAR SEQUÊNCIAS
-- =====================================================
ALTER SEQUENCE IF EXISTS filiados_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS produtos_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS comandas_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS itens_comanda_id_seq RESTART WITH 1;
-- =====================================================
-- 3. VERIFICAÇÃO
-- =====================================================
-- Verificar se está tudo limpo
SELECT 'Status após reset:' as info;
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