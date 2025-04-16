/**
 * models/Message.js
 * Modelo de dados para mensagens usando MongoDB/Mongoose
 */

const mongoose = require('mongoose');

// Definir schema para mensagens
const messageSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  lastAttempt: {
    type: Date
  }
});

// Criar e exportar o modelo
const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
