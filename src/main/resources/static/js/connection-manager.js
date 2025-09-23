/**
 * 🌐 CONNECTION MANAGER
 * Maneja el estado de conexión y funcionalidad offline
 */
class ConnectionManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.indicators = new Map();
        this.retryCount = 0;
        this.maxRetries = 3;
        this.lastCheck = null;
        this.checkInProgress = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createOfflineIndicator();
        
        // Solo verificar conexión después de un delay para evitar false positives
        setTimeout(() => {
            this.checkInitialConnection();
        }, 2000);
        
        this.setupPeriodicCheck();
    }

    setupEventListeners() {
        // Eventos nativos de conexión
        window.addEventListener('online', () => {
            console.log('🌐 Conexión restaurada');
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            console.log('🔴 Conexión perdida');
            this.handleOffline();
        });

        // Interceptar fetch para manejar errores de red
        this.interceptFetch();
    }

    createOfflineIndicator() {
        if (document.getElementById('connection-indicator')) return;

        const indicator = document.createElement('div');
        indicator.id = 'connection-indicator';
        indicator.className = 'offline-indicator';
        indicator.innerHTML = `
            <div class="flex items-center justify-center space-x-2">
                <i class="fas fa-wifi" id="connection-icon"></i>
                <span id="connection-text">Sin conexión - Modo offline</span>
                <button id="retry-connection" class="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded text-xs hover:bg-opacity-30 transition-colors">
                    Reintentar
                </button>
            </div>
        `;

        document.body.appendChild(indicator);

        // Event listener para el botón de reintento
        document.getElementById('retry-connection').addEventListener('click', () => {
            this.checkConnection();
        });
    }

    async checkInitialConnection() {
        if (this.checkInProgress) return;
        this.checkInProgress = true;
        
        try {
            // En localhost, ser más permisivo
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                this.isOnline = navigator.onLine;
                console.log('🌐 Localhost detected - using navigator.onLine:', this.isOnline);
                return;
            }
            
            // Verificación más robusta para producción
            const wasOnline = this.isOnline;
            const currentlyOnline = await this.checkConnection();
            
            if (wasOnline !== currentlyOnline) {
                this.isOnline = currentlyOnline;
                this.isOnline ? this.handleOnline() : this.handleOffline();
            }
            
            this.lastCheck = Date.now();
        } catch (error) {
            console.warn('Error en verificación inicial de conexión:', error);
            // En caso de error, asumir que estamos online
            this.isOnline = true;
        } finally {
            this.checkInProgress = false;
        }
    }

    async checkConnection() {
        try {
            // En localhost, usar navigator.onLine es más confiable
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return navigator.onLine;
            }

            // Para producción, intenta una petición ligera
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const response = await fetch(window.location.origin + '/login', {
                method: 'HEAD',
                cache: 'no-cache',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
            
        } catch (error) {
            // En localhost, si falla la petición pero tenemos conexión general
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                return navigator.onLine;
            }
            
            try {
                // Fallback: ping a un endpoint externo solo en producción
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);
                
                await fetch('https://www.google.com/favicon.ico', {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-cache',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return true;
            } catch (fallbackError) {
                return false;
            }
        }
    }

    setupPeriodicCheck() {
        // En localhost, verificar menos frecuentemente y solo cuando sea realmente necesario
        const interval = window.location.hostname === 'localhost' ? 120000 : 30000; // 2 min en local, 30s en prod
        
        setInterval(async () => {
            // Solo verificar si realmente pensamos que estamos offline
            if (!this.isOnline && !this.checkInProgress) {
                const isNowOnline = await this.checkConnection();
                if (isNowOnline && !this.isOnline) {
                    this.isOnline = true;
                    this.handleOnline();
                }
            }
        }, interval);
    }

    handleOnline() {
        this.isOnline = true;
        this.retryCount = 0;
        this.hideOfflineIndicator();
        this.showConnectionMessage('Conexión restaurada', 'online');
        this.processOfflineQueue();
        this.notifyComponents('online');
        
        // Actualizar icono de red en toda la app
        this.updateNetworkIcons(true);
    }

    handleOffline() {
        // En localhost, ser más cauteloso para mostrar offline
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            if (navigator.onLine) {
                console.log('🌐 Localhost: Navigator dice online, ignorando offline false positive');
                return;
            }
        }
        
        this.isOnline = false;
        console.log('🔴 Conexión perdida confirmada');
        this.showOfflineIndicator();
        this.notifyComponents('offline');
        
        // Actualizar icono de red en toda la app
        this.updateNetworkIcons(false);
        
        // Mostrar mensaje informativo solo después de confirmar que realmente está offline
        setTimeout(() => {
            if (!this.isOnline) {
                this.showOfflineMessage();
            }
        }, 3000);
    }

    showOfflineIndicator() {
        const indicator = document.getElementById('connection-indicator');
        if (indicator) {
            indicator.classList.add('show');
            indicator.classList.remove('online');
        }
    }

    hideOfflineIndicator() {
        const indicator = document.getElementById('connection-indicator');
        if (indicator) {
            indicator.classList.remove('show');
        }
    }

    showConnectionMessage(message, type = 'online') {
        const indicator = document.getElementById('connection-indicator');
        if (indicator) {
            const textEl = document.getElementById('connection-text');
            const iconEl = document.getElementById('connection-icon');
            
            if (textEl) textEl.textContent = message;
            if (iconEl) {
                iconEl.className = type === 'online' ? 'fas fa-wifi' : 'fas fa-wifi-slash';
            }
            
            indicator.classList.add('show');
            indicator.classList.toggle('online', type === 'online');
            
            if (type === 'online') {
                setTimeout(() => {
                    indicator.classList.remove('show');
                }, 3000);
            }
        }
    }

    showOfflineMessage() {
        // Solo mostrar si no existe ya
        if (document.getElementById('offline-message')) return;

        const offlineMessage = document.createElement('div');
        offlineMessage.id = 'offline-message';
        offlineMessage.innerHTML = `
            <div class="fixed bottom-20 left-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-40 max-w-sm mx-auto">
                <div class="flex items-start space-x-3">
                    <i class="fas fa-cloud-download-alt text-lg text-blue-400 mt-1"></i>
                    <div>
                        <h4 class="font-semibold text-sm">Modo Offline</h4>
                        <p class="text-xs text-gray-300 mt-1">Puedes seguir navegando. Los cambios se guardarán cuando recuperes la conexión.</p>
                    </div>
                    <button onclick="this.closest('#offline-message').remove()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-sm"></i>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(offlineMessage);

        // Auto-remover después de 10 segundos
        setTimeout(() => {
            if (offlineMessage.parentNode) {
                offlineMessage.remove();
            }
        }, 10000);
    }

    updateNetworkIcons(isOnline) {
        const icons = document.querySelectorAll('.network-status-icon');
        icons.forEach(icon => {
            icon.className = isOnline ? 'fas fa-wifi network-status-icon text-green-500' : 
                                      'fas fa-wifi-slash network-status-icon text-red-500';
        });
    }

    // Queue para peticiones offline
    queueRequest(requestInfo) {
        const queueItem = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            ...requestInfo
        };
        
        this.offlineQueue.push(queueItem);
        this.saveOfflineQueue();
        
        console.log('📦 Petición guardada para cuando haya conexión:', queueItem);
        return queueItem.id;
    }

    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        console.log(`📤 Procesando ${this.offlineQueue.length} peticiones pendientes...`);
        
        const results = [];
        
        for (const request of [...this.offlineQueue]) {
            try {
                const result = await this.executeQueuedRequest(request);
                results.push({ success: true, request, result });
                
                // Remover de la cola si fue exitoso
                this.offlineQueue = this.offlineQueue.filter(q => q.id !== request.id);
                
            } catch (error) {
                console.error('❌ Error procesando petición offline:', error);
                results.push({ success: false, request, error });
                
                // Mantener en cola para reintento posterior
                request.retries = (request.retries || 0) + 1;
                if (request.retries >= this.maxRetries) {
                    this.offlineQueue = this.offlineQueue.filter(q => q.id !== request.id);
                    console.warn('🚫 Petición descartada tras múltiples intentos:', request);
                }
            }
        }

        this.saveOfflineQueue();
        
        if (results.some(r => r.success)) {
            this.showSyncMessage(results.filter(r => r.success).length);
        }

        return results;
    }

    async executeQueuedRequest(request) {
        const { url, method = 'POST', data, headers = {} } = request;
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            },
            body: data ? JSON.stringify(data) : undefined
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    showSyncMessage(count) {
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div class="fixed top-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-50 max-w-sm">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-sync-alt text-sm"></i>
                    <span class="text-sm">
                        ${count} ${count === 1 ? 'acción sincronizada' : 'acciones sincronizadas'}
                    </span>
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    saveOfflineQueue() {
        try {
            localStorage.setItem('offline-queue', JSON.stringify(this.offlineQueue));
        } catch (error) {
            console.warn('No se pudo guardar la cola offline:', error);
        }
    }

    loadOfflineQueue() {
        try {
            const saved = localStorage.getItem('offline-queue');
            if (saved) {
                this.offlineQueue = JSON.parse(saved);
                console.log(`📦 Cargadas ${this.offlineQueue.length} peticiones offline pendientes`);
            }
        } catch (error) {
            console.warn('No se pudo cargar la cola offline:', error);
            this.offlineQueue = [];
        }
    }

    interceptFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                return response;
            } catch (error) {
                // Si es un error de red y estamos offline
                if (!this.isOnline && this.isNetworkError(error)) {
                    throw new OfflineError('Sin conexión a internet', error);
                }
                throw error;
            }
        };
    }

    isNetworkError(error) {
        return error.name === 'TypeError' && 
               (error.message.includes('Failed to fetch') || 
                error.message.includes('NetworkError') ||
                error.message.includes('fetch'));
    }

    // Notificar a otros componentes sobre cambios de conexión
    notifyComponents(status) {
        const event = new CustomEvent('connectionchange', {
            detail: { 
                isOnline: this.isOnline, 
                status,
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(event);
    }

    // API pública
    getStatus() {
        return {
            isOnline: this.isOnline,
            queueLength: this.offlineQueue.length,
            lastCheck: this.lastCheck
        };
    }

    // Método para que otros componentes registren callbacks
    onConnectionChange(callback) {
        window.addEventListener('connectionchange', callback);
    }

    // Forzar verificación de conexión
    async forceCheck() {
        const isOnline = await this.checkConnection();
        if (isOnline !== this.isOnline) {
            this.isOnline = isOnline;
            this.isOnline ? this.handleOnline() : this.handleOffline();
        }
        return this.isOnline;
    }
}

// Clase de error personalizada para offline
class OfflineError extends Error {
    constructor(message, originalError) {
        super(message);
        this.name = 'OfflineError';
        this.originalError = originalError;
        this.isOffline = true;
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ConnectionManager = new ConnectionManager();
    });
} else {
    window.ConnectionManager = new ConnectionManager();
}

// Exportar para uso global
window.ConnectionManager = ConnectionManager;
window.OfflineError = OfflineError;