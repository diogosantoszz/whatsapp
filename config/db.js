/**
 * config/db.js
 * Configuração de conexão com MongoDB
 */

const mongoose = require('mongoose');
require('dotenv').config();

// URI de conexão do MongoDB (do arquivo .env ou padrão local)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp-scheduler';

// Opções de conexão
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, options);
    console.log('Conectado ao MongoDB com sucesso');
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error.message);
    process.exit(1); // Encerrar aplicação em caso de falha de conexão
  }
};

module.exports = { connectDB };
