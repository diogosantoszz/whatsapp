/**
 * controllers/contactController.js
 * Controlador para gerenciar contatos pré-definidos
 */
const Contact = require('../models/Contact');

// Obter todos os contatos
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ name: 1 });
    res.json(contacts);
  } catch (error) {
    console.error('Erro ao obter contatos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obter contato por ID
exports.getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    res.json(contact);
  } catch (error) {
    console.error('Erro ao obter contato:', error);
    res.status(500).json({ error: error.message });
  }
};

// Criar novo contato
exports.createContact = async (req, res) => {
  try {
    const { name, phoneNumber, description, category } = req.body;
    
    if (!name || !phoneNumber) {
      return res.status(400).json({ error: 'Nome e número de telefone são obrigatórios' });
    }
    
    // Formatar o número de telefone (similar ao serviço de WhatsApp)
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('351')) {
      formattedNumber = '351' + formattedNumber;
    }
    
    const newContact = new Contact({
      name,
      phoneNumber: formattedNumber,
      description,
      category
    });
    
    await newContact.save();
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    res.status(500).json({ error: error.message });
  }
};

// Atualizar contato
exports.updateContact = async (req, res) => {
  try {
    const { name, phoneNumber, description, category } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (phoneNumber) {
      // Formatar o número de telefone
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      if (!formattedNumber.startsWith('351')) {
        formattedNumber = '351' + formattedNumber;
      }
      updates.phoneNumber = formattedNumber;
    }
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    
    // Sempre atualizar o updatedAt
    updates.updatedAt = new Date();
    
    const updatedContact = await Contact.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    
    if (!updatedContact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    
    res.json(updatedContact);
  } catch (error) {
    console.error('Erro ao atualizar contato:', error);
    res.status(500).json({ error: error.message });
  }
};

// Excluir contato
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contato não encontrado' });
    }
    
    res.json({ message: 'Contato excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir contato:', error);
    res.status(500).json({ error: error.message });
  }
};
