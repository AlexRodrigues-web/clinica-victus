const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // ajuste se sua conexão estiver em outro lugar

router.get('/hoje', async (req, res) => {
  try {
    const hoje = new Date().toISOString().split('T')[0];
    const [rows] = await pool.query('SELECT mensagem FROM lembretes WHERE data = ?', [hoje]);

    if (rows.length > 0) {
      res.json({ mensagem: rows[0].mensagem });
    } else {
      res.status(404).json({ mensagem: 'Nenhum lembrete para hoje.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar lembrete do dia' });
  }
});

module.exports = router;
