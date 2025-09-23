/**
 * 📱 PWA INSTALL MANAGER
 * Maneja la instalación de la PWA y prompts de instalación
 */
class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = null;
        this.isInstalled = false;
        this.init();
    }

    init() {
        this.checkIfInstalled();
        this.setupEventListeners();
        this.createInstallButton();
    }

    // Verificar si ya está instalada
    checkIfInstalled() {
        // PWA instalada si display-mode es standalone
        this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                          window.navigator.standalone === true ||
                          document.referrer.includes('android-app://');
        
        const environment = window.location.protocol === 'https:' ? 'PRODUCCIÓN' : 'DESARROLLO';
        console.log(`📱 PWA Install Manager [${environment}]:`, this.isInstalled ? 'Ya instalada' : 'No instalada');
        
        // Mostrar info sobre limitaciones en desarrollo
        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
            console.warn('⚠️ PWA en HTTP: Funciones limitadas. En HTTPS tendrás funcionalidad completa.');
        }
    }

    setupEventListeners() {
        // Capturar evento beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('📱 PWA: beforeinstallprompt disparado');
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        // Detectar cuando se instala
        window.addEventListener('appinstalled', () => {
            console.log('✅ PWA: App instalada exitosamente');
            this.isInstalled = true;
            this.hideInstallButton();
            this.showInstalledMessage();
        });

        // Detectar cambios en display mode
        window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
            this.isInstalled = e.matches;
            if (this.isInstalled) {
                this.hideInstallButton();
            }
        });
    }

    createInstallButton() {
        // Solo crear si no está instalada
        if (this.isInstalled) return;

        // Crear banner principal de instalación
        this.installButton = document.createElement('div');
        this.installButton.id = 'pwa-install-prompt';
        this.installButton.innerHTML = `
            <!-- Banner Principal - Top -->
            <div class="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-indigo-600 to-purple-600 text-white transform transition-all duration-500 -translate-y-full shadow-xl" id="install-banner-top" style="z-index: 9999 !important;">
                <div class="px-4 py-3">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                <i class="fas fa-mobile-alt text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-lg">📱 ¿Deseas descargar la App Móvil?</h3>
                                <p class="text-sm text-indigo-100">Acceso rápido, funciona offline y como app nativa</p>
                            </div>
                        </div>
                        <button id="close-install-prompt-top" class="text-white/70 hover:text-white p-1">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    <div class="mt-3 flex space-x-3">
                        <button id="install-app-btn-top" class="bg-white text-indigo-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-indigo-50 transition-all flex items-center space-x-2 shadow-lg">
                            <i class="fas fa-download"></i>
                            <span>Instalar App</span>
                        </button>
                        <button id="maybe-later-btn-top" class="text-white/90 px-4 py-2 rounded-full text-sm hover:text-white transition-colors border border-white/30">
                            Más tarde
                        </button>
                    </div>
                </div>
            </div>

            <!-- Banner Alternativo - En contenido -->
            <div class="fixed top-20 left-4 right-4 z-[9998] bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-2xl transform transition-all duration-500 opacity-0 scale-95" id="install-banner-content" style="z-index: 9998 !important;">
                <div class="p-4">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i class="fas fa-mobile-alt text-white text-xl"></i>
                            </div>
                            <div>
                                <h3 class="font-bold text-lg">📱 Descargar App Móvil</h3>
                                <p class="text-sm text-blue-100">¡Instala Uni-Eats como app nativa!</p>
                            </div>
                        </div>
                        <button id="close-install-prompt-content" class="text-white/70 hover:text-white p-1">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                    <div class="mt-3 flex space-x-3">
                        <button id="install-app-btn-content" class="bg-white text-blue-600 px-6 py-2 rounded-full font-bold text-sm hover:bg-blue-50 transition-all flex items-center space-x-2 shadow-lg">
                            <i class="fas fa-download"></i>
                            <span>Instalar Ahora</span>
                        </button>
                        <button id="maybe-later-btn-content" class="text-white/90 px-4 py-2 rounded-full text-sm hover:text-white transition-colors border border-white/30">
                            Más tarde
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(this.installButton);

        // Event listeners para los botones del banner superior
        document.getElementById('install-app-btn-top').addEventListener('click', () => {
            this.installApp();
        });

        document.getElementById('close-install-prompt-top').addEventListener('click', () => {
            this.hideInstallButton();
        });

        document.getElementById('maybe-later-btn-top').addEventListener('click', () => {
            this.hideInstallButton();
            // No mostrar por 24 horas
            localStorage.setItem('pwa-install-dismissed', Date.now() + (24 * 60 * 60 * 1000));
        });

        // Event listeners para los botones del banner de contenido
        document.getElementById('install-app-btn-content').addEventListener('click', () => {
            this.installApp();
        });

        document.getElementById('close-install-prompt-content').addEventListener('click', () => {
            this.hideInstallButton();
        });

        document.getElementById('maybe-later-btn-content').addEventListener('click', () => {
            this.hideInstallButton();
            // No mostrar por 24 horas
            localStorage.setItem('pwa-install-dismissed', Date.now() + (24 * 60 * 60 * 1000));
        });
    }

    showInstallButton() {
        if (!this.installButton || this.isInstalled) return;

        // Verificar si fue rechazado recientemente
        const dismissedUntil = localStorage.getItem('pwa-install-dismissed');
        if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
            console.log('📱 PWA: Install prompt dismissed, esperando...');
            return;
        }

        // Mostrar banner principal después de 2 segundos
        setTimeout(() => {
            const topBanner = document.getElementById('install-banner-top');
            if (topBanner) {
                topBanner.classList.remove('-translate-y-full');
                topBanner.classList.add('translate-y-0');
            }
        }, 2000);

        // Mostrar banner de contenido después de 4 segundos (como backup)
        setTimeout(() => {
            const contentBanner = document.getElementById('install-banner-content');
            if (contentBanner) {
                contentBanner.classList.remove('opacity-0', 'scale-95');
                contentBanner.classList.add('opacity-100', 'scale-100');
            }
        }, 4000);
    }

    hideInstallButton() {
        const topBanner = document.getElementById('install-banner-top');
        if (topBanner) {
            topBanner.classList.add('-translate-y-full');
            topBanner.classList.remove('translate-y-0');
        }

        const contentBanner = document.getElementById('install-banner-content');
        if (contentBanner) {
            contentBanner.classList.add('opacity-0', 'scale-95');
            contentBanner.classList.remove('opacity-100', 'scale-100');
        }
        
        // Remover completamente después de la animación
        setTimeout(() => {
            if (this.installButton) {
                this.installButton.remove();
                this.installButton = null;
            }
        }, 500);
    }

    async installApp() {
        if (!this.deferredPrompt) {
            console.warn('📱 PWA: No hay prompt disponible');
            return;
        }

        try {
            // Mostrar el prompt de instalación
            this.deferredPrompt.prompt();
            
            // Esperar la respuesta del usuario
            const { outcome } = await this.deferredPrompt.userChoice;
            console.log('📱 PWA: User choice:', outcome);
            
            if (outcome === 'accepted') {
                console.log('✅ PWA: Usuario aceptó la instalación');
                this.hideInstallButton();
            } else {
                console.log('❌ PWA: Usuario rechazó la instalación');
                // Guardar rechazo por 7 días
                localStorage.setItem('pwa-install-dismissed', Date.now() + (7 * 24 * 60 * 60 * 1000));
            }

            this.deferredPrompt = null;
        } catch (error) {
            console.error('❌ PWA: Error en instalación:', error);
        }
    }

    showInstalledMessage() {
        // Mostrar mensaje de confirmación
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname.includes('192.168');
        const environment = window.location.protocol === 'https:' ? '' : ' (Modo Desarrollo)';
        
        const toast = document.createElement('div');
        toast.innerHTML = `
            <div class="fixed top-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-check-circle text-lg"></i>
                    <div>
                        <h4 class="font-semibold text-sm">¡App Instalada!${environment}</h4>
                        <p class="text-xs text-green-100">
                            ${isLocal ? 
                                'Instalada desde desarrollo local. En producción tendrás todas las funciones.' : 
                                'Uni-Eats ahora está en tu pantalla principal'
                            }
                        </p>
                        ${isLocal ? 
                            '<p class="text-xs text-green-200 mt-1">💡 Funciona offline y con menú fijo</p>' : 
                            ''
                        }
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    // Método para forzar mostrar prompt (para botón manual)
    showInstallPrompt() {
        if (this.isInstalled) {
            console.log('📱 PWA: Ya está instalada');
            return;
        }

        if (this.deferredPrompt) {
            this.installApp();
        } else {
            // Mostrar instrucciones manuales
            this.showManualInstallInstructions();
        }
    }

    showManualInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);
        
        let instructions = '';
        
        if (isIOS) {
            instructions = `
                <div class="text-center">
                    <i class="fas fa-mobile-alt text-4xl text-indigo-600 mb-3"></i>
                    <h3 class="font-bold text-lg mb-2">Instalar en iOS</h3>
                    <ol class="text-left space-y-2 text-sm">
                        <li>1. Toca el botón <i class="fas fa-share"></i> compartir</li>
                        <li>2. Selecciona "Añadir a inicio"</li>
                        <li>3. Confirma tocando "Añadir"</li>
                    </ol>
                </div>
            `;
        } else if (isAndroid) {
            instructions = `
                <div class="text-center">
                    <i class="fas fa-mobile-alt text-4xl text-indigo-600 mb-3"></i>
                    <h3 class="font-bold text-lg mb-2">Instalar en Android</h3>
                    <ol class="text-left space-y-2 text-sm">
                        <li>1. Toca el menú <i class="fas fa-ellipsis-v"></i> (tres puntos)</li>
                        <li>2. Selecciona "Instalar app" o "Añadir a inicio"</li>
                        <li>3. Confirma la instalación</li>
                    </ol>
                </div>
            `;
        } else {
            instructions = `
                <div class="text-center">
                    <i class="fas fa-desktop text-4xl text-indigo-600 mb-3"></i>
                    <h3 class="font-bold text-lg mb-2">Instalar en Escritorio</h3>
                    <p class="text-sm">Busca el ícono de instalación <i class="fas fa-download"></i> en la barra de direcciones de tu navegador.</p>
                </div>
            `;
        }

        // Crear modal con instrucciones
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 max-w-md mx-4">
                    ${instructions}
                    <button class="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors" onclick="this.closest('.fixed').remove()">
                        Entendido
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Información sobre la PWA
    getPWAInfo() {
        return {
            isInstalled: this.isInstalled,
            isStandalone: window.matchMedia('(display-mode: standalone)').matches,
            canInstall: !!this.deferredPrompt,
            platform: this.detectPlatform()
        };
    }

    detectPlatform() {
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return 'iOS';
        if (/Android/.test(navigator.userAgent)) return 'Android';
        if (/Windows/.test(navigator.userAgent)) return 'Windows';
        if (/Mac/.test(navigator.userAgent)) return 'macOS';
        return 'Desktop';
    }

    showDownloadOptions() {
        // Crear modal con opciones de descarga
        const modal = document.createElement('div');
        modal.id = 'download-options-modal';
        modal.innerHTML = `
            <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4" id="modal-overlay">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-95 opacity-0" id="modal-content">
                    <div class="p-6">
                        <!-- Header -->
                        <div class="text-center mb-6">
                            <div class="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-mobile-alt text-white text-2xl"></i>
                            </div>
                            <h2 class="text-2xl font-bold text-gray-800 mb-2">📱 Descargar Uni-Eats</h2>
                            <p class="text-gray-600">Elige cómo quieres instalar la aplicación</p>
                        </div>

                        <!-- Opciones -->
                        <div class="space-y-3 mb-6">
                            <!-- Opción PWA -->
                            <div class="border border-indigo-200 rounded-xl p-4 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all cursor-pointer" onclick="window.pwaInstaller?.installApp(); window.pwaInstaller?.closeDownloadModal();">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center">
                                        <i class="fas fa-rocket text-white text-lg"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-bold text-gray-800">Instalar como App</h3>
                                        <p class="text-sm text-gray-600">Funciona offline, notificaciones push</p>
                                    </div>
                                    <i class="fas fa-arrow-right text-indigo-500"></i>
                                </div>
                            </div>

                            <!-- Opción Acceso Directo -->
                            <div class="border border-blue-200 rounded-xl p-4 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 transition-all cursor-pointer" onclick="window.pwaInstaller?.addToHomeScreen();">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                                        <i class="fas fa-plus-circle text-white text-lg"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-bold text-gray-800">Agregar a Inicio</h3>
                                        <p class="text-sm text-gray-600">Acceso directo en pantalla principal</p>
                                    </div>
                                    <i class="fas fa-arrow-right text-blue-500"></i>
                                </div>
                            </div>

                            <!-- Información -->
                            <div class="border border-emerald-200 rounded-xl p-4 bg-gradient-to-r from-emerald-50 to-teal-50">
                                <div class="flex items-center space-x-3">
                                    <div class="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                                        <i class="fas fa-info-circle text-white text-lg"></i>
                                    </div>
                                    <div class="flex-1">
                                        <h3 class="font-bold text-gray-800">¿Por qué descargar?</h3>
                                        <p class="text-sm text-gray-600">Acceso más rápido y experiencia nativa</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Botón Cerrar -->
                        <div class="flex justify-center">
                            <button onclick="window.pwaInstaller?.closeDownloadModal()" class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full font-medium transition-colors">
                                Más tarde
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animar entrada del modal
        setTimeout(() => {
            const content = document.getElementById('modal-content');
            if (content) {
                content.classList.remove('scale-95', 'opacity-0');
                content.classList.add('scale-100', 'opacity-100');
            }
        }, 10);

        // Cerrar al hacer click fuera
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDownloadModal();
            }
        });
    }

    closeDownloadModal() {
        const modal = document.getElementById('download-options-modal');
        if (modal) {
            const content = document.getElementById('modal-content');
            if (content) {
                content.classList.add('scale-95', 'opacity-0');
                content.classList.remove('scale-100', 'opacity-100');
            }
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    addToHomeScreen() {
        if (this.deferredPrompt) {
            this.installApp();
        } else {
            // Mostrar instrucciones manuales
            this.showManualInstructions();
        }
        this.closeDownloadModal();
    }

    showManualInstructions() {
        const instructions = document.createElement('div');
        instructions.innerHTML = `
            <div class="fixed inset-0 bg-black/50 z-[99999] flex items-center justify-center p-4">
                <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                    <div class="text-center mb-4">
                        <h3 class="text-xl font-bold text-gray-800 mb-2">📲 Instrucciones</h3>
                        <p class="text-gray-600 text-sm">Para agregar a tu pantalla de inicio:</p>
                    </div>
                    <div class="space-y-3 text-sm text-gray-700 mb-6">
                        <div class="flex items-center space-x-2">
                            <span class="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                            <span>Toca el menú del navegador (⋮ o ⋯)</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                            <span>Busca "Agregar a pantalla de inicio"</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                            <span>Confirma la instalación</span>
                        </div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg font-medium transition-colors">
                        Entendido
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(instructions);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaInstaller = new PWAInstallManager();
    });
} else {
    window.pwaInstaller = new PWAInstallManager();
}

// Exportar para uso global
window.PWAInstallManager = PWAInstallManager;