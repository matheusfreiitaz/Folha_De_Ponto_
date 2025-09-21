// =============================================
// Configurações Iniciais
// =============================================
const LOCAL_STORAGE_KEY = 'ponto-telecom-pro-data';
const JWT_SECRET = 'ponto-pro-secret-2023';

// Cores do tema
const themeColors = {
    primary: '#7c4dff',
    primaryLight: '#b47cff',
    primaryDark: '#3f1dcb',
    secondary: '#00e5ff',
    accent: '#ff4081',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336'
};

// =============================================
// Modelos de Dados
// =============================================
class User {
    constructor(id, email, password, name, role, department, avatarColor) {
        this.id = id;
        this.email = email;
        this.password = password;
        this.name = name;
        this.role = role;
        this.department = department;
        this.avatarColor = avatarColor;
        this.createdAt = new Date().toISOString();
    }
}

class Ponto {
    constructor(id, userId, tipo, data, localizacao, metodo = 'manual', observacao = '') {
        this.id = id;
        this.userId = userId;
        this.tipo = tipo;
        this.data = data;
        this.localizacao = localizacao;
        this.metodo = metodo;
        this.observacao = observacao;
        this.status = 'pendente'; // pendente, aprovado, rejeitado
        this.approvedBy = null;
        this.approvalComment = '';
    }
}

class Ferias {
    constructor(id, userId, inicio, fim, observacoes, status = 'pendente') {
        this.id = id;
        this.userId = userId;
        this.inicio = inicio;
        this.fim = fim;
        this.observacoes = observacoes;
        this.status = status;
        this.dataSolicitacao = new Date().toISOString();
        this.aprovadoPor = null;
        this.aprovacaoComentario = '';
        this.documentos = [];
    }
}

class Documento {
    constructor(id, userId, tipo, nomeArquivo, dataReferencia, descricao, status = 'pendente') {
        this.id = id;
        this.userId = userId;
        this.tipo = tipo;
        this.nomeArquivo = nomeArquivo;
        this.dataReferencia = dataReferencia;
        this.descricao = descricao;
        this.dataUpload = new Date().toISOString();
        this.status = status;
        this.aprovadoPor = null;
        this.comentario = '';
    }
}

class Departamento {
    constructor(id, nome, responsavelId) {
        this.id = id;
        this.nome = nome;
        this.responsavelId = responsavelId;
    }
}

// =============================================
// Banco de Dados Simulado
// =============================================
function loadDatabase() {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
        return JSON.parse(savedData);
    }
    
    // Gerar dados iniciais
    const initialData = {
        users: [
            new User(1, 'admin@pontotelecom.com', 'admin123', 'John Doe', 'admin', 'TI', '#7c4dff'),
            new User(2, 'gerente@pontotelecom.com', 'gerente123', 'Carlos Silva', 'manager', 'Vendas', '#00e5ff'),
            new User(3, 'funcionario@pontotelecom.com', 'func123', 'Ana Souza', 'user', 'Atendimento', '#ff4081'),
            new User(4, 'supervisor@pontotelecom.com', 'super123', 'Márcia Oliveira', 'supervisor', 'Operações', '#4caf50')
        ],
        departamentos: [
            new Departamento(1, 'TI', 1),
            new Departamento(2, 'Vendas', 2),
            new Departamento(3, 'Atendimento', 4),
            new Departamento(4, 'Operações', 4)
        ],
        pontos: [],
        ferias: [],
        documentos: [],
        configuracoes: {
            jornadaPadrao: 8,
            toleranciaAtraso: 10,
            limiteHorasExtras: 20
        },
        lastId: {
            user: 4,
            ponto: 0,
            ferias: 0,
            documento: 0,
            departamento: 4
        }
    };
    
    // Gerar pontos de exemplo
    const now = new Date();
    for (let i = 1; i <= 3; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        initialData.pontos.push(new Ponto(
            initialData.lastId.ponto++,
            3,
            'entrada',
            new Date(date.setHours(8, 0, 0, 0)).toISOString(),
            { lat: -23.5505 + (Math.random() * 0.01), lng: -46.6333 + (Math.random() * 0.01) },
            'geolocalizacao',
            `Entrada do dia ${date.toLocaleDateString()}`
        ));
        
        initialData.pontos.push(new Ponto(
            initialData.lastId.ponto++,
            3,
            'saida',
            new Date(date.setHours(17, 30, 0, 0)).toISOString(),
            { lat: -23.5505 + (Math.random() * 0.01), lng: -46.6333 + (Math.random() * 0.01) },
            'geolocalizacao',
            `Saída do dia ${date.toLocaleDateString()}`
        ));
    }
    
    // Gerar férias de exemplo
    initialData.ferias.push(new Ferias(
        initialData.lastId.ferias++,
        3,
        '2023-07-15',
        '2023-07-30',
        'Férias programadas'
    ));
    
    // Gerar documentos de exemplo
    initialData.documentos.push(new Documento(
        initialData.lastId.documento++,
        3,
        'comprovante',
        'comprovante_horas_extras_junho.pdf',
        '2023-06-30',
        'Comprovante de horas extras trabalhadas em junho'
    ));
    
    initialData.documentos.push(new Documento(
        initialData.lastId.documento++,
        3,
        'atestado',
        'atestado_medico.jpg',
        '2023-06-15',
        'Atestado médico para justificar falta'
    ));
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
}

function saveDatabase(data) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

// =============================================
// Autenticação e Sessão
// =============================================
function generateToken(user) {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        exp: Date.now() + 3600000 // Expira em 1 hora
    };
    return btoa(JSON.stringify(payload));
}

function verifyToken(token) {
    try {
        const payload = JSON.parse(atob(token));
        if (payload.exp < Date.now()) {
            return null; // Token expirado
        }
        return payload;
    } catch (e) {
        return null;
    }
}

// =============================================
// Estado da Aplicação
// =============================================
let currentUser = null;
let currentToken = null;
let database = loadDatabase();
let faceRecognitionModel = null;
let currentSection = 'dashboard';
let currentApprovalItem = null;

// =============================================
// Elementos DOM
// =============================================
const sections = {
    dashboard: document.getElementById('dashboard-section'),
    registrar: document.getElementById('registrar-section'),
    calendario: document.getElementById('calendario-section'),
    ferias: document.getElementById('ferias-section'),
    relatorios: document.getElementById('relatorios-section'),
    documentos: document.getElementById('documentos-section'),
    aprovar: document.getElementById('aprovar-section'),
    admin: document.getElementById('admin-section'),
    equipe: document.getElementById('equipe-section')
};

const navItems = document.querySelectorAll('.nav-item');
const userProfile = document.querySelector('.user-profile');
const userAvatar = document.querySelector('.user-avatar');
const userName = document.querySelector('.user-name');
const userRole = document.querySelector('.user-role');

// Elementos do modal
const modal = document.getElementById('notification-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

// Toast container
const toastContainer = document.getElementById('toast-container');

// =============================================
// Funções de Utilidade
// =============================================
function formatDate(dateString, includeTime = true) {
    const date = new Date(dateString);
    if (includeTime) {
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('pt-BR');
}

function calculateTimeDifference(start, end) {
    const diffMs = new Date(end) - new Date(start);
    return diffMs / (1000 * 60 * 60); // Convert to hours
}

function showModal(title, message, confirmCallback = null) {
    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    
    if (confirmCallback) {
        modalConfirm.style.display = 'inline-block';
        modalConfirm.onclick = function() {
            confirmCallback();
            hideModal();
        };
    } else {
        modalConfirm.style.display = 'none';
    }
    
    modal.classList.add('active');
}

function hideModal() {
    modal.classList.remove('active');
}

function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                         type === 'error' ? 'fa-exclamation-circle' : 
                         type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

function updateUserProfile(user) {
    userAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2);
    userAvatar.style.backgroundColor = user.avatarColor || themeColors.primary;
    userName.textContent = user.name;
    userRole.textContent = user.role === 'admin' ? 'Administrador' : 
                           user.role === 'manager' ? 'Gerente' : 
                           user.role === 'supervisor' ? 'Supervisor' : 'Colaborador';
    
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = user.role === 'admin' || user.role === 'manager' || user.role === 'supervisor' ? 'flex' : 'none';
    });
}

// =============================================
// Navegação
// =============================================
function showSection(sectionId) {
    Object.values(sections).forEach(section => {
        if (section) section.style.display = 'none';
    });
    
    if (sections[sectionId]) {
        sections[sectionId].style.display = 'block';
        sections[sectionId].classList.add('fade-in');
    }
    
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionId) {
            item.classList.add('active');
        }
    });
    
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        switch (sectionId) {
            case 'dashboard':
                pageTitle.textContent = 'Dashboard';
                break;
            case 'registrar':
                pageTitle.textContent = 'Registrar Ponto';
                break;
            case 'calendario':
                pageTitle.textContent = 'Calendário';
                break;
            case 'ferias':
                pageTitle.textContent = 'Férias';
                break;
            case 'relatorios':
                pageTitle.textContent = 'Relatórios';
                break;
            case 'documentos':
                pageTitle.textContent = 'Documentos';
                break;
            case 'aprovar':
                pageTitle.textContent = 'Aprovações';
                break;
            case 'admin':
                pageTitle.textContent = 'Administração';
                break;
            case 'equipe':
                pageTitle.textContent = 'Minha Equipe';
                break;
        }
    }
    
    switch (sectionId) {
        case 'dashboard':
            initDashboard();
            break;
        case 'registrar':
            initRegistrarPonto();
            break;
        case 'calendario':
            initCalendario();
            break;
        case 'ferias':
            initFerias();
            break;
        case 'relatorios':
            initRelatorios();
            break;
        case 'documentos':
            initDocumentos();
            break;
        case 'aprovar':
            initAprovar();
            break;
        case 'admin':
            initAdmin();
            break;
        case 'equipe':
            initEquipe();
            break;
    }
    
    currentSection = sectionId;
}

// =============================================
// Dashboard
// =============================================
let dashboardChart = null;
let miniCalendar = null;
let bancoHorasChart = null;

function initDashboard() {
    if (dashboardChart) {
        dashboardChart.destroy();
    }
    
    const ctx = document.getElementById('dashboard-chart');
    if (ctx) {
        dashboardChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
                datasets: [
                    {
                        label: 'Horas Trabalhadas',
                        data: [8, 8.5, 7.5, 9, 8, 4, 0],
                        backgroundColor: themeColors.primary,
                        borderRadius: 4
                    },
                    {
                        label: 'Horas Extras',
                        data: [0.5, 1, 0, 1.5, 0.5, 0, 0],
                        backgroundColor: themeColors.warning,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}h`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Horas'
                        }
                    }
                }
            }
        });
    }
    
    const miniCalendarEl = document.getElementById('mini-calendar');
    if (miniCalendar) {
        miniCalendar.destroy();
    }
    
    const userPontos = database.pontos.filter(p => p.userId === currentUser.id);
    const events = userPontos.map(ponto => ({
        title: ponto.tipo.charAt(0).toUpperCase() + ponto.tipo.slice(1),
        start: ponto.data,
        color: ponto.tipo === 'entrada' ? themeColors.primary : 
               ponto.tipo === 'saida' ? themeColors.accent : themeColors.secondary,
        extendedProps: {
            metodo: ponto.metodo,
            localizacao: ponto.localizacao,
            observacao: ponto.observacao
        }
    }));
    
    miniCalendar = new FullCalendar.Calendar(miniCalendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'title',
            right: 'prev,next'
        },
        height: 'auto',
        events: events,
        locale: 'pt-br'
    });
    miniCalendar.render();
}

// =============================================
// Funcionalidades de Ponto
// =============================================
function initRegistrarPonto() {
    const tipoRegistro = document.getElementById('tipo-registro');
    const locationInfo = document.getElementById('location-info');
    const registrarPontoBtn = document.getElementById('registrar-ponto-btn');
    const registroStatus = document.getElementById('registro-status');
    const videoElement = document.getElementById('videoElement');
    const faceRecognitionOverlay = document.getElementById('face-recognition-overlay');
    const startFaceRecognitionBtn = document.getElementById('start-face-recognition');
    const faceRecognitionStatus = document.getElementById('face-recognition-status');
    
    getLocation();
    
    startFaceRecognitionBtn.addEventListener('click', startFaceRecognition);
    
    registrarPontoBtn.addEventListener('click', () => registrarPonto('manual'));
    
    function getLocation() {
        if (navigator.geolocation) {
            locationInfo.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Obtendo localização...';
            registrarPontoBtn.disabled = true;
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    locationInfo.innerHTML = `<i class="fas fa-map-marker-alt"></i> Localização obtida: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                    registrarPontoBtn.disabled = false;
                    registrarPontoBtn.dataset.lat = lat;
                    registrarPontoBtn.dataset.lng = lng;
                },
                (error) => {
                    locationInfo.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Erro ao obter localização: ${error.message}`;
                    registrarPontoBtn.disabled = false;
                    registrarPontoBtn.dataset.lat = 'N/A';
                    registrarPontoBtn.dataset.lng = 'N/A';
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            locationInfo.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Geolocalização não suportada';
            registrarPontoBtn.disabled = true;
        }
    }
    
    function registrarPonto(metodo) {
        const lat = registrarPontoBtn.dataset.lat;
        const lng = registrarPontoBtn.dataset.lng;
        
        const novoPonto = new Ponto(
            ++database.lastId.ponto,
            currentUser.id,
            tipoRegistro.value,
            new Date().toISOString(),
            (lat !== 'N/A' && lng !== 'N/A') ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null,
            metodo
        );
        
        database.pontos.push(novoPonto);
        saveDatabase(database);
        
        registroStatus.innerHTML = `
            <div class="text-success animate__animated animate__fadeIn">
                <i class="fas fa-check-circle"></i> Ponto registrado com sucesso!
                <div class="mt-2 text-sm">
                    <p><strong>Data/Hora:</strong> ${formatDate(novoPonto.data)}</p>
                    <p><strong>Tipo:</strong> ${novoPonto.tipo.charAt(0).toUpperCase() + novoPonto.tipo.slice(1)}</p>
                </div>
            </div>
        `;
        
        showToast('Ponto registrado com sucesso!', 'success');
        
        if (currentSection === 'calendario') {
            initCalendario();
        }
        if (currentSection === 'dashboard') {
            initDashboard();
        }
    }
    
    function startFaceRecognition() {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            faceRecognitionOverlay.style.display = 'flex';
            faceRecognitionStatus.innerHTML = '';
            startFaceRecognitionBtn.disabled = true;
            
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(function(stream) {
                    videoElement.srcObject = stream;
                    videoElement.play();
                    
                    // Simular reconhecimento facial
                    setTimeout(() => {
                        const isSuccess = Math.random() > 0.3; // 70% de chance de sucesso
                        
                        stream.getTracks().forEach(track => track.stop());
                        
                        faceRecognitionOverlay.style.display = 'none';
                        
                        if (isSuccess) {
                            faceRecognitionStatus.innerHTML = '<span class="text-success"><i class="fas fa-check-circle"></i> Reconhecimento facial bem-sucedido! Registrando ponto...</span>';
                            
                            const novoPonto = new Ponto(
                                ++database.lastId.ponto,
                                currentUser.id,
                                tipoRegistro.value,
                                new Date().toISOString(),
                                null,
                                'reconhecimento_facial'
                            );
                            
                            database.pontos.push(novoPonto);
                            saveDatabase(database);
                            
                            showToast('Ponto registrado via reconhecimento facial!', 'success');
                            
                            if (currentSection === 'calendario') {
                                initCalendario();
                            }
                            if (currentSection === 'dashboard') {
                                initDashboard();
                            }
                        } else {
                            faceRecognitionStatus.innerHTML = `<span class="text-error"><i class="fas fa-exclamation-circle"></i> Falha no reconhecimento facial. Tente novamente.</span>`;
                            showToast('Falha no reconhecimento facial.', 'error');
                        }
                        
                        setTimeout(() => {
                            faceRecognitionStatus.innerHTML = '';
                            startFaceRecognitionBtn.disabled = false;
                        }, 5000);
                    }, 3000);
                })
                .catch(function(error) {
                    faceRecognitionOverlay.style.display = 'none';
                    faceRecognitionStatus.innerHTML = `<span class="text-error"><i class="fas fa-exclamation-circle"></i> Erro ao acessar câmera: ${error.message}</span>`;
                    startFaceRecognitionBtn.disabled = false;
                });
        } else {
            faceRecognitionStatus.innerHTML = '<span class="text-error"><i class="fas fa-exclamation-circle"></i> Acesso à câmera não suportado</span>';
        }
    }
}

// =============================================
// Calendário e Banco de Horas
// =============================================
function initCalendario() {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl._fullCalendar) {
        calendarEl._fullCalendar.destroy();
    }
    
    const userPontos = database.pontos.filter(p => p.userId === currentUser.id);
    const events = userPontos.map(ponto => ({
        title: ponto.tipo.charAt(0).toUpperCase() + ponto.tipo.slice(1),
        start: ponto.data,
        color: ponto.tipo === 'entrada' ? themeColors.primary : 
               ponto.tipo === 'saida' ? themeColors.accent : themeColors.secondary,
        extendedProps: {
            metodo: ponto.metodo,
            localizacao: ponto.localizacao,
            observacao: ponto.observacao,
            status: ponto.status
        }
    }));
    
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        eventClick: function(info) {
            const ponto = info.event;
            const metodo = ponto.extendedProps.metodo === 'geolocalizacao' ? 'Geolocalização' :
                             ponto.extendedProps.metodo === 'reconhecimento_facial' ? 'Reconhecimento Facial' :
                             'Manual';
            
            let statusBadge = '';
            if (ponto.extendedProps.status === 'aprovado') {
                statusBadge = '<span class="badge badge-success">Aprovado</span>';
            } else if (ponto.extendedProps.status === 'rejeitado') {
                statusBadge = '<span class="badge badge-error">Rejeitado</span>';
            } else {
                statusBadge = '<span class="badge badge-warning">Pendente</span>';
            }
            
            showModal(
                `Detalhes do Ponto: ${ponto.title}`,
                `
                <p><strong>Data/Hora:</strong> ${formatDate(ponto.start)}</p>
                <p><strong>Status:</strong> ${statusBadge}</p>
                <p><strong>Método:</strong> ${metodo}</p>
                ${ponto.extendedProps.localizacao ? `<p><strong>Localização:</strong> ${ponto.extendedProps.localizacao.lat.toFixed(4)}, ${ponto.extendedProps.localizacao.lng.toFixed(4)}</p>` : ''}
                ${ponto.extendedProps.observacao ? `<p><strong>Observação:</strong> ${ponto.extendedProps.observacao}</p>` : ''}
                `
            );
        },
        events: events,
        locale: 'pt-br',
        buttonText: {
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
        }
    });
    
    calendar.render();
    
    updateBancoHoras();
}

function updateBancoHoras() {
    const userPontos = database.pontos.filter(p => p.userId === currentUser.id);
    let saldo = 0;
    let horasTrabalhadas = 0;
    let horasExtras = 0;
    let faltas = 0;
    
    userPontos.sort((a, b) => new Date(a.data) - new Date(b.data));
    
    for (let i = 0; i < userPontos.length; i++) {
        if (userPontos[i].tipo === 'entrada' && i + 1 < userPontos.length && userPontos[i + 1].tipo === 'saida') {
            const horas = calculateTimeDifference(userPontos[i].data, userPontos[i + 1].data);
            horasTrabalhadas += horas;
            
            if (horas > 8) {
                horasExtras += horas - 8;
            } else if (horas < 8) {
                saldo -= (8 - horas);
            }
        }
    }
    
    const diasTrabalhados = userPontos.filter(p => p.tipo === 'entrada').length;
    const diasTotalNoMes = (new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)).getDate();
    faltas = Math.max(0, diasTotalNoMes - diasTrabalhados);
    
    const bancoHorasSaldoEl = document.getElementById('banco-horas-saldo');
    if (bancoHorasSaldoEl) {
        bancoHorasSaldoEl.textContent = saldo >= 0 ? `+${saldo.toFixed(1)}h` : `${saldo.toFixed(1)}h`;
        bancoHorasSaldoEl.style.color = saldo >= 0 ? themeColors.success : themeColors.error;
    }
    
    const ctx = document.createElement('canvas');
    const chartContainer = document.getElementById('banco-horas-chart');
    if (chartContainer) {
        if (bancoHorasChart) {
            bancoHorasChart.destroy();
        }
        chartContainer.innerHTML = '';
        chartContainer.appendChild(ctx);
        
        bancoHorasChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Horas Normais', 'Horas Extras', 'Saldo'],
                datasets: [{
                    data: [Math.max(0, horasTrabalhadas - horasExtras), horasExtras, Math.abs(saldo)],
                    backgroundColor: [
                        themeColors.primary,
                        themeColors.warning,
                        saldo >= 0 ? themeColors.success : themeColors.error
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw.toFixed(1)}h`;
                            }
                        }
                    },
                    datalabels: {
                        display: false
                    }
                },
                cutout: '70%'
            }
        });
    }
}

// =============================================
// Funcionalidades de Férias
// =============================================
function initFerias() {
    const feriasForm = document.getElementById('ferias-form');
    const feriasItems = document.getElementById('ferias-items');
    
    const feriasDropzone = new Dropzone('#ferias-document-dropzone', {
        url: '/fake-url',
        autoProcessQueue: false,
        addRemoveLinks: true,
        maxFiles: 3,
        acceptedFiles: 'image/*,.pdf,.doc,.docx',
        dictDefaultMessage: 'Arraste arquivos aqui ou clique para selecionar',
        dictRemoveFile: 'Remover arquivo',
        dictMaxFilesExceeded: 'Você não pode enviar mais que {{maxFiles}} arquivos'
    });
    
    loadFerias();
    
    feriasForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const inicio = document.getElementById('ferias-inicio').value;
        const fim = document.getElementById('ferias-fim').value;
        const obs = document.getElementById('ferias-obs').value;
        
        if (!inicio || !fim) {
            showToast('Preencha as datas de início e término', 'error');
            return;
        }
        
        if (new Date(fim) < new Date(inicio)) {
            showToast('Data de término deve ser após a data de início', 'error');
            return;
        }
        
        const novaFerias = new Ferias(
            ++database.lastId.ferias,
            currentUser.id,
            inicio,
            fim,
            obs
        );
        
        feriasDropzone.files.forEach(file => {
            novaFerias.documentos.push({
                nomeArquivo: file.name,
                tipo: file.type,
                tamanho: file.size
            });
        });
        
        database.ferias.push(novaFerias);
        saveDatabase(database);
        feriasForm.reset();
        feriasDropzone.removeAllFiles(true);
        
        showToast('Solicitação de férias enviada com sucesso!', 'success');
        loadFerias();
    });
    
    function loadFerias() {
        const userFerias = database.ferias.filter(f => f.userId === currentUser.id)
            .sort((a, b) => new Date(b.dataSolicitacao) - new Date(a.dataSolicitacao));
        
        feriasItems.innerHTML = '';
        
        if (userFerias.length === 0) {
            feriasItems.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Nenhuma solicitação de férias encontrada</td></tr>';
            return;
        }
        
        userFerias.forEach(ferias => {
            const inicio = new Date(ferias.inicio);
            const fim = new Date(ferias.fim);
            const diffTime = Math.abs(fim - inicio);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            
            let statusHtml = '';
            if (ferias.status === 'aprovado') {
                statusHtml = `<span class="badge badge-success"><i class="fas fa-check-circle"></i> Aprovado</span>`;
            } else if (ferias.status === 'pendente') {
                statusHtml = `<span class="badge badge-warning"><i class="fas fa-clock"></i> Pendente</span>`;
            } else {
                statusHtml = `<span class="badge badge-error"><i class="fas fa-times-circle"></i> Recusado</span>`;
            }
            
            let actionsHtml = `<button class="btn btn-outline btn-sm view-ferias" data-id="${ferias.id}"><i class="fas fa-eye"></i></button>`;
            if (ferias.status === 'pendente') {
                actionsHtml += `
                    <button class="btn btn-outline btn-sm edit-ferias" data-id="${ferias.id}"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-outline btn-sm delete-ferias" data-id="${ferias.id}"><i class="fas fa-trash"></i></button>
                `;
            }
            
            row.innerHTML = `
                <td class="py-3">${formatDate(ferias.inicio, false)} - ${formatDate(ferias.fim, false)}</td>
                <td class="py-3">${diffDays} dias</td>
                <td class="py-3">${statusHtml}</td>
                <td class="py-3">
                    ${ferias.documentos.length > 0 ? 
                        `<span class="badge badge-primary">${ferias.documentos.length}</span>` : 
                        `<span class="text-gray-400">-</span>`}
                </td>
                <td class="py-3">${actionsHtml}</td>
            `;
            
            feriasItems.appendChild(row);
        });
        
        document.querySelectorAll('.view-ferias').forEach(btn => btn.addEventListener('click', function() {
            const feriasId = parseInt(this.dataset.id);
            viewFerias(feriasId);
        }));
        
        document.querySelectorAll('.edit-ferias').forEach(btn => btn.addEventListener('click', function() {
            const feriasId = parseInt(this.dataset.id);
            editFerias(feriasId);
        }));
        
        document.querySelectorAll('.delete-ferias').forEach(btn => btn.addEventListener('click', function() {
            const feriasId = parseInt(this.dataset.id);
            deleteFerias(feriasId);
        }));
    }
    
    function viewFerias(id) {
        const ferias = database.ferias.find(f => f.id === id);
        if (!ferias) return;
        
        const user = database.users.find(u => u.id === ferias.userId);
        const inicio = new Date(ferias.inicio);
        const fim = new Date(ferias.fim);
        const diffTime = Math.abs(fim - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        let documentosHTML = '<p class="text-gray-500">Nenhum documento anexado</p>';
        if (ferias.documentos.length > 0) {
            documentosHTML = '<ul class="list-disc pl-5">';
            ferias.documentos.forEach(doc => {
                documentosHTML += `<li>${doc.nomeArquivo}</li>`;
            });
            documentosHTML += '</ul>';
        }
        
        showModal(
            'Detalhes da Solicitação de Férias',
            `
            <div class="space-y-3">
                <p><strong>Colaborador:</strong> ${user ? user.name : 'N/A'}</p>
                <p><strong>Período:</strong> ${formatDate(ferias.inicio, false)} - ${formatDate(ferias.fim, false)} (${diffDays} dias)</p>
                <p><strong>Status:</strong> ${ferias.status.charAt(0).toUpperCase() + ferias.status.slice(1)}</p>
                <p><strong>Solicitado em:</strong> ${formatDate(ferias.dataSolicitacao)}</p>
                ${ferias.observacoes ? `<p><strong>Observações:</strong> ${ferias.observacoes}</p>` : ''}
                ${ferias.aprovadoPor ? `<p><strong>Aprovado por:</strong> ${database.users.find(u => u.id === ferias.aprovadoPor)?.name || 'N/A'}</p>` : ''}
                ${ferias.aprovacaoComentario ? `<p><strong>Comentário:</strong> ${ferias.aprovacaoComentario}</p>` : ''}
                <div class="mt-4">
                    <h5 class="font-semibold mb-2">Documentos Anexados</h5>
                    ${documentosHTML}
                </div>
            </div>
            `
        );
    }
    
    function editFerias(id) {
        const ferias = database.ferias.find(f => f.id === id);
        if (!ferias) return;
        
        document.getElementById('ferias-inicio').value = ferias.inicio;
        document.getElementById('ferias-fim').value = ferias.fim;
        document.getElementById('ferias-obs').value = ferias.observacoes || '';
        
        document.getElementById('ferias-form').scrollIntoView({ behavior: 'smooth' });
        
        showToast('Preencha o formulário para editar a solicitação', 'info');
    }
    
    function deleteFerias(id) {
        showModal(
            'Confirmar Exclusão',
            'Tem certeza que deseja excluir esta solicitação de férias?',
            function() {
                database.ferias = database.ferias.filter(f => f.id !== id);
                saveDatabase(database);
                loadFerias();
                showToast('Solicitação de férias excluída com sucesso', 'success');
            }
        );
    }
}

// =============================================
// Relatórios
// =============================================
let relatorioChart = null;
function initRelatorios() {
    const gerarRelatorioBtn = document.getElementById('gerar-relatorio-btn');
    const relatorioResultado = document.getElementById('relatorio-resultado');
    const relatorioResumo = document.getElementById('relatorio-resumo');
    const exportarPdfBtn = document.getElementById('exportar-pdf-btn');
    const exportarExcelBtn = document.getElementById('exportar-excel-btn');
    const imprimirRelatorioBtn = document.getElementById('imprimir-relatorio-btn');
    
    gerarRelatorioBtn.addEventListener('click', gerarRelatorio);
    exportarPdfBtn.addEventListener('click', exportarPDF);
    exportarExcelBtn.addEventListener('click', exportarExcel);
    imprimirRelatorioBtn.addEventListener('click', imprimirRelatorio);
    
    function gerarRelatorio() {
        const inicio = document.getElementById('relatorio-inicio').value;
        const fim = document.getElementById('relatorio-fim').value;
        const tipo = document.getElementById('relatorio-tipo').value;
        const formato = document.getElementById('relatorio-formato').value;
        
        if (!inicio || !fim) {
            showToast('Selecione o período para gerar o relatório', 'error');
            return;
        }
        
        if (new Date(fim) < new Date(inicio)) {
            showToast('Data final deve ser após a data inicial', 'error');
            return;
        }
        
        const userPontos = database.pontos.filter(p => 
            p.userId === currentUser.id && 
            new Date(p.data) >= new Date(inicio) && 
            new Date(p.data) <= new Date(fim)
        ).sort((a, b) => new Date(a.data) - new Date(b.data));
        
        let horasTrabalhadas = 0;
        let horasExtras = 0;
        let entradas = 0;
        let saidas = 0;
        let intervalos = 0;
        
        userPontos.forEach(ponto => {
            if (ponto.tipo === 'entrada') entradas++;
            if (ponto.tipo === 'saida') saidas++;
            if (ponto.tipo === 'intervalo') intervalos++;
        });
        
        const diasTrabalhados = Math.min(entradas, saidas);
        
        let pontuationByDay = {};
        userPontos.forEach(ponto => {
            const date = new Date(ponto.data).toISOString().split('T')[0];
            if (!pontuationByDay[date]) {
                pontuationByDay[date] = [];
            }
            pontuationByDay[date].push(ponto);
        });
        
        for (const date in pontuationByDay) {
            const dayPontos = pontuationByDay[date];
            dayPontos.sort((a, b) => new Date(a.data) - new Date(b.data));
            for (let i = 0; i < dayPontos.length; i++) {
                if (dayPontos[i].tipo === 'entrada' && i + 1 < dayPontos.length && dayPontos[i + 1].tipo === 'saida') {
                    const horas = calculateTimeDifference(dayPontos[i].data, dayPontos[i + 1].data);
                    horasTrabalhadas += horas;
                    if (horas > 8) {
                        horasExtras += horas - 8;
                    }
                }
            }
        }
        
        const faltas = Math.max(0, (new Date(fim) - new Date(inicio)) / (1000 * 60 * 60 * 24) - diasTrabalhados);
        
        relatorioResumo.innerHTML = `
            <div class="grid-2 mb-6">
                <div>
                    <h4 class="text-lg font-semibold mb-3">Resumo do Período</h4>
                    <div class="space-y-2">
                        <p><strong>Período:</strong> ${formatDate(inicio, false)} - ${formatDate(fim, false)}</p>
                        <p><strong>Total de Registros:</strong> ${userPontos.length}</p>
                        <p><strong>Dias Trabalhados:</strong> ${diasTrabalhados}</p>
                        <p><strong>Horas Trabalhadas:</strong> ${horasTrabalhadas.toFixed(1)}h</p>
                        <p><strong>Horas Extras:</strong> ${horasExtras.toFixed(1)}h</p>
                        <p><strong>Faltas:</strong> ${faltas.toFixed(0)} dia(s)</p>
                    </div>
                </div>
            </div>
        `;
        
        const ctx = document.getElementById('relatorio-chart');
        if (relatorioChart) {
            relatorioChart.destroy();
        }
        if (ctx) {
            relatorioChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Entradas', 'Saídas', 'Intervalos', 'Horas Trabalhadas', 'Horas Extras', 'Faltas'],
                    datasets: [{
                        label: 'Resumo',
                        data: [entradas, saidas, intervalos, horasTrabalhadas, horasExtras, faltas],
                        backgroundColor: [
                            themeColors.primary,
                            themeColors.accent,
                            themeColors.secondary,
                            themeColors.success,
                            themeColors.warning,
                            themeColors.error
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.label}: ${context.raw}${context.raw > 3 ? 'h' : ''}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        const detalhesTbody = document.querySelector('#relatorio-detalhes tbody');
        detalhesTbody.innerHTML = '';
        
        userPontos.forEach(ponto => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(ponto.data, false)}</td>
                <td>${ponto.tipo.charAt(0).toUpperCase() + ponto.tipo.slice(1)}</td>
                <td>${formatDate(ponto.data).split(' ')[1]}</td>
                <td>${ponto.localizacao ? `${ponto.localizacao.lat.toFixed(4)}, ${ponto.localizacao.lng.toFixed(4)}` : 'N/A'}</td>
                <td>
                    ${ponto.status === 'aprovado' ? 
                        '<span class="badge badge-success">Aprovado</span>' : 
                        ponto.status === 'rejeitado' ? 
                        '<span class="badge badge-error">Rejeitado</span>' : 
                        '<span class="badge badge-warning">Pendente</span>'}
                </td>
                <td>${ponto.metodo.charAt(0).toUpperCase() + ponto.metodo.slice(1).replace(/_/g, ' ')}</td>
            `;
            detalhesTbody.appendChild(row);
        });
        
        relatorioResultado.style.display = 'block';
        showToast('Relatório gerado com sucesso', 'success');
        
        if (formato === 'pdf') {
            exportarPDF();
        } else if (formato === 'excel') {
            exportarExcel();
        }
    }
    
    function exportarPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.setTextColor(themeColors.primaryDark);
        doc.text('Relatório de Ponto - Nova Telecom', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(themeColors.text);
        doc.text(`Colaborador: ${currentUser.name}`, 20, 30);
        doc.text(`Período: ${formatDate(document.getElementById('relatorio-inicio').value, false)} - ${formatDate(document.getElementById('relatorio-fim').value, false)}`, 20, 37);
        doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 20, 44);
        
        doc.setDrawColor(themeColors.primaryLight);
        doc.setLineWidth(0.5);
        doc.line(20, 50, 190, 50);
        
        doc.setFontSize(14);
        doc.setTextColor(themeColors.primaryDark);
        doc.text('Resumo do Período', 20, 60);
        
        doc.setFontSize(10);
        doc.setTextColor(themeColors.text);
        
        const resumoLines = relatorioResumo.textContent.split('\n').filter(l => l.trim());
        let y = 70;
        
        resumoLines.forEach(line => {
            if (line.trim() !== '') {
                doc.text(line.trim(), 20, y);
                y += 7;
            }
        });
        
        y += 20;
        doc.setFontSize(14);
        doc.setTextColor(themeColors.primaryDark);
        doc.text('Registros Detalhados', 20, y);
        y += 10;
        
        const detalhesTbody = document.querySelector('#relatorio-detalhes tbody');
        const rows = detalhesTbody.querySelectorAll('tr');
        
        doc.setFontSize(10);
        doc.setTextColor(themeColors.primaryDark);
        doc.text('Data', 20, y);
        doc.text('Tipo', 50, y);
        doc.text('Horário', 80, y);
        doc.text('Localização', 110, y);
        doc.text('Status', 160, y);
        y += 5;
        
        doc.setDrawColor(themeColors.primaryLight);
        doc.line(20, y, 190, y);
        y += 7;
        
        doc.setTextColor(themeColors.text);
        rows.forEach(row => {
            if (y > 270) {
                doc.addPage();
                y = 20;
                doc.text('Data', 20, y);
                doc.text('Tipo', 50, y);
                doc.text('Horário', 80, y);
                doc.text('Localização', 110, y);
                doc.text('Status', 160, y);
                y += 5;
                doc.setDrawColor(themeColors.primaryLight);
                doc.line(20, y, 190, y);
                y += 7;
            }
            const cells = row.querySelectorAll('td');
            doc.text(cells[0].textContent, 20, y);
            doc.text(cells[1].textContent, 50, y);
            doc.text(cells[2].textContent, 80, y);
            doc.text(cells[3].textContent, 110, y);
            doc.text(cells[4].textContent.trim(), 160, y);
            y += 7;
        });
        
        doc.setFontSize(8);
        doc.setTextColor(themeColors.textLight);
        doc.text('Sistema Nova Telecom © 2023', 105, 285, { align: 'center' });
        
        doc.save(`relatorio_ponto_${currentUser.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('PDF exportado com sucesso', 'success');
    }
    
    function exportarExcel() {
        showToast('Exportação para Excel simulada', 'info');
    }
    
    function imprimirRelatorio() {
        window.print();
    }
}

// =============================================
// Documentos
// =============================================
function initDocumentos() {
    const novoDocumentoBtn = document.getElementById('novo-documento-btn');
    const documentoModal = document.getElementById('documento-modal');
    const documentoModalClose = document.getElementById('documento-modal-close');
    const documentoModalCancel = document.getElementById('documento-modal-cancel');
    const documentoModalSave = document.getElementById('documento-modal-save');
    const documentoForm = document.getElementById('documento-form');
    const documentosList = document.getElementById('documentos-list');
    
    const documentoDropzone = new Dropzone('#document-dropzone', {
        url: '/fake-url',
        autoProcessQueue: false,
        addRemoveLinks: true,
        maxFiles: 1,
        acceptedFiles: 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
        dictDefaultMessage: 'Arraste o arquivo aqui ou clique para selecionar',
        dictRemoveFile: 'Remover arquivo',
        dictMaxFilesExceeded: 'Você pode enviar apenas 1 arquivo'
    });
    
    loadDocumentos();
    
    novoDocumentoBtn.addEventListener('click', () => documentoModal.classList.add('active'));
    documentoModalClose.addEventListener('click', () => documentoModal.classList.remove('active'));
    documentoModalCancel.addEventListener('click', () => documentoModal.classList.remove('active'));
    
    documentoModalSave.addEventListener('click', function() {
        if (!documentoForm.checkValidity()) {
            showToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }
        
        if (documentoDropzone.files.length === 0) {
            showToast('Selecione um arquivo para upload', 'error');
            return;
        }
        
        const tipo = document.getElementById('documento-tipo').value;
        const dataReferencia = document.getElementById('documento-data').value;
        const descricao = document.getElementById('documento-descricao').value;
        const arquivo = documentoDropzone.files[0];
        
        const novoDocumento = new Documento(
            ++database.lastId.documento,
            currentUser.id,
            tipo,
            arquivo.name,
            dataReferencia,
            descricao
        );
        
        database.documentos.push(novoDocumento);
        saveDatabase(database);
        
        showToast('Documento enviado com sucesso!', 'success');
        documentoModal.classList.remove('active');
        documentoForm.reset();
        documentoDropzone.removeAllFiles(true);
        loadDocumentos();
    });
    
    function loadDocumentos() {
        const userDocumentos = database.documentos.filter(d => d.userId === currentUser.id)
            .sort((a, b) => new Date(b.dataUpload) - new Date(a.dataUpload));
        
        documentosList.innerHTML = '';
        
        if (userDocumentos.length === 0) {
            documentosList.innerHTML = '<div class="text-center py-8 text-gray-500">Nenhum documento encontrado</div>';
            return;
        }
        
        userDocumentos.forEach(documento => {
            const fileIcon = getFileIcon(documento.nomeArquivo);
            const fileType = getFileType(documento.tipo);
            
            const docElement = document.createElement('div');
            docElement.className = 'document-item';
            docElement.innerHTML = `
                <div class="document-icon">
                    <i class="fas ${fileIcon}"></i>
                </div>
                <div class="document-info">
                    <div class="document-name">${documento.descricao || documento.nomeArquivo}</div>
                    <div class="document-meta">
                        ${fileType} | Enviado em ${formatDate(documento.dataUpload)} | 
                        Status: ${documento.status === 'aprovado' ? 
                            '<span class="text-success">Aprovado</span>' : 
                            documento.status === 'rejeitado' ? 
                            '<span class="text-error">Rejeitado</span>' : 
                            '<span class="text-warning">Pendente</span>'}
                    </div>
                </div>
                <div class="document-actions">
                    <button class="btn btn-outline btn-sm download-documento" data-id="${documento.id}">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-outline btn-sm view-documento" data-id="${documento.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            
            documentosList.appendChild(docElement);
        });
        
        document.querySelectorAll('.download-documento').forEach(btn => btn.addEventListener('click', function() {
            const docId = parseInt(this.dataset.id);
            downloadDocumento(docId);
        }));
        
        document.querySelectorAll('.view-documento').forEach(btn => btn.addEventListener('click', function() {
            const docId = parseInt(this.dataset.id);
            viewDocumento(docId);
        }));
    }
    
    function getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf': return 'fa-file-pdf';
            case 'doc': case 'docx': return 'fa-file-word';
            case 'xls': case 'xlsx': return 'fa-file-excel';
            case 'jpg': case 'jpeg': case 'png': case 'gif': return 'fa-file-image';
            default: return 'fa-file-alt';
        }
    }
    
    function getFileType(tipo) {
        switch (tipo) {
            case 'comprovante': return 'Comprovante';
            case 'atestado': return 'Atestado';
            case 'holerite': return 'Holerite';
            default: return 'Outros';
        }
    }
    
    function downloadDocumento(id) {
        const documento = database.documentos.find(d => d.id === id);
        if (!documento) return;
        showToast(`Download do documento ${documento.nomeArquivo} iniciado`, 'info');
    }
    
    function viewDocumento(id) {
        const documento = database.documentos.find(d => d.id === id);
        if (!documento) return;
        showModal(
            'Detalhes do Documento',
            `
            <div class="space-y-3">
                <p><strong>Nome do Arquivo:</strong> ${documento.nomeArquivo}</p>
                <p><strong>Tipo:</strong> ${getFileType(documento.tipo)}</p>
                <p><strong>Data de Referência:</strong> ${formatDate(documento.dataReferencia, false)}</p>
                <p><strong>Enviado em:</strong> ${formatDate(documento.dataUpload)}</p>
                <p><strong>Status:</strong> ${documento.status.charAt(0).toUpperCase() + documento.status.slice(1)}</p>
                ${documento.comentario ? `<p><strong>Comentário:</strong> ${documento.comentario}</p>` : ''}
                ${documento.descricao ? `<p><strong>Descrição:</strong> ${documento.descricao}</p>` : ''}
            </div>
            `
        );
    }
}

// =============================================
// Aprovações
// =============================================
function initAprovar() {
    const tabs = document.querySelectorAll('.tabs .tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const approvalModal = document.getElementById('approval-modal');
    const approvalModalClose = document.getElementById('approval-modal-close');
    const approvalModalApprove = document.getElementById('approval-modal-approve');
    const approvalModalReject = document.getElementById('approval-modal-reject');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => content.style.display = 'none');
            const tabId = this.dataset.tab;
            document.getElementById(`${tabId}-tab`).style.display = 'block';
            
            switch (tabId) {
                case 'pontos': loadPontosParaAprovacao(); break;
                case 'ferias': loadFeriasParaAprovacao(); break;
                case 'documentos': loadDocumentosParaAprovacao(); break;
            }
        });
    });
    
    approvalModalClose.addEventListener('click', () => approvalModal.classList.remove('active'));
    
    approvalModalApprove.addEventListener('click', function() {
        if (!currentApprovalItem) return;
        const comment = document.getElementById('approval-comment').value;
        
        switch (currentApprovalItem.type) {
            case 'ponto':
                const ponto = database.pontos.find(p => p.id === currentApprovalItem.id);
                if (ponto) {
                    ponto.status = 'aprovado';
                    ponto.approvedBy = currentUser.id;
                    ponto.approvalComment = comment;
                }
                break;
            case 'ferias':
                const ferias = database.ferias.find(f => f.id === currentApprovalItem.id);
                if (ferias) {
                    ferias.status = 'aprovado';
                    ferias.aprovadoPor = currentUser.id;
                    ferias.aprovacaoComentario = comment;
                }
                break;
            case 'documento':
                const documento = database.documentos.find(d => d.id === currentApprovalItem.id);
                if (documento) {
                    documento.status = 'aprovado';
                    documento.aprovadoPor = currentUser.id;
                    documento.comentario = comment;
                }
                break;
        }
        
        saveDatabase(database);
        approvalModal.classList.remove('active');
        showToast('Item aprovado com sucesso', 'success');
        
        // Recarregar listas
        loadPontosParaAprovacao();
        loadFeriasParaAprovacao();
        loadDocumentosParaAprovacao();
    });
    
    approvalModalReject.addEventListener('click', function() {
        if (!currentApprovalItem) return;
        const comment = document.getElementById('approval-comment').value;
        
        if (!comment) {
            showToast('Por favor, informe um motivo para a rejeição', 'error');
            return;
        }
        
        switch (currentApprovalItem.type) {
            case 'ponto':
                const ponto = database.pontos.find(p => p.id === currentApprovalItem.id);
                if (ponto) {
                    ponto.status = 'rejeitado';
                    ponto.approvedBy = currentUser.id;
                    ponto.approvalComment = comment;
                }
                break;
            case 'ferias':
                const ferias = database.ferias.find(f => f.id === currentApprovalItem.id);
                if (ferias) {
                    ferias.status = 'recusado';
                    ferias.aprovadoPor = currentUser.id;
                    ferias.aprovacaoComentario = comment;
                }
                break;
            case 'documento':
                const documento = database.documentos.find(d => d.id === currentApprovalItem.id);
                if (documento) {
                    documento.status = 'rejeitado';
                    documento.aprovadoPor = currentUser.id;
                    documento.comentario = comment;
                }
                break;
        }
        
        saveDatabase(database);
        approvalModal.classList.remove('active');
        showToast('Item rejeitado', 'warning');
        
        loadPontosParaAprovacao();
        loadFeriasParaAprovacao();
        loadDocumentosParaAprovacao();
    });
    
    function createApprovalItemHtml(item, type) {
        const user = database.users.find(u => u.id === item.userId);
        const name = user ? user.name : 'N/A';
        
        let title, meta, actions;
        
        if (type === 'ponto') {
            const tipo = item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1);
            title = `Registro de ${tipo} - ${formatDate(item.data)}`;
            meta = `${name} | Localização: ${item.localizacao ? `${item.localizacao.lat.toFixed(4)}, ${item.localizacao.lng.toFixed(4)}` : 'N/A'}`;
        } else if (type === 'ferias') {
            const inicio = new Date(item.inicio);
            const fim = new Date(item.fim);
            const diffDays = Math.ceil(Math.abs(fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
            title = `Férias - ${formatDate(item.inicio, false)} a ${formatDate(item.fim, false)} (${diffDays} dias)`;
            meta = `${name} | Solicitado em ${formatDate(item.dataSolicitacao)}`;
        } else if (type === 'documento') {
            const fileIcon = getFileIcon(item.nomeArquivo);
            const fileType = getFileType(item.tipo);
            title = `<i class="fas ${fileIcon} mr-2"></i> ${item.descricao || item.nomeArquivo}`;
            meta = `${name} | ${fileType} | Enviado em ${formatDate(item.dataUpload)}`;
        }

        actions = `
            <button class="btn btn-success btn-sm approve-btn" data-id="${item.id}" data-type="${type}"><i class="fas fa-check"></i> Aprovar</button>
            <button class="btn btn-error btn-sm reject-btn" data-id="${item.id}" data-type="${type}"><i class="fas fa-times"></i> Rejeitar</button>
            <button class="btn btn-outline btn-sm view-btn" data-id="${item.id}" data-type="${type}"><i class="fas fa-eye"></i> Detalhes</button>
        `;

        if (type === 'documento') {
            actions += `<button class="btn btn-outline btn-sm download-btn" data-id="${item.id}" data-type="${type}"><i class="fas fa-download"></i> Baixar</button>`;
        }
        
        return `
            <div class="approval-item">
                <div class="approval-info">
                    <div class="approval-title">${title}</div>
                    <div class="approval-meta">${meta}</div>
                </div>
                <div class="approval-actions">${actions}</div>
            </div>
        `;
    }

    function loadPontosParaAprovacao() {
        const pontosPendentes = database.pontos.filter(p => p.status === 'pendente');
        const pontosList = document.getElementById('pontos-approval-list');
        pontosList.innerHTML = '';
        if (pontosPendentes.length === 0) {
            pontosList.innerHTML = '<div class="text-center py-4 text-gray-500">Nenhum registro de ponto pendente</div>';
        } else {
            pontosPendentes.forEach(p => pontosList.innerHTML += createApprovalItemHtml(p, 'ponto'));
        }
        setupApprovalButtons();
    }
    
    function loadFeriasParaAprovacao() {
        const feriasPendentes = database.ferias.filter(f => f.status === 'pendente');
        const feriasList = document.getElementById('ferias-approval-list');
        feriasList.innerHTML = '';
        if (feriasPendentes.length === 0) {
            feriasList.innerHTML = '<div class="text-center py-4 text-gray-500">Nenhuma solicitação de férias pendente</div>';
        } else {
            feriasPendentes.forEach(f => feriasList.innerHTML += createApprovalItemHtml(f, 'ferias'));
        }
        setupApprovalButtons();
    }
    
    function loadDocumentosParaAprovacao() {
        const documentosPendentes = database.documentos.filter(d => d.status === 'pendente');
        const documentosList = document.getElementById('documentos-approval-list');
        documentosList.innerHTML = '';
        if (documentosPendentes.length === 0) {
            documentosList.innerHTML = '<div class="text-center py-4 text-gray-500">Nenhum documento pendente</div>';
        } else {
            documentosPendentes.forEach(d => documentosList.innerHTML += createApprovalItemHtml(d, 'documento'));
        }
        setupApprovalButtons();
    }
    
    function setupApprovalButtons() {
        document.querySelectorAll('.approve-btn, .reject-btn, .view-btn, .download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                const type = this.dataset.type;
                currentApprovalItem = { id, type };
                
                const approvalComment = document.getElementById('approval-comment');
                if (approvalComment) approvalComment.value = '';

                if (this.classList.contains('approve-btn')) {
                    const item = database[type + 's'].find(i => i.id === id);
                    const user = database.users.find(u => u.id === item.userId);
                    document.getElementById('approval-modal-title').textContent = `Aprovar ${type.charAt(0).toUpperCase() + type.slice(1)}`;
                    document.getElementById('approval-modal-content').innerHTML = `
                        <p>Deseja aprovar este ${type.replace(/s$/, '')}?</p>
                        <p class="mt-2"><strong>Funcionário:</strong> ${user ? user.name : 'N/A'}</p>
                    `;
                    approvalModal.classList.add('active');
                } else if (this.classList.contains('reject-btn')) {
                    const item = database[type + 's'].find(i => i.id === id);
                    const user = database.users.find(u => u.id === item.userId);
                    document.getElementById('approval-modal-title').textContent = `Rejeitar ${type.charAt(0).toUpperCase() + type.slice(1)}`;
                    document.getElementById('approval-modal-content').innerHTML = `
                        <p>Deseja rejeitar este ${type.replace(/s$/, '')}?</p>
                        <p class="mt-2"><strong>Funcionário:</strong> ${user ? user.name : 'N/A'}</p>
                        <p class="mt-2 text-error">Por favor, informe o motivo da rejeição:</p>
                    `;
                    approvalModal.classList.add('active');
                } else if (this.classList.contains('view-btn')) {
                    if (type === 'ponto') {
                        const ponto = database.pontos.find(p => p.id === id);
                        if (!ponto) return;
                        const user = database.users.find(u => u.id === ponto.userId);
                        showModal(
                            'Detalhes do Registro de Ponto',
                            `
                            <div class="space-y-3">
                                <p><strong>Funcionário:</strong> ${user ? user.name : 'N/A'}</p>
                                <p><strong>Tipo:</strong> ${ponto.tipo.charAt(0).toUpperCase() + ponto.tipo.slice(1)}</p>
                                <p><strong>Data/Hora:</strong> ${formatDate(ponto.data)}</p>
                                <p><strong>Método:</strong> ${ponto.metodo.charAt(0).toUpperCase() + ponto.metodo.slice(1).replace(/_/g, ' ')}</p>
                                ${ponto.localizacao ? `<p><strong>Localização:</strong> ${ponto.localizacao.lat.toFixed(4)}, ${ponto.localizacao.lng.toFixed(4)}</p>` : ''}
                                ${ponto.observacao ? `<p><strong>Observação:</strong> ${ponto.observacao}</p>` : ''}
                            </div>
                            `
                        );
                    } else if (type === 'ferias') {
                        const ferias = database.ferias.find(f => f.id === id);
                        if (!ferias) return;
                        const user = database.users.find(u => u.id === ferias.userId);
                        const inicio = new Date(ferias.inicio);
                        const fim = new Date(ferias.fim);
                        const diffDays = Math.ceil(Math.abs(fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
                        let documentosHTML = '<p class="text-gray-500">Nenhum documento anexado</p>';
                        if (ferias.documentos.length > 0) {
                            documentosHTML = '<ul class="list-disc pl-5">' + ferias.documentos.map(d => `<li>${d.nomeArquivo}</li>`).join('') + '</ul>';
                        }
                        showModal(
                            'Detalhes da Solicitação de Férias',
                            `
                            <div class="space-y-3">
                                <p><strong>Funcionário:</strong> ${user ? user.name : 'N/A'}</p>
                                <p><strong>Período:</strong> ${formatDate(ferias.inicio, false)} - ${formatDate(ferias.fim, false)} (${diffDays} dias)</p>
                                <p><strong>Solicitado em:</strong> ${formatDate(ferias.dataSolicitacao)}</p>
                                ${ferias.observacoes ? `<p><strong>Observações:</strong> ${ferias.observacoes}</p>` : ''}
                                <div class="mt-4">
                                    <h5 class="font-semibold mb-2">Documentos Anexados</h5>
                                    ${documentosHTML}
                                </div>
                            </div>
                            `
                        );
                    } else if (type === 'documento') {
                        const documento = database.documentos.find(d => d.id === id);
                        if (!documento) return;
                        const user = database.users.find(u => u.id === documento.userId);
                        showModal(
                            'Detalhes do Documento',
                            `
                            <div class="space-y-3">
                                <p><strong>Funcionário:</strong> ${user ? user.name : 'N/A'}</p>
                                <p><strong>Nome do Arquivo:</strong> ${documento.nomeArquivo}</p>
                                <p><strong>Tipo:</strong> ${getFileType(documento.tipo)}</p>
                                <p><strong>Data de Referência:</strong> ${formatDate(documento.dataReferencia, false)}</p>
                                <p><strong>Enviado em:</strong> ${formatDate(documento.dataUpload)}</p>
                                ${documento.descricao ? `<p><strong>Descrição:</strong> ${documento.descricao}</p>` : ''}
                            </div>
                            `
                        );
                    }
                } else if (this.classList.contains('download-btn')) {
                    const documento = database.documentos.find(d => d.id === id);
                    if (!documento) return;
                    showToast(`Download do documento ${documento.nomeArquivo} iniciado`, 'info');
                }
            });
        });
    }

    // Carregar a primeira aba por padrão
    loadPontosParaAprovacao();
}

// =============================================
// Painel Administrativo
// =============================================
function initAdmin() {
    loadAdminData();
    
    function loadAdminData() {
        const feriasPendentes = database.ferias.filter(f => f.status === 'pendente').sort((a, b) => new Date(a.dataSolicitacao) - new Date(b.dataSolicitacao));
        const feriasContainer = document.getElementById('admin-ferias-pendentes');
        feriasContainer.innerHTML = '';
        if (feriasPendentes.length === 0) {
            feriasContainer.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Nenhuma solicitação de férias pendente</td></tr>';
        } else {
            feriasPendentes.forEach(ferias => {
                const user = database.users.find(u => u.id === ferias.userId);
                const inicio = new Date(ferias.inicio);
                const fim = new Date(ferias.fim);
                const diffDays = Math.ceil(Math.abs(fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
                
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-50';
                row.innerHTML = `
                    <td class="py-3">${user ? user.name : 'N/A'}</td>
                    <td class="py-3">${formatDate(ferias.inicio, false)} - ${formatDate(ferias.fim, false)}</td>
                    <td class="py-3">${diffDays} dias</td>
                    <td class="py-3">
                        <button class="btn btn-outline btn-sm approve-ferias" data-id="${ferias.id}"><i class="fas fa-check"></i></button>
                        <button class="btn btn-outline btn-sm reject-ferias" data-id="${ferias.id}"><i class="fas fa-times"></i></button>
                        <button class="btn btn-outline btn-sm view-ferias" data-id="${ferias.id}"><i class="fas fa-eye"></i></button>
                    </td>
                `;
                feriasContainer.appendChild(row);
            });
        }
        
        const pontosRecentes = [...database.pontos]
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 10);
        
        const pontosContainer = document.getElementById('admin-pontos-recentes');
        pontosContainer.innerHTML = '';
        
        pontosRecentes.forEach(ponto => {
            const user = database.users.find(u => u.id === ponto.userId);
            const tipo = ponto.tipo.charAt(0).toUpperCase() + ponto.tipo.slice(1);
            const metodo = ponto.metodo.charAt(0).toUpperCase() + ponto.metodo.slice(1).replace(/_/g, ' ');
            
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="py-3">${user ? user.name : 'N/A'}</td>
                <td class="py-3">${formatDate(ponto.data)}</td>
                <td class="py-3">${tipo}</td>
                <td class="py-3">${metodo}</td>
            `;
            pontosContainer.appendChild(row);
        });
        
        document.querySelectorAll('.approve-ferias').forEach(btn => btn.addEventListener('click', function() {
            const feriasId = parseInt(this.dataset.id);
            approveFerias(feriasId);
        }));
        
        document.querySelectorAll('.reject-ferias').forEach(btn => btn.addEventListener('click', function() {
            const feriasId = parseInt(this.dataset.id);
            rejectFerias(feriasId);
        }));
        
        document.querySelectorAll('.view-ferias').forEach(btn => btn.addEventListener('click', function() {
            const feriasId = parseInt(this.dataset.id);
            viewFeriasDetails(feriasId);
        }));
    }
    
    function approveFerias(id) {
        const ferias = database.ferias.find(f => f.id === id);
        if (!ferias) return;
        
        showModal(
            'Aprovar Solicitação de Férias',
            `Tem certeza que deseja aprovar a solicitação de férias de ${database.users.find(u => u.id === ferias.userId)?.name || 'este colaborador'}?`,
            () => {
                ferias.status = 'aprovado';
                ferias.aprovadoPor = currentUser.id;
                saveDatabase(database);
                loadAdminData();
                showToast('Solicitação de férias aprovada com sucesso', 'success');
            }
        );
    }
    
    function rejectFerias(id) {
        const ferias = database.ferias.find(f => f.id === id);
        if (!ferias) return;
        
        showModal(
            'Rejeitar Solicitação de Férias',
            `Tem certeza que deseja rejeitar a solicitação de férias de ${database.users.find(u => u.id === ferias.userId)?.name || 'este colaborador'}?`,
            () => {
                ferias.status = 'recusado';
                ferias.aprovadoPor = currentUser.id;
                saveDatabase(database);
                loadAdminData();
                showToast('Solicitação de férias rejeitada', 'warning');
            }
        );
    }
    
    function viewFeriasDetails(id) {
        const ferias = database.ferias.find(f => f.id === id);
        if (!ferias) return;
        const user = database.users.find(u => u.id === ferias.userId);
        const inicio = new Date(ferias.inicio);
        const fim = new Date(ferias.fim);
        const diffDays = Math.ceil(Math.abs(fim - inicio) / (1000 * 60 * 60 * 24)) + 1;
        
        showModal(
            'Detalhes da Solicitação de Férias',
            `
            <div class="space-y-3">
                <p><strong>Colaborador:</strong> ${user ? user.name : 'N/A'}</p>
                <p><strong>Período:</strong> ${formatDate(ferias.inicio, false)} - ${formatDate(ferias.fim, false)} (${diffDays} dias)</p>
                <p><strong>Status:</strong> ${ferias.status.charAt(0).toUpperCase() + ferias.status.slice(1)}</p>
                <p><strong>Solicitado em:</strong> ${formatDate(ferias.dataSolicitacao)}</p>
                ${ferias.observacoes ? `<p><strong>Observações:</strong> ${ferias.observacoes}</p>` : ''}
            </div>
            `
        );
    }
}

// =============================================
// Gestão de Equipe
// =============================================
function initEquipe() {
    const teamMembersList = document.getElementById('team-members-list');
    const teamMemberModal = document.getElementById('team-member-modal');
    const teamMemberModalClose = document.getElementById('team-member-modal-close');
    const teamMemberModalCloseBtn = document.getElementById('team-member-modal-close-btn');
    
    loadTeamMembers();
    
    teamMemberModalClose.addEventListener('click', () => teamMemberModal.classList.remove('active'));
    teamMemberModalCloseBtn.addEventListener('click', () => teamMemberModal.classList.remove('active'));
    
    function loadTeamMembers() {
        const teamMembers = database.users.filter(u => u.role !== 'admin' && u.role !== 'manager');
        
        teamMembersList.innerHTML = '';
        
        teamMembers.forEach(member => {
            const memberElement = document.createElement('div');
            memberElement.className = 'team-member';
            memberElement.innerHTML = `
                <div class="team-member-avatar" style="background-color: ${member.avatarColor}">${member.name.split(' ').map(n => n[0]).join('').substring(0, 2)}</div>
                <div class="team-member-info">
                    <div class="team-member-name">${member.name}</div>
                    <div class="team-member-role">${member.role.charAt(0).toUpperCase() + member.role.slice(1)} | Departamento: ${member.department}</div>
                </div>
                <div class="team-member-actions">
                    <button class="btn btn-outline btn-sm view-member" data-id="${member.id}">
                        <i class="fas fa-eye"></i> Visualizar
                    </button>
                    <button class="btn btn-outline btn-sm contact-member" data-id="${member.id}">
                        <i class="fas fa-envelope"></i> Contatar
                    </button>
                </div>
            `;
            teamMembersList.appendChild(memberElement);
        });
        
        document.querySelectorAll('.view-member').forEach(btn => btn.addEventListener('click', function() {
            const memberId = parseInt(this.dataset.id);
            viewTeamMember(memberId);
        }));
        
        document.querySelectorAll('.contact-member').forEach(btn => btn.addEventListener('click', function() {
            const memberId = parseInt(this.dataset.id);
            contactTeamMember(memberId);
        }));
    }
    
    function viewTeamMember(id) {
        const member = database.users.find(u => u.id === id);
        if (!member) return;
        
        const avatar = document.querySelector('#team-member-modal .team-member-avatar');
        const name = document.querySelector('#team-member-modal .text-lg');
        const role = document.querySelector('#team-member-modal .text-gray-500');
        const personalInfo = document.querySelector('#team-member-modal .mt-6 .grid-2 div:first-child');
        const professionalInfo = document.querySelector('#team-member-modal .mt-6 .grid-2 div:last-child');

        avatar.textContent = member.name.split(' ').map(n => n[0]).join('').substring(0, 2);
        avatar.style.backgroundColor = member.avatarColor;
        name.textContent = member.name;
        role.textContent = member.role.charAt(0).toUpperCase() + member.role.slice(1);
        
        const department = database.departamentos.find(d => d.id === member.department);
        
        personalInfo.innerHTML = `
            <h5 class="font-semibold mb-2">Informações Pessoais</h5>
            <p><strong>Email:</strong> ${member.email}</p>
            <p><strong>Telefone:</strong> N/A</p>
            <p><strong>Data de Admissão:</strong> N/A</p>
        `;

        professionalInfo.innerHTML = `
            <h5 class="font-semibold mb-2">Informações Profissionais</h5>
            <p><strong>Departamento:</strong> ${member.department}</p>
            <p><strong>Cargo:</strong> ${member.role.charAt(0).toUpperCase() + member.role.slice(1)}</p>
            <p><strong>Gestor:</strong> N/A</p>
        `;
        
        teamMemberModal.classList.add('active');
    }

    function contactTeamMember(id) {
        const member = database.users.find(u => u.id === id);
        if (!member) return;
        window.location.href = `mailto:${member.email}`;
    }
}

// =============================================
// Inicialização da Aplicação
// =============================================
document.addEventListener('DOMContentLoaded', function() {
    database = loadDatabase();
    
    const loggedInUser = database.users.find(u => u.id === 1); // Loga como o primeiro usuário (admin)
    currentUser = loggedInUser;
    currentToken = generateToken(loggedInUser);
    
    updateUserProfile(loggedInUser);
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.dataset.section;
            showSection(sectionId);
        });
    });
    
    modalClose.addEventListener('click', hideModal);
    modalCancel.addEventListener('click', hideModal);
    
    showSection('dashboard');
    
    setTimeout(() => {
        showToast(`Bem-vindo(a), ${loggedInUser.name}!`, 'info');
    }, 1000);
});