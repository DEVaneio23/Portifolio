const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// GET - Buscar filiados por termo (precisa vir antes de /:id)
router.get('/buscar/:termo', async (req, res) => {
  try {
    const { termo } = req.params;
    const searchTerm = `%${termo}%`;
    
    const { rows } = await pool.query(
      `SELECT * FROM filiados 
       WHERE nome ILIKE $1 OR cpf ILIKE $1 OR cr ILIKE $1 
       ORDER BY nome`,
      [searchTerm]
    );
    
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar filiados:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Listar todos os filiados
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM filiados ORDER BY nome'
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar filiados:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Buscar filiado por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'SELECT * FROM filiados WHERE id = $1',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Filiado não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao buscar filiado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST - Criar novo filiado
router.post('/', async (req, res) => {
  try {
    const { nome, cpf, cr, telefone, email } = req.body;
    
    // Validar dados obrigatórios
    if (!nome || !cpf || !cr) {
      return res.status(400).json({ 
        error: 'Nome, CPF e CR são obrigatórios' 
      });
    }
    
    // Verificar se CPF já existe
    const existingFiliado = await pool.query(
      'SELECT id FROM filiados WHERE cpf = $1',
      [cpf]
    );
    
    if (existingFiliado.rows.length > 0) {
      return res.status(400).json({ 
        error: 'CPF já cadastrado' 
      });
    }
    
    // Inserir novo filiado
    const { rows } = await pool.query(
      `INSERT INTO filiados (nome, cpf, cr, telefone, email, data_cadastro) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE) 
       RETURNING *`,
      [nome, cpf, cr, telefone, email]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao criar filiado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Atualizar filiado
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cpf, cr, telefone, email } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE filiados 
       SET nome = $1, cpf = $2, cr = $3, telefone = $4, email = $5 
       WHERE id = $6 
       RETURNING *`,
      [nome, cpf, cr, telefone, email, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Filiado não encontrado' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar filiado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE - Remover filiado
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { rows } = await pool.query(
      'DELETE FROM filiados WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Filiado não encontrado' });
    }
    
    res.json({ message: 'Filiado removido com sucesso' });
  } catch (err) {
    console.error('Erro ao remover filiado:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router; 