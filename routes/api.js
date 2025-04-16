/**
 * routes/api.js
 * Rotas da API atualizadas com suporte para contatos, templates e endpoint de URL
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const contactController = require('../controllers/contactController');
const templateController = require('../controllers/templateController');
const { getWhatsAppStatus, getQrCode, restartWhatsApp } = require('../services/whatsappService');
// Adicionar importação do modelo Message
const Message = require('../models/Message');

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

// Rota para reiniciar o WhatsApp
router.post('/whatsapp/restart', async (req, res) => {
  try {
    const result = await restartWhatsApp();
    res.json(result);
  } catch (error) {
    console.error('Erro ao reiniciar WhatsApp:', error);
    res.status(500).json({ error: 'Falha ao reiniciar o serviço WhatsApp' });
  }
});

// Rota para criar mensagem via URL (GET)
router.get('/message-url', async (req, res) => {
  try {
    const { recipient, message, date, time, token } = req.query;
    
    // Verificar token de autenticação
    const API_TOKEN = process.env.API_TOKEN || 'your-default-token-change-this';
    if (!token || token !== API_TOKEN) {
      return res.status(401).json({ error: 'Token de autenticação inválido ou não fornecido' });
    }
    
    // Validar campos obrigatórios
    if (!recipient || !message) {
      return res.status(400).json({ error: 'Destinatário e mensagem são obrigatórios' });
    }
    
    // Determinar data/hora de agendamento
    let scheduledDateTime;
    
    if (date && time) {
      // Se data e hora específicas foram fornecidas
      scheduledDateTime = new Date(`${date}T${time}`);
    } else {
      // Agendar para o próximo minuto como padrão
      scheduledDateTime = new Date();
      scheduledDateTime.setMinutes(scheduledDateTime.getMinutes() + 1);
    }
    
    // Verificar se a data é válida
    if (isNaN(scheduledDateTime)) {
      return res.status(400).json({ error: 'Data ou hora fornecida é inválida' });
    }
    
    // Verificar se o número está no formato correto
    let formattedNumber = recipient.replace(/\D/g, '');
    if (!formattedNumber.startsWith('351')) {
      formattedNumber = '351' + formattedNumber;
    }
    
    // Criar mensagem
    const newMessage = new Message({
      recipient: formattedNumber,
      message,
      scheduledTime: scheduledDateTime
    });
    
    await newMessage.save();
    
    res.status(201).json({
      success: true,
      message: 'Mensagem agendada com sucesso',
      data: {
        id: newMessage._id,
        recipient: newMessage.recipient,
        scheduledTime: newMessage.scheduledTime,
        status: newMessage.status
      }
    });
  } catch (error) {
    console.error('Erro ao criar mensagem via URL:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para criar mensagem via URL (POST)
router.post('/message-url', async (req, res) => {
  try {
    const { recipient, message, date, time, token } = req.body;
    
    // Verificar token de autenticação
    const API_TOKEN = process.env.API_TOKEN || 'your-default-token-change-this';
    if (!token || token !== API_TOKEN) {
      return res.status(401).json({ error: 'Token de autenticação inválido ou não fornecido' });
    }
    
    // Validar campos obrigatórios
    if (!recipient || !message) {
      return res.status(400).json({ error: 'Destinatário e mensagem são obrigatórios' });
    }
    
    // Determinar data/hora de agendamento
    let scheduledDateTime;
    
    if (date && time) {
      // Se data e hora específicas foram fornecidas
      scheduledDateTime = new Date(`${date}T${time}`);
    } else {
      // Agendar para o próximo minuto como padrão
      scheduledDateTime = new Date();
      scheduledDateTime.setMinutes(scheduledDateTime.getMinutes() + 1);
    }
    
    // Verificar se a data é válida
    if (isNaN(scheduledDateTime)) {
      return res.status(400).json({ error: 'Data ou hora fornecida é inválida' });
    }
    
    // Verificar se o número está no formato correto
    let formattedNumber = recipient.replace(/\D/g, '');
    if (!formattedNumber.startsWith('351')) {
      formattedNumber = '351' + formattedNumber;
    }
    
    // Criar mensagem
    const newMessage = new Message({
      recipient: formattedNumber,
      message,
      scheduledTime: scheduledDateTime
    });
    
    await newMessage.save();
    
    res.status(201).json({
      success: true,
      message: 'Mensagem agendada com sucesso',
      data: {
        id: newMessage._id,
        recipient: newMessage.recipient,
        scheduledTime: newMessage.scheduledTime,
        status: newMessage.status
      }
    });
  } catch (error) {
    console.error('Erro ao criar mensagem via URL:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;