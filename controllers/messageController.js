/**
 * controllers/messageController.js
 * Controlador para mensagens usando MongoDB
 */

const Message = require('../models/Message');
const { sendWhatsAppMessage, isWhatsAppConnected } = require('../services/whatsappService');

// Obter todas as mensagens
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find().sort({ scheduledTime: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Erro ao obter mensagens:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obter mensagem por ID
exports.getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    res.json(message);
  } catch (error) {
    console.error('Erro ao obter mensagem:', error);
    res.status(500).json({ error: error.message });
  }
};

// Criar nova mensagem
exports.createMessage = async (req, res) => {
  try {
    const { recipient, message, scheduledTime } = req.body;
    
    if (!recipient || !message || !scheduledTime) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    // Validar telefone (formato básico)
    if (!/^\d{10,15}$/.test(recipient)) {
      return res.status(400).json({ error: 'Número de telefone inválido' });
    }
    
    // Validar data de agendamento (deve ser no futuro)
    const scheduledDate = new Date(scheduledTime);
    if (isNaN(scheduledDate) || scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Data de agendamento deve ser no futuro' });
    }
    
    const newMessage = new Message({
      recipient,
      message,
      scheduledTime: scheduledDate
    });
    
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
};

// Atualizar mensagem
exports.updateMessage = async (req, res) => {
  try {
    const { recipient, message, scheduledTime } = req.body;
    const updates = {};
    
    if (recipient) updates.recipient = recipient;
    if (message) updates.message = message;
    if (scheduledTime) updates.scheduledTime = new Date(scheduledTime);
    
    // Sempre atualizar o updatedAt
    updates.updatedAt = new Date();
    
    const updatedMessage = await Message.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    
    if (!updatedMessage) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    res.json(updatedMessage);
  } catch (error) {
    console.error('Erro ao atualizar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
};

// Excluir mensagem
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: 'Mensagem não encontrada' });
    }
    
    res.json({ message: 'Mensagem excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verificar e enviar mensagens agendadas
exports.checkScheduledMessages = async () => {
  try {
    // Verificar se o WhatsApp está conectado
    if (!isWhatsAppConnected()) {
      console.log('WhatsApp não está conectado. Não é possível enviar mensagens.');
      return;
    }
    
    const now = new Date();
    const pendingMessages = await Message.find({
      status: 'pending',
      scheduledTime: { $lte: now }
    });
    
    console.log(`${pendingMessages.length} mensagens pendentes encontradas para envio.`);
    
    for (const msg of pendingMessages) {
      try {
        await sendWhatsAppMessage(msg.recipient, msg.message);
        
        msg.status = 'sent';
        msg.sentAt = new Date();
        await msg.save();
        
        console.log(`Mensagem ${msg._id} enviada com sucesso para ${msg.recipient}`);
      } catch (error) {
        msg.status = 'failed';
        msg.error = error.message;
        msg.lastAttempt = new Date();
        await msg.save();
        
        console.error(`Erro ao enviar mensagem ${msg._id}:`, error);
      }
    }
  } catch (error) {
    console.error('Erro ao verificar mensagens agendadas:', error);
  }
};
