/**
 * middleware/auth.js
 * Middleware para autenticação e controle de acesso
 */

// Importar dependências se necessário
require('dotenv').config();

// Configuração da senha de acesso
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || 'Zerozero9217!';

// Variável para ativar/desativar autenticação (para depuração)
const DEBUG_DISABLE_AUTH = false; // Mude para true para desativar autenticação temporariamente

/**
 * Middleware para verificar autenticação em rotas da API
 * @param {Object} req - Requisição Express
 * @param {Object} res - Resposta Express
 * @param {Function} next - Função para passar para o próximo middleware
 */
exports.apiAuth = (req, res, next) => {
  // === MODO DE DEPURAÇÃO ===
  // Se o modo de depuração estiver ativado, ignora toda a autenticação
  if (DEBUG_DISABLE_AUTH) {
    console.log('[AUTH DEBUG] Autenticação desativada para depuração');
    return next();
  }

  // === ROTAS WHATSAPP ===
  // Permitir sempre acesso às rotas do WhatsApp para garantir funcionamento
  if (req.path.includes('/whatsapp')) {
    return next();
  }

  // === AUTENTICAÇÃO POR TOKEN ===
  // Se você quiser implementar autenticação por token, descomente e adapte o código abaixo
  /*
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  
  const token = authHeader.split(' ')[1];
  
  // Verificar token (implementação simples)
  if (token !== 'seu_token_secreto') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  */
  
  // === AUTENTICAÇÃO POR SESSÃO ===
  // Se você quiser implementar verificação de sessão no backend, descomente e adapte o código abaixo
  /*
  const sessionToken = req.cookies.session_token;
  if (!sessionToken || !isValidSessionToken(sessionToken)) {
    return res.status(401).json({ error: 'Sessão inválida ou expirada' });
  }
  */
  
  // Por enquanto, permitir todas as chamadas API
  next();
};

/**
 * Função para verificar senha de acesso
 * @param {string} password - Senha fornecida pelo usuário
 * @returns {boolean} - Se a senha está correta
 */
exports.verifyPassword = (password) => {
  // Modo de depuração - permite qualquer senha
  if (DEBUG_DISABLE_AUTH) {
    return true;
  }
  
  // Verificação simples de senha
  // Em produção, considere usar bcrypt ou outra solução mais segura
  return password === ACCESS_PASSWORD;
};

/**
 * Middleware para proteger rotas de página (caso necessário)
 * Se usar server-side rendering ou proteção de páginas no backend
 */
exports.pageAuth = (req, res, next) => {
  // Implementação depende da sua abordagem de autenticação
  // Esta é apenas uma estrutura base
  
  // Modo de depuração - ignora autenticação
  if (DEBUG_DISABLE_AUTH) {
    return next();
  }
  
  // Permitir acesso à página de login
  if (req.path.includes('/login')) {
    return next();
  }
  
  // Verificar autenticação
  // Implementação depende da sua estratégia (cookies, sessão, etc)
  
  // Por enquanto, permite acesso a todas as páginas
  next();
};
