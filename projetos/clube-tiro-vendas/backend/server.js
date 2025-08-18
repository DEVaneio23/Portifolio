const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuração do banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Testar conexão com banco
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro ao conectar com banco:', err);
  } else {
    console.log('Conectado ao banco de dados');
  }
});

// Rotas
app.use('/api/filiados', require('./routes/filiados'));
// app.use('/api/produtos', require('./routes/produtos')); // (pendente)
// app.use('/api/comandas', require('./routes/comandas')); // (pendente)

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'RangeClub Demo — API opcional',
    timestamp: new Date().toISOString()
  });
});

// Middleware de erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`API disponível em: http://localhost:${PORT}/api`);
}); 