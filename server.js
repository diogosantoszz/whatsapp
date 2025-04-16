/**
 * server.js
 * Arquivo principal do servidor, atualizado com autenticação
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const { apiAuth } = require('./middleware/auth');
const { initWhatsApp } = require('./services/whatsappService');
const { checkScheduledMessages } = require('./controllers/messageController');
const cron = require('node-cron');

// Criar a aplicação Express
const app = express();
const PORT = process.env.PORT || process.env.ALTERNATE_PORT || 3000;

// Conectar ao MongoDB
connectDB();

app.get('/api/whatsapp/status', (req, res) => {
  const { getWhatsAppStatus } = require('./services/whatsappService');
  res.json({ connected: getWhatsAppStatus() });
});

app.get('/api/whatsapp/qrcode', (req, res) => {
  const { getQrCode } = require('./services/whatsappService');
  const qrCode = getQrCode();
  if (qrCode) {
    res.json({ qrCode });
  } else {
    res.status(404).json({ error: 'QR Code não disponível ou já conectado' });
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Rota raiz para redirecionar para login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rotas de autenticação (não protegidas)
app.use('/api/auth', authRoutes);

// Proteção para rotas da API
app.use('/api', apiAuth);

// Rotas da API
app.use('/api', apiRoutes);

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas para acessar páginas específicas
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicializar WhatsApp
initWhatsApp();

// Agendar verificação de mensagens a cada minuto
cron.schedule('* * * * *', () => {
  checkScheduledMessages();
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
