/**
 * services/whatsappService.js
 * Serviço otimizado de WhatsApp com reconexão automática
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const os = require('os');

let client;
let whatsappConnected = false;
let qrCodeImage = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// Definir diretório de sessão como constante para consistência
const SESSION_DIR = path.join(os.homedir(), '.wwebjs_auth');

// Função para verificar e limpar pasta de sessão se necessário
const checkAndCleanSessionDir = async () => {
    try {
        // Verificar se diretório existe
        if (fs.existsSync(SESSION_DIR)) {
            const sessionFiles = fs.readdirSync(SESSION_DIR);
            
            // Se houver tentativas de conexão falhadas, limpar sessão
            if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
                console.log(`Atingido limite de tentativas (${MAX_RECONNECT_ATTEMPTS}). Limpando pasta de sessão...`);
                
                sessionFiles.forEach(file => {
                    const filePath = path.join(SESSION_DIR, file);
                    if (fs.lstatSync(filePath).isDirectory()) {
                        fs.rmdirSync(filePath, { recursive: true });
                    } else {
                        fs.unlinkSync(filePath);
                    }
                });
                
                console.log('Pasta de sessão limpa. Reiniciando contador de tentativas.');
                connectionAttempts = 0;
            } else {
                console.log(`Diretório de sessão existe com ${sessionFiles.length} itens. Tentativa ${connectionAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}.`);
            }
        } else {
            console.log('Diretório de sessão não existe. Criando...');
            fs.mkdirSync(SESSION_DIR, { recursive: true });
            connectionAttempts = 0;
        }
    } catch (error) {
        console.error('Erro ao verificar/limpar diretório de sessão:', error);
    }
};

// Inicializar cliente do WhatsApp
exports.initWhatsApp = async () => {
    console.log('Iniciando serviço WhatsApp...');
    
    // Verificar pasta de sessão antes de inicializar
    await checkAndCleanSessionDir();
    
    // Criar o cliente com configurações otimizadas
    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: SESSION_DIR,
            clientId: 'whatsapp-scheduler'  // ID consistente para sessão
        }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-extensions',
                '--disable-component-extensions-with-background-pages',
                '--disable-default-apps',
                '--mute-audio',
                '--hide-scrollbars'
            ],
            ignoreDefaultArgs: ['--enable-automation'],
            defaultViewport: null
        },
        webVersionCache: {
            type: 'none'  // Desativar cache de versão para evitar problemas
        },
        webVersion: '2.2342.52',  // Usar versão específica para estabilidade
        takeoverOnConflict: true,  // Tomar controle se houver conflito
        authTimeoutMs: 60000,      // 60 segundos de timeout para autenticação
        qrTimeoutMs: 40000,        // 40 segundos de timeout para QR
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'
    });

    // Event Handlers
    client.on('qr', async (qr) => {
        console.log('QR Code recebido, escaneie para conectar...');
        whatsappConnected = false;
        connectionAttempts++; // Incrementar contador de tentativas
        
        try {
            // Gerar imagem do QR code em base64
            qrCodeImage = await qrcode.toDataURL(qr);
            console.log('QR Code gerado com sucesso. Pendente escaneamento.');
        } catch (error) {
            console.error('Erro ao gerar QR Code:', error);
        }
    });

    client.on('ready', () => {
        console.log('Cliente WhatsApp está pronto!');
        whatsappConnected = true;
        qrCodeImage = null;
        connectionAttempts = 0; // Resetar contador em caso de sucesso
        
        // Criar arquivo de marcador para indicar uma conexão bem-sucedida
        try {
            fs.writeFileSync(path.join(SESSION_DIR, 'connection-success'), new Date().toISOString());
        } catch (e) {
            console.log('Aviso: Não foi possível criar marcador de conexão bem-sucedida');
        }
    });

    client.on('authenticated', () => {
        console.log('Autenticado no WhatsApp. Aguardando inicialização...');
    });

    client.on('auth_failure', (msg) => {
        console.error('Falha na autenticação:', msg);
        whatsappConnected = false;
        connectionAttempts++;
        
        // Se exceder tentativas, forçar limpeza na próxima inicialização
        if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log('Múltiplas falhas de autenticação. Sessão será limpa na próxima tentativa.');
        }
    });

    client.on('disconnected', async (reason) => {
        console.log('Cliente WhatsApp desconectado. Motivo:', reason);
        whatsappConnected = false;
        
        // Verificar se deve limpar a sessão
        await checkAndCleanSessionDir();
        
        // Aguardar um tempo antes de tentar reconectar
        console.log('Aguardando 10 segundos antes de tentar reconectar...');
        setTimeout(() => {
            console.log('Tentando reiniciar cliente...');
            try {
                client.initialize();
            } catch (error) {
                console.error('Erro ao reiniciar cliente:', error);
            }
        }, 10000);
    });

    // Handler para erros não tratados
    client.on('error', (error) => {
        console.error('Erro no cliente WhatsApp:', error);
    });

    // Inicializar o cliente com tratamento de erros
    try {
        console.log('Inicializando cliente WhatsApp...');
        await client.initialize();
    } catch (error) {
        console.error('Erro ao inicializar cliente WhatsApp:', error);
        
        // Incrementar tentativas e verificar se deve limpar sessão
        connectionAttempts++;
        await checkAndCleanSessionDir();
        
        // Tentar novamente após erro de inicialização
        setTimeout(() => {
            console.log('Tentando reiniciar após erro de inicialização...');
            try {
                client.initialize();
            } catch (e) {
                console.error('Erro ao reiniciar após falha:', e);
            }
        }, 5000);
    }
};

// Serviço de manutenção periódica
const startMaintenanceService = () => {
    console.log('Iniciando serviço de manutenção periódica do WhatsApp...');
    
    // Verificar a cada 30 minutos se a conexão está OK
    setInterval(async () => {
        console.log('Executando manutenção periódica...');
        
        // Se estiver desconectado, tentar reconectar
        if (!whatsappConnected) {
            console.log('Detectada desconexão durante manutenção. Tentando reconectar...');
            await checkAndCleanSessionDir();
            try {
                client.initialize();
            } catch (error) {
                console.error('Erro ao reconectar durante manutenção:', error);
            }
        } else {
            console.log('Conexão OK durante verificação de manutenção.');
            // Atualizar timestamp para indicar que conexão está ativa
            try {
                fs.writeFileSync(path.join(SESSION_DIR, 'last-heartbeat'), new Date().toISOString());
            } catch (e) {
                console.log('Aviso: Não foi possível atualizar heartbeat');
            }
        }
    }, 30 * 60 * 1000); // 30 minutos
};

// Enviar mensagem do WhatsApp
exports.sendWhatsAppMessage = async (to, message) => {
    if (!client || !whatsappConnected) {
        throw new Error('Cliente WhatsApp não está conectado');
    }

    try {
        // Formatar número para o formato do WhatsApp
        let formattedNumber = to.replace(/\D/g, '');
        if (!formattedNumber.startsWith('351')) {
            formattedNumber = '351' + formattedNumber;
        }
        console.log(`Tentando enviar mensagem para: ${formattedNumber}`);
        
        // Formato para o WhatsApp Web
        const chatId = `${formattedNumber}@c.us`;
        
        // Verificar se o número existe no WhatsApp
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
            throw new Error(`O número ${to} (formatado: ${formattedNumber}) não está registrado no WhatsApp`);
        }
        
        // Enviar mensagem
        const result = await client.sendMessage(chatId, message);
        console.log(`Mensagem enviada com sucesso para ${formattedNumber}`);
        return result;
    } catch (error) {
        console.error('Erro ao enviar mensagem do WhatsApp:', error);
        throw error;
    }
};

// Verificar status da conexão com WhatsApp
exports.isWhatsAppConnected = () => {
    return whatsappConnected;
};

// Obter status da conexão com WhatsApp
exports.getWhatsAppStatus = () => {
    return whatsappConnected;
};

// Obter QR code para conexão
exports.getQrCode = () => {
    return qrCodeImage;
};

// Exportar outras funções úteis
exports.restartWhatsApp = async () => {
    console.log('Reiniciando serviço WhatsApp por solicitação...');
    
    if (client) {
        try {
            // Tentar desconexão limpa
            await client.destroy();
        } catch (e) {
            console.log('Aviso ao destruir cliente:', e);
        }
    }
    
    // Resetar estado
    whatsappConnected = false;
    qrCodeImage = null;
    
    // Limpar sessão e reiniciar
    connectionAttempts = MAX_RECONNECT_ATTEMPTS; // Forçar limpeza
    await checkAndCleanSessionDir();
    exports.initWhatsApp();
    
    return { success: true, message: 'Serviço WhatsApp está sendo reiniciado' };
};

// Iniciar serviço de manutenção
startMaintenanceService();
