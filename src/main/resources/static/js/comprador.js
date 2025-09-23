/**
 * @file Script principal para la App de Compradores de Uni-Eats.
 * @description Gestiona las vistas, el estado y la         case 'inicio': return `<div class="relative w-full px-4 py-4">
        <div class="relative">
            <input type="search" placeholder="Buscar comida deliciosa..." class="w-full bg-white/80 backdrop-blur-md placeholder-gray-400 text-gray-800 border-2 border-transparent rounded-2xl py-4 pl-12 pr-16 text-sm focus:outline-none focus:bg-white focus:border-orange-300 focus:ring-4 focus:ring-orange-100 transition-all duration-300 shadow-xl shadow-orange-100/50">
            <div class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
                <i class="fas fa-search text-white text-xs"></i>
            </div>
            <button class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <i class="fas fa-sliders-h text-white text-xs"></i>
            </button>
        </div>
    </div>`;ca de la PWA del comprador.
 * @version Pro Final 2.0 (Flujo de Compra Detallado)
 */
document.addEventListener("DOMContentLoaded", () => {
    
    // --- Módulos Principales de la Aplicación ---
    const Header = document.getElementById('app-header');
    const Container = document.getElementById('app-container');
    const Nav = document.getElementById('app-nav');

    // Estado global de la aplicación
    const State = {
        vistaActual: localStorage.getItem('uni-eats-vista') || null,
        tiendaActual: null,
        productoSeleccionado: null,
        carrito: [],
        csrfToken: document.querySelector("meta[name='_csrf']")?.getAttribute("content"),
        csrfHeader: document.querySelector("meta[name='_csrf_header']")?.getAttribute("content"),
        // Nuevo sistema de caché y notificaciones
        pedidosCache: {
            data: null,
            lastUpdate: null,
            hash: null
        },
        polling: {
            interval: null,
            isActive: false,
            frequency: 3000 // 3 segundos inicial
        },
        notifications: {
            audio: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+L2wHEiBC6B2f3rgIoNOjl6'),
            permission: 'default', // 'default', 'granted', 'denied'
            isSupported: 'Notification' in window,
            serviceWorkerReady: false
        }
    };

    // Módulo para todas las interacciones con el backend
    const Api = {
        _fetch: async (url, options = {}) => {
            const headers = { 'Content-Type': 'application/json', ...options.headers };
            if (options.method === 'POST') {
                headers[State.csrfHeader] = State.csrfToken;
            }
            const response = await fetch(url, { ...options, headers });
            if (!response.ok) {
                const errorMsg = await response.text();
                throw new Error(errorMsg || 'Error de red o del servidor.');
            }
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            }
            return response.text(); 
        },
        getTiendas: () => Api._fetch('/api/marketplace/tiendas'),
        getProductos: () => Api._fetch('/api/marketplace/productos'),
        getProductoDetalle: (id) => Api._fetch(`/api/marketplace/productos/${id}`),
        getMisPedidos: () => Api._fetch('/api/pedidos/mis-pedidos'),
        crearPedido: (dto) => Api._fetch('/api/pedidos/crear', { method: 'POST', body: JSON.stringify(dto) }),
    };

    // 🔔 Sistema de Notificaciones y Caché Inteligente
    const SmartCache = {
        // Genera hash para detectar cambios en los datos
        generateHash(data) {
            return btoa(JSON.stringify(data)).slice(0, 16);
        },

        // Verifica si los datos han cambiado
        hasDataChanged(newData) {
            const newHash = this.generateHash(newData);
            return State.pedidosCache.hash !== newHash;
        },

        // Guarda datos en caché con timestamp
        saveToCache(data) {
            const hash = this.generateHash(data);
            State.pedidosCache = {
                data: data,
                lastUpdate: Date.now(),
                hash: hash
            };
        },

        // 🔄 Persistir estado en localStorage para detectar cambios entre recargas
        saveToLocalStorage(pedidos) {
            const pedidosState = {};
            pedidos.forEach(pedido => {
                pedidosState[pedido.id] = {
                    estado: pedido.estado,
                    nombreTienda: pedido.nombreTienda,
                    total: pedido.total,
                    lastSeen: Date.now()
                };
            });
            
            localStorage.setItem('uni-eats-pedidos-state', JSON.stringify(pedidosState));
        },

        // 🔄 Comparar con estado anterior y notificar cambios
        async checkForChangesOnRefresh(currentPedidos) {
            try {
                const previousStateJson = localStorage.getItem('uni-eats-pedidos-state');
                if (!previousStateJson) {
                    this.saveToLocalStorage(currentPedidos);
                    return;
                }

                const previousState = JSON.parse(previousStateJson);

                // Detectar cambios de estado
                const changes = [];
                currentPedidos.forEach(pedido => {
                    const prevPedido = previousState[pedido.id];
                    if (prevPedido && prevPedido.estado !== pedido.estado) {
                        changes.push({
                            id: pedido.id,
                            previousState: prevPedido.estado,
                            newState: pedido.estado,
                            nombreTienda: pedido.nombreTienda
                        });
                    }
                });

                // Enviar notificaciones por cada cambio detectado
                if (changes.length > 0) {
                    console.log('🔔 Cambios de estado detectados:', changes.length);
                    
                    for (const change of changes) {
                        await this.showRefreshNotification(change);
                        // Pequeña pausa entre notificaciones
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                // Guardar nuevo estado
                this.saveToLocalStorage(currentPedidos);

            } catch (error) {
                console.error('❌ Error al verificar cambios:', error);
                // En caso de error, guardar estado actual
                this.saveToLocalStorage(currentPedidos);
            }
        },

        // 🔔 Mostrar notificación específica para cambios detectados en refresh
        async showRefreshNotification(change) {
            const stateMessages = {
                'PENDIENTE': '⏳ Tu pedido está esperando aprobación',
                'EN_PREPARACION': '👨‍🍳 ¡Tu pedido se está preparando!',
                'LISTO_PARA_RECOGER': '🎉 ¡Tu pedido está listo para recoger!',
                'COMPLETADO': '🎊 ¡Pedido entregado exitosamente!',
                'CANCELADO': '❌ Tu pedido fue cancelado'
            };

            const message = stateMessages[change.newState] || 'Estado actualizado';
            
            // 🔔 Enviar notificación web nativa del sistema
            await WebNotifications.sendNativeNotification(
                `${message}`,
                {
                    body: `Pedido #${change.id} de ${change.nombreTienda}`,
                    data: { pedidoId: change.id, estado: change.newState }
                }
            );

            // Mostrar toast interno también
            const toastMessage = `${message} - Pedido #${change.id}`;
            if (change.newState === 'COMPLETADO') {
                this.showCompletionCelebration({
                    id: change.id,
                    nombreTienda: change.nombreTienda,
                    estado: change.newState
                }, toastMessage);
            } else {
                this.showToast(toastMessage);
            }
            
            // Sonido y vibración
            State.notifications.audio.play().catch(() => {});
            if (navigator.vibrate) {
                const vibrationPattern = change.newState === 'COMPLETADO' ? [200, 100, 200, 100, 200] : [200, 100, 200];
                navigator.vibrate(vibrationPattern);
            }
        },

        // Verifica si el caché es válido (optimizado para nube)
        isCacheValid() {
            if (!State.pedidosCache.data) return false;
            
            const isCloud = !location.host.includes('localhost') && !location.host.includes('127.0.0.1');
            
            // En la nube, usar caché más corto para detección rápida
            const cacheTimeout = isCloud ? 5000 : 15000; // 5s en nube, 15s local
            
            const isValid = (Date.now() - State.pedidosCache.lastUpdate) < cacheTimeout;
            
            // Solo log si estamos en modo debug
            if (!isValid && State.debugMode) {
                console.log(`🔄 Caché expirado (${cacheTimeout}ms) - solicitando datos frescos`);
            }
            
            return isValid;
        },

        // Obtiene pedidos con caché inteligente
        async getMisPedidosOptimized() {
            try {
                // SIEMPRE hacer petición en la primera carga de la vista para detectar cambios
                const isFirstLoad = !State.pedidosCache.data;
                const shouldForceRefresh = isFirstLoad || !this.isCacheValid();
                
                if (!shouldForceRefresh) {
                    return State.pedidosCache.data;
                }

                // Solicitar nuevos datos
                const newData = await Api.getMisPedidos();
                
                // Filtrar pedidos activos solamente
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                
                const activeOrders = newData.filter(pedido => {
                    if (['COMPLETADO', 'CANCELADO'].includes(pedido.estado)) {
                        return false;
                    }
                    
                    const orderDate = new Date(pedido.fechaCreacion);
                    return orderDate >= thirtyDaysAgo || 
                           ['PENDIENTE', 'EN_PREPARACION', 'LISTO_PARA_RECOGER'].includes(pedido.estado);
                });

                // Verificar cambios contra localStorage (funciona con refresh)
                await this.checkForChangesOnRefresh(activeOrders);

                // Verificar cambios en memoria también (para polling si está activo)
                if (State.pedidosCache.data && this.hasDataChanged(activeOrders)) {
                    this.notifyStatusChanges(State.pedidosCache.data, activeOrders);
                }

                // Guardar en caché
                this.saveToCache(activeOrders);
                
                return activeOrders;

            } catch (error) {
                console.error('Error al cargar pedidos:', error);
                
                // Devolver caché si hay error y tenemos datos
                const fallbackData = State.pedidosCache.data || [];
                return fallbackData;
            }
        },

        // Detecta cambios de estado y notifica INMEDIATAMENTE
        notifyStatusChanges(oldData, newData) {
            const oldMap = new Map(oldData.map(p => [p.id, p.estado]));
            
            newData.forEach(pedido => {
                const oldStatus = oldMap.get(pedido.id);
                if (oldStatus && oldStatus !== pedido.estado) {
                    console.log(`🔔 CAMBIO DETECTADO: Pedido #${pedido.id} cambió de ${oldStatus} → ${pedido.estado}`);
                    
                    // 🎯 Notificación INMEDIATA al usuario
                    this.showStatusNotification(pedido);
                    
                    // 🔄 Si estamos en la vista de pedidos, refrescar inmediatamente
                    if (State.vistaActual === 'misPedidos') {
                        setTimeout(() => {
                            Views.refreshPedidosView();
                        }, 1000); // Pequeño delay para que se vea la notificación
                    }
                }
            });
        },

        // Muestra notificación de cambio de estado
        async showStatusNotification(pedido) {
            const statusMessages = {
                'PENDIENTE': '⏳ Tu pedido está en espera de aprobación',
                'EN_PREPARACION': '👨‍🍳 ¡Tu pedido se está preparando!',
                'LISTO_PARA_RECOGER': '🎉 ¡Tu pedido está listo para recoger!',
                'COMPLETADO': '🎊 ¡Pedido entregado exitosamente! Gracias por tu compra',
                'CANCELADO': '❌ Tu pedido fue cancelado'
            };

            const message = statusMessages[pedido.estado] || 'Estado actualizado';
            
            // 🔔 Enviar notificación web nativa del sistema
            await WebNotifications.notifyStatusChange(pedido);
            
            // Notificación especial para pedidos completados
            if (pedido.estado === 'COMPLETADO') {
                this.showCompletionCelebration(pedido, message);
            } else {
                this.showToast(`${message} - Pedido #${pedido.id}`);
            }
            
            // Sonido de notificación
            State.notifications.audio.play().catch(() => {});
            
            // Vibración en móviles
            if (navigator.vibrate) {
                const vibrationPattern = pedido.estado === 'COMPLETADO' ? [200, 100, 200, 100, 200] : [200, 100, 200];
                navigator.vibrate(vibrationPattern);
            }
        },

        // Celebración especial para pedidos completados
        showCompletionCelebration(pedido, message) {
            // Notificación más grande y celebratoria
            const existingToast = document.getElementById('completion-celebration');
            if (existingToast) existingToast.remove();

            const celebration = document.createElement('div');
            celebration.id = 'completion-celebration';
            celebration.className = 'fixed top-16 left-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-3xl shadow-2xl z-50 transform translate-y-[-150px] transition-all duration-500';
            celebration.innerHTML = `
                <div class="text-center">
                    <div class="text-4xl mb-3 animate-bounce">🎊✨🎉</div>
                    <h3 class="text-lg font-bold mb-2">${message}</h3>
                    <p class="text-green-100 text-sm mb-3">Pedido #${pedido.id} de ${pedido.nombreTienda}</p>
                    <div class="flex justify-center gap-2">
                        <div class="w-2 h-2 bg-white rounded-full animate-ping"></div>
                        <div class="w-2 h-2 bg-white rounded-full animate-ping" style="animation-delay: 0.2s"></div>
                        <div class="w-2 h-2 bg-white rounded-full animate-ping" style="animation-delay: 0.4s"></div>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" class="mt-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-2xl text-sm font-medium transition-colors">
                        ¡Genial! 👍
                    </button>
                </div>
            `;
            
            document.body.appendChild(celebration);
            
            // Animar entrada
            setTimeout(() => {
                celebration.style.transform = 'translate-y-0';
            }, 100);
            
            // Auto-remover después de 8 segundos (más tiempo para celebración)
            setTimeout(() => {
                celebration.style.transform = 'translate-y-[-150px]';
                setTimeout(() => celebration.remove(), 500);
            }, 8000);
        },

        // Muestra toast notification
        showToast(message) {
            // Remover toast anterior si existe
            const existingToast = document.getElementById('status-toast');
            if (existingToast) existingToast.remove();

            const toast = document.createElement('div');
            toast.id = 'status-toast';
            toast.className = 'fixed top-20 left-4 right-4 bg-indigo-600 text-white p-4 rounded-2xl shadow-2xl z-50 transform translate-y-[-100px] transition-all duration-300';
            toast.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <i class="fas fa-bell text-sm"></i>
                    </div>
                    <p class="flex-1 font-medium">${message}</p>
                    <button onclick="this.parentElement.parentElement.remove()" class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                </div>
            `;
            
            document.body.appendChild(toast);
            
            // Animar entrada
            setTimeout(() => {
                toast.style.transform = 'translate-y-0';
            }, 100);
            
            // Auto-remover después de 4 segundos
            setTimeout(() => {
                toast.style.transform = 'translate-y-[-100px]';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }
    };

    // 🔄 Sistema de Polling Inteligente
    const SmartPolling = {
        start() {
            if (State.polling.isActive) return;
            
            console.log('🔄 Iniciando polling automático para notificaciones en tiempo real...');
            State.polling.isActive = true;
            
            State.polling.interval = setInterval(async () => {
                try {
                    // 🎯 SIEMPRE ejecutar polling para detectar cambios (incluso en background)
                    const nuevosPedidos = await SmartCache.getMisPedidosOptimized();
                    
                    // Si estamos en la vista de pedidos, actualizar automáticamente la vista
                    if (State.vistaActual === 'misPedidos') {
                        Views.refreshPedidosView();
                    }
                    
                    // Ajustar frecuencia según pedidos activos
                    const hasActivePedidos = nuevosPedidos.some(p => 
                        ['PENDIENTE', 'EN_PREPARACION', 'LISTO_PARA_RECOGER'].includes(p.estado)
                    );
                    SmartPolling.adjustFrequency(hasActivePedidos);
                    
                } catch (error) {
                    console.error('❌ Error en polling:', error);
                    // En caso de error, continuar pero reducir frecuencia
                    SmartPolling.adjustFrequency(false);
                }
            }, State.polling.frequency);
        },

        stop() {
            if (State.polling.interval) {
                clearInterval(State.polling.interval);
                State.polling.interval = null;
                State.polling.isActive = false;
            }
        },

        // Ajusta frecuencia según la actividad y la vista actual
        adjustFrequency(hasActivePedidos) {
            // Para nube (Render), usar frecuencias optimizadas para detección rápida
            const isCloud = !location.host.includes('localhost') && !location.host.includes('127.0.0.1');
            const isInPedidosView = State.vistaActual === 'misPedidos';
            
            let newFrequency;
            
            if (isCloud) {
                // 🌐 EN LA NUBE: Frecuencias optimizadas para detección inmediata
                if (isInPedidosView && hasActivePedidos) {
                    newFrequency = 3000; // 3 segundos - muy activo
                } else if (hasActivePedidos) {
                    newFrequency = 5000; // 5 segundos - background con pedidos activos
                } else {
                    newFrequency = 15000; // 15 segundos - sin pedidos activos
                }
            } else {
                // 🏠 LOCAL: Frecuencias conservadoras
                if (isInPedidosView && hasActivePedidos) {
                    newFrequency = 5000; // 5 segundos
                } else if (hasActivePedidos) {
                    newFrequency = 10000; // 10 segundos
                } else {
                    newFrequency = 20000; // 20 segundos
                }
            }
            
            console.log(`📊 Ajustando frecuencia de polling:`, {
                'Es nube': isCloud,
                'Vista actual': State.vistaActual,
                'En vista pedidos': isInPedidosView,
                'Pedidos activos': hasActivePedidos,
                'Nueva frecuencia': `${newFrequency}ms`
            });
            
            if (newFrequency !== State.polling.frequency) {
                State.polling.frequency = newFrequency;
                if (State.polling.isActive) {
                    this.stop();
                    this.start();
                }
            }
        }
    };

    // 🔔 Sistema de Notificaciones Web Push
    const WebNotifications = {
        async init() {
            console.log('🔧 Iniciando WebNotifications...');
            
            // Verificar soporte de notificaciones
            if (!State.notifications.isSupported) {
                console.log('❌ Las notificaciones no están soportadas en este navegador');
                return false;
            }

            console.log('✅ Notificaciones soportadas');

            // Verificar estado de permisos
            State.notifications.permission = Notification.permission;
            console.log('🔐 Estado de permisos:', State.notifications.permission);
            
            // Inicializar service worker si está disponible
            if ('serviceWorker' in navigator) {
                try {
                    console.log('🔄 Verificando Service Worker...');
                    const registration = await navigator.serviceWorker.ready;
                    State.notifications.serviceWorkerReady = true;
                    console.log('✅ Service Worker listo para notificaciones');
                } catch (error) {
                    console.log('❌ Service Worker no disponible:', error);
                }
            } else {
                console.log('❌ Service Worker no soportado');
            }

            return true;
        },

        async requestPermission() {
            console.log('🔔 requestPermission llamado');
            console.log('isSupported:', State.notifications.isSupported);
            console.log('current permission:', State.notifications.permission);
            console.log('🔍 User Agent:', navigator.userAgent);
            console.log('🔍 Is HTTPS:', location.protocol === 'https:');
            console.log('🔍 Host:', location.host);
            console.log('🔍 Notification API exists:', 'Notification' in window);
            
            if (!State.notifications.isSupported) {
                console.log('❌ Notificaciones no soportadas');
                return false;
            }

            if (State.notifications.permission === 'granted') {
                console.log('✅ Ya tenemos permisos');
                this.showPermissionGrantedMessage();
                return true;
            }

            if (State.notifications.permission === 'denied') {
                console.log('❌ Permisos denegados previamente');
                this.showPermissionDeniedMessage();
                return false;
            }

            // Mostrar explicación antes de solicitar permiso
            console.log('📝 Mostrando modal de solicitud...');
            const userWantsNotifications = await this.showPermissionRequest();
            console.log('Usuario quiere notificaciones:', userWantsNotifications);
            
            if (!userWantsNotifications) {
                console.log('❌ Usuario rechazó en el modal');
                return false;
            }

            try {
                console.log('🎯 Solicitando permisos del navegador...');
                const permission = await Notification.requestPermission();
                console.log('Resultado del navegador:', permission);
                State.notifications.permission = permission;
                
                if (permission === 'granted') {
                    this.showPermissionGrantedMessage();
                    return true;
                } else {
                    this.showPermissionDeniedMessage();
                    return false;
                }
            } catch (error) {
                console.error('Error al solicitar permisos:', error);
                return false;
            }
        },

        showPermissionRequest() {
            console.log('🎨 Creando modal de permisos...');
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4';
                modal.innerHTML = `
                    <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl transform scale-95 transition-transform duration-300">
                        <div class="text-center">
                            <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-bell text-2xl text-indigo-600"></i>
                            </div>
                            <h3 class="text-xl font-bold text-slate-800 mb-3">¡Mantente al día!</h3>
                            <p class="text-slate-600 mb-6 text-sm leading-relaxed">
                                Recibe notificaciones instantáneas sobre el estado de tus pedidos, 
                                incluso cuando la app esté cerrada. ¡No te pierdas cuando tu comida esté lista! 🍕
                            </p>
                            <div class="flex gap-3">
                                <button id="deny-notif" class="flex-1 bg-slate-100 text-slate-700 py-3 px-4 rounded-2xl font-medium hover:bg-slate-200 transition-colors">
                                    Ahora no
                                </button>
                                <button id="allow-notif" class="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-2xl font-medium hover:bg-indigo-700 transition-colors">
                                    ¡Activar! 🔔
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                console.log('📱 Agregando modal al DOM...');
                document.body.appendChild(modal);
                
                // Animar entrada
                setTimeout(() => {
                    console.log('🎬 Animando modal...');
                    modal.querySelector('div').style.transform = 'scale-1';
                }, 100);

                modal.querySelector('#allow-notif').onclick = () => {
                    console.log('✅ Usuario clickeó ACTIVAR');
                    modal.remove();
                    resolve(true);
                };

                modal.querySelector('#deny-notif').onclick = () => {
                    console.log('❌ Usuario clickeó AHORA NO');
                    modal.remove();
                    resolve(false);
                };
            });
        },

        showPermissionGrantedMessage() {
            SmartCache.showToast('🎉 ¡Notificaciones activadas! Te avisaremos sobre tus pedidos');
        },

        showPermissionDeniedMessage() {
            SmartCache.showToast('ℹ️ Puedes activar las notificaciones desde la configuración del navegador');
        },

        // Enviar notificación nativa del sistema
        async sendNativeNotification(title, options = {}) {
            console.log('📱 sendNativeNotification llamado:', title);
            console.log('📱 Permission actual:', State.notifications.permission);
            
            if (State.notifications.permission !== 'granted') {
                console.warn('❌ Permisos no otorgados:', State.notifications.permission);
                return;
            }

            const defaultOptions = {
                icon: '/img/logo.png', // Usar ruta que existe
                badge: '/img/logo.png', // Usar ruta que existe
                tag: 'pedido-update',
                renotify: true,
                requireInteraction: false,
                vibrate: [200, 100, 200],
                silent: false
            };

            const finalOptions = { ...defaultOptions, ...options };
            
            // Detectar si es móvil
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            console.log('📱 Es móvil:', isMobile);

            try {
                // Usar service worker si está disponible para notificaciones persistentes
                if (State.notifications.serviceWorkerReady && 'serviceWorker' in navigator) {
                    console.log('📱 Usando Service Worker...');
                    const registration = await navigator.serviceWorker.ready;
                    await registration.showNotification(title, {
                        ...finalOptions,
                        actions: isMobile ? [] : [ // No acciones en móvil
                            {
                                action: 'view',
                                title: 'Ver pedido'
                            }
                        ]
                    });
                    console.log('✅ Notificación enviada via Service Worker');
                } else {
                    console.log('📱 Usando notificación directa...');
                    // Fallback a notificación simple (sin acciones para compatibilidad)
                    const notificationOptions = { ...finalOptions };
                    delete notificationOptions.actions; // Remover acciones para notificaciones directas
                    
                    const notification = new Notification(title, notificationOptions);
                    
                    // Manejar clicks
                    notification.onclick = () => {
                        console.log('🖱️ Notificación clickeada');
                        window.focus();
                        notification.close();
                    };
                    
                    // Auto-cerrar después de 8 segundos en móvil, 5 en desktop
                    setTimeout(() => {
                        notification.close();
                    }, isMobile ? 8000 : 5000);
                    
                    console.log('✅ Notificación enviada directamente');
                }
            } catch (error) {
                console.error('❌ Error al enviar notificación:', error);
                console.error('❌ Error stack:', error.stack);
            }
        },

        // Manejar notificación de cambio de estado de pedido
        async notifyStatusChange(pedido) {
            const statusMessages = {
                'PENDIENTE': {
                    title: '⏳ Pedido en espera',
                    body: `Tu pedido #${pedido.id} está esperando aprobación del vendedor`,
                },
                'EN_PREPARACION': {
                    title: '👨‍🍳 ¡Se está preparando!',
                    body: `Tu pedido #${pedido.id} de ${pedido.nombreTienda} está siendo preparado`,
                },
                'LISTO_PARA_RECOGER': {
                    title: '🎉 ¡Pedido listo!',
                    body: `Tu pedido #${pedido.id} está listo para recoger en ${pedido.nombreTienda}`,
                },
                'COMPLETADO': {
                    title: '🎊 ¡Entregado con éxito!',
                    body: `Pedido #${pedido.id} entregado. ¡Gracias por tu compra en ${pedido.nombreTienda}!`,
                },
                'CANCELADO': {
                    title: '❌ Pedido cancelado',
                    body: `Tu pedido #${pedido.id} ha sido cancelado`,
                }
            };

            const config = statusMessages[pedido.estado];
            if (!config) return;

            await this.sendNativeNotification(config.title, {
                body: config.body,
                data: { pedidoId: pedido.id, estado: pedido.estado }
            });
        },

        // Verificar si debe mostrar el prompt de permisos
        shouldShowPermissionPrompt() {
            const lastPrompt = localStorage.getItem('last-notification-prompt');
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000; // 24 horas

            return !lastPrompt || (now - parseInt(lastPrompt)) > oneDay;
        },

        markPermissionPromptShown() {
            localStorage.setItem('last-notification-prompt', Date.now().toString());
        }
    };

    // Módulo para renderizar todas las vistas y componentes
    const Views = {
        formatPrice: (price, sign = true) => {
            if (price === 0 && sign) return 'Gratis';
            const prefix = sign && price > 0 ? '+ ' : '';
            return prefix + new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
        },

        // Pantalla de loading moderna
        getLoadingHTML(message = 'Cargando...') {
            return `
                <div class="flex flex-col items-center justify-center p-12 text-center">
                    <div class="relative w-16 h-16 mb-6">
                        <div class="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-spin"></div>
                        <div class="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                            <i class="fas fa-utensils text-indigo-500 text-lg"></i>
                        </div>
                    </div>
                    <h3 class="text-lg font-bold text-slate-700 mb-2">${message}</h3>
                    <p class="text-slate-500 text-sm">Esto no tomará mucho tiempo...</p>
                    <div class="flex gap-1 mt-4">
                        <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                </div>
            `;
        },

        // Refresca solo la vista de pedidos sin recargar toda la página
        async refreshPedidosView() {
            if (State.vistaActual !== 'misPedidos') return;
            
            try {
                const pedidos = await SmartCache.getMisPedidosOptimized();
                const container = document.getElementById('app-container');
                if (container) {
                    container.innerHTML = this.getMisPedidosHTML(pedidos);
                }
            } catch (error) {
                console.error('Error al refrescar pedidos:', error);
            }
        },

        // 🔔 Inicializar notificaciones para la vista de pedidos (más inteligente)
        async initNotificationsForPedidos() {
            console.log('🔔 Inicializando notificaciones...');
            console.log('Hostname:', window.location.hostname);
            console.log('Protocol:', window.location.protocol);
            console.log('Notification support:', 'Notification' in window);
            console.log('Current permission:', Notification.permission);
            
            // Inicializar sistema de notificaciones
            const initialized = await WebNotifications.init();
            console.log('WebNotifications initialized:', initialized);
            
            // 🎯 NUEVO: Solo mostrar prompt si ya no hay un flujo post-pedido activo
            // Y si debería mostrarse según la lógica anterior
            const shouldPrompt = WebNotifications.shouldShowPermissionPrompt() && 
                                State.notifications.permission === 'default' &&
                                !this.hasRecentOrder();
            
            if (shouldPrompt) {
                console.log('📝 Mostrando prompt de permisos (no hay pedido reciente)...');
                
                // Esperar un poco para que la vista se cargue completamente
                setTimeout(async () => {
                    console.log('🎯 Intentando solicitar permisos...');
                    const granted = await WebNotifications.requestPermission();
                    console.log('Permisos otorgados:', granted);
                    if (granted) {
                        console.log('🔔 Notificaciones activadas correctamente');
                    }
                    WebNotifications.markPermissionPromptShown();
                }, 2000);
            } else {
                console.log('❌ No se mostrará prompt:', {
                    shouldShow: WebNotifications.shouldShowPermissionPrompt(),
                    permission: State.notifications.permission,
                    hasRecentOrder: this.hasRecentOrder()
                });
            }
        },

        // Verificar si hay un pedido reciente (últimos 2 minutos)
        hasRecentOrder() {
            const lastOrderTime = localStorage.getItem('last-order-time');
            if (!lastOrderTime) return false;
            
            const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
            return parseInt(lastOrderTime) > twoMinutesAgo;
        },

        async render(view, params = null) {
            State.vistaActual = view;
            
            // Persistir vista actual (excepto para vista de producto específico)
            if (!['producto'].includes(view)) {
                localStorage.setItem('uni-eats-vista', view);
            }
            
            this.updateNav();
            this.renderSkeleton(view);

            try {
                // 🔄 MANTENER POLLING ACTIVO EN BACKGROUND
                // Solo detener si no hay pedidos activos o si no se ha inicializado
                if (view !== 'misPedidos' && State.polling.isActive) {
                    console.log('📊 Manteniendo polling en background para notificaciones');
                    // NO detenemos el polling, solo ajustamos frecuencia para ser más eficiente
                    SmartPolling.adjustFrequency(false); // Menos frecuente cuando no estamos en la vista
                }

                switch (view) {
                    case 'inicio':
                        Header.innerHTML = this.getHeaderHTML('inicio');
                        const tiendas = await Api.getTiendas();
                        const productos = await Api.getProductos();
                        Container.innerHTML =
                            this.getCarouselTiendasHTML(tiendas) +
                            this.getCategoryBarHTML() +
                            this.getSmallProductGridHTML(productos);
                        break;
                    case 'tiendas':
                        Header.innerHTML = this.getHeaderHTML('tiendas');
                        const tiendasList = await Api.getTiendas();
                        Container.innerHTML = this.getListaTiendasHTML(tiendasList);
                        break;
                    case 'perfil':
                        Header.innerHTML = this.getHeaderHTML('perfil');
                        Container.innerHTML = this.getPerfilHTML();
                        break;
                    case 'detalleProducto':
                        const producto = await Api.getProductoDetalle(params.id);
                        State.productoSeleccionado = producto;
                        Header.innerHTML = this.getHeaderHTML('detalleProducto', producto);
                        Container.innerHTML = this.getDetalleProductoHTML(producto);
                        this.updateTotalProducto();
                        break;
                    case 'carrito':
                        Header.innerHTML = this.getHeaderHTML('carrito');
                        Container.innerHTML = this.getCarritoHTML();
                        this.renderFloatingCartButton(true);
                        break;
                    case 'misPedidos':
                        Header.innerHTML = this.getHeaderHTML('misPedidos');
                        
                        // Mostrar loading mientras se cargan los datos
                        Container.innerHTML = this.getLoadingHTML('Cargando tus pedidos...');
                        
                        // Usar caché inteligente en lugar de API directa
                        const pedidos = await SmartCache.getMisPedidosOptimized();
                        Container.innerHTML = this.getMisPedidosHTML(pedidos);
                        
                        // 🔔 Inicializar notificaciones web en primera visita
                        await this.initNotificationsForPedidos();
                        
                        // Iniciar polling inteligente
                        const hasActivePedidos = pedidos.some(p => 
                            ['PENDIENTE', 'EN_PREPARACION', 'LISTO_PARA_RECOGER'].includes(p.estado)
                        );
                        SmartPolling.adjustFrequency(hasActivePedidos);
                        SmartPolling.start();
                        break;
                }
            } catch (error) {
                Container.innerHTML = `<div class="p-4 text-center text-red-500">${error.message}</div>`;
            }
        },

        renderSkeleton(view) {
            let skeletonCard = '';
            let layout = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';
            if (view === 'tiendas' || view === 'misPedidos') {
                skeletonCard = `<div class="w-full h-24 skeleton rounded-lg"></div>`;
                layout = 'space-y-3';
            } else {
                skeletonCard = `<div class="space-y-3"><div class="h-24 skeleton rounded-lg"></div><div class="h-4 w-3/4 skeleton rounded"></div><div class="h-3 w-1/2 skeleton rounded"></div></div>`;
            }
            Container.innerHTML = `<div class="${layout}">${skeletonCard.repeat(6)}</div>`;
        },
        
        getHeaderHTML(view, data = {}) {
            let backViewTarget = 'inicio';
            if (view === 'carrito') {
                backViewTarget = `detalleProducto`;
            } else if (State.tiendaActual && view === 'detalleProducto') {
                backViewTarget = 'tiendas';
            }
            
            switch (view) {
                case 'inicio': return `
                    <div class="relative bg-indigo-600 text-white overflow-hidden">
                        <!-- Elementos decorativos flotantes -->
                        <div class="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full opacity-20 -translate-y-16 translate-x-16"></div>
                        <div class="absolute bottom-0 left-0 w-24 h-24 bg-orange-400 rounded-full opacity-30 translate-y-12 -translate-x-12"></div>
                        <div class="absolute top-1/2 right-1/4 w-16 h-16 bg-purple-400 rounded-full opacity-15"></div>
                        
                        <div class="relative z-10 px-4 pt-3 pb-3">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <div class="relative">
                                        <div class="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                            <i class="fas fa-utensils text-white text-sm"></i>
                                        </div>
                                        <div class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                    </div>
                                    <div>
                                        <h1 class="text-lg font-black tracking-tight bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">Uni-Eats</h1>
                                        <p class="text-indigo-200 text-xs font-medium">🎓 Comida universitaria</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button class="relative w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 group border border-white/20" data-action="navigate" data-view="perfil">
                                        <i class="fas fa-user text-white text-xs group-hover:scale-110 transition-transform"></i>
                                        <div class="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    </button>
                                    ${State.carrito.length > 0 ? `
                                        <button class="relative w-9 h-9 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 group border border-white/20" data-action="navigate" data-view="carrito">
                                            <i class="fas fa-shopping-cart text-white text-xs group-hover:scale-110 transition-transform"></i>
                                            <span class="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-br from-orange-400 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white">${State.carrito.length}</span>
                                            <div class="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <!-- Barra de búsqueda compacta -->
                            <div class="relative">
                                <div class="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30">
                                    <div class="flex items-center px-1">
                                        <div class="flex-1 relative">
                                            <input type="search" placeholder="Buscar comida..." class="w-full bg-transparent placeholder-slate-400 text-slate-800 border-0 rounded-2xl py-2 pl-4 pr-3 text-sm focus:outline-none">
                                            <div class="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-400 rounded-full animate-ping"></div>
                                        </div>
                                        <button class="w-9 h-9 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                                            <i class="fas fa-search text-white text-xs group-hover:rotate-12 transition-transform"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    
                case 'tiendas': return `
                    <div class="relative bg-blue-600 text-white overflow-hidden">
                        <div class="absolute top-0 right-0 w-28 h-28 bg-blue-500 rounded-full opacity-20 -translate-y-14 translate-x-14"></div>
                        <div class="absolute bottom-0 left-0 w-20 h-20 bg-cyan-400 rounded-full opacity-25 translate-y-10 -translate-x-10"></div>
                        
                        <div class="relative z-10 px-4 py-4">
                            <div class="flex items-center gap-4">
                                <div class="relative">
                                    <div class="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                                        <i class="fas fa-store text-white text-xl"></i>
                                    </div>
                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full"></div>
                                </div>
                                <div class="flex-1">
                                    <h1 class="text-2xl font-black bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Tiendas</h1>
                                    <p class="text-blue-200 text-sm">🏪 Descubre sabores únicos</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    
                case 'perfil': return `
                    <div class="relative bg-emerald-600 text-white overflow-hidden">
                        <div class="absolute top-0 right-0 w-28 h-28 bg-emerald-500 rounded-full opacity-20 -translate-y-14 translate-x-14"></div>
                        <div class="absolute bottom-0 left-0 w-20 h-20 bg-teal-400 rounded-full opacity-25 translate-y-10 -translate-x-10"></div>
                        
                        <div class="relative z-10 px-4 py-4">
                            <div class="flex items-center gap-4">
                                <div class="relative">
                                    <div class="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-2 hover:rotate-0 transition-transform duration-300">
                                        <i class="fas fa-user text-white text-xl"></i>
                                    </div>
                                    <div class="absolute -top-1 -right-1 w-4 h-4 bg-teal-400 rounded-full animate-pulse"></div>
                                </div>
                                <div class="flex-1">
                                    <h1 class="text-2xl font-black bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">Mi Perfil</h1>
                                    <p class="text-emerald-200 text-sm">👤 Gestiona tu experiencia</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    
                case 'carrito': return `
                    <div class="relative bg-amber-600 text-white overflow-hidden">
                        <div class="absolute top-0 right-0 w-28 h-28 bg-amber-500 rounded-full opacity-20 -translate-y-14 translate-x-14"></div>
                        <div class="absolute bottom-0 left-0 w-20 h-20 bg-orange-400 rounded-full opacity-25 translate-y-10 -translate-x-10"></div>
                        
                        <div class="relative z-10 px-4 py-4">
                            <div class="flex items-center gap-3">
                                <button class="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 group border border-white/20 nav-back-btn" data-action="navigate" data-view="tiendas" data-id="${State.tiendaActual?.id}">
                                    <i class="fas fa-arrow-left text-white text-sm group-hover:scale-110 transition-transform"></i>
                                </button>
                                <div class="relative">
                                    <div class="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-1 hover:rotate-0 transition-transform duration-300">
                                        <i class="fas fa-shopping-cart text-white text-xl"></i>
                                    </div>
                                    <div class="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                                        <span class="text-white text-xs font-bold">${State.carrito.length}</span>
                                    </div>
                                </div>
                                <div class="flex-1">
                                    <h1 class="text-2xl font-black bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">Tu Pedido</h1>
                                    <p class="text-amber-200 text-sm">🛒 ${State.carrito.length} producto${State.carrito.length !== 1 ? 's' : ''} seleccionado${State.carrito.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    
                case 'misPedidos': return `
                    <div class="relative bg-purple-600 text-white overflow-hidden">
                        <div class="absolute top-0 right-0 w-28 h-28 bg-purple-500 rounded-full opacity-20 -translate-y-14 translate-x-14"></div>
                        <div class="absolute bottom-0 left-0 w-20 h-20 bg-violet-400 rounded-full opacity-25 translate-y-10 -translate-x-10"></div>
                        
                        <div class="relative z-10 px-4 py-4">
                            <div class="flex items-center gap-3">
                                <button class="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 group border border-white/20 nav-back-btn" data-action="navigate" data-view="perfil">
                                    <i class="fas fa-arrow-left text-white text-sm group-hover:scale-110 transition-transform"></i>
                                </button>
                                <div class="relative">
                                    <div class="w-12 h-12 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl transform rotate-1 hover:rotate-0 transition-transform duration-300">
                                        <i class="fas fa-history text-white text-xl"></i>
                                    </div>
                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
                                </div>
                                <div class="flex-1">
                                    <h1 class="text-2xl font-black bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">Mis Pedidos</h1>
                                    <p class="text-purple-200 text-sm">📜 Tu historial de sabores</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    
                case 'detalleProducto': return `
                    <div class="relative bg-rose-600 text-white overflow-hidden">
                        <div class="absolute top-0 right-0 w-28 h-28 bg-rose-500 rounded-full opacity-20 -translate-y-14 translate-x-14"></div>
                        <div class="absolute bottom-0 left-0 w-20 h-20 bg-pink-400 rounded-full opacity-25 translate-y-10 -translate-x-10"></div>
                        
                        <div class="relative z-10 px-4 py-4">
                            <div class="flex items-center gap-3">
                                <button class="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 group border border-white/20 nav-back-btn" data-action="navigate" data-view="${backViewTarget}" data-id="${State.tiendaActual?.id}">
                                    <i class="fas fa-arrow-left text-white text-sm group-hover:scale-110 transition-transform"></i>
                                </button>
                                <div class="relative">
                                    <div class="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-600 rounded-2xl flex items-center justify-center shadow-xl transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                                        <i class="fas fa-hamburger text-white text-xl"></i>
                                    </div>
                                    <div class="absolute -top-1 -left-1 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h1 class="text-xl font-black truncate bg-gradient-to-r from-white to-rose-100 bg-clip-text text-transparent">${data.nombre}</h1>
                                    <p class="text-rose-200 text-sm">🎨 Personaliza tu antojo</p>
                                </div>
                                ${State.carrito.length > 0 ? `
                                    <button class="relative w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all duration-300 group border border-white/20" data-action="navigate" data-view="carrito">
                                        <i class="fas fa-shopping-cart text-white text-sm group-hover:scale-110 transition-transform"></i>
                                        <span class="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg animate-bounce border-2 border-white">${State.carrito.length}</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>`;
                    
                default: return '';
            }
        },

        getFeedProductosHTML(productos) {
            if (!productos || productos.length === 0) return `<div class="text-center p-10"><i class="fas fa-box-open text-5xl text-slate-300"></i><p class="mt-4 text-slate-500">No hay productos disponibles.</p></div>`;
            const categorias = { "Novedades para ti": productos };
            let html = '';
            for (const [nombreCat, prodsCat] of Object.entries(categorias)) {
                html += `<h2 class="text-lg font-bold text-slate-700 mt-4 mb-2">${nombreCat}</h2><div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        ${prodsCat.map(p => `
                            <div class="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition duration-200 hover:scale-105" data-action="navigate" data-view="detalleProducto" data-id="${p.id}">
                            <img src="${p.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk3YTNiNCI+8J+NvUNvbWlkYTwvdGV4dD48L3N2Zz4='" class="w-full h-24 object-cover">
                            <div class="p-3"><h3 class="font-semibold text-sm text-slate-800 truncate">${p.nombre}</h3><p class="text-xs text-slate-500">${p.tienda.nombre}</p><p class="font-bold text-indigo-600 mt-1">${this.formatPrice(p.precio, false)}</p></div>
                        </div>`).join('')}
                </div>`;
            }
            return html;
        },

        getListaTiendasHTML(tiendas) {
            return tiendas.map(tienda => `
                <div class="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm mb-3 cursor-pointer" data-action="navigate" data-view="tiendas" data-id="${tienda.id}">
                    <img src="${tienda.logoUrl}" class="w-16 h-16 rounded-full object-cover">
                    <div class="flex-grow"><h3 class="font-bold text-slate-800">${tienda.nombre}</h3><p class="text-sm text-slate-500 line-clamp-2">${tienda.descripcion}</p></div>
                    <i class="fas fa-chevron-right text-slate-300"></i>
                </div>`).join('');
        },

        getDetalleProductoHTML(producto) {
            let opcionesHtml = producto.categoriasDeOpciones.map(cat => `
                <div class="mt-6 mb-4"><h3 class="font-bold text-lg mb-2">${cat.nombre}</h3><div class="space-y-2">
                    ${cat.opciones.map(op => `
                        <label class="flex items-center bg-white p-3 rounded-lg shadow-sm">
                            <input type="checkbox" class="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500" name="${cat.id}" value="${op.id}" data-precio="${op.precioAdicional}" data-nombre="${op.nombre}">
                            <span class="ml-3 text-slate-700">${op.nombre}</span><span class="ml-auto font-semibold text-slate-500">${this.formatPrice(op.precioAdicional)}</span>
                        </label>`).join('')}
                </div></div>`).join('');

            return `<div class="bg-white rounded-t-2xl shadow-lg -m-4">
                        <img src="${producto.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk3YTNiNCI+8J+NvSR7cHJvZHVjdG8ubm9tYnJlfTwvdGV4dD48L3N2Zz4='" class="w-full h-48 object-cover rounded-t-2xl">
                        <div class="p-4"><h2 class="font-bold text-2xl">${producto.nombre}</h2><p class="text-slate-600 mt-1">${producto.descripcion}</p></div>
                    </div>
                    <div class="p-4">${opcionesHtml}</div>
                    <div class="sticky bottom-0 bg-white/80 backdrop-blur-md p-3 shadow-inner-top -mx-4 -mb-4 rounded-t-2xl">
                        <div class="flex items-center justify-between mb-3">
                             <div class="flex items-center gap-3"><button class="qty-btn" data-action="update-qty" data-op="-1">-</button><span id="item-qty" class="font-bold text-xl w-5 text-center">1</span><button class="qty-btn" data-action="update-qty" data-op="1">+</button></div>
                            <span id="total-producto" class="font-bold text-xl text-indigo-600">${this.formatPrice(producto.precio, false)}</span>
                        </div>
                        <button class="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl" data-action="add-custom-to-cart">Añadir al Pedido</button>
                    </div>`;
        },

        getCarritoHTML() {
            if (State.carrito.length === 0) return `<div class="text-center p-10"><i class="fas fa-shopping-cart text-5xl text-slate-300"></i><p class="mt-4 text-slate-500">Tu carrito está vacío.</p><button class="mt-4 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg" data-action="navigate" data-view="inicio">Volver al inicio</button></div>`;
            
            // El precioFinal ya incluye la cantidad, no multiplicar de nuevo
            const total = State.carrito.reduce((sum, item) => sum + item.precioFinal, 0);
            const itemsHtml = State.carrito.map((item, index) => `
                <div class="flex items-start gap-4 py-4 border-b">
                    <div class="flex-grow">
                        <p class="font-bold">${item.cantidad}x ${item.nombre}</p>
                        ${item.opciones.map(op => `<p class="text-xs text-slate-500">+ ${op.nombre}</p>`).join('')}
                    </div>
                    <p class="font-semibold w-24 text-right">${this.formatPrice(item.precioFinal, false)}</p>
                    <button class="text-red-500 hover:text-red-700" data-action="remove-from-cart" data-index="${index}"><i class="fas fa-trash"></i></button>
                </div>`).join('');

            return `<div class="bg-white rounded-lg shadow-sm p-4">${itemsHtml}
                        <div class="flex justify-between items-center text-xl font-bold mt-4"><span>Total:</span><span>${this.formatPrice(total, false)}</span></div>
                    </div>
                    <p class="text-xs text-slate-500 text-center my-4">Estás pidiendo de: <strong>${State.tiendaActual.nombre}</strong></p>
                    <button class="w-full mt-2 bg-green-500 text-white font-bold py-4 rounded-xl text-lg" data-action="checkout">Confirmar Pedido</button>`;
        },

        getPerfilHTML() {
            return `<div class="bg-white rounded-lg shadow-sm">
                        <a href="#" class="profile-link" data-action="navigate" data-view="misPedidos"><i class="fas fa-receipt profile-icon text-indigo-500"></i><span class="font-semibold">Mis Pedidos</span><i class="fas fa-chevron-right text-slate-300 ml-auto"></i></a>
                        <form action="/logout" method="post"><input type="hidden" name="${State.csrfHeader}" value="${State.csrfToken}"><button type="submit" class="profile-link w-full text-left text-red-500"><i class="fas fa-sign-out-alt profile-icon"></i><span class="font-semibold">Cerrar Sesión</span></button></form>
                    </div>`;
        },

        getMisPedidosHTML(pedidos) {
            if (!pedidos || pedidos.length === 0) {
                return `
                    <div class="text-center p-12">
                        <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-receipt text-3xl text-slate-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-slate-600 mb-2">Sin pedidos aún</h3>
                        <p class="text-slate-500">¡Explora nuestras tiendas y realiza tu primer pedido!</p>
                        <button class="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-2xl font-medium hover:bg-indigo-700 transition-colors" data-action="navigate" data-view="tiendas">
                            Explorar Tiendas
                        </button>
                    </div>
                    </div>
                `;
            }
            
            // Configuración avanzada de estados con animaciones
            const statusConfig = {
                'PENDIENTE': { 
                    text: 'En espera de aprobación', 
                    icon: 'fa-hourglass-start', 
                    color: 'text-amber-500',
                    animation: 'animate-spin',
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-200'
                },
                'EN_PREPARACION': { 
                    text: 'Preparando tu pedido', 
                    icon: 'fa-utensils', 
                    color: 'text-blue-500',
                    animation: 'animate-bounce',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200'
                },
                'LISTO_PARA_RECOGER': { 
                    text: '¡Listo para recoger!', 
                    icon: 'fa-shopping-bag', 
                    color: 'text-green-500',
                    animation: 'animate-pulse',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200'
                },
                'COMPLETADO': { 
                    text: 'Entregado', 
                    icon: 'fa-check-circle', 
                    color: 'text-gray-500',
                    animation: '',
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200'
                },
                'CANCELADO': { 
                    text: 'Cancelado', 
                    icon: 'fa-times-circle', 
                    color: 'text-red-500',
                    animation: '',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200'
                }
            };

            return pedidos.map(pedido => {
                const status = statusConfig[pedido.estado] || statusConfig['PENDIENTE'];
                const fechaFormateada = new Date(pedido.fechaCreacion).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const isActiveOrder = ['PENDIENTE', 'EN_PREPARACION', 'LISTO_PARA_RECOGER'].includes(pedido.estado);
                
                return `
                <div class="bg-white rounded-2xl shadow-lg p-5 mb-4 border-2 ${status.borderColor} hover:shadow-xl transition-all duration-300 ${status.bgColor}">
                    <!-- Header del pedido -->
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <h3 class="font-bold text-lg text-slate-800">${pedido.nombreTienda}</h3>
                                ${isActiveOrder ? '<div class="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>' : ''}
                            </div>
                            <p class="text-sm text-slate-500 flex items-center gap-2">
                                <i class="fas fa-hashtag text-xs"></i>
                                Pedido ${pedido.id} • ${fechaFormateada}
                            </p>
                        </div>
                        <div class="text-right">
                            <p class="font-black text-xl text-slate-800">${this.formatPrice(pedido.total, false)}</p>
                            ${isActiveOrder ? '<p class="text-xs text-green-600 font-medium">En tiempo real 🔴</p>' : ''}
                        </div>
                    </div>

                    <!-- Estado actual con animación -->
                    <div class="mb-4 p-3 rounded-xl ${status.bgColor} border ${status.borderColor}">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <i class="fas ${status.icon} ${status.color} ${status.animation}"></i>
                            </div>
                            <div class="flex-1">
                                <p class="font-bold ${status.color} text-sm">${status.text}</p>
                                <p class="text-xs text-slate-500 mt-0.5">
                                    ${isActiveOrder ? 'Actualizándose automáticamente...' : 'Estado final'}
                                </p>
                            </div>
                            ${isActiveOrder ? `
                                <div class="flex gap-1">
                                    <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                                    <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                                    <div class="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Línea de tiempo del pedido -->
                    <div class="grid grid-cols-4 gap-2 text-center">
                        <div class="flex flex-col items-center space-y-1">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs ${pedido.estado === 'PENDIENTE' ? 'bg-amber-500 text-white animate-spin' : 'bg-amber-100 text-amber-600'}">
                                <i class="fas fa-receipt"></i>
                            </div>
                            <p class="text-xs font-medium ${pedido.estado === 'PENDIENTE' ? 'text-amber-600' : 'text-slate-400'}">Pedido</p>
                        </div>
                        
                        <div class="flex flex-col items-center space-y-1">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs ${pedido.estado === 'EN_PREPARACION' ? 'bg-blue-500 text-white animate-bounce' : ['EN_PREPARACION', 'LISTO_PARA_RECOGER', 'COMPLETADO'].includes(pedido.estado) ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}">
                                <i class="fas fa-utensils"></i>
                            </div>
                            <p class="text-xs font-medium ${pedido.estado === 'EN_PREPARACION' ? 'text-blue-600' : ['EN_PREPARACION', 'LISTO_PARA_RECOGER', 'COMPLETADO'].includes(pedido.estado) ? 'text-blue-600' : 'text-slate-400'}">Preparando</p>
                        </div>
                        
                        <div class="flex flex-col items-center space-y-1">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs ${pedido.estado === 'LISTO_PARA_RECOGER' ? 'bg-green-500 text-white animate-pulse' : ['LISTO_PARA_RECOGER', 'COMPLETADO'].includes(pedido.estado) ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}">
                                <i class="fas fa-shopping-bag"></i>
                            </div>
                            <p class="text-xs font-medium ${pedido.estado === 'LISTO_PARA_RECOGER' ? 'text-green-600' : ['LISTO_PARA_RECOGER', 'COMPLETADO'].includes(pedido.estado) ? 'text-green-600' : 'text-slate-400'}">Listo</p>
                        </div>
                        
                        <div class="flex flex-col items-center space-y-1">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs ${pedido.estado === 'COMPLETADO' ? 'bg-gray-500 text-white' : 'bg-slate-100 text-slate-400'}">
                                <i class="fas fa-check"></i>
                            </div>
                            <p class="text-xs font-medium ${pedido.estado === 'COMPLETADO' ? 'text-gray-600' : 'text-slate-400'}">Entregado</p>
                        </div>
                    </div>

                    <!-- Indicador de cancelación -->
                    ${pedido.estado === 'CANCELADO' ? `
                        <div class="mt-3 p-2 bg-red-50 border border-red-200 rounded-xl">
                            <div class="flex items-center gap-2 text-red-600">
                                <i class="fas fa-times-circle"></i>
                                <span class="text-sm font-medium">Pedido cancelado</span>
                            </div>
                        </div>
                    ` : ''}
                </div>`;
            }).join('');
        },

        updateTotalProducto() {
            const totalElement = document.getElementById('total-producto');
            const qtyElement = document.getElementById('item-qty');
            if (!totalElement || !qtyElement) return;
            let precioOpciones = 0;
            document.querySelectorAll('input[type="checkbox"]:checked').forEach(c => { precioOpciones += parseFloat(c.dataset.precio); });
            const cantidad = parseInt(qtyElement.textContent);
            const total = (State.productoSeleccionado.precio + precioOpciones) * cantidad;
            totalElement.textContent = this.formatPrice(total, false);
        },

        renderFloatingCartButton() {
            let boton = document.getElementById('floating-cart-btn');
            if (State.carrito.length === 0) {
                boton?.remove();
                return;
            }
            const totalItems = State.carrito.reduce((sum, item) => sum + item.cantidad, 0);
            if (boton) {
                boton.querySelector('span').textContent = totalItems;
            } else {
                boton = document.createElement('div');
                boton.id = 'floating-cart-btn';
                boton.className = 'fixed bottom-24 right-5 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center h-16 w-16 cursor-pointer z-50 animate-pop-in';
                boton.innerHTML = `<i class="fas fa-shopping-bag text-2xl"></i><span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">${totalItems}</span>`;
                boton.dataset.action = 'navigate';
                boton.dataset.view = 'carrito';
                document.body.appendChild(boton);
            }
        },

        updateNav() {
            Nav.querySelectorAll('.nav-link').forEach(link => {
                link.classList.toggle('active', link.dataset.view === State.vistaActual);
            });
        },

        /**
         * Genera un carrusel horizontal de tiendas
         */
getCarouselTiendasHTML(tiendas) {
    if (!tiendas || tiendas.length === 0) return '';
    return `
    <div class="px-4 py-3">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-bold text-gray-800">🏪 Tiendas Populares</h2>
            <button class="text-orange-500 text-sm font-semibold">Ver todas</button>
        </div>
        <div class="overflow-x-auto snap-x snap-mandatory hide-scrollbar">
            <div class="flex space-x-4">
                ${tiendas.map(t => `
                    <div class="snap-center flex-shrink-0 w-16 h-16 relative cursor-pointer group" data-action="navigate" data-view="tiendas" data-id="${t.id}">
                        <div class="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:border-orange-200">
                            <img src="${t.logoUrl}" alt="${t.nombre}" class="w-full h-full object-cover">
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                            <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>`;
},        /**
         * Genera barra horizontal de categorías de alimentos
         */
getCategoryBarHTML() {
    const categories = [
        { name: 'Desayuno', icon: 'fa-mug-hot', gradient: 'from-yellow-400 to-orange-400', textColor: 'text-yellow-700' },
        { name: 'Rápida', icon: 'fa-hamburger', gradient: 'from-red-400 to-pink-400', textColor: 'text-red-700' },
        { name: 'Almuerzos', icon: 'fa-utensils', gradient: 'from-green-400 to-emerald-400', textColor: 'text-green-700' },
        { name: 'Fritos', icon: 'fa-fire', gradient: 'from-orange-400 to-red-400', textColor: 'text-orange-700' },
        { name: 'Dulces', icon: 'fa-cookie-bite', gradient: 'from-pink-400 to-purple-400', textColor: 'text-pink-700' }
    ];
    return `
    <div class="px-4 py-2">
        <div class="overflow-x-auto snap-x snap-mandatory hide-scrollbar">
            <div class="flex space-x-3">
                ${categories.map(cat => `
                    <button class="snap-center flex-shrink-0 relative group" data-action="filter-category" data-category="${cat.name}">
                        <div class="bg-gradient-to-r ${cat.gradient} p-3 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                            <div class="flex flex-col items-center space-y-1 text-white">
                                <i class="fas ${cat.icon} text-sm"></i>
                                <span class="text-xs font-bold">${cat.name}</span>
                            </div>
                        </div>
                        <div class="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                `).join('')}
            </div>
        </div>
    </div>`;
},        /**
         * Grid compacto de productos
         */
        getSmallProductGridHTML(productos) {
            if (!productos || productos.length === 0) return `<div class="text-center p-10"><i class="fas fa-box-open text-5xl text-slate-300"></i><p class="mt-4 text-slate-500">No hay productos.</p></div>`;
            return `
            <div class="px-4 py-3">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold text-gray-800">🍽️ Para ti</h2>
                    <div class="flex space-x-2">
                        <button class="w-8 h-8 bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                            <i class="fas fa-th text-gray-600 text-xs"></i>
                        </button>
                        <button class="w-8 h-8 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                            <i class="fas fa-list text-orange-600 text-xs"></i>
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    ${productos.map(p => `
                        <div class="group cursor-pointer" data-action="navigate" data-view="detalleProducto" data-id="${p.id}">
                            <div class="bg-white rounded-2xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2 border border-gray-100">
                                <div class="relative">
                                    <img src="${p.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTdhM2I0Ij7wn42dPC90ZXh0Pjwvc3ZnPg=='" class="w-full h-20 object-cover">
                                    <div class="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                                        <i class="fas fa-heart text-gray-400 text-xs hover:text-red-500 transition-colors"></i>
                                    </div>
                                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent h-8"></div>
                                </div>
                                <div class="p-3">
                                    <h3 class="font-bold text-xs text-gray-800 truncate leading-tight mb-1">${p.nombre}</h3>
                                    <p class="text-xs text-gray-500 truncate mb-2">${p.tienda.nombre}</p>
                                    <div class="flex items-center justify-between">
                                        <span class="font-black text-xs bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">${this.formatPrice(p.precio, false)}</span>
                                        <button class="w-6 h-6 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <i class="fas fa-plus text-white text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        },
    };
    
    const AppController = {
        init() {
            document.body.addEventListener('click', e => {
                const target = e.target.closest('[data-action]');
                if (!target) {
                    if (e.target.matches('input[type="checkbox"]')) Views.updateTotalProducto();
                    return;
                }
                e.preventDefault();
                const { action, view, id, op, index } = target.dataset;

                switch(action) {
                    case 'navigate': Views.render(view, { id }); break;
                    case 'add-custom-to-cart': this.agregarProductoPersonalizado(); break;
                    case 'update-qty': this.actualizarCantidadProducto(parseInt(op)); break;
                    case 'remove-from-cart': this.removerDelCarrito(parseInt(index)); break;
                    case 'checkout': this.enviarPedido(); break;
                }
            });
            Nav.addEventListener('click', e => {
                const navLink = e.target.closest('.nav-link');
                if (navLink) { e.preventDefault(); Views.render(navLink.dataset.view); }
            });
            
            // 🔄 Cargar vista persistida o vista por defecto
            const vistaGuardada = State.vistaActual || 'inicio';
            Views.render(vistaGuardada);
            
            // 🚀 INICIALIZAR POLLING AUTOMÁTICO 
            // Inicializar siempre, independientemente del entorno
            console.log('🌐 Inicializando polling automático para notificaciones');
            
            // Dar tiempo a que se cargue la vista, luego iniciar polling
            setTimeout(async () => {
                try {
                    // Verificar si hay pedidos activos antes de iniciar
                    const pedidosIniciales = await Api.getMisPedidos();
                    const hasActivePedidos = pedidosIniciales.some(p => 
                        ['PENDIENTE', 'EN_PREPARACION', 'LISTO_PARA_RECOGER'].includes(p.estado)
                    );
                    
                    if (hasActivePedidos) {
                        console.log('✅ Pedidos activos detectados - iniciando polling');
                        SmartPolling.adjustFrequency(true);
                        SmartPolling.start();
                    } else {
                        console.log('📊 Sin pedidos activos - polling en modo background');
                        SmartPolling.adjustFrequency(false);
                        SmartPolling.start();
                    }
                } catch (error) {
                    console.error('❌ Error al inicializar polling automático:', error);
                }
            }, 2000); // 2 segundos después de cargar
            
            // �🔔 Listener para mensajes del Service Worker
            navigator.serviceWorker?.addEventListener('message', (event) => {
                if (event.data?.type === 'NAVIGATE_TO_PEDIDOS') {
                    Views.render('misPedidos');
                }
            });
        },

        actualizarCantidadProducto(operacion) {
            const qtyElement = document.getElementById('item-qty');
            if (!qtyElement) return;
            let cantidad = parseInt(qtyElement.textContent);
            cantidad += operacion;
            if (cantidad < 1) cantidad = 1;
            qtyElement.textContent = cantidad;
            Views.updateTotalProducto();
        },

        agregarProductoPersonalizado() {
            const productoBase = State.productoSeleccionado;
            if (State.carrito.length > 0 && State.carrito[0].tiendaId !== productoBase.tienda.id) {
                Toast.show("Solo puedes pedir de esta tienda.", "error");
                return;
            }

            let precioOpciones = 0;
            const opcionesSeleccionadas = [];
            document.querySelectorAll('input[type="checkbox"]:checked').forEach(c => {
                precioOpciones += parseFloat(c.dataset.precio);
                opcionesSeleccionadas.push({ id: parseInt(c.value), nombre: c.dataset.nombre, precio: parseFloat(c.dataset.precio) });
            });
            const cantidad = parseInt(document.getElementById('item-qty').textContent);

            State.carrito.push({
                productoId: productoBase.id, // ID del producto base
                nombre: productoBase.nombre,
                precioUnitario: productoBase.precio + precioOpciones,
                precioFinal: (productoBase.precio + precioOpciones) * cantidad,
                cantidad: cantidad,
                opciones: opcionesSeleccionadas,
                tiendaId: productoBase.tienda.id
            });
            
            State.tiendaActual = { id: productoBase.tienda.id, nombre: productoBase.tienda.nombre };
            Toast.show(`${cantidad}x "${productoBase.nombre}" añadido.`, 'success');
            Views.renderFloatingCartButton();
            Views.render('tiendas');
        },

        removerDelCarrito(index) {
            State.carrito.splice(index, 1);
            if(State.carrito.length === 0) State.tiendaActual = null;
            Views.render('carrito');
        },
        
        async enviarPedido() {
            const boton = document.querySelector('[data-action="checkout"]');
            boton.disabled = true;
            boton.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...`;
            
            const dto = {
                tiendaId: State.tiendaActual.id,
                items: State.carrito.map(item => ({
                    id: item.productoId,
                    cantidad: item.cantidad,
                    opcionesIds: item.opciones.map(op => op.id)
                }))
            };

            try {
                await Api.crearPedido(dto);
                
                // 🕒 Marcar timestamp del pedido para flujo de notificaciones
                localStorage.setItem('last-order-time', Date.now().toString());
                
                Toast.show("¡Pedido realizado con éxito!", 'success');
                State.carrito = [];
                State.tiendaActual = null;
                Views.renderFloatingCartButton();
                
                // 🔔 NUEVO FLUJO: Verificar permisos DESPUÉS del pedido exitoso
                await this.handlePostOrderNotificationPermissions();
                
                Views.render('misPedidos');
            } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
                boton.disabled = false;
                boton.innerHTML = 'Confirmar Pedido';
            }
        },

        // 🔔 Manejar permisos de notificaciones después de un pedido exitoso
        async handlePostOrderNotificationPermissions() {
            console.log('🔔 Verificando permisos post-pedido...');
            
            // Solo en HTTPS (producción)
            if (location.protocol !== 'https:') {
                console.log('❌ No HTTPS - saltando verificación de permisos');
                return;
            }

            // Verificar si ya tiene permisos
            const currentPermission = Notification.permission;
            console.log('🔐 Permisos actuales:', currentPermission);
            
            if (currentPermission === 'granted') {
                console.log('✅ Ya tiene permisos - continuando normal');
                return;
            }
            
            if (currentPermission === 'denied') {
                console.log('❌ Permisos denegados permanentemente');
                return;
            }
            
            // Si no ha decidido (default), mostrar modal educativo
            if (currentPermission === 'default') {
                console.log('🎯 Mostrando modal post-pedido para permisos');
                await this.showPostOrderNotificationModal();
            }
        },

        // 🎉 Modal específico después de realizar pedido
        async showPostOrderNotificationModal() {
            return new Promise((resolve) => {
                const modal = document.createElement('div');
                modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
                modal.innerHTML = `
                    <div class="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl transform scale-95 transition-transform duration-300">
                        <div class="text-center">
                            <div class="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-check text-3xl text-white"></i>
                            </div>
                            <h3 class="text-xl font-bold text-slate-800 mb-2">¡Pedido Confirmado! 🎉</h3>
                            <p class="text-slate-600 mb-4 text-sm leading-relaxed">
                                Tu pedido está siendo procesado. 
                            </p>
                            
                            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6">
                                <div class="flex items-center gap-3 mb-2">
                                    <i class="fas fa-bell text-blue-600"></i>
                                    <span class="font-bold text-blue-800">¿Quieres notificaciones?</span>
                                </div>
                                <p class="text-blue-700 text-xs leading-relaxed">
                                    Te avisaremos cuando tu pedido esté listo, 
                                    incluso si cierras la app 📱
                                </p>
                            </div>
                            
                            <div class="flex gap-3">
                                <button id="skip-notif" class="flex-1 bg-slate-100 text-slate-700 py-3 px-4 rounded-2xl font-medium hover:bg-slate-200 transition-colors text-sm">
                                    Continuar sin avisos
                                </button>
                                <button id="enable-notif" class="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-2xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors text-sm">
                                    ¡Sí, avísame! 🔔
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                document.body.appendChild(modal);
                
                // Animar entrada
                setTimeout(() => {
                    modal.querySelector('.bg-white').style.transform = 'scale(1)';
                }, 100);

                // Handler para activar notificaciones
                modal.querySelector('#enable-notif').onclick = async () => {
                    console.log('✅ Usuario quiere activar notificaciones post-pedido');
                    modal.remove();
                    
                    // Solicitar permisos
                    try {
                        const permission = await Notification.requestPermission();
                        console.log('📱 Resultado permisos:', permission);
                        
                        if (permission === 'granted') {
                            Toast.show('🔔 ¡Notificaciones activadas! Te avisaremos sobre tu pedido', 'success');
                            State.notifications.permission = permission;
                            
                            // Inicializar notificaciones web
                            await WebNotifications.init();
                        } else {
                            Toast.show('ℹ️ Puedes activar las notificaciones desde la configuración del navegador', 'error');
                        }
                    } catch (error) {
                        console.error('❌ Error al solicitar permisos:', error);
                        Toast.show('❌ Error al activar notificaciones', 'error');
                    }
                    
                    resolve(true);
                };

                // Handler para saltar
                modal.querySelector('#skip-notif').onclick = () => {
                    console.log('⏭️ Usuario saltó notificaciones post-pedido');
                    modal.remove();
                    resolve(false);
                };
            });
        }
    };

    const Toast = {
        show(message, type = 'success') {
            const icons = { success: 'fa-check-circle', error: 'fa-times-circle' };
            const colors = { success: 'from-green-500 to-green-600', error: 'from-red-500 to-red-600' };
            const toast = document.createElement('div');
            toast.className = `fixed top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r ${colors[type]} text-white py-3 px-6 rounded-full shadow-lg flex items-center gap-3 z-50 animate-slide-down`;
            toast.innerHTML = `<i class="fas ${icons[type]}"></i><p class="font-semibold">${message}</p>`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('animate-fade-out');
                toast.addEventListener('animationend', () => toast.remove());
            }, 3000);
        }
    };

    // 🌐 Exponer funciones globalmente para desarrollo
    window.WebNotifications = WebNotifications;
    window.SmartCache = SmartCache;

    AppController.init();
});