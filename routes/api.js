/**
 * routes/api.js
 * Rotas da API atualizadas com suporte para contatos e templates
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const contactController = require('../controllers/contactController');
const templateController = require('../controllers/templateController');
const { getWhatsAppStatus, getQrCode } = require('../services/whatsappService');
const { restartWhatsApp } = require('../services/whatsappService');

// Rotas para mensagens
router.get('/messages', messageController.getAllMessages);
router.post('/messages', messageController.createMessage);
router.get('/messages/:id', messageController.getMessage);
router.put('/messages/:id', messageController.updateMessage);
router.delete('/messages/:id', messageController.deleteMessage);

// Rotas para contatos
router.get('/contacts', contactController.getAllContacts);
router.post('/contacts', contactController.createContact);
router.get('/contacts/:id', contactController.getContact);
router.put('/contacts/:id', contactController.updateContact);
router.delete('/contacts/:id', contactController.deleteContact);

// Rotas para templates de mensagens
router.get('/templates', templateController.getAllTemplates);
router.post('/templates', templateController.createTemplate);
router.get('/templates/:id', templateController.getTemplate);
router.put('/templates/:id', templateController.updateTemplate);
router.delete('/templates/:id', templateController.deleteTemplate);

// Rotas para WhatsApp
router.get('/whatsapp/status', (req, res) => {
  res.json({ connected: getWhatsAppStatus() });
});

router.get('/whatsapp/qrcode', (req, res) => {
  const qrCode = getQrCode();
  if (qrCode) {
    res.json({ qrCode });
  } else {
    res.status(404).json({ error: 'QR Code não disponível ou já conectado' });
  }
});

// Adicione esta rota para reiniciar o WhatsApp
router.post('/whatsapp/restart', async (req, res) => {
  try {
    const result = await restartWhatsApp();
    res.json(result);
  } catch (error) {
    console.error('Erro ao reiniciar WhatsApp:', error);
    res.status(500).json({ error: 'Falha ao reiniciar o serviço WhatsApp' });
  }
});

module.exports = router;
