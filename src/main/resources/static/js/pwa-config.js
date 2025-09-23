/**
 * 📱 PWA CONFIGURATION
 * Configuración centralizada para todas las características PWA
 */
window.PWAConfig = {
    // Información de la aplicación
    app: {
        name: 'Uni-Eats',
        shortName: 'Uni-Eats',
        description: 'Sistema de pedidos universitario con código QR',
        version: '1.0.0',
        author: 'Universidad Remington',
        url: window.location.origin,
        scope: '/',
        startUrl: '/'
    },

    // Configuración de Service Worker
    serviceWorker: {
        file: '/service-worker.js',
        scope: '/',
        updateCheckInterval: 60000, // 1 minuto
        skipWaiting: true,
        clientsClaim: true
    },

    // Configuración de Cache
    cache: {
        version: 'v1.0.0',
        staticCacheName: 'uni-eats-static-v1',
        dynamicCacheName: 'uni-eats-dynamic-v1',
        imageCacheName: 'uni-eats-images-v1',
        apiCacheName: 'uni-eats-api-v1',
        maxEntries: {
            static: 50,
            dynamic: 100,
            images: 150,
            api: 30
        },
        maxAge: {
            static: 30 * 24 * 60 * 60 * 1000, // 30 días
            dynamic: 7 * 24 * 60 * 60 * 1000,  // 7 días
            images: 14 * 24 * 60 * 60 * 1000,  // 14 días
            api: 5 * 60 * 1000                 // 5 minutos
        }
    },

    // URLs críticas para precaching
    precacheUrls: [
        '/',
        '/login',
        '/estudiante-dashboard',
        '/vendedor-dashboard',
        '/manifest.json',
        '/css/pwa-styles.css',
        '/js/connection-manager.js',
        '/js/image-optimizer.js',
        '/js/pwa-installer.js',
        '/js/push-notifications.js',
        '/js/utils/logger.js',
        '/img/icons/icon-192x192.png',
        '/img/icons/icon-512x512.png'
    ],

    // Patrones de recursos para diferentes estrategias de cache
    cacheStrategies: {
        staleWhileRevalidate: [
            /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            /\.(?:css|js)$/
        ],
        networkFirst: [
            /\/api\//,
            /\/auth\//,
            /\/pedidos\//,
            /\/productos\//
        ],
        cacheFirst: [
            /\.(?:woff|woff2|ttf|eot)$/,
            /\/img\/icons\//,
            /\/static\//
        ]
    },

    // Configuración de notificaciones push
    notifications: {
        vapidPublicKey: 'YOUR_VAPID_PUBLIC_KEY_HERE', // Reemplazar con clave real
        defaultIcon: '/img/icons/icon-192x192.png',
        badge: '/img/icons/badge-72x72.png',
        defaultOptions: {
            requireInteraction: false,
            silent: false,
            vibrate: [200, 100, 200],
            actions: [
                {
                    action: 'view',
                    title: 'Ver',
                    icon: '/img/icons/view.png'
                },
                {
                    action: 'dismiss',
                    title: 'Cerrar',
                    icon: '/img/icons/close.png'
                }
            ]
        },
        preferences: {
            // Preferencias por tipo de usuario
            vendedor: {
                newOrders: true,
                orderUpdates: true,
                promotions: false,
                systemUpdates: true
            },
            estudiante: {
                newOrders: false,
                orderUpdates: true,
                promotions: true,
                systemUpdates: false
            },
            admin: {
                newOrders: true,
                orderUpdates: true,
                promotions: true,
                systemUpdates: true
            }
        }
    },

    // Configuración de instalación
    install: {
        showPromptDelay: 5000, // 5 segundos
        dismissDuration: 24 * 60 * 60 * 1000, // 24 horas
        maxRetries: 3,
        autoPrompt: true,
        criteria: {
            minVisits: 2,
            minTime: 30000, // 30 segundos en la página
            recurring: true
        }
    },

    // Configuración de conexión
    connection: {
        checkInterval: 30000, // 30 segundos
        timeout: 5000,
        retryDelay: 1000,
        maxRetries: 3,
        endpoints: {
            primary: '/api/health-check',
            fallback: 'https://www.google.com/favicon.ico'
        }
    },

    // Configuración de imágenes
    images: {
        lazyLoading: true,
        placeholder: '/img/placeholder.png',
        errorImage: '/img/error.png',
        loadingClass: 'image-loading',
        loadedClass: 'image-loaded',
        errorClass: 'image-error',
        intersection: {
            rootMargin: '50px 0px',
            threshold: 0.01
        },
        optimization: {
            quality: 80,
            formats: ['webp', 'jpeg'],
            responsive: true
        }
    },

    // Configuración de UI/UX
    ui: {
        theme: {
            primary: '#667eea',
            secondary: '#764ba2',
            accent: '#f093fb',
            background: '#f8fafc',
            surface: '#ffffff',
            error: '#ef4444',
            warning: '#f59e0b',
            success: '#10b981',
            info: '#3b82f6'
        },
        animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-out'
        },
        accessibility: {
            reduceMotion: false,
            highContrast: false,
            focusVisible: true
        }
    },

    // Configuración de desarrollo/producción
    debug: {
        enabled: window.location.hostname === 'localhost',
        logLevel: 'info', // error, warn, info, debug
        showToasts: true,
        persistLogs: false
    },

    // Configuración específica por rol
    roles: {
        vendedor: {
            features: ['orders', 'products', 'notifications', 'analytics'],
            defaultView: 'pedidos',
            cacheProfile: 'intensive'
        },
        estudiante: {
            features: ['browse', 'cart', 'orders', 'favorites'],
            defaultView: 'inicio',
            cacheProfile: 'standard'
        },
        admin: {
            features: ['users', 'vendors', 'analytics', 'system'],
            defaultView: 'dashboard',
            cacheProfile: 'minimal'
        }
    },

    // APIs y endpoints
    api: {
        baseUrl: '/api',
        endpoints: {
            auth: '/auth',
            orders: '/pedidos',
            products: '/productos',
            vendors: '/vendedores',
            notifications: '/notifications',
            upload: '/upload',
            health: '/health-check'
        },
        timeout: 10000,
        retries: 3
    },

    // Configuración de almacenamiento
    storage: {
        prefix: 'uni-eats-',
        quota: 50 * 1024 * 1024, // 50MB
        cleanupThreshold: 0.8, // Limpiar cuando use 80% del espacio
        persistence: true,
        encryption: false
    },

    // Configuración de eventos y analytics
    analytics: {
        enabled: false, // Activar cuando se configure
        trackingId: 'YOUR_GA_TRACKING_ID',
        events: {
            install: true,
            navigation: true,
            errors: true,
            performance: true,
            engagement: true
        }
    },

    // URLs externas
    external: {
        support: 'mailto:soporte@uni-eats.com',
        privacy: '/privacy',
        terms: '/terms',
        feedback: '/feedback',
        updates: '/updates'
    }
};

// Aplicar configuración específica del entorno
if (window.location.hostname === 'localhost') {
    // Configuración de desarrollo
    PWAConfig.debug.enabled = true;
    PWAConfig.debug.logLevel = 'debug';
    PWAConfig.cache.maxAge.api = 30000; // 30 segundos en desarrollo
    PWAConfig.serviceWorker.updateCheckInterval = 10000; // 10 segundos
} else {
    // Configuración de producción
    PWAConfig.debug.enabled = false;
    PWAConfig.debug.logLevel = 'warn';
    PWAConfig.analytics.enabled = true;
}

// Detectar capacidades del dispositivo
PWAConfig.device = {
    isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
    isAndroid: /Android/.test(navigator.userAgent),
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
    hasNotifications: 'Notification' in window,
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager: 'PushManager' in window,
    hasWebShare: 'share' in navigator,
    online: navigator.onLine
};

// Configuración responsive
PWAConfig.responsive = {
    breakpoints: {
        mobile: 640,
        tablet: 768,
        desktop: 1024,
        wide: 1280
    },
    getCurrentBreakpoint: () => {
        const width = window.innerWidth;
        if (width < PWAConfig.responsive.breakpoints.mobile) return 'mobile';
        if (width < PWAConfig.responsive.breakpoints.tablet) return 'tablet';
        if (width < PWAConfig.responsive.breakpoints.desktop) return 'desktop';
        return 'wide';
    }
};

// Utilidades de configuración
PWAConfig.utils = {
    // Obtener configuración por rol
    getConfigForRole: (role) => {
        return {
            ...PWAConfig,
            notifications: {
                ...PWAConfig.notifications,
                preferences: PWAConfig.notifications.preferences[role] || PWAConfig.notifications.preferences.estudiante
            },
            features: PWAConfig.roles[role]?.features || [],
            defaultView: PWAConfig.roles[role]?.defaultView || 'inicio'
        };
    },

    // Verificar si una característica está habilitada
    isFeatureEnabled: (feature, role = 'estudiante') => {
        return PWAConfig.roles[role]?.features?.includes(feature) || false;
    },

    // Obtener URL completa
    getFullUrl: (path) => {
        return new URL(path, PWAConfig.app.url).href;
    },

    // Verificar compatibilidad PWA
    isPWASupported: () => {
        return PWAConfig.device.hasServiceWorker && 
               PWAConfig.device.hasNotifications && 
               PWAConfig.device.hasPushManager;
    }
};

// Evento de configuración lista
document.dispatchEvent(new CustomEvent('pwaConfigReady', { 
    detail: PWAConfig 
}));

console.log('📱 PWA Config cargada:', PWAConfig.debug.enabled ? PWAConfig : 'Configuración lista');

// Exportar para uso global
window.PWAConfig = PWAConfig;