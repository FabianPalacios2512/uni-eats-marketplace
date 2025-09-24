/**
 * 🎯 PWA STANDALONE MODE DETECTOR
 * Detecta y optimiza la experiencia cuando la app se abre como PWA standalone
 */

class PWAStandaloneManager {
    constructor() {
        this.isStandalone = this.detectStandaloneMode();
        this.init();
    }

    init() {
        console.log('📱 PWA Standalone:', this.isStandalone ? 'SÍ' : 'NO');
        
        if (this.isStandalone) {
            this.optimizeForStandalone();
        }
        
        this.setupServiceWorkerMessages();
    }

    detectStandaloneMode() {
        // Múltiples formas de detectar modo standalone
        const displayMode = window.matchMedia('(display-mode: standalone)').matches;
        const navigatorStandalone = window.navigator.standalone === true;
        const fromHomescreen = window.matchMedia('(display-mode: standalone)').matches || 
                              window.navigator.standalone === true || 
                              document.referrer.includes('android-app://') ||
                              !window.matchMedia('(display-mode: browser)').matches;

        // Verificar si la URL tiene parámetros PWA
        const urlParams = new URLSearchParams(window.location.search);
        const fromPWA = urlParams.get('utm_source') === 'pwa';

        console.log('📱 PWA Detection:', {
            displayMode,
            navigatorStandalone,
            fromHomescreen,
            fromPWA,
            userAgent: navigator.userAgent.substring(0, 100),
            referrer: document.referrer
        });

        return displayMode || navigatorStandalone || fromHomescreen || fromPWA;
    }

    optimizeForStandalone() {
        console.log('🚀 PWA: Optimizando para modo standalone');
        
        // Agregar clase CSS para estilos específicos de PWA
        document.documentElement.classList.add('pwa-standalone');
        document.body.setAttribute('data-pwa-mode', 'standalone');
        
        // Optimizar viewport para PWA
        this.optimizeViewport();
        
        // Prevenir zoom en iOS PWA
        this.preventIOSZoom();
        
        // Manejar navegación interna
        this.setupInternalNavigation();
        
        // Agregar indicador visual de PWA
        this.addPWAIndicator();
        
        // Forzar pantalla completa
        this.forceFullscreen();
    }

    optimizeViewport() {
        // Ajustar viewport para PWA standalone
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 
                'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
            );
        }
    }

    preventIOSZoom() {
        // Prevenir zoom accidental en iOS PWA
        document.addEventListener('touchstart', (event) => {
            if (event.touches.length > 1) {
                event.preventDefault();
            }
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (event) => {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    setupInternalNavigation() {
        // Interceptar enlaces externos para abrirlos en el navegador
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.href) {
                const url = new URL(link.href);
                const currentUrl = new URL(window.location.href);
                
                // Si es un enlace externo
                if (url.origin !== currentUrl.origin) {
                    event.preventDefault();
                    window.open(link.href, '_blank');
                    console.log('🔗 PWA: Abriendo enlace externo en navegador:', link.href);
                }
            }
        });
    }

    addPWAIndicator() {
        // Agregar pequeño indicador visual de que es PWA
        const indicator = document.createElement('div');
        indicator.innerHTML = `
            <div id="pwa-indicator" class="fixed top-2 right-2 z-50 bg-indigo-500 text-white text-xs px-2 py-1 rounded-full shadow-lg opacity-75 transition-opacity">
                📱 PWA
            </div>
        `;
        document.body.appendChild(indicator);
        
        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            const element = document.getElementById('pwa-indicator');
            if (element) {
                element.style.opacity = '0';
                setTimeout(() => element.remove(), 300);
            }
        }, 3000);
    }

    forceFullscreen() {
        // Intentar ocultar la barra de direcciones
        setTimeout(() => {
            window.scrollTo(0, 1);
        }, 100);
        
        // En iOS, solicitar pantalla completa si está disponible
        if (document.documentElement.requestFullscreen && this.isStandalone) {
            document.addEventListener('click', () => {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(err => {
                        console.log('No se pudo activar pantalla completa:', err);
                    });
                }
            }, { once: true });
        }
    }

    setupServiceWorkerMessages() {
        // Escuchar mensajes del Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('📨 PWA: Mensaje del SW:', event.data);
                
                if (event.data && event.data.type === 'PWA_ACTIVATED') {
                    console.log('🚀 PWA: Service Worker activado en modo:', event.data.mode);
                    this.onPWAActivated();
                }
            });
        }
    }

    onPWAActivated() {
        // Ejecutar acciones cuando PWA está completamente activada
        console.log('✅ PWA: Completamente activada');
        
        // Notificar a otros componentes
        window.dispatchEvent(new CustomEvent('pwa-ready', {
            detail: { standalone: this.isStandalone }
        }));
    }

    // Método público para verificar si es standalone
    isRunningStandalone() {
        return this.isStandalone;
    }
}

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.pwaStandalone = new PWAStandaloneManager();
    });
} else {
    window.pwaStandalone = new PWAStandaloneManager();
}

// Exportar para uso global
window.PWAStandaloneManager = PWAStandaloneManager;