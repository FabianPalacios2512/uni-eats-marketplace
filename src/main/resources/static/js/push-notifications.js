/**
 * 🔔 PUSH NOTIFICATIONS MANAGER
 * Maneja notificaciones push y permisos
 */
class PushNotificationManager {
    constructor() {
        this.registration = null;
        this.subscription = null;
        this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
        this.permission = Notification.permission;
        this.publicKey = null; // Se debe configurar con la clave del servidor
        this.init();
    }

    async init() {
        if (!this.isSupported) {
            console.warn('🔔 Push notifications no soportadas en este navegador');
            return;
        }

        try {
            this.registration = await navigator.serviceWorker.ready;
            await this.loadExistingSubscription();
            this.setupMessageHandler();
        } catch (error) {
            console.error('❌ Error inicializando push notifications:', error);
        }
    }

    async loadExistingSubscription() {
        try {
            this.subscription = await this.registration.pushManager.getSubscription();
            if (this.subscription) {
                console.log('🔔 Suscripción push existente encontrada');
                this.sendSubscriptionToServer(this.subscription);
            }
        } catch (error) {
            console.error('Error cargando suscripción existente:', error);
        }
    }

    setupMessageHandler() {
        // Escuchar mensajes del service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
                this.handleNotificationClick(event.data.notification);
            }
        });
    }

    async requestPermission() {
        if (!this.isSupported) {
            throw new Error('Notificaciones push no soportadas');
        }

        if (this.permission === 'granted') {
            return true;
        }

        if (this.permission === 'denied') {
            throw new Error('Permisos de notificación denegados');
        }

        // Solicitar permiso
        const permission = await Notification.requestPermission();
        this.permission = permission;

        if (permission === 'granted') {
            console.log('✅ Permisos de notificación concedidos');
            return true;
        } else {
            console.log('❌ Permisos de notificación denegados');
            throw new Error('Usuario denegó permisos de notificación');
        }
    }

    async subscribe(userPreferences = {}) {
        try {
            // Verificar permisos
            const hasPermission = await this.requestPermission();
            if (!hasPermission) return null;

            // Verificar si ya existe suscripción
            if (this.subscription) {
                console.log('Ya existe una suscripción activa');
                return this.subscription;
            }

            // Crear nueva suscripción
            const options = {
                userVisibleOnly: true,
                applicationServerKey: this.getApplicationServerKey()
            };

            this.subscription = await this.registration.pushManager.subscribe(options);
            
            console.log('🔔 Nueva suscripción push creada');
            
            // Enviar al servidor
            await this.sendSubscriptionToServer(this.subscription, userPreferences);
            
            return this.subscription;

        } catch (error) {
            console.error('❌ Error creando suscripción push:', error);
            throw error;
        }
    }

    async unsubscribe() {
        try {
            if (!this.subscription) {
                console.log('No hay suscripción activa para cancelar');
                return true;
            }

            // Cancelar suscripción
            const success = await this.subscription.unsubscribe();
            
            if (success) {
                console.log('🔔 Suscripción push cancelada');
                
                // Notificar al servidor
                await this.removeSubscriptionFromServer(this.subscription);
                
                this.subscription = null;
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ Error cancelando suscripción:', error);
            throw error;
        }
    }

    getApplicationServerKey() {
        // Clave pública VAPID del servidor (debe configurarse)
        const vapidPublicKey = this.publicKey || 'YOUR_VAPID_PUBLIC_KEY_HERE';
        
        // Convertir de base64 a Uint8Array
        return this.urlBase64ToUint8Array(vapidPublicKey);
    }

    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async sendSubscriptionToServer(subscription, preferences = {}) {
        try {
            const response = await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    preferences,
                    userAgent: navigator.userAgent,
                    timestamp: Date.now()
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            console.log('✅ Suscripción enviada al servidor');
        } catch (error) {
            console.error('❌ Error enviando suscripción al servidor:', error);
        }
    }

    async removeSubscriptionFromServer(subscription) {
        try {
            await fetch('/api/push/unsubscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON()
                })
            });

            console.log('✅ Suscripción removida del servidor');
        } catch (error) {
            console.error('❌ Error removiendo suscripción del servidor:', error);
        }
    }

    // Crear notificación local
    async showNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            console.warn('No hay permisos para mostrar notificaciones');
            return;
        }

        const defaultOptions = {
            icon: '/img/icons/icon-192x192.png',
            badge: '/img/icons/badge-72x72.png',
            image: options.image,
            body: options.body || '',
            tag: options.tag || 'uni-eats-notification',
            renotify: true,
            requireInteraction: false,
            actions: options.actions || [],
            data: options.data || {},
            timestamp: Date.now()
        };

        try {
            if (this.registration) {
                // Usar service worker para persistencia
                await this.registration.showNotification(title, defaultOptions);
            } else {
                // Fallback a notificación directa
                new Notification(title, defaultOptions);
            }
        } catch (error) {
            console.error('Error mostrando notificación:', error);
        }
    }

    // Plantillas de notificaciones predefinidas
    async notifyNewOrder(order) {
        await this.showNotification('📦 Nuevo Pedido', {
            body: `Pedido #${order.id} de ${order.cliente}`,
            tag: `order-${order.id}`,
            actions: [
                {
                    action: 'view-order',
                    title: '👀 Ver Pedido',
                    icon: '/img/icons/view.png'
                },
                {
                    action: 'accept-order',
                    title: '✅ Aceptar',
                    icon: '/img/icons/check.png'
                }
            ],
            data: { orderId: order.id, type: 'new-order' }
        });
    }

    async notifyOrderReady(order) {
        await this.showNotification('🍽️ Pedido Listo', {
            body: `Tu pedido #${order.id} está listo para recoger`,
            tag: `ready-${order.id}`,
            actions: [
                {
                    action: 'order-details',
                    title: '📋 Ver Detalles',
                    icon: '/img/icons/details.png'
                }
            ],
            data: { orderId: order.id, type: 'order-ready' }
        });
    }

    async notifyOrderStatusUpdate(order, status) {
        const statusMessages = {
            'confirmado': '✅ Pedido confirmado',
            'preparando': '👨‍🍳 Preparando tu pedido',
            'listo': '🍽️ Pedido listo para recoger',
            'entregado': '📦 Pedido entregado',
            'cancelado': '❌ Pedido cancelado'
        };

        await this.showNotification('Actualización de Pedido', {
            body: `${statusMessages[status]} - Pedido #${order.id}`,
            tag: `status-${order.id}`,
            data: { orderId: order.id, type: 'status-update', status }
        });
    }

    async notifyPromotion(promotion) {
        await this.showNotification('🎉 Nueva Promoción', {
            body: promotion.description,
            image: promotion.image,
            tag: `promo-${promotion.id}`,
            actions: [
                {
                    action: 'view-promotion',
                    title: '🛒 Ver Oferta',
                    icon: '/img/icons/shop.png'
                }
            ],
            data: { promotionId: promotion.id, type: 'promotion' }
        });
    }

    handleNotificationClick(notification) {
        const data = notification.data;
        
        switch (data.type) {
            case 'new-order':
                this.navigateToOrder(data.orderId);
                break;
            case 'order-ready':
            case 'status-update':
                this.navigateToOrderTracking(data.orderId);
                break;
            case 'promotion':
                this.navigateToPromotion(data.promotionId);
                break;
            default:
                window.focus();
        }
    }

    navigateToOrder(orderId) {
        const url = `/vendedor-dashboard?section=pedidos&order=${orderId}`;
        if (window.location.pathname !== '/vendedor-dashboard') {
            window.location.href = url;
        } else {
            window.focus();
            // Trigger evento personalizado para cambiar sección
            window.dispatchEvent(new CustomEvent('navigateToOrder', { 
                detail: { orderId } 
            }));
        }
    }

    navigateToOrderTracking(orderId) {
        const url = `/estudiante-dashboard?section=pedidos&track=${orderId}`;
        if (window.location.pathname !== '/estudiante-dashboard') {
            window.location.href = url;
        } else {
            window.focus();
            window.dispatchEvent(new CustomEvent('trackOrder', { 
                detail: { orderId } 
            }));
        }
    }

    navigateToPromotion(promotionId) {
        const url = `/estudiante-dashboard?promo=${promotionId}`;
        window.location.href = url;
    }

    // Configuración de preferencias de usuario
    async updatePreferences(preferences) {
        if (!this.subscription) {
            console.warn('No hay suscripción activa');
            return;
        }

        try {
            await fetch('/api/push/preferences', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscription: this.subscription.toJSON(),
                    preferences
                })
            });

            console.log('✅ Preferencias de notificación actualizadas');
        } catch (error) {
            console.error('❌ Error actualizando preferencias:', error);
        }
    }

    // Información del estado actual
    getStatus() {
        return {
            isSupported: this.isSupported,
            permission: this.permission,
            isSubscribed: !!this.subscription,
            subscription: this.subscription?.toJSON()
        };
    }

    // Test de notificación
    async testNotification() {
        await this.showNotification('🧪 Notificación de Prueba', {
            body: 'Si ves esto, las notificaciones están funcionando correctamente',
            tag: 'test-notification',
            actions: [
                {
                    action: 'ok',
                    title: '👍 Perfecto',
                    icon: '/img/icons/check.png'
                }
            ]
        });
    }

    // Configurar clave pública VAPID
    setVapidPublicKey(key) {
        this.publicKey = key;
    }
}

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.PushManager = new PushNotificationManager();
    });
} else {
    window.PushManager = new PushNotificationManager();
}

// Exportar para uso global
window.PushNotificationManager = PushNotificationManager;