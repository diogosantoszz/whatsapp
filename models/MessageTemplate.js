/**
 * models/MessageTemplate.js
 * Modelo para templates de mensagens pré-definidas
 */
const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
