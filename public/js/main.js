// main.js

// Verificar autenticação
(function checkAuth() {
    // Ignorar verificação se estiver na página de login
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    // Verificar se o usuário está autenticado
    const isAuthenticated = sessionStorage.getItem('authenticated') === 'true';
    
    // Se não estiver autenticado, redirecionar para o login
    if (!isAuthenticated) {
        window.location.href = 'login.html';
    }
})();

// Adicionar função de logout
window.logout = function() {
    // Limpar autenticação
    sessionStorage.removeItem('authenticated');
    // Redirecionar para login
    window.location.href = 'login.html';
};

// URLs da API
const API_URL = '/api';
const MESSAGES_API = `${API_URL}/messages`;
const CONTACTS_API = `${API_URL}/contacts`;
const TEMPLATES_API = `${API_URL}/templates`;
const WHATSAPP_STATUS_API = `${API_URL}/whatsapp/status`;
const WHATSAPP_QRCODE_API = `${API_URL}/whatsapp/qrcode`;

// Mapeamento global de contatos e templates para uso fácil
let contactsMap = {};
let templatesMap = {};

// Elementos DOM - Geral
const connectBtn = document.getElementById('connectBtn');
const qrContainer = document.getElementById('qrContainer');
const qrCodeImage = document.getElementById('qrCodeImage');
const connectionStatus = document.getElementById('connectionStatus');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Elementos DOM - Agendamento
const recipientSelect = document.getElementById('recipient-select');
const manualRecipientBtn = document.getElementById('manualRecipientBtn');
const manualRecipientDiv = document.getElementById('manual-recipient');
const recipientInput = document.getElementById('recipient');
const templateSelect = document.getElementById('template-select');
const customMessageBtn = document.getElementById('customMessageBtn');
const messageInput = document.getElementById('message');
const dateInput = document.getElementById('scheduledDate');
const timeInput = document.getElementById('scheduledTime');
const scheduleBtn = document.getElementById('scheduleBtn');
const messagesList = document.getElementById('scheduledMessagesList');

// Elementos DOM - Contatos
const newContactBtn = document.getElementById('newContactBtn');
const contactForm = document.getElementById('contact-form');
const contactFormTitle = document.getElementById('contact-form-title');
const contactIdInput = document.getElementById('contact-id');
const contactNameInput = document.getElementById('contact-name');
const contactNumberInput = document.getElementById('contact-number');
const contactCategoryInput = document.getElementById('contact-category');
const contactDescriptionInput = document.getElementById('contact-description');
const saveContactBtn = document.getElementById('saveContactBtn');
const cancelContactBtn = document.getElementById('cancelContactBtn');
const contactsList = document.getElementById('contactsList');

// Elementos DOM - Templates
const newTemplateBtn = document.getElementById('newTemplateBtn');
const templateForm = document.getElementById('template-form');
const templateFormTitle = document.getElementById('template-form-title');
const templateIdInput = document.getElementById('template-id');
const templateTitleInput = document.getElementById('template-title');
const templateContentInput = document.getElementById('template-content');
const templateCategoryInput = document.getElementById('template-category');
const templateTagsInput = document.getElementById('template-tags');
const saveTemplateBtn = document.getElementById('saveTemplateBtn');
const cancelTemplateBtn = document.getElementById('cancelTemplateBtn');
const templatesList = document.getElementById('templatesList');

// Elementos DOM - Modal de Visualização
const templateModal = document.getElementById('template-preview-modal');
const modalClose = document.querySelector('.close');
const previewTitle = document.getElementById('preview-title');
const previewContent = document.getElementById('preview-content');

// INICIALIZAÇÃO

// Definir data mínima como hoje
const today = new Date();
const formattedDate = today.toISOString().split('T')[0];
dateInput.min = formattedDate;
dateInput.value = formattedDate;

// Configurar navegação por abas
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remover classe active de todos os botões e conteúdos
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        // Adicionar classe active ao botão clicado e ao conteúdo correspondente
        button.classList.add('active');
        const tabId = `${button.dataset.tab}-tab`;
        document.getElementById(tabId).classList.add('active');
    });
});

// Alternância entre seleção e entrada manual de destinatário
manualRecipientBtn.addEventListener('click', () => {
    if (manualRecipientDiv.style.display === 'none') {
        manualRecipientDiv.style.display = 'block';
        recipientSelect.disabled = true;
        manualRecipientBtn.textContent = 'Usar contato salvo';
    } else {
        manualRecipientDiv.style.display = 'none';
        recipientSelect.disabled = false;
        manualRecipientBtn.textContent = 'Inserir manualmente';
    }
});

// Carregamento de template para o campo de mensagem
templateSelect.addEventListener('change', () => {
    const selectedTemplate = templateSelect.value;
    if (selectedTemplate && templatesMap[selectedTemplate]) {
        messageInput.value = templatesMap[selectedTemplate].content;
    }
});

// Configuração do modal de visualização de template
modalClose.addEventListener('click', () => {
    templateModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === templateModal) {
        templateModal.style.display = 'none';
    }
});

// FUNCIONALIDADES DE WHATSAPP

// Verificar status do WhatsApp
async function checkWhatsAppStatus() {
    try {
        const response = await fetch(WHATSAPP_STATUS_API);
        const data = await response.json();
        
        if (data.connected) {
            connectionStatus.className = 'connection-status status-connected';
            connectionStatus.textContent = 'Conectado ao WhatsApp';
            connectBtn.textContent = 'Desconectar';
            qrContainer.style.display = 'none';
        } else {
            connectionStatus.className = 'connection-status status-disconnected';
            connectionStatus.textContent = 'Não conectado ao WhatsApp';
            connectBtn.textContent = 'Conectar ao WhatsApp';
        }
    } catch (error) {
        console.error('Erro ao verificar status do WhatsApp:', error);
        connectionStatus.className = 'connection-status status-disconnected';
        connectionStatus.textContent = 'Erro ao verificar conexão';
    }
}

// Obter QR code
async function getQrCode() {
    try {
        const response = await fetch(WHATSAPP_QRCODE_API);
        const data = await response.json();
        
        if (data.qrCode) {
            qrCodeImage.src = data.qrCode;
            qrContainer.style.display = 'block';
        } else {
            qrContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro ao obter QR code:', error);
        qrContainer.style.display = 'none';
    }
}

// Botão para reiniciar o serviço WhatsApp
const restartWhatsAppBtn = document.getElementById('restartWhatsAppBtn');
if (restartWhatsAppBtn) {
  restartWhatsAppBtn.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja reiniciar o serviço do WhatsApp? Isso irá limpar a sessão atual e você precisará escanear o QR code novamente.')) {
      try {
        // Mostrar indicador de carregamento
        restartWhatsAppBtn.textContent = 'Reiniciando...';
        restartWhatsAppBtn.disabled = true;
        
        // Chamar API para reiniciar
        const response = await fetch('/api/whatsapp/restart', {
          method: 'POST'
        });
        
        if (response.ok) {
          alert('Serviço WhatsApp está sendo reiniciado. Aguarde o QR code aparecer para reconectar.');
          // Atualizar status após um tempo
          setTimeout(checkWhatsAppStatus, 5000);
        } else {
          alert('Falha ao reiniciar o serviço WhatsApp.');
        }
      } catch (error) {
        console.error('Erro ao reiniciar WhatsApp:', error);
        alert('Erro ao tentar reiniciar o serviço. Verifique o console para mais detalhes.');
      } finally {
        // Restaurar botão
        restartWhatsAppBtn.textContent = 'Reiniciar Serviço WhatsApp';
        restartWhatsAppBtn.disabled = false;
      }
    }
  });
}

// Alternar conexão do WhatsApp
connectBtn.addEventListener('click', async function() {
    try {
        const statusResponse = await fetch(WHATSAPP_STATUS_API);
        const statusData = await statusResponse.json();
        
        if (!statusData.connected) {
            await getQrCode();
            connectBtn.textContent = 'Aguardando conexão...';
        }
    } catch (error) {
        console.error('Erro ao conectar WhatsApp:', error);
    }
});

// FUNCIONALIDADES DE MENSAGENS

// Carregar todas as mensagens agendadas
async function loadMessages() {
    try {
        const response = await fetch(MESSAGES_API);
        const messages = await response.json();
        
        updateMessagesList(messages);
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    }
}

// Atualizar lista de mensagens agendadas
function updateMessagesList(messages) {
    messagesList.innerHTML = '';
    
    if (messages.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="center">Nenhuma mensagem agendada</td>';
        messagesList.appendChild(row);
        return;
    }
    
    // Ordenar mensagens por data de agendamento
    const sortedMessages = [...messages].sort((a, b) => {
        return new Date(a.scheduledTime) - new Date(b.scheduledTime);
    });
    
    sortedMessages.forEach(msg => {
        const row = document.createElement('tr');
        
        const scheduledTime = new Date(msg.scheduledTime);
        const formattedDate = new Intl.DateTimeFormat('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(scheduledTime);
        
        let statusClass = '';
        let statusText = '';
        
        switch(msg.status) {
            case 'pending':
                statusClass = 'status-pending';
                statusText = 'Pendente';
                break;
            case 'sent':
                statusClass = 'status-sent';
                statusText = 'Enviada';
                break;
            case 'failed':
                statusClass = 'status-failed';
                statusText = 'Falha';
                break;
        }
        
        // Encontrar o nome do contato, se existir
        let recipientDisplay = msg.recipient;
        for (const id in contactsMap) {
            if (contactsMap[id].phoneNumber === msg.recipient) {
                recipientDisplay = contactsMap[id].name + ` (${msg.recipient})`;
                break;
            }
        }
        
        row.innerHTML = `
            <td>${recipientDisplay}</td>
            <td>${msg.message.length > 30 ? msg.message.substring(0, 30) + '...' : msg.message}</td>
            <td>${formattedDate}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>
                ${msg.status === 'pending' ? 
                    `<button class="btn-danger" onclick="deleteMessage('${msg._id}')">Cancelar</button>` : 
                    ''}
            </td>
        `;
        
        messagesList.appendChild(row);
    });
}

// Criar nova mensagem agendada
scheduleBtn.addEventListener('click', async function() {
    let recipient;
    
    // Determinar o destinatário com base no método de entrada
    if (manualRecipientDiv.style.display === 'none') {
        // Usando contato pré-definido
        if (!recipientSelect.value) {
            alert('Por favor, selecione um contato.');
            return;
        }
        recipient = contactsMap[recipientSelect.value].phoneNumber;
    } else {
        // Usando entrada manual
        recipient = recipientInput.value.trim();
        if (!recipient) {
            alert('Por favor, digite o número de telefone.');
            return;
        }
    }
    
    const message = messageInput.value.trim();
    const date = dateInput.value;
    const time = timeInput.value;
    
    if (!message || !date || !time) {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    
    const scheduledDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    
    if (scheduledDateTime <= now) {
        alert('Por favor, selecione uma data e hora futura.');
        return;
    }
    
    try {
        const statusResponse = await fetch(WHATSAPP_STATUS_API);
        const statusData = await statusResponse.json();
        
        if (!statusData.connected) {
            alert('Por favor, conecte-se ao WhatsApp primeiro.');
            return;
        }
        
        // Enviar mensagem para API
        const response = await fetch(MESSAGES_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: recipient,
                message: message,
                scheduledTime: scheduledDateTime.toISOString()
            }),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao agendar mensagem');
        }
        
        // Limpar formulário
        if (manualRecipientDiv.style.display !== 'none') {
            recipientInput.value = '';
        } else {
            recipientSelect.value = '';
        }
        messageInput.value = '';
        templateSelect.value = '';
        
        // Recarregar lista de mensagens
        loadMessages();
        
        alert('Mensagem agendada com sucesso!');
    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
});

// Excluir mensagem
window.deleteMessage = async function(id) {
    if (confirm('Tem certeza que deseja cancelar esta mensagem?')) {
        try {
            const response = await fetch(`${MESSAGES_API}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir mensagem');
            }
            
            // Recarregar lista de mensagens
            loadMessages();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
};

// FUNCIONALIDADES DE CONTATOS

// Carregar todos os contatos
async function loadContacts() {
    try {
        const response = await fetch(CONTACTS_API);
        const contacts = await response.json();
        
        updateContactsList(contacts);
        updateContactsDropdown(contacts);
    } catch (error) {
        console.error('Erro ao carregar contatos:', error);
    }
}

// Atualizar lista de contatos
function updateContactsList(contacts) {
    contactsList.innerHTML = '';
    contactsMap = {}; // Resetar mapeamento global
    
    if (contacts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="center">Nenhum contato cadastrado</td>';
        contactsList.appendChild(row);
        return;
    }
    
    // Ordenar contatos por nome
    const sortedContacts = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedContacts.forEach(contact => {
        // Adicionar ao mapeamento global
        contactsMap[contact._id] = contact;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contact.name}</td>
            <td>${contact.phoneNumber}</td>
            <td>${contact.category || '-'}</td>
            <td>
                <button class="btn-icon" onclick="editContact('${contact._id}')" title="Editar">
                    ✏️
                </button>
                <button class="btn-icon" onclick="deleteContact('${contact._id}')" title="Excluir">
                    🗑️
                </button>
            </td>
        `;
        
        contactsList.appendChild(row);
    });
}

// Atualizar dropdown de contatos para seleção
function updateContactsDropdown(contacts) {
    // Limpar opções existentes, exceto a primeira
    while (recipientSelect.options.length > 1) {
        recipientSelect.remove(1);
    }
    
    if (contacts.length === 0) {
        return;
    }
    
    // Ordenar contatos por nome
    const sortedContacts = [...contacts].sort((a, b) => a.name.localeCompare(b.name));
    
    // Agrupar contatos por categoria
    const categorizedContacts = {};
    sortedContacts.forEach(contact => {
        const category = contact.category || 'Sem categoria';
        if (!categorizedContacts[category]) {
            categorizedContacts[category] = [];
        }
        categorizedContacts[category].push(contact);
    });
    
    // Adicionar optgroups por categoria
    for (const category in categorizedContacts) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        
        categorizedContacts[category].forEach(contact => {
            const option = document.createElement('option');
            option.value = contact._id;
            option.textContent = contact.name;
            optgroup.appendChild(option);
        });
        
        recipientSelect.appendChild(optgroup);
    }
}

// Exibir formulário para novo contato
newContactBtn.addEventListener('click', function() {
    // Resetar formulário
    contactFormTitle.textContent = 'Adicionar Contato';
    contactIdInput.value = '';
    contactNameInput.value = '';
    contactNumberInput.value = '';
    contactCategoryInput.value = '';
    contactDescriptionInput.value = '';
    
    // Exibir formulário
    contactForm.style.display = 'block';
});

// Cancelar cadastro/edição de contato
cancelContactBtn.addEventListener('click', function() {
    contactForm.style.display = 'none';
});

// Salvar contato (novo ou editado)
saveContactBtn.addEventListener('click', async function() {
    const name = contactNameInput.value.trim();
    const phoneNumber = contactNumberInput.value.trim();
    
    if (!name || !phoneNumber) {
        alert('Nome e número de telefone são obrigatórios.');
        return;
    }
    
    const contactData = {
        name,
        phoneNumber,
        category: contactCategoryInput.value.trim(),
        description: contactDescriptionInput.value.trim()
    };
    
    try {
        let response;
        
        if (contactIdInput.value) {
            // Atualizar contato existente
            response = await fetch(`${CONTACTS_API}/${contactIdInput.value}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData),
            });
        } else {
            // Criar novo contato
            response = await fetch(CONTACTS_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData),
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao salvar contato');
        }
        
        // Esconder formulário
        contactForm.style.display = 'none';
        
        // Recarregar lista de contatos
        loadContacts();
        
        alert('Contato salvo com sucesso!');
    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
});

// Editar contato existente
window.editContact = function(id) {
    const contact = contactsMap[id];
    if (!contact) return;
    
    contactFormTitle.textContent = 'Editar Contato';
    contactIdInput.value = id;
    contactNameInput.value = contact.name;
    contactNumberInput.value = contact.phoneNumber;
    contactCategoryInput.value = contact.category || '';
    contactDescriptionInput.value = contact.description || '';
    
    contactForm.style.display = 'block';
};

// Excluir contato
window.deleteContact = async function(id) {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
        try {
            const response = await fetch(`${CONTACTS_API}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir contato');
            }
            
            // Recarregar lista de contatos
            loadContacts();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
};

// FUNCIONALIDADES DE TEMPLATES

// Carregar todos os templates
async function loadTemplates() {
    try {
        const response = await fetch(TEMPLATES_API);
        const templates = await response.json();
        
        updateTemplatesList(templates);
        updateTemplatesDropdown(templates);
    } catch (error) {
        console.error('Erro ao carregar templates:', error);
    }
}

// Atualizar lista de templates
function updateTemplatesList(templates) {
    templatesList.innerHTML = '';
    templatesMap = {}; // Resetar mapeamento global
    
    if (templates.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="center">Nenhum template cadastrado</td>';
        templatesList.appendChild(row);
        return;
    }
    
    // Ordenar templates por título
    const sortedTemplates = [...templates].sort((a, b) => a.title.localeCompare(b.title));
    
    sortedTemplates.forEach(template => {
        // Adicionar ao mapeamento global
        templatesMap[template._id] = template;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${template.title}</td>
            <td>${template.category || '-'}</td>
            <td>
                <button class="btn-icon" onclick="previewTemplate('${template._id}')" title="Visualizar">
                    👁️
                </button>
            </td>
            <td>
                <button class="btn-icon" onclick="editTemplate('${template._id}')" title="Editar">
                    ✏️
                </button>
                <button class="btn-icon" onclick="deleteTemplate('${template._id}')" title="Excluir">
                    🗑️
                </button>
            </td>
        `;
        
        templatesList.appendChild(row);
    });
}

// Atualizar dropdown de templates para seleção
function updateTemplatesDropdown(templates) {
    // Limpar opções existentes, exceto a primeira
    while (templateSelect.options.length > 1) {
        templateSelect.remove(1);
    }
    
    if (templates.length === 0) {
        return;
    }
    
    // Ordenar templates por título
    const sortedTemplates = [...templates].sort((a, b) => a.title.localeCompare(b.title));
    
    // Agrupar templates por categoria
    const categorizedTemplates = {};
    sortedTemplates.forEach(template => {
        const category = template.category || 'Sem categoria';
        if (!categorizedTemplates[category]) {
            categorizedTemplates[category] = [];
        }
        categorizedTemplates[category].push(template);
    });
    
    // Adicionar optgroups por categoria
    for (const category in categorizedTemplates) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = category;
        
        categorizedTemplates[category].forEach(template => {
            const option = document.createElement('option');
            option.value = template._id;
            option.textContent = template.title;
            optgroup.appendChild(option);
        });
        
        templateSelect.appendChild(optgroup);
    }
}

// Exibir formulário para novo template
newTemplateBtn.addEventListener('click', function() {
    // Resetar formulário
    templateFormTitle.textContent = 'Adicionar Template';
    templateIdInput.value = '';
    templateTitleInput.value = '';
    templateContentInput.value = '';
    templateCategoryInput.value = '';
    templateTagsInput.value = '';
    
    // Exibir formulário
    templateForm.style.display = 'block';
});

// Cancelar cadastro/edição de template
cancelTemplateBtn.addEventListener('click', function() {
    templateForm.style.display = 'none';
});

// Salvar template (novo ou editado)
saveTemplateBtn.addEventListener('click', async function() {
    const title = templateTitleInput.value.trim();
    const content = templateContentInput.value.trim();
    
    if (!title || !content) {
        alert('Título e conteúdo são obrigatórios.');
        return;
    }
    
    // Converter tags de string para array
    const tagsString = templateTagsInput.value.trim();
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()) : [];
    
    const templateData = {
        title,
        content,
        category: templateCategoryInput.value.trim(),
        tags
    };
    
    try {
        let response;
        
        if (templateIdInput.value) {
            // Atualizar template existente
            response = await fetch(`${TEMPLATES_API}/${templateIdInput.value}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData),
            });
        } else {
            // Criar novo template
            response = await fetch(TEMPLATES_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(templateData),
            });
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao salvar template');
        }
        
        // Esconder formulário
        templateForm.style.display = 'none';
        
        // Recarregar lista de templates
        loadTemplates();
        
        alert('Template salvo com sucesso!');
    } catch (error) {
        alert(`Erro: ${error.message}`);
    }
});

// Visualizar template
window.previewTemplate = function(id) {
    const template = templatesMap[id];
    if (!template) return;
    
    previewTitle.textContent = template.title;
    previewContent.textContent = template.content;
    
    templateModal.style.display = 'block';
};

// Editar template existente
window.editTemplate = function(id) {
    const template = templatesMap[id];
    if (!template) return;
    
    templateFormTitle.textContent = 'Editar Template';
    templateIdInput.value = id;
    templateTitleInput.value = template.title;
    templateContentInput.value = template.content;
    templateCategoryInput.value = template.category || '';
    
    // Converter array de tags para string
    const tagsString = template.tags ? template.tags.join(', ') : '';
    templateTagsInput.value = tagsString;
    
    templateForm.style.display = 'block';
};

// Excluir template
window.deleteTemplate = async function(id) {
    if (confirm('Tem certeza que deseja excluir este template?')) {
        try {
            const response = await fetch(`${TEMPLATES_API}/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir template');
            }
            
            // Recarregar lista de templates
            loadTemplates();
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    }
};

// INICIALIZAÇÃO DA APLICAÇÃO

// Verificar status do WhatsApp a cada 10 segundos
setInterval(checkWhatsAppStatus, 10000);

// Inicializar
checkWhatsAppStatus();
loadMessages();
loadContacts();
loadTemplates();
