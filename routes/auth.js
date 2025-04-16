/**
 * routes/auth.js
 * Rotas para autenticação
 */

const express = require('express');
const router = express.Router();
const { verifyPassword } = require('../middleware/auth');

// Rota para verificar login
router.post('/login', (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ error: 'Senha não fornecida' });
  }
  
  // Log para depuração (remova em produção)
  console.log(`Tentativa de login com senha: [comprimento: ${password.length}]`);
  console.log(`Senha atual configurada em .env: [comprimento: ${process.env.ACCESS_PASSWORD ? process.env.ACCESS_PASSWORD.length : 0}]`);
  
  // Verificar a senha
  if (verifyPassword(password)) {
    console.log('Login bem-sucedido');
    return res.status(200).json({ success: true });
  } else {
    console.log('Tentativa de login falhou - senha incorreta');
    return res.status(401).json({ error: 'Senha incorreta' });
  }
});

module.exports = router;
