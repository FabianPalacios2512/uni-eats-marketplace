/**
 * 🚀 PWA INITIALIZER
 * Punto de entrada principal para todas las funcionalidades PWA
 */
class PWAInitializer {
    constructor() {
        this.initialized = false;
        this.components = new Map();
        this.config = null;
        this.userRole = null;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Inicializando PWA...');
            
            // Esperar a que la configuración esté lista
            await this.waitForConfig();
            
            // Detectar rol del usuario
            this.detectUserRole();
            
            // Mostrar splash screen si es necesario
            this.showSplashScreen();
            
            // Inicializar componentes principales
            await this.initializeComponents();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Configurar según el rol
            this.configureForRole();
            
            // Marcar como inicializado
            this.initialized = true;
            
            console.log('✅ PWA inicializada correctamente');
            
            // Ocultar splash screen
            this.hideSplashScreen();
            
        } catch (error) {
            console.error('❌ Error inicializando PWA:', error);
            this.handleInitializationError(error);
        }
    }

    waitForConfig() {
        return new Promise((resolve) => {
            if (window.PWAConfig) {
                this.config = window.PWAConfig;
                resolve();
            } else {
                document.addEventListener('pwaConfigReady', (e) => {
                    this.config = e.detail;
                    resolve();
                });
            }
        });
    }

    detectUserRole() {
        // Detectar rol basado en la URL o contenido de la página
        const path = window.location.pathname;
        
        if (path.includes('vendedor')) {
            this.userRole = 'vendedor';
        } else if (path.includes('estudiante')) {
            this.userRole = 'estudiante';
        } else if (path.includes('admin')) {
            this.userRole = 'admin';
        } else {
            this.userRole = 'estudiante'; // Default
        }

        // También verificar elementos DOM específicos
        if (document.getElementById('vendor-dashboard-container')) {
            this.userRole = 'vendedor';
        } else if (document.getElementById('app-nav')) {
            this.userRole = 'estudiante';
        }

        console.log('👤 Rol de usuario detectado:', this.userRole);
    }

    showSplashScreen() {
        if (!this.config.device.isMobile) return;

        const splash = document.createElement('div');
        splash.id = 'pwa-splash-screen';
        splash.className = 'pwa-splash';
        splash.innerHTML = `
            <div class="pwa-splash-content">
                <div class="pwa-splash-logo">
                    <i class="fas fa-utensils"></i>
                </div>
                <h1 class="pwa-splash-title">${this.config.app.name}</h1>
                <p class="pwa-splash-subtitle">${this.config.app.description}</p>
                <div class="pwa-loading"></div>
            </div>
        `;

        document.body.appendChild(splash);
    }

    async initializeComponents() {
        const components = [
            { name: 'ConnectionManager', class: ConnectionManager },
            { name: 'ImageOptimizer', class: ImageOptimizationManager },
            { name: 'PWAInstaller', class: PWAInstallManager },
            { name: 'PushManager', class: PushNotificationManager }
        ];

        for (const component of components) {
            try {
                if (window[component.class.name]) {
                    // El componente ya fue inicializado
                    this.components.set(component.name, window[component.name] || window[component.class.name]);
                    console.log(`✅ ${component.name} ya inicializado`);
                } else {
                    // Inicializar nuevo componente
                    const instance = new component.class();
                    this.components.set(component.name, instance);
                    window[component.name] = instance;
                    console.log(`🔧 ${component.name} inicializado`);
                }
            } catch (error) {
                console.warn(`⚠️ Error inicializando ${component.name}:`, error);
            }
        }
    }

    setupEventListeners() {
        // Escuchar cambios de visibilidad
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handleAppResume();
            } else {
                this.handleAppPause();
            }
        });

        // Escuchar cambios de conexión
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());

        // Escuchar eventos de instalación
        window.addEventListener('beforeinstallprompt', (e) => {
            this.handleInstallPrompt(e);
        });

        // Escuchar cambios de orientación
        window.addEventListener('orientationchange', () => {
            this.handleOrientationChange();
        });

        // Escuchar errores globales
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e);
        });

        // Escuchar errores de promesas no capturadas
        window.addEventListener('unhandledrejection', (e) => {
            this.handleUnhandledRejection(e);
        });
    }

    configureForRole() {
        const roleConfig = this.config.utils.getConfigForRole(this.userRole);
        
        // Configurar notificaciones según el rol
        if (this.components.has('PushManager')) {
            const pushManager = this.components.get('PushManager');
            pushManager.setVapidPublicKey(roleConfig.notifications.vapidPublicKey);
            
            // Auto-suscribir si es apropiado
            if (this.shouldAutoSubscribeNotifications()) {
                setTimeout(() => {
                    pushManager.subscribe(roleConfig.notifications.preferences)
                        .catch(err => console.log('Auto-subscribe falló:', err.message));
                }, roleConfig.install.showPromptDelay);
            }
        }

        // Configurar características específicas del rol
        this.enableRoleFeatures(roleConfig.features);

        // Aplicar tema y estilos
        this.applyTheme(roleConfig.ui.theme);
    }

    shouldAutoSubscribeNotifications() {
        // No auto-suscribir en localhost o si ya se rechazó antes
        if (window.location.hostname === 'localhost') return false;
        
        const rejected = localStorage.getItem('notifications-rejected');
        if (rejected && Date.now() - parseInt(rejected) < 7 * 24 * 60 * 60 * 1000) {
            return false;
        }

        return true;
    }

    enableRoleFeatures(features) {
        features.forEach(feature => {
            switch (feature) {
                case 'orders':
                    this.enableOrderFeatures();
                    break;
                case 'products':
                    this.enableProductFeatures();
                    break;
                case 'analytics':
                    this.enableAnalytics();
                    break;
                case 'browse':
                    this.enableBrowsingFeatures();
                    break;
                default:
                    console.log(`🔧 Característica ${feature} habilitada`);
            }
        });
    }

    enableOrderFeatures() {
        // Habilitar funciones específicas de pedidos
        if (this.components.has('PushManager')) {
            const pushManager = this.components.get('PushManager');
            
            // Escuchar eventos de pedidos
            window.addEventListener('newOrder', (e) => {
                if (this.userRole === 'vendedor') {
                    pushManager.notifyNewOrder(e.detail);
                }
            });

            window.addEventListener('orderStatusUpdate', (e) => {
                pushManager.notifyOrderStatusUpdate(e.detail.order, e.detail.status);
            });
        }
    }

    enableProductFeatures() {
        // Habilitar funciones de gestión de productos
        if (this.components.has('ImageOptimizer')) {
            const imageOptimizer = this.components.get('ImageOptimizer');
            
            // Optimizar imágenes de productos automáticamente
            const observer = new MutationObserver(() => {
                imageOptimizer.processNewImages();
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    enableBrowsingFeatures() {
        // Funciones para navegación de estudiantes
        this.setupPullToRefresh();
        this.setupSwipeNavigation();
    }

    enableAnalytics() {
        if (!this.config.analytics.enabled) return;

        // Configurar analytics básico
        this.trackPageView();
        this.trackUserInteractions();
    }

    applyTheme(theme) {
        // Aplicar variables CSS para el tema
        const root = document.documentElement;
        
        Object.entries(theme).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
        });

        // Aplicar meta theme-color
        const metaTheme = document.querySelector('meta[name="theme-color"]');
        if (metaTheme) {
            metaTheme.content = theme.primary;
        }
    }

    setupPullToRefresh() {
        if (!this.config.device.isMobile) return;

        let startY = 0;
        let pullDistance = 0;
        const threshold = 80;

        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY > 0) return;

            const currentY = e.touches[0].clientY;
            pullDistance = Math.max(0, currentY - startY);

            if (pullDistance > 0) {
                e.preventDefault();
                
                // Visual feedback
                document.body.style.transform = `translateY(${Math.min(pullDistance * 0.5, 50)}px)`;
                
                if (pullDistance > threshold) {
                    this.showPullToRefreshIndicator();
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (pullDistance > threshold) {
                this.triggerRefresh();
            }
            
            // Reset
            document.body.style.transform = '';
            this.hidePullToRefreshIndicator();
            pullDistance = 0;
        }, { passive: true });
    }

    showPullToRefreshIndicator() {
        let indicator = document.getElementById('pull-refresh-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pull-refresh-indicator';
            indicator.className = 'pull-refresh-indicator active';
            indicator.innerHTML = '<i class="fas fa-sync-alt"></i>';
            document.body.appendChild(indicator);
        }
        indicator.classList.add('active');
    }

    hidePullToRefreshIndicator() {
        const indicator = document.getElementById('pull-refresh-indicator');
        if (indicator) {
            indicator.classList.remove('active');
        }
    }

    triggerRefresh() {
        const indicator = document.getElementById('pull-refresh-indicator');
        if (indicator) {
            indicator.classList.add('refreshing');
            indicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>';
        }

        // Refresh de la página o datos específicos
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }

    setupSwipeNavigation() {
        // Implementar navegación por swipe en móviles
        let startX = 0;
        let startY = 0;
        const minSwipeDistance = 50;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            
            // Solo procesar si es más horizontal que vertical
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    this.handleSwipeRight();
                } else {
                    this.handleSwipeLeft();
                }
            }
        }, { passive: true });
    }

    handleSwipeRight() {
        // Navegar hacia atrás o sección anterior
        if (this.userRole === 'estudiante') {
            const navLinks = document.querySelectorAll('.nav-link');
            const activeLink = document.querySelector('.nav-link.active');
            const activeIndex = Array.from(navLinks).indexOf(activeLink);
            
            if (activeIndex > 0) {
                navLinks[activeIndex - 1].click();
            }
        }
    }

    handleSwipeLeft() {
        // Navegar hacia adelante o siguiente sección
        if (this.userRole === 'estudiante') {
            const navLinks = document.querySelectorAll('.nav-link');
            const activeLink = document.querySelector('.nav-link.active');
            const activeIndex = Array.from(navLinks).indexOf(activeLink);
            
            if (activeIndex < navLinks.length - 1) {
                navLinks[activeIndex + 1].click();
            }
        }
    }

    // Event handlers
    handleAppResume() {
        console.log('📱 App resumed');
        
        // Verificar actualizaciones del service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => registration.update());
            });
        }

        // Refrescar datos críticos
        this.refreshCriticalData();
    }

    handleAppPause() {
        console.log('📱 App paused');
        
        // Guardar estado actual
        this.saveAppState();
    }

    handleOnline() {
        console.log('🌐 App online');
        
        // Procesar cola offline si existe
        if (this.components.has('ConnectionManager')) {
            this.components.get('ConnectionManager').processOfflineQueue();
        }
    }

    handleOffline() {
        console.log('🔴 App offline');
        
        // Mostrar estado offline
        this.showOfflineState();
    }

    handleInstallPrompt(e) {
        if (this.components.has('PWAInstaller')) {
            // El installer manejará el prompt
            return;
        }

        // Fallback manual
        e.preventDefault();
        console.log('📱 Install prompt disponible');
    }

    handleOrientationChange() {
        // Ajustar layout según orientación
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
    }

    handleGlobalError(e) {
        console.error('💥 Error global:', e.error);
        
        // Reportar error si analytics está habilitado
        if (this.config.analytics.enabled) {
            this.trackError(e.error);
        }
    }

    handleUnhandledRejection(e) {
        console.error('💥 Promise no capturada:', e.reason);
        
        // Reportar error
        if (this.config.analytics.enabled) {
            this.trackError(e.reason);
        }
    }

    // Utility methods
    refreshCriticalData() {
        // Refrescar datos específicos según el rol
        const event = new CustomEvent('refreshData', {
            detail: { role: this.userRole }
        });
        window.dispatchEvent(event);
    }

    saveAppState() {
        try {
            const state = {
                role: this.userRole,
                timestamp: Date.now(),
                url: window.location.href
            };
            
            localStorage.setItem('app-state', JSON.stringify(state));
        } catch (error) {
            console.warn('No se pudo guardar el estado:', error);
        }
    }

    showOfflineState() {
        // Mostrar indicador visual de estado offline
        document.body.classList.add('app-offline');
    }

    trackPageView() {
        // Track page view básico
        console.log('📊 Page view:', window.location.pathname);
    }

    trackUserInteractions() {
        // Track clicks básicos
        document.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A') {
                console.log('📊 Click:', e.target.textContent?.trim());
            }
        });
    }

    trackError(error) {
        console.log('📊 Error tracked:', error.message);
    }

    hideSplashScreen() {
        const splash = document.getElementById('pwa-splash-screen');
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => splash.remove(), 500);
        }
    }

    handleInitializationError(error) {
        console.error('💥 Error crítico de inicialización:', error);
        
        // Mostrar mensaje de error amigable
        const errorMessage = document.createElement('div');
        errorMessage.innerHTML = `
            <div class="fixed inset-0 bg-red-500 text-white flex items-center justify-center z-50">
                <div class="text-center p-6">
                    <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                    <h2 class="text-xl font-bold mb-2">Error de Inicialización</h2>
                    <p class="mb-4">Hubo un problema cargando la aplicación.</p>
                    <button onclick="window.location.reload()" class="bg-white text-red-500 px-4 py-2 rounded font-bold">
                        Reintentar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorMessage);
    }

    // API pública
    getComponent(name) {
        return this.components.get(name);
    }

    isInitialized() {
        return this.initialized;
    }

    getUserRole() {
        return this.userRole;
    }

    getConfig() {
        return this.config;
    }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PWAInit = new PWAInitializer();
    });
} else {
    window.PWAInit = new PWAInitializer();
}

// Exportar para uso global
window.PWAInitializer = PWAInitializer;