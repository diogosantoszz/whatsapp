/**
 * controllers/templateController.js
 * Controlador para gerenciar templates de mensagens
 */
const MessageTemplate = require('../models/MessageTemplate');

// Obter todos os templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await MessageTemplate.find().sort({ title: 1 });
    res.json(templates);
  } catch (error) {
    console.error('Erro ao obter templates:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obter template por ID
exports.getTemplate = async (req, res) => {
  try {
    const template = await MessageTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    res.json(template);
  } catch (error) {
    console.error('Erro ao obter template:', error);
    res.status(500).json({ error: error.message });
  }
};

// Criar novo template
exports.createTemplate = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Título e conteúdo são obrigatórios' });
    }
    
    const newTemplate = new MessageTemplate({
      title,
      content,
      category,
      tags: tags || []
    });
    
    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Erro ao criar template:', error);
    res.status(500).json({ error: error.message });
  }
};

// Atualizar template
exports.updateTemplate = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const updates = {};
    
    if (title) updates.title = title;
    if (content) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (tags) updates.tags = tags;
    
    // Sempre atualizar o updatedAt
    updates.updatedAt = new Date();
    
    const updatedTemplate = await MessageTemplate.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    
    if (!updatedTemplate) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error('Erro ao atualizar template:', error);
    res.status(500).json({ error: error.message });
  }
};

// Excluir template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await MessageTemplate.findByIdAndDelete(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template não encontrado' });
    }
    
    res.json({ message: 'Template excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir template:', error);
    res.status(500).json({ error: error.message });
  }
};
