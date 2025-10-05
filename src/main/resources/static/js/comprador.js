/**
 * @file Script principal para la App de Compradores de Uni-Eats.
 * @description Gestiona las vistas, el estado y la lógica de la PWA del comprador.
 * @version Pro Final 2.0 (Flujo de Compra Detallado)
 */

// 🎨 Optimizar eventos touch para scroll horizontal
(function optimizeTouchEvents() {
    // Prevenir errores de touch events durante scroll horizontal
    document.addEventListener('touchstart', function(e) {
        // Permitir scroll horizontal sin interferencias
    }, { passive: true });
    
    document.addEventListener('touchmove', function(e) {
        // Permitir scroll horizontal sin interferencias
    }, { passive: true });
    
    document.addEventListener('touchend', function(e) {
        // Permitir scroll horizontal sin interferencias
    }, { passive: true });
})();

// 🎨 Inyectar CSS personalizado para mejorar la apariencia
(function injectCustomCSS() {
    const style = document.createElement('style');
    style.textContent = `
        /* Ocultar barras de scroll pero mantener funcionalidad */
        .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
            display: none;
        }
        
        /* Mejorar la suavidad del scroll horizontal */
        .smooth-scroll {
            scroll-behavior: smooth;
            -webkit-overflow-scrolling: touch;
        }
        
        /* Optimizar contenedores de scroll horizontal */
        .scroll-container {
            overscroll-behavior-x: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-x pan-y;
        }
        
        /* Limitar texto a múltiples líneas */
        .line-clamp-1 {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        /* Animaciones suaves para los cards */
        .card-hover-animation {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-hover-animation:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
    `;
    document.head.appendChild(style);
})();

// 🎨 Helper functions para logos de tiendas
function getTiendaLogoHTML(tienda) {
    console.log('🔍 Debug getTiendaLogoHTML:', tienda.nombre, 'logoUrl:', tienda.logoUrl);
    
    // Si tiene logoUrl válido, intentar mostrar la imagen
    if (tienda.logoUrl && tienda.logoUrl.trim() !== '') {
        return `<img src="${tienda.logoUrl}" 
                    alt="${tienda.nombre}" 
                    class="w-full h-full object-cover"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'; console.log('❌ Error loading logo for ${tienda.nombre}:', '${tienda.logoUrl}');">
                <div class="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm" style="display: none;">
                    ${getInitials(tienda.nombre)}
                </div>`;
    } else {
        console.log('⚠️ No logoUrl for:', tienda.nombre);
        // Fallback directo a iniciales
        return `<div class="w-full h-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                    ${getInitials(tienda.nombre)}
                </div>`;
    }
}

function getInitials(nombre) {
    if (!nombre) return '?';
    return nombre.split(' ')
                .map(word => word.charAt(0).toUpperCase())
                .slice(0, 2)
                .join('');
}

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
        categoriaSeleccionada: null, // 🍔 Nueva variable para filtro de categoría
        csrfToken: document.querySelector("meta[name='_csrf']")?.getAttribute("content"),
        csrfHeader: document.querySelector("meta[name='_csrf_header']")?.getAttribute("content"),
        // Opciones de entrega y pago
        tipoEntrega: 'recoger', // 'domicilio' o 'recoger' - por defecto recoger
        tipoPago: 'transferencia', // 'efectivo' o 'transferencia' - por defecto transferencia
        notasGenerales: '',
        notasDomicilio: '',
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
        getTienda: (id) => Api._fetch(`/api/marketplace/tiendas/${id}`),
        getProductos: () => Api._fetch('/api/marketplace/productos'),
        getProductosDeTienda: (tiendaId) => Api._fetch(`/api/marketplace/productos/tienda/${tiendaId}`),
        getProductoDetalle: (id) => Api._fetch(`/api/marketplace/productos/${id}`),
        getMisPedidos: () => Api._fetch('/api/pedidos/mis-pedidos'),
        crearPedido: (dto) => Api._fetch('/api/pedidos/crear', { method: 'POST', body: JSON.stringify(dto) }),
        // 🔍 NUEVA FUNCIÓN DE BÚSQUEDA
        buscarProductos: (termino) => Api._fetch(`/api/marketplace/productos/buscar?termino=${encodeURIComponent(termino)}`),
        // Alias para compatibilidad
        getProductosPopulares: () => Api._fetch('/api/marketplace/productos'),
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

    // 🛒💾 Sistema de Persistencia del Carrito
    const CarritoPersistente = {
        // Guardar todo el estado del carrito en localStorage
        guardar() {
            const carritoData = {
                carrito: State.carrito,
                tiendaActual: State.tiendaActual,
                tipoEntrega: State.tipoEntrega,
                tipoPago: State.tipoPago,
                notasGenerales: State.notasGenerales,
                notasDomicilio: State.notasDomicilio,
                timestamp: Date.now()
            };
            localStorage.setItem('unieats_carrito', JSON.stringify(carritoData));
            console.log('🛒💾 Carrito guardado en localStorage:', carritoData);
            console.log('🔍 Verificando que se guardó correctamente:', localStorage.getItem('unieats_carrito'));
        },

        // Cargar estado del carrito desde localStorage
        cargar() {
            try {
                const carritoData = localStorage.getItem('unieats_carrito');
                if (carritoData) {
                    const data = JSON.parse(carritoData);
                    
                    // Verificar que los datos no sean muy antiguos (máximo 24 horas)
                    const ahora = Date.now();
                    const tiempoLimite = 24 * 60 * 60 * 1000; // 24 horas
                    
                    if (data.timestamp && (ahora - data.timestamp) < tiempoLimite) {
                        State.carrito = data.carrito || [];
                        State.tiendaActual = data.tiendaActual || null;
                        State.tipoEntrega = data.tipoEntrega || 'recoger';
                        State.tipoPago = data.tipoPago || 'transferencia';
                        State.notasGenerales = data.notasGenerales || '';
                        State.notasDomicilio = data.notasDomicilio || '';
                        
                        // Si no hay tiendaActual pero hay items en el carrito, restaurar desde el primer item
                        if (!State.tiendaActual && State.carrito.length > 0) {
                            const primerItem = State.carrito[0];
                            State.tiendaActual = {
                                id: primerItem.tiendaId,
                                nombre: primerItem.tiendaNombre || `Tienda #${primerItem.tiendaId}`
                            };
                        }
                        
                        console.log('🛒📦 Carrito cargado desde localStorage:', data);
                        
                        // Actualizar UI del carrito inmediatamente
                        if (State.carrito.length > 0) {
                            // Renderizar botón flotante del carrito
                            setTimeout(() => {
                                try {
                                    if (typeof UI !== 'undefined' && UI.renderFloatingCartButton) {
                                        UI.renderFloatingCartButton();
                                        console.log('✅ Botón del carrito renderizado correctamente');
                                    } else {
                                        console.warn('⚠️ UI.renderFloatingCartButton no está disponible aún');
                                        // Crear el botón manualmente como fallback
                                        let boton = document.getElementById('floating-cart-btn');
                                        if (!boton) {
                                            const totalItems = State.carrito.reduce((sum, item) => sum + item.cantidad, 0);
                                            boton = document.createElement('div');
                                            boton.id = 'floating-cart-btn';
                                            boton.className = 'fixed bottom-20 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg flex items-center justify-center h-12 w-12 cursor-pointer z-50 transform transition-all duration-300 hover:scale-110 hover:shadow-xl';
                                            boton.innerHTML = `
                                                <i class="fas fa-shopping-cart text-lg"></i>
                                                <span class="cart-count absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce border-2 border-white">${totalItems}</span>
                                            `;
                                            boton.dataset.action = 'navigate';
                                            boton.dataset.view = 'carrito';
                                            document.body.appendChild(boton);
                                            console.log('🔧 Botón del carrito creado manualmente como fallback');
                                        }
                                    }
                                } catch (error) {
                                    console.error('❌ Error al renderizar botón del carrito:', error);
                                }
                                
                                // Mostrar notificación de recuperación
                                if (typeof NotificationSystem !== 'undefined') {
                                    NotificationSystem.show(
                                        `🛒 Carrito recuperado: ${State.carrito.length} producto${State.carrito.length !== 1 ? 's' : ''}`,
                                        'info',
                                        3000
                                    );
                                }
                            }, 500); // Reducir delay para mostrar más rápido
                        }
                        return true;
                    } else {
                        // Datos muy antiguos, limpiar
                        this.limpiar();
                        console.log('🛒🕐 Carrito expirado, limpiado');
                    }
                }
            } catch (error) {
                console.error('❌ Error al cargar carrito desde localStorage:', error);
                this.limpiar();
            }
            return false;
        },

        // Limpiar carrito del localStorage
        limpiar() {
            localStorage.removeItem('unieats_carrito');
            console.log('🛒🧹 Carrito limpiado del localStorage');
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
        navigationHistory: ['inicio'],
        
        // Configurar manejo del historial del navegador
        setupHistoryManagement() {
            // Interceptar el botón de retroceso del navegador
            window.addEventListener('popstate', (event) => {
                event.preventDefault();
                this.handleBrowserBack();
            });
            
            // Prevenir que el botón atrás vaya al login
            history.replaceState({ view: 'inicio' }, 'Inicio', '#inicio');
        },

        // Manejar navegación hacia atrás
        handleBrowserBack() {
            // Remover vista actual del historial
            if (this.navigationHistory.length > 1) {
                this.navigationHistory.pop();
                const previousView = this.navigationHistory[this.navigationHistory.length - 1];
                
                // Navegar a la vista anterior sin agregar al historial
                this.navigateWithoutHistory(previousView);
            } else {
                // Si no hay historial, ir a inicio
                this.render('inicio');
            }
        },

        // Navegar sin agregar al historial (para botón atrás)
        navigateWithoutHistory(view, params = null) {
            State.vistaActual = view;
            this.render(view, params);
        },

        // Actualizar URL del navegador sin recargar página
        updateBrowserURL(view, params) {
            let url = `#${view}`;
            
            switch (view) {
                case 'productosTienda':
                    if (params && params.tiendaId) {
                        url = `#tienda/${params.tiendaId}`;
                    }
                    break;
                case 'detalleProducto':
                    if (params && params.id) {
                        url = `#producto/${params.id}`;
                    }
                    break;
            }
            
            history.pushState({ view, params }, '', url);
        },

        // Método para mostrar errores amigables con opciones de navegación
        getErrorHTML(title, message, actions = []) {
            const defaultActions = [
                { text: '🏠 Ir a Inicio', view: 'inicio', icon: 'fas fa-home' }
            ];
            const allActions = actions.length > 0 ? actions : defaultActions;
            
            return `
                <div class="flex flex-col items-center justify-center py-16 px-4">
                    <div class="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mb-6">
                        <i class="fas fa-exclamation-triangle text-3xl text-red-500"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
                    <p class="text-gray-500 text-center mb-6">${message}</p>
                    <div class="flex gap-3 flex-wrap justify-center">
                        ${allActions.map(action => `
                            <button class="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 rounded-lg font-medium hover:from-teal-600 hover:to-emerald-600 transition-all" 
                                    data-action="navigate" data-view="${action.view}">
                                <i class="${action.icon} mr-2"></i>${action.text}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        },

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
                    // 🎯 Solo mostrar pedidos activos por defecto
                    container.innerHTML = this.getMisPedidosHTML(pedidos, false);
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
            
            // Agregar al historial de navegación
            if (this.navigationHistory[this.navigationHistory.length - 1] !== view) {
                this.navigationHistory.push(view);
            }
            
            // Actualizar URL del navegador
            this.updateBrowserURL(view, params);
            
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
                        let productos = await Api.getProductos();
                        
                        // 🍔 FILTRAR POR CATEGORÍA SI HAY UNA SELECCIONADA
                        if (State.categoriaSeleccionada) {
                            const dbValue = this.getDbValueFromCategory(State.categoriaSeleccionada);
                            console.log('🔍 Filtrando por:', State.categoriaSeleccionada, '-> BD:', dbValue);
                            productos = productos.filter(producto => 
                                producto.clasificacion === dbValue
                            );
                            console.log('📊 Productos filtrados encontrados:', productos.length);
                        }
                        
                        // 🎯 NUEVA LÓGICA: Vista mejorada basada en popularidad
                        if (State.categoriaSeleccionada) {
                            // Vista compacta cuando hay filtro de categoría
                            Container.innerHTML = 
                                this.getCategoryBarHTML() +
                                this.getCompactProductGridHTML(productos, State.categoriaSeleccionada);
                        } else {
                            // � VISTA DE INICIO MEJORADA: Mostrar categorías populares
                            Container.innerHTML = 
                                this.getCategoryBarHTML() +
                                this.getPopularCategoriesViewHTML(productos);
                        }
                        break;
                    case 'tiendas':
                        Header.innerHTML = this.getHeaderHTML('tiendas');
                        const tiendasList = await Api.getTiendas();
                        Container.innerHTML = this.getListaTiendasHTML(tiendasList);
                        break;
                    case 'productosTienda':
                        console.log('🏪 Navegando a productos de tienda');
                        console.log('📋 Params recibidos:', params);
                        console.log('🆔 tiendaId:', params?.tiendaId || params?.id);
                        
                        // Validar que se especificó la tienda
                        if (!params || (!params.tiendaId && !params.id)) {
                            console.error('❌ No se especificó tiendaId');
                            Container.innerHTML = this.getErrorHTML(
                                'No se especificó la tienda',
                                'Esto puede pasar si refrescaste la página.',
                                [
                                    { text: '🏪 Ver Tiendas', view: 'tiendas', icon: 'fas fa-store' },
                                    { text: '🏠 Ir a Inicio', view: 'inicio', icon: 'fas fa-home' }
                                ]
                            );
                            return;
                        }
                        const tiendaIdFinal = params?.tiendaId || params?.id;
                        if (!tiendaIdFinal) {
                            console.error('❌ No se recibió tiendaId');
                            Container.innerHTML = '<div class="p-8 text-center text-red-500">Error: No se especificó la tienda</div>';
                            return;
                        }
                        
                        console.log('🔍 Obteniendo datos de la tienda:', tiendaIdFinal);
                        const tienda = await Api.getTienda(tiendaIdFinal);
                        console.log('🏪 Tienda obtenida:', tienda);
                        
                        const productosDeTienda = await Api.getProductosDeTienda(tiendaIdFinal);
                        console.log('📦 Productos obtenidos:', productosDeTienda?.length || 0);
                        console.log('📋 Lista de productos:', productosDeTienda);
                        
                        State.tiendaActual = tienda;
                        Header.innerHTML = this.getHeaderHTML('productosTienda', tienda);
                        Container.innerHTML = this.getProductosTiendaHTML(productosDeTienda, tienda);
                        break;
                    case 'perfil':
                        Header.innerHTML = this.getHeaderHTML('perfil');
                        Container.innerHTML = this.getPerfilHTML();
                        break;
                    case 'detalleProducto':
                        // Validar que se especificó el producto
                        if (!params || !params.id) {
                            console.error('❌ No se especificó el ID del producto');
                            Container.innerHTML = this.getErrorHTML(
                                'Producto no encontrado',
                                'No se especificó qué producto quieres ver.<br>Esto puede pasar si refrescaste la página.',
                                [
                                    { text: '🏠 Ir a Inicio', view: 'inicio', icon: 'fas fa-home' },
                                    { text: '🏪 Ver Tiendas', view: 'tiendas', icon: 'fas fa-store' }
                                ]
                            );
                            return;
                        }

                        try {
                            const producto = await Api.getProductoDetalle(params.id);
                            if (!producto) {
                                Container.innerHTML = this.getErrorHTML(
                                    'Producto no encontrado',
                                    'El producto que buscas no existe o fue eliminado.<br>Esto puede pasar si refrescaste la página.',
                                    [
                                        { text: '🏠 Ir a Inicio', view: 'inicio', icon: 'fas fa-home' },
                                        { text: '🏪 Ver Tiendas', view: 'tiendas', icon: 'fas fa-store' }
                                    ]
                                );
                                return;
                            }
                            State.productoSeleccionado = producto;
                            Header.innerHTML = this.getHeaderHTML('detalleProducto', producto);
                            Container.innerHTML = this.getDetalleProductoHTML(producto);
                            this.updateTotalProducto();
                        } catch (error) {
                            console.error('❌ Error cargando producto:', error);
                            Container.innerHTML = this.getErrorHTML(
                                'Error cargando producto',
                                'Hubo un problema al cargar el producto.<br>Por favor, intenta nuevamente.',
                                [
                                    { text: '🏠 Ir a Inicio', view: 'inicio', icon: 'fas fa-home' },
                                    { text: '🏪 Ver Tiendas', view: 'tiendas', icon: 'fas fa-store' }
                                ]
                            );
                        }
                        break;
                    case 'carrito':
                        Header.innerHTML = this.getHeaderHTML('carrito');
                        Container.innerHTML = this.getCarritoHTML();
                        this.renderFloatingCartButton(true);
                        
                        // 📝 Configurar event listeners para campos de texto
                        setTimeout(() => {
                            const notasGeneralesField = document.querySelector('[data-action="change-notas-generales"]');
                            const notasDomicilioField = document.querySelector('[data-action="change-notas-domicilio"]');
                            
                            if (notasGeneralesField) {
                                notasGeneralesField.addEventListener('input', (e) => {
                                    AppController.cambiarNotasGenerales(e.target.value);
                                });
                            }
                            
                            if (notasDomicilioField) {
                                notasDomicilioField.addEventListener('input', (e) => {
                                    AppController.cambiarNotasDomicilio(e.target.value);
                                });
                            }
                        }, 100);
                        break;
                    case 'misPedidos':
                        Header.innerHTML = this.getHeaderHTML('misPedidos');
                        
                        // Mostrar loading mientras se cargan los datos
                        Container.innerHTML = this.getLoadingHTML('Cargando tus pedidos...');
                        
                        // Usar caché inteligente en lugar de API directa
                        const pedidos = await SmartCache.getMisPedidosOptimized();
                        // 🎯 Solo mostrar pedidos activos por defecto
                        Container.innerHTML = this.getMisPedidosHTML(pedidos, false);
                        
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
                    <div class="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-2 shadow-md">
                        <!-- Header Principal Compacto -->
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-2">
                                <div class="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                                    <span class="text-teal-600 font-bold text-sm">🍽️</span>
                                </div>
                                <div>
                                    <h1 class="text-base font-bold">UniEats</h1>
                                    <p class="text-teal-100 text-xs">Tu marketplace universitario</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button class="p-2 bg-teal-600 rounded-full hover:bg-teal-700 transition-colors" data-action="navigate" data-view="perfil">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                    </svg>
                                </button>
                                ${State.carrito.length > 0 ? `
                                    <button class="p-2 bg-teal-600 rounded-full hover:bg-teal-700 transition-colors relative" data-action="navigate" data-view="carrito">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5h12"></path>
                                        </svg>
                                        <span class="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-xs">${State.carrito.length}</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Barra de búsqueda compacta -->
                        <div class="relative">
                            <input type="text" 
                                   id="searchInput" 
                                   placeholder="Buscar productos, tiendas..." 
                                   class="w-full pl-8 pr-3 py-2 bg-white rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-white shadow-sm text-sm">
                            <svg class="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                    </div>`;
                    
                case 'productosTienda': return `
                    <div class="relative bg-gradient-to-br from-teal-600 to-emerald-600 text-white overflow-hidden">
                        <div class="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                        <div class="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
                        
                        <div class="relative z-10 px-4 py-3">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center gap-3">
                                    <button class="w-9 h-9 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-300" 
                                            data-action="navigate" data-view="tiendas">
                                        <i class="fas fa-arrow-left text-white text-sm"></i>
                                    </button>
                                    <div class="flex items-center gap-3">
                                        <div class="w-12 h-12 rounded-xl overflow-hidden bg-white/20 backdrop-blur-md border border-white/30">
                                            ${data ? getTiendaLogoHTML(data) : '<div class="w-full h-full bg-white/30 flex items-center justify-center"><i class="fas fa-store text-white"></i></div>'}
                                        </div>
                                        <div>
                                            <h1 class="text-lg font-bold">${data ? data.nombre : 'Tienda'}</h1>
                                            <p class="text-white/80 text-xs">${data ? data.descripcion : 'Productos disponibles'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    ${State.carrito.length > 0 ? `
                                        <button class="p-2 bg-white/20 backdrop-blur-md rounded-xl hover:bg-white/30 transition-all relative" 
                                                data-action="navigate" data-view="carrito">
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5h12"></path>
                                            </svg>
                                            <span class="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-xs">${State.carrito.length}</span>
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    </div>`;
                    
                case 'tiendas': return `
                    <div class="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-3 shadow-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                                    <span class="text-teal-600 font-bold text-base">🏪</span>
                                </div>
                                <div>
                                    <h1 class="text-lg font-bold">Tiendas</h1>
                                    <p class="text-teal-100 text-xs">Explora nuestras tiendas</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                ${State.carrito.length > 0 ? `
                                    <button class="p-2 bg-teal-600 rounded-full hover:bg-teal-700 transition-colors relative" data-action="navigate" data-view="carrito">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5h12"></path>
                                        </svg>
                                        <span class="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-xs">${State.carrito.length}</span>
                                    </button>
                                ` : ''}
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
                    <div class="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-3 shadow-sm">
                        <div class="flex items-center gap-3">
                            <button class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all nav-back-btn" data-action="navigate" data-view="tiendas" data-id="${State.tiendaActual?.id}">
                                <i class="fas fa-arrow-left text-white text-sm"></i>
                            </button>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center relative">
                                    <i class="fas fa-shopping-cart text-white text-sm"></i>
                                    <span class="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold">${State.carrito.length}</span>
                                </div>
                                <div>
                                    <h1 class="text-lg font-bold">Tu Pedido</h1>
                                    <p class="text-teal-100 text-xs">${State.carrito.length} producto${State.carrito.length !== 1 ? 's' : ''} seleccionado${State.carrito.length !== 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        </div>
                    </div>`;
                    
                case 'misPedidos': return `
                    <div class="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-3 shadow-lg">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <div class="w-9 h-9 bg-white rounded-full flex items-center justify-center">
                                    <span class="text-teal-600 font-bold text-base">📜</span>
                                </div>
                                <div>
                                    <h1 class="text-lg font-bold">Mis Pedidos</h1>
                                    <p class="text-teal-100 text-xs">Tu historial de pedidos</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-2">
                                ${State.carrito.length > 0 ? `
                                    <button class="p-2 bg-teal-600 rounded-full hover:bg-teal-700 transition-colors relative" data-action="navigate" data-view="carrito">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 7.5h12"></path>
                                        </svg>
                                        <span class="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center text-xs">${State.carrito.length}</span>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>`;
                    
                case 'detalleProducto': return `
                    <div class="relative bg-gradient-to-r from-teal-500 to-emerald-500 text-white mb-3">
                        <!-- Elementos decorativos sutiles -->
                        <div class="absolute top-0 right-0 w-16 h-16 bg-emerald-400 rounded-full opacity-20 -translate-y-8 translate-x-8"></div>
                        <div class="absolute bottom-0 left-0 w-12 h-12 bg-teal-300 rounded-full opacity-25 translate-y-6 -translate-x-6"></div>
                        
                        <div class="relative z-10 px-4 py-3">
                            <div class="flex items-center justify-between">
                                <!-- Botón de regreso compacto -->
                                <button class="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-200 nav-back-btn" data-action="navigate" data-view="${backViewTarget}" data-id="${State.tiendaActual?.id}">
                                    <i class="fas fa-arrow-left text-white text-sm"></i>
                                </button>
                                
                                <!-- Mensaje central compacto -->
                                <div class="flex-1 text-center mx-3">
                                    <h1 class="text-lg font-bold text-white">Personaliza tu pedido</h1>
                                    <p class="text-emerald-100 text-xs">Ajusta todo a tu gusto</p>
                                </div>
                                
                                <!-- Carrito si tiene items -->
                                ${State.carrito.length > 0 ? `
                                    <button class="relative w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-all duration-200" data-action="navigate" data-view="carrito">
                                        <i class="fas fa-shopping-cart text-white text-sm"></i>
                                        <span class="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">${State.carrito.length}</span>
                                    </button>
                                ` : `
                                    <div class="w-9 h-9"></div>
                                `}
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
                html += `<h2 class="text-lg font-bold text-slate-700 mt-4 mb-3 px-3">${nombreCat}</h2>
                <div class="px-3">
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        ${prodsCat.map(p => `
                            <div class="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transform transition duration-200 hover:scale-105 border border-gray-100" data-action="navigate" data-view="detalleProducto" data-id="${p.id}">
                                <div class="relative">
                                    <img src="${p.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk3YTNiNCI+🍽️</text></svg>'" class="w-full h-20 object-cover">
                                    <!-- Botón + en la esquina superior derecha -->
                                    <button class="absolute top-1.5 right-1.5 w-6 h-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors" onclick="event.stopPropagation()">
                                        <i class="fas fa-plus text-xs"></i>
                                    </button>
                                </div>
                                <div class="p-2.5">
                                    <h3 class="font-semibold text-xs text-slate-800 truncate leading-tight">${p.nombre}</h3>
                                    <p class="text-xs text-slate-500 truncate">${p.tienda.nombre}</p>
                                    <p class="font-bold text-teal-600 mt-1 text-sm">${this.formatPrice(p.precio, false)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }
            return html;
        },

        getListaTiendasHTML(tiendas) {
            if (!tiendas || tiendas.length === 0) {
                return `
                    <div class="flex flex-col items-center justify-center py-16 px-4">
                        <div class="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                            <i class="fas fa-store text-3xl text-teal-500"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">No hay tiendas disponibles</h3>
                        <p class="text-gray-500 text-center">Las tiendas estarán disponibles pronto</p>
                    </div>
                `;
            }

            return `
                <div class="p-3 space-y-3">
                    ${tiendas.map(tienda => `
                        <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 cursor-pointer transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md" 
                             data-action="navigate" data-view="productosTienda" data-tienda-id="${tienda.id}">
                            <div class="p-3">
                                <div class="flex items-center gap-3">
                                    <!-- Logo de la tienda más pequeño -->
                                    <div class="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-teal-100 to-emerald-100 flex-shrink-0 border border-teal-200">
                                        ${getTiendaLogoHTML(tienda)}
                                    </div>
                                    
                                    <!-- Info de la tienda compacta -->
                                    <div class="flex-1 min-w-0">
                                        <h3 class="font-bold text-base text-gray-900 mb-1 truncate">${tienda.nombre}</h3>
                                        <p class="text-gray-600 text-xs line-clamp-1 mb-2">${tienda.descripcion || 'Deliciosa comida te espera'}</p>
                                        
                                        <!-- Estado compacto -->
                                        <div class="flex items-center gap-2">
                                            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1"></span>
                                                Abierto
                                            </span>
                                            <div class="flex items-center gap-1">
                                                <i class="fas fa-star text-yellow-400 text-xs"></i>
                                                <span class="text-xs text-gray-600 font-medium">4.8</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Flecha más pequeña -->
                                    <div class="w-6 h-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <i class="fas fa-chevron-right text-teal-500 text-xs"></i>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        },

        getDetalleProductoHTML(producto) {
            let opcionesHtml = producto.categoriasDeOpciones.map(cat => `
                <div class="mb-3">
                    <h3 class="font-bold text-base mb-2 text-gray-800">${cat.nombre}</h3>
                    <div class="space-y-2">
                        ${cat.opciones.map(op => `
                            <label class="flex items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-all cursor-pointer">
                                <input type="checkbox" class="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-gray-300" name="${cat.id}" value="${op.id}" data-precio="${op.precioAdicional}" data-nombre="${op.nombre}">
                                <span class="ml-2.5 text-gray-700 flex-1 text-sm">${op.nombre}</span>
                                <span class="font-semibold text-teal-600 text-sm">${this.formatPrice(op.precioAdicional)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            return `
            <div class="bg-white rounded-t-2xl shadow-lg mx-4 max-w-full overflow-hidden">
                <div class="relative">
                    <img src="${producto.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk3YTNiNCI+8J+NvSR7cHJvZHVjdG8ubm9tYnJlfTwvdGV4dD48L3N2Zz4='" class="w-full h-40 object-cover rounded-t-2xl">
                    <!-- Badge de precio más compacto -->
                    <div class="absolute top-3 right-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-2 py-1 rounded-lg font-bold shadow-lg text-sm">
                        ${this.formatPrice(producto.precio, false)}
                    </div>
                    <!-- Badge del restaurante más compacto -->
                    <div class="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-lg">
                        <p class="text-xs font-medium text-gray-800">${producto.tienda.nombre}</p>
                    </div>
                </div>
                <div class="p-3">
                    <h2 class="font-bold text-xl text-gray-800 mb-1">${producto.nombre}</h2>
                    <p class="text-gray-600 text-sm">${producto.descripcion}</p>
                </div>
            </div>

            <!-- Opciones de personalización más compactas -->
            ${opcionesHtml ? `<div class="px-4 py-3">${opcionesHtml}</div>` : ''}

            <!-- Footer fijo con controles optimizado -->
            <div class="sticky bottom-0 bg-white/95 backdrop-blur-sm mx-4 p-3 shadow-lg border-t border-gray-100 rounded-t-xl max-w-full">
                <div class="flex items-center justify-between mb-3">
                    <!-- Controles de cantidad compactos -->
                    <div class="flex items-center gap-2">
                        <button class="w-7 h-7 bg-gray-100 hover:bg-teal-100 rounded-lg flex items-center justify-center transition-colors" data-action="update-qty" data-op="-1">
                            <i class="fas fa-minus text-gray-600 text-xs"></i>
                        </button>
                        <span id="item-qty" class="font-bold text-lg w-6 text-center text-teal-600">1</span>
                        <button class="w-7 h-7 bg-gray-100 hover:bg-teal-100 rounded-lg flex items-center justify-center transition-colors" data-action="update-qty" data-op="1">
                            <i class="fas fa-plus text-gray-600 text-xs"></i>
                        </button>
                    </div>
                    
                    <!-- Total compacto -->
                    <div class="text-right">
                        <p class="text-xs text-gray-500">Total</p>
                        <span id="total-producto" class="font-bold text-lg text-teal-600">${this.formatPrice(producto.precio, false)}</span>
                    </div>
                </div>
                
                <!-- Botón de acción compacto -->
                <button class="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-2.5 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2 hover:from-teal-600 hover:to-emerald-600" data-action="add-custom-to-cart">
                    <i class="fas fa-plus text-sm"></i>
                    <span>Añadir al Pedido</span>
                </button>
            </div>`;
        },

        getCarritoHTML() {
            if (State.carrito.length === 0) {
                return `
                <div class="text-center p-12">
                    <div class="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-shopping-cart text-3xl text-amber-500"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-600 mb-2">Tu carrito está vacío</h3>
                    <p class="text-gray-500 mb-6">¡Explora nuestros deliciosos productos!</p>
                    <button class="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all" data-action="navigate" data-view="inicio">
                        Explorar productos
                    </button>
                </div>`;
            }
            
            const total = State.carrito.reduce((sum, item) => sum + item.precioFinal, 0);
            
            // Obtener nombre de la tienda (con fallback si State.tiendaActual es null)
            let nombreTienda = 'Tu Pedido';
            if (State.tiendaActual && State.tiendaActual.nombre) {
                nombreTienda = State.tiendaActual.nombre;
            } else if (State.carrito.length > 0) {
                // Fallback: usar información del carrito si está disponible
                const primerItem = State.carrito[0];
                if (primerItem.tiendaNombre) {
                    nombreTienda = primerItem.tiendaNombre;
                } else {
                    nombreTienda = `Tienda #${primerItem.tiendaId}`;
                }
            }
            
            const itemsHtml = State.carrito.map((item, index) => `
                <div class="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div class="flex items-center gap-2 flex-1">
                        <span class="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded">${item.cantidad}x</span>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-medium text-gray-800 text-sm truncate">${item.nombre}</h4>
                            ${item.opciones.length > 0 ? `
                                <p class="text-xs text-gray-500 truncate">+${item.opciones.map(op => op.nombre).join(', ')}</p>
                            ` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-teal-600 text-sm">${this.formatPrice(item.precioFinal, false)}</span>
                        <button class="text-red-400 hover:text-red-600 p-1" data-action="remove-from-cart" data-index="${index}">
                            <i class="fas fa-times text-xs"></i>
                        </button>
                    </div>
                </div>
            `).join('');

            return `
            <div class="px-3 py-2 space-y-3">
                <!-- Header minimalista del carrito -->
                <div class="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div class="w-6 h-6 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center">
                        <i class="fas fa-shopping-cart text-white text-xs"></i>
                    </div>
                    <h2 class="font-bold text-gray-800 text-sm">Tu pedido de ${nombreTienda}</h2>
                </div>

                <!-- Lista compacta de productos -->
                <div class="bg-white rounded-lg border border-gray-100 overflow-hidden">
                    <div class="px-3 py-2 bg-gray-50 border-b">
                        <h3 class="font-medium text-gray-700 text-sm flex items-center gap-1">
                            <i class="fas fa-utensils text-xs"></i> Tu pedido
                        </h3>
                    </div>
                    <div class="p-3">
                        ${itemsHtml}
                    </div>
                </div>

                <!-- Opciones compactas -->
                <div class="space-y-2">
                    <!-- Entrega -->
                    <div class="bg-white rounded-lg border border-gray-100 p-3">
                        <h4 class="font-medium text-gray-700 text-xs mb-2 flex items-center gap-1">
                            <i class="fas fa-truck text-xs text-teal-500"></i> Entrega
                        </h4>
                        <div class="space-y-1">
                            <label class="flex items-center gap-2 text-xs cursor-pointer">
                                <input type="radio" name="tipoEntrega" value="domicilio" ${State.tipoEntrega === 'domicilio' ? 'checked' : ''} class="text-teal-500 scale-75" data-action="change-entrega">
                                <span class="text-gray-700">🏠 Domicilio</span>
                            </label>
                            <label class="flex items-center gap-2 text-xs cursor-pointer">
                                <input type="radio" name="tipoEntrega" value="recoger" ${State.tipoEntrega === 'recoger' ? 'checked' : ''} class="text-teal-500 scale-75" data-action="change-entrega">
                                <span class="text-gray-700">🚶 Recoger</span>
                            </label>
                        </div>
                    </div>

                    <!-- Pago con diseño diferente tipo toggle -->
                    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-3">
                        <h4 class="font-medium text-purple-700 text-xs mb-3 flex items-center gap-1">
                            <i class="fas fa-credit-card text-xs text-purple-500"></i> Método de pago
                        </h4>
                        <div class="flex bg-white rounded-lg p-1 border border-purple-200">
                            <button 
                                class="flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200 ${State.tipoPago === 'efectivo' ? 'bg-green-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}"
                                data-action="set-pago"
                                data-tipo="efectivo"
                            >
                                💵 Efectivo
                            </button>
                            <button 
                                class="flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all duration-200 ${State.tipoPago === 'transferencia' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}"
                                data-action="set-pago"
                                data-tipo="transferencia"
                            >
                                🏦 Transfer.
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Notas compactas -->
                <div class="bg-white rounded-lg border border-gray-100 p-3">
                    <h4 class="font-medium text-gray-700 text-xs mb-2 flex items-center gap-1">
                        <i class="fas fa-edit text-xs text-teal-500"></i> Notas especiales
                    </h4>
                    <textarea 
                        placeholder="Ej: Sin salsa picante, sin cebolla..."
                        class="w-full p-2 border border-gray-200 rounded text-xs resize-none focus:border-teal-300 focus:ring-1 focus:ring-teal-100"
                        rows="2"
                        data-action="change-notas-generales"
                        maxlength="200"
                    >${State.notasGenerales}</textarea>
                </div>

                <!-- Ubicación solo si es domicilio -->
                ${State.tipoEntrega === 'domicilio' ? `
                <div class="bg-amber-50 rounded-lg border border-amber-200 p-3">
                    <h4 class="font-medium text-amber-700 text-xs mb-2 flex items-center gap-1">
                        <i class="fas fa-map-marker-alt text-xs"></i> Ubicación de entrega
                        <span class="text-red-500 font-bold">*</span>
                    </h4>
                    <textarea 
                        placeholder="Torre, piso, apartamento, referencias... (OBLIGATORIO)"
                        class="w-full p-2 border border-amber-200 rounded text-xs resize-none focus:border-amber-300 bg-white required"
                        rows="2"
                        data-action="change-notas-domicilio"
                        maxlength="300"
                        required
                    >${State.notasDomicilio}</textarea>
                </div>
                ` : ''}

                <!-- Botón de confirmación -->
                <button class="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold py-3 rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md" data-action="checkout">
                    <i class="fas fa-check text-sm"></i>
                    <span>Confirmar Pedido • ${this.formatPrice(total, false)}</span>
                </button>
            </div>`;
        },

        getPerfilHTML() {
            return `<div class="bg-white rounded-lg shadow-sm">
                        <a href="#" class="profile-link" data-action="navigate" data-view="misPedidos"><i class="fas fa-receipt profile-icon text-indigo-500"></i><span class="font-semibold">Mis Pedidos</span><i class="fas fa-chevron-right text-slate-300 ml-auto"></i></a>
                        <form action="/logout" method="post"><input type="hidden" name="_csrf" value="${State.csrfToken}"><button type="submit" class="profile-link w-full text-left text-red-500"><i class="fas fa-sign-out-alt profile-icon"></i><span class="font-semibold">Cerrar Sesión</span></button></form>
                    </div>`;
        },

        getMisPedidosHTML(pedidos, mostrarTodos = false) {
            if (!pedidos || pedidos.length === 0) {
                return `
                    <div class="px-4">
                        <div class="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div class="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i class="fas fa-receipt text-3xl text-teal-600"></i>
                            </div>
                            <h3 class="text-xl font-bold text-slate-700 mb-3">¡Aún no tienes pedidos!</h3>
                            <p class="text-slate-500 mb-6 leading-relaxed">Explora nuestras deliciosas tiendas y realiza tu primer pedido. <br>¡Te esperan sabores increíbles!</p>
                            <button class="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all transform hover:scale-105" data-action="navigate" data-view="tiendas">
                                <i class="fas fa-store mr-2"></i>
                                Explorar Tiendas
                            </button>
                        </div>
                    </div>
                `;
            }
            
            // 🎯 FILTRAR PEDIDOS: Solo activos por defecto, todos si se solicita
            const pedidosActivos = pedidos.filter(p => 
                ['PENDIENTE', 'EN_PREPARACION', 'LISTO_PARA_RECOGER'].includes(p.estado)
            );
            const pedidosFinalizados = pedidos.filter(p => 
                ['COMPLETADO', 'CANCELADO'].includes(p.estado)
            );

            // Si no se muestran todos, solo mostrar pedidos activos
            const pedidosAMostrar = mostrarTodos ? pedidos : pedidosActivos;
            
            // Si no hay pedidos activos y no se están mostrando todos, mostrar estado especial
            if (pedidosActivos.length === 0 && !mostrarTodos) {
                return `
                    <div class="px-4">
                        <div class="text-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div class="w-24 h-24 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i class="fas fa-check-circle text-3xl text-teal-600"></i>
                            </div>
                            <h3 class="text-xl font-bold text-slate-700 mb-3">¡No tienes pedidos pendientes!</h3>
                            <p class="text-slate-500 mb-6 leading-relaxed">Todos tus pedidos han sido completados. <br>¿Listo para tu próximo pedido?</p>
                            <div class="flex flex-col gap-3">
                                <button class="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-8 py-3 rounded-2xl font-semibold hover:shadow-lg transition-all transform hover:scale-105" data-action="navigate" data-view="tiendas">
                                    <i class="fas fa-store mr-2"></i>
                                    Hacer Nuevo Pedido
                                </button>
                                ${pedidosFinalizados.length > 0 ? `
                                <button class="bg-white border-2 border-teal-500 text-teal-600 px-8 py-3 rounded-2xl font-semibold hover:bg-teal-50 transition-all" onclick="Views.mostrarPedidosAnteriores()">
                                    <i class="fas fa-history mr-2"></i>
                                    Ver Pedidos Anteriores (${pedidosFinalizados.length})
                                </button>
                                ` : ''}
                            </div>
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

            return `
                <div class="px-4 py-3 space-y-4">
                    ${mostrarTodos && pedidosActivos.length > 0 ? `
                        <div class="bg-white border-2 border-teal-500 rounded-2xl p-4 mb-4">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                        <i class="fas fa-clock text-teal-600"></i>
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-slate-800">Pedidos Activos</h4>
                                        <p class="text-sm text-slate-500">${pedidosActivos.length} pedido(s) en proceso</p>
                                    </div>
                                </div>
                                <button class="text-teal-600 hover:text-teal-700 font-semibold" onclick="Views.mostrarSoloPedidosActivos()">
                                    <i class="fas fa-eye mr-1"></i>Solo Activos
                                </button>
                            </div>
                        </div>
                    ` : ''}
                    ${pedidosAMostrar.map(pedido => {
                        const status = statusConfig[pedido.estado] || statusConfig['PENDIENTE'];
                        const fechaFormateada = new Date(pedido.fechaCreacion).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        const isActiveOrder = ['PENDIENTE', 'EN_PREPARACION', 'LISTO_PARA_RECOGER'].includes(pedido.estado);
                        
                        return `
                        <div class="bg-white rounded-2xl shadow-lg p-5 border-2 ${status.borderColor} hover:shadow-xl transition-all duration-300 ${status.bgColor}">
                            <!-- Header del pedido -->
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <h3 class="font-bold text-lg text-slate-800">${pedido.nombreTienda}</h3>
                                        ${isActiveOrder ? '<div class="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>' : ''}
                                    </div>
                                    <p class="text-sm text-slate-500 flex items-center gap-2">
                                        <i class="fas fa-hashtag text-xs"></i>
                                        Pedido ${pedido.id} • ${fechaFormateada}
                                    </p>
                                </div>
                                <div class="text-right">
                                    <p class="font-black text-xl text-slate-800">${this.formatPrice(pedido.total, false)}</p>
                                    ${isActiveOrder ? '<p class="text-xs text-emerald-600 font-medium">En tiempo real 🔴</p>' : ''}
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
                                            <div class="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                                            <div class="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                                            <div class="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
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
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs ${pedido.estado === 'LISTO_PARA_RECOGER' ? 'bg-emerald-500 text-white animate-pulse' : ['LISTO_PARA_RECOGER', 'COMPLETADO'].includes(pedido.estado) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}">
                                        <i class="fas fa-shopping-bag"></i>
                                    </div>
                                    <p class="text-xs font-medium ${pedido.estado === 'LISTO_PARA_RECOGER' ? 'text-emerald-600' : ['LISTO_PARA_RECOGER', 'COMPLETADO'].includes(pedido.estado) ? 'text-emerald-600' : 'text-slate-400'}">Listo</p>
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
                    }).join('')}
                </div>
            `;
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
                boton.querySelector('.cart-count').textContent = totalItems;
            } else {
                boton = document.createElement('div');
                boton.id = 'floating-cart-btn';
                boton.className = 'fixed bottom-20 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg flex items-center justify-center h-12 w-12 cursor-pointer z-50 transform transition-all duration-300 hover:scale-110 hover:shadow-xl';
                boton.innerHTML = `
                    <i class="fas fa-shopping-cart text-lg"></i>
                    <span class="cart-count absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce border-2 border-white">${totalItems}</span>
                `;
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
        <div class="overflow-x-auto snap-x snap-mandatory hide-scrollbar scroll-container">
            <div class="flex space-x-4">
                ${tiendas.map(t => `
                    <div class="snap-center flex-shrink-0 w-16 h-16 relative cursor-pointer group" data-action="navigate" data-view="tiendas" data-id="${t.id}">
                        <div class="w-full h-full rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50 border-2 border-gray-100 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:border-orange-200">
                            ${getTiendaLogoHTML(t)}
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
         * 🎨 Barra de categorías mejorada y más compacta
         */
        getCategoryBarHTML() {
            const categories = [
                { name: 'Desayuno', icon: 'fa-coffee', gradient: 'from-amber-400 to-orange-400', dbValue: 'DESAYUNO' },
                { name: 'Rápida', icon: 'fa-bolt', gradient: 'from-red-400 to-pink-400', dbValue: 'COMIDA_RAPIDA' },
                { name: 'Almuerzos', icon: 'fa-utensils', gradient: 'from-emerald-400 to-teal-400', dbValue: 'ALMUERZO' },
                { name: 'Bebidas', icon: 'fa-glass-water', gradient: 'from-blue-400 to-cyan-400', dbValue: 'BEBIDAS' },
                { name: 'Postres', icon: 'fa-ice-cream', gradient: 'from-pink-400 to-rose-400', dbValue: 'POSTRES' },
                { name: 'Snacks', icon: 'fa-cookie', gradient: 'from-purple-400 to-indigo-400', dbValue: 'SNACKS' },
                { name: 'Saludable', icon: 'fa-leaf', gradient: 'from-green-400 to-emerald-400', dbValue: 'SALUDABLE' }
            ];
            
            return `
            <div class="px-3 py-2">
                <div class="overflow-x-auto hide-scrollbar scroll-container">
                    <div class="flex gap-1.5" style="width: max-content;">
                        <!-- Botón "Todos" especial -->
                        <button class="flex-shrink-0 group ${!State.categoriaSeleccionada ? 'scale-105' : ''}" data-action="filter-category" data-category="">
                            <div class="bg-gradient-to-r from-gray-600 to-slate-600 p-2 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 min-w-[55px] ${!State.categoriaSeleccionada ? 'ring-2 ring-white ring-opacity-50 shadow-xl' : ''}">
                                <div class="flex flex-col items-center gap-0.5 text-white">
                                    <i class="fas fa-th-large text-xs ${!State.categoriaSeleccionada ? 'text-sm' : ''}"></i>
                                    <span class="text-xs font-semibold ${!State.categoriaSeleccionada ? 'font-bold' : ''}">Todos</span>
                                </div>
                            </div>
                        </button>
                        
                        ${categories.map(cat => {
                            const isSelected = State.categoriaSeleccionada === cat.name;
                            return `
                            <button class="flex-shrink-0 group ${isSelected ? 'scale-105' : ''}" data-action="filter-category" data-category="${cat.name}">
                                <div class="bg-gradient-to-r ${cat.gradient} p-2 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105 min-w-[55px] ${isSelected ? 'ring-2 ring-white ring-opacity-50 shadow-xl' : ''}">
                                    <div class="flex flex-col items-center gap-0.5 text-white">
                                        <i class="fas ${cat.icon} text-xs ${isSelected ? 'text-sm' : ''}"></i>
                                        <span class="text-xs font-semibold ${isSelected ? 'font-bold' : ''}">${cat.name}</span>
                                    </div>
                                </div>
                            </button>
                        `;
                        }).join('')}
                    </div>
                </div>
            </div>`;
        },        

        /**
         * 🌟 Vista de inicio con categorías populares (Desayuno, Almuerzo, Rápidas)
         */
        getPopularCategoriesViewHTML(productos) {
            // Definir categorías populares en orden de importancia
            const categoriasPopulares = [
                { name: 'Desayuno', dbValue: 'DESAYUNO', icon: '🌅', color: 'from-amber-400 to-orange-500' },
                { name: 'Rápida', dbValue: 'COMIDA_RAPIDA', icon: '⚡', color: 'from-red-400 to-pink-500' },
                { name: 'Almuerzos', dbValue: 'ALMUERZO', icon: '🍽️', color: 'from-emerald-400 to-teal-500' },
                { name: 'Bebidas', dbValue: 'BEBIDAS', icon: '🥤', color: 'from-blue-400 to-cyan-500' }
            ];
            
            let html = `
                <!-- Sección Hero Súper Compacta -->
                <div class="px-3 py-2 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-b-2xl mx-2 mb-3">
                    <div class="text-center">
                        <h2 id="productos-title" class="text-lg font-bold text-gray-800 mb-0.5">¿Qué se te antoja?</h2>
                        <p class="text-xs text-gray-600">Comida fresca y deliciosa</p>
                    </div>
                </div>
                
                <!-- Contenedor de productos para búsqueda -->
                <div id="productos-container">
            `;
            
            // Generar secciones por categoría popular
            categoriasPopulares.forEach(categoria => {
                const productosCategoria = productos.filter(p => p.clasificacion === categoria.dbValue);
                
                if (productosCategoria.length > 0) {
                    html += `
                        <div class="mb-4">
                            <!-- Header de categoría compacto -->
                            <div class="px-3 py-2 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <div class="w-8 h-8 bg-gradient-to-r ${categoria.color} rounded-xl flex items-center justify-center">
                                        <span class="text-sm">${categoria.icon}</span>
                                    </div>
                                    <div>
                                        <h3 class="font-bold text-gray-800 text-base">${categoria.name}</h3>
                                    </div>
                                </div>
                                <button class="bg-gradient-to-r ${categoria.color} text-white px-3 py-1.5 rounded-xl text-xs font-semibold hover:shadow-lg transition-all duration-300" 
                                        data-action="filter-category" data-category="${categoria.name}">
                                    Ver todos
                                </button>
                            </div>
                            
                            <!-- Grid horizontal súper compacto -->
                            <div class="overflow-x-auto hide-scrollbar scroll-container px-3">
                                <div class="flex gap-2 pb-1" style="width: max-content;">
                                    ${productosCategoria.slice(0, 6).map(p => `
                                        <div class="flex-shrink-0 w-28 group cursor-pointer" data-action="navigate" data-view="detalleProducto" data-id="${p.id}">
                                            <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg">
                                                <div class="relative h-16">
                                                    <img src="${p.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTQ0IiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTdhM2I0Ij7wn42977iMPC90ZXh0Pjwvc3ZnPg=='" class="w-full h-full object-cover">
                                                    <div class="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur-sm rounded-full w-6 h-6 flex items-center justify-center">
                                                        <i class="fas fa-heart text-gray-400 text-xs hover:text-red-500 transition-colors cursor-pointer"></i>
                                                    </div>
                                                </div>
                                                <div class="p-2">
                                                    <h4 class="font-semibold text-xs text-gray-800 leading-tight mb-1 line-clamp-1">${p.nombre}</h4>
                                                    <p class="text-xs text-gray-500 mb-1">${p.tienda.nombre}</p>
                                                    <div class="flex items-center justify-between">
                                                        <span class="font-bold text-emerald-600 text-xs">${this.formatPrice(p.precio, false)}</span>
                                                        <button class="bg-gradient-to-r from-emerald-500 to-teal-500 text-white w-5 h-5 rounded-lg text-xs hover:shadow-md transition-all flex items-center justify-center group-hover:scale-110">
                                                            <i class="fas fa-plus text-xs"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            
            html += `</div>`; // Cerrar el contenedor de productos
            
            return html;
        },
        
        /**
         * 📱 Grid compacto para productos filtrados
         */
        getCompactProductGridHTML(productos, categoria) {
            if (!productos || productos.length === 0) {
                return `
                    <div class="flex flex-col items-center justify-center p-8 text-center">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-search text-gray-400 text-xl"></i>
                        </div>
                        <h3 class="text-lg font-bold text-gray-600 mb-2">No hay productos de ${categoria}</h3>
                        <p class="text-gray-500 text-sm">Prueba con otra categoría o vuelve más tarde</p>
                        <button class="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg transition-all" 
                                data-action="filter-category" data-category="">
                            Ver todos los productos
                        </button>
                    </div>
                `;
            }
            
            return `
                <div class="px-3 py-2">
                    <!-- Header de resultados compacto -->
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <h2 class="text-base font-bold text-gray-800">${categoria}</h2>
                            <p class="text-xs text-gray-500">${productos.length} producto${productos.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button class="text-emerald-600 text-xs font-semibold hover:text-emerald-700 transition-colors" 
                                data-action="filter-category" data-category="">
                            Ver todos
                        </button>
                    </div>
                    
                    <!-- Grid súper compacto -->
                    <div class="grid grid-cols-2 gap-2">
                        ${productos.map(p => `
                            <div class="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02]" data-action="navigate" data-view="detalleProducto" data-id="${p.id}">
                                <div class="bg-white rounded-xl overflow-hidden shadow-sm group-hover:shadow-lg border border-gray-100">
                                    <div class="relative h-20">
                                        <img src="${p.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9Ijk2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjOTdhM2I0Ij7wn42977iNPC90ZXh0Pjwvc3ZnPg=='" class="w-full h-full object-cover">
                                        <!-- Badge de precio prominente -->
                                        <div class="absolute top-2 left-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                                            ${this.formatPrice(p.precio, false)}
                                        </div>
                                        <!-- Favorito sutil -->
                                        <div class="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <i class="fas fa-heart text-gray-400 text-xs hover:text-red-500 transition-colors cursor-pointer"></i>
                                        </div>
                                    </div>
                                    <div class="p-2">
                                        <h3 class="font-semibold text-xs text-gray-800 leading-tight mb-1 line-clamp-1">${p.nombre}</h3>
                                        <p class="text-xs text-gray-500 mb-1 line-clamp-1">${p.tienda.nombre}</p>
                                        
                                        <!-- Botón de acción compacto -->
                                        <button class="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-1.5 px-2 rounded-lg text-xs font-semibold shadow-sm group-hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1">
                                            <i class="fas fa-plus text-xs"></i>
                                            <span>Agregar</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        },

        /**
         * Nueva vista horizontal de productos por tienda
         */
        getProductosPorTiendaHTML(productosPorTienda) {
            if (!productosPorTienda || Object.keys(productosPorTienda).length === 0) {
                return `
                <div class="flex flex-col items-center justify-center p-8 text-center">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-utensils text-gray-400 text-xl"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-600 mb-2">No hay productos disponibles</h3>
                    <p class="text-gray-500 text-sm">Las tiendas estarán agregando productos pronto</p>
                </div>`;
            }
            
            return Object.entries(productosPorTienda).map(([tiendaNombre, data]) => {
                const { tienda, productos } = data;
                
                return `
                <div class="mb-6">
                    <!-- Header de la tienda -->
                    <div class="px-4 py-2 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                                ${getTiendaLogoHTML(tienda)}
                            </div>
                            <div>
                                <h3 class="font-bold text-gray-800 text-base">${tienda.nombre}</h3>
                                <p class="text-gray-500 text-xs">Productos frescos</p>
                            </div>
                        </div>
                        <button class="text-teal-600 text-xs font-semibold hover:text-teal-700 transition-colors bg-teal-50 px-2 py-1 rounded-md" data-action="navigate" data-view="tiendas" data-id="${tienda.id}">
                            Ver todos
                        </button>
                    </div>
                    
                    <!-- Scroll horizontal de productos -->
                    <div class="overflow-x-auto hide-scrollbar scroll-container px-4">
                        <div class="flex gap-2 pb-2" style="width: max-content;">
                            ${productos.map(p => `
                                <div class="flex-shrink-0 w-32 h-48 group cursor-pointer" data-action="navigate" data-view="detalleProducto" data-id="${p.id}">
                                    <div class="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 group-hover:scale-105 h-full flex flex-col">
                                        <div class="relative h-24 flex-shrink-0">
                                            <img src="${p.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9Ijk2IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9ImNlbnRyYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjI0IiBmaWxsPSIjOTdhM2I0Ij7wn42977iPPC90ZXh0Pjwvc3ZnPg=='" class="w-full h-full object-cover">
                                        </div>
                                        <div class="p-2 flex flex-col justify-between flex-grow">
                                            <div class="mb-1">
                                                <h4 class="font-medium text-xs text-gray-800 leading-tight line-clamp-2">${p.nombre}</h4>
                                            </div>
                                            <div class="flex items-center justify-between mt-auto">
                                                <span class="font-bold text-teal-600 text-sm">${this.formatPrice(p.precio, false)}</span>
                                                <button class="bg-teal-500 text-white w-6 h-6 rounded-full text-xs hover:bg-teal-600 transition-colors flex items-center justify-center">
                                                    <i class="fas fa-plus text-xs"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>`;
            }).join('');
        },

        /**
         * Grid compacto de productos (mejorado)
         */
        getSmallProductGridHTML(productos) {
            if (!productos || productos.length === 0) {
                return `
                <div class="text-center p-10">
                    <div class="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-box-open text-2xl text-gray-400"></i>
                    </div>
                    <p class="text-gray-500">No hay productos disponibles</p>
                </div>`;
            }
            
            return `
            <div class="px-3 py-3">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-bold text-gray-800">🍽️ Recomendados</h2>
                    <div class="flex space-x-1">
                        <button class="w-7 h-7 bg-gray-100 hover:bg-purple-100 rounded-lg flex items-center justify-center transition-colors">
                            <i class="fas fa-th text-gray-600 text-xs"></i>
                        </button>
                        <button class="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-list text-purple-600 text-xs"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Grid optimizado más compacto -->
                <div class="grid grid-cols-2 gap-3">
                    ${productos.slice(0, 6).map(p => `
                        <div class="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02]" data-action="navigate" data-view="detalleProducto" data-id="${p.id}">
                            <div class="bg-white rounded-xl overflow-hidden shadow-md group-hover:shadow-lg border border-gray-100">
                                <div class="relative">
                                    <img src="${p.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk3YTNiNCI+8J+NvSR7cC5ub21icmV9PC90ZXh0Pjwvc3ZnPg=='" class="w-full h-24 object-cover">
                                    <!-- Badge de precio más prominente -->
                                    <div class="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-lg">
                                        ${this.formatPrice(p.precio, false)}
                                    </div>
                                    <!-- Botón de favorito más sutil -->
                                    <div class="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md">
                                        <i class="fas fa-heart text-gray-400 text-xs hover:text-red-500 transition-colors cursor-pointer"></i>
                                    </div>
                                </div>
                                <div class="p-3">
                                    <h3 class="font-bold text-sm text-gray-800 leading-tight mb-1 line-clamp-1">${p.nombre}</h3>
                                    <p class="text-xs text-gray-500 mb-2 line-clamp-1">${p.tienda.nombre}</p>
                                    
                                    <!-- Botón de acción más pequeño y moderno -->
                                    <button class="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-3 rounded-lg text-xs font-medium shadow-sm group-hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1">
                                        <i class="fas fa-plus text-xs"></i>
                                        <span>Personalizar</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Ver más productos -->
                ${productos.length > 6 ? `
                <div class="mt-4 text-center">
                    <button class="bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-700 px-4 py-2 rounded-xl text-sm font-medium transition-all" data-action="navigate" data-view="tiendas">
                        Ver todos los productos
                    </button>
                </div>
                ` : ''}
            </div>`;
        },

        /**
         * 🍔 NUEVA FUNCIÓN: Vista de productos filtrados por categoría
         */
        getProductosPorCategoriaHTML(productos, categoria) {
            // Mapear categorías a iconos y gradientes
            const categoriaInfo = {
                'Desayuno': { icon: 'fa-coffee', gradient: 'from-amber-400 to-orange-400' },
                'Rápida': { icon: 'fa-hamburger', gradient: 'from-red-400 to-pink-400' },
                'Almuerzos': { icon: 'fa-utensils', gradient: 'from-teal-400 to-cyan-400' },
                'Bebidas': { icon: 'fa-glass-cheers', gradient: 'from-blue-400 to-indigo-400' },
                'Postres': { icon: 'fa-ice-cream', gradient: 'from-pink-400 to-rose-400' },
                'Snacks': { icon: 'fa-seedling', gradient: 'from-purple-400 to-indigo-400' },
                'Saludable': { icon: 'fa-leaf', gradient: 'from-green-400 to-emerald-400' }
            };

            const info = categoriaInfo[categoria] || { icon: 'fa-utensils', gradient: 'from-gray-400 to-gray-500' };

            if (!productos || productos.length === 0) {
                return `
                <div class="flex flex-col items-center justify-center p-8 text-center">
                    <div class="w-20 h-20 bg-gradient-to-r ${info.gradient} rounded-full flex items-center justify-center mb-4">
                        <i class="fas ${info.icon} text-white text-2xl"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-600 mb-2">No hay productos de ${categoria}</h3>
                    <p class="text-gray-500 text-sm mb-4">Las tiendas estarán agregando productos pronto</p>
                    <button class="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all" data-action="filter-category" data-category="${categoria}">
                        <i class="fas fa-arrow-left mr-2"></i>Ver todas las categorías
                    </button>
                </div>`;
            }

            // Agrupar productos por tienda para mostrar variedad
            const productosPorTienda = {};
            productos.forEach(producto => {
                const tiendaNombre = producto.tienda.nombre;
                if (!productosPorTienda[tiendaNombre]) {
                    productosPorTienda[tiendaNombre] = {
                        tienda: producto.tienda,
                        productos: []
                    };
                }
                productosPorTienda[tiendaNombre].productos.push(producto);
            });

            return `
            <div class="px-4 pb-4">
                <!-- Header de categoría -->
                <div class="bg-gradient-to-r ${info.gradient} rounded-2xl p-4 mb-6 text-white">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <i class="fas ${info.icon} text-2xl"></i>
                            </div>
                            <div>
                                <h2 class="text-xl font-bold">${categoria}</h2>
                                <p class="text-white/80 text-sm">${productos.length} producto${productos.length !== 1 ? 's' : ''} disponible${productos.length !== 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <button class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-all" data-action="filter-category" data-category="${categoria}">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>
                </div>

                <!-- Grid de productos por tienda -->
                ${Object.entries(productosPorTienda).map(([tiendaNombre, data]) => {
                    const { tienda, productos: productosT } = data;
                    return `
                    <div class="mb-6">
                        <!-- Header de tienda compacto -->
                        <div class="flex items-center gap-3 mb-3">
                            <div class="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm">
                                <img src="${tienda.logoUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjRjNGNEY2Ii8+PHBhdGggZD0iTTEyIDIwaDE2djhIMTJ2LTh6bTItMmg0djJoLTR2LTJ6bTYgMGg0djJoLTR2LTJ6IiBmaWxsPSIjOTdBM0I0Ii8+PC9zdmc+'" class="w-full h-full object-cover">
                            </div>
                            <div class="flex-1">
                                <h3 class="font-bold text-gray-800 text-sm">${tienda.nombre}</h3>
                                <p class="text-xs text-gray-500">${productosT.length} producto${productosT.length !== 1 ? 's' : ''} de ${categoria}</p>
                            </div>
                            <button class="text-teal-500 text-xs font-medium hover:text-teal-600" data-action="navigate" data-view="productosTienda" data-tienda-id="${tienda.id}">
                                Ver tienda <i class="fas fa-chevron-right text-xs ml-1"></i>
                            </button>
                        </div>

                        <!-- Grid de productos -->
                        <div class="grid grid-cols-2 gap-3">
                            ${productosT.map(p => `
                                <div class="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02]" data-action="navigate" data-view="detalleProducto" data-id="${p.id}">
                                    <div class="bg-white rounded-xl overflow-hidden shadow-sm group-hover:shadow-md border border-gray-100">
                                        <div class="relative">
                                            <img src="${p.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk3YTNiNCI+8J2NvfCfja0+PC90ZXh0Pjwvc3ZnPg=='" class="w-full h-24 object-cover">
                                            <div class="absolute top-2 left-2 bg-gradient-to-r ${info.gradient} text-white px-2 py-1 rounded-lg text-xs font-bold shadow-md">
                                                ${this.formatPrice(p.precio, false)}
                                            </div>
                                        </div>
                                        <div class="p-3">
                                            <h4 class="font-bold text-sm text-gray-800 leading-tight mb-1 line-clamp-1">${p.nombre}</h4>
                                            <p class="text-xs text-gray-500 mb-2 line-clamp-1">${p.descripcion || 'Delicioso producto'}</p>
                                            
                                            <button class="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-2 px-3 rounded-lg text-xs font-medium shadow-sm group-hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1">
                                                <i class="fas fa-plus text-xs"></i>
                                                <span>Personalizar</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>`;
                }).join('')}
                
                <!-- Botón para quitar filtro -->
                <div class="mt-6 text-center">
                    <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 mx-auto" data-action="filter-category" data-category="${categoria}">
                        <i class="fas fa-arrow-left"></i>
                        <span>Ver todas las categorías</span>
                    </button>
                </div>
            </div>`;
        },

        /**
         * Grid de productos de una tienda específica (nuevo diseño moderno)
         */
        getProductosTiendaHTML(productos, tienda) {
            // Validar si existe la tienda
            if (!tienda) {
                return this.getErrorHTML(
                    '¡Ups! Algo salió mal',
                    'No pudimos cargar la información de la tienda.<br>Esto puede pasar si refrescaste la página.',
                    [
                        { text: '🏪 Ver Tiendas', view: 'tiendas', icon: 'fas fa-store' },
                        { text: '🏠 Ir a Inicio', view: 'inicio', icon: 'fas fa-home' }
                    ]
                );
            }

            if (!productos || productos.length === 0) {
                return `
                <div class="text-center p-12">
                    <div class="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-utensils text-3xl text-gray-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-gray-600 mb-2">No hay productos</h3>
                    <p class="text-gray-500 mb-4">Esta tienda no tiene productos disponibles.</p>
                    <button class="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all" data-action="navigate" data-view="tiendas">
                        Ver otras tiendas
                    </button>
                </div>`;
            }

            return `
            <div class="px-3 py-2">
                <!-- Header de info de la tienda -->
                <div class="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-4 mb-4 border border-teal-100">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <i class="fas fa-store text-white text-lg"></i>
                        </div>
                        <div class="flex-1">
                            <h2 class="font-bold text-gray-800">${tienda.nombre}</h2>
                            <p class="text-sm text-gray-600">${productos.length} productos disponibles</p>
                        </div>
                        <div class="text-right">
                            <div class="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-check text-emerald-600 text-sm"></i>
                            </div>
                            <p class="text-xs text-emerald-600 font-medium mt-1">Abierto</p>
                        </div>
                    </div>
                </div>

                <!-- Grid de productos con el mismo diseño del inicio -->
                <div class="p-3">
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        ${productos.map(p => `
                            <div class="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transform transition duration-200 hover:scale-105 border border-gray-100" data-action="navigate" data-view="detalleProducto" data-id="${p.id}">
                                <div class="relative">
                                    <img src="${p.imagenUrl}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTJlOGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJjZW50cmFsIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk3YTNiNCI+🍽️</text></svg>'" class="w-full h-20 object-cover">
                                    <!-- Botón + en la esquina superior derecha más pequeño -->
                                    <button class="absolute top-1.5 right-1.5 w-6 h-6 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors" onclick="event.stopPropagation()">
                                        <i class="fas fa-plus text-xs"></i>
                                    </button>
                                </div>
                                <div class="p-2.5">
                                    <h3 class="font-semibold text-xs text-slate-800 truncate leading-tight">${p.nombre}</h3>
                                    <p class="text-xs text-slate-500 truncate">${tienda.nombre}</p>
                                    <p class="font-bold text-teal-600 mt-1 text-sm">${this.formatPrice(p.precio, false)}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Footer con info adicional -->
                ${State.carrito.length > 0 ? `
                <div class="mt-6 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium">Tu pedido actual</p>
                            <p class="text-xs opacity-90">${State.carrito.length} producto${State.carrito.length !== 1 ? 's' : ''} seleccionado${State.carrito.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button class="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/30 transition-all" data-action="navigate" data-view="carrito">
                            Ver carrito
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>`;
        },

        // 🎯 NUEVAS FUNCIONES PARA MANEJAR PEDIDOS ANTERIORES
        async mostrarPedidosAnteriores() {
            const pedidos = await SmartCache.getMisPedidosOptimized();
            const container = document.getElementById('app-container');
            if (container) {
                container.innerHTML = this.getMisPedidosHTML(pedidos, true);
            }
        },

        async mostrarSoloPedidosActivos() {
            const pedidos = await SmartCache.getMisPedidosOptimized();
            const container = document.getElementById('app-container');
            if (container) {
                container.innerHTML = this.getMisPedidosHTML(pedidos, false);
            }
        },

        // 🍔 NUEVA FUNCIÓN PARA FILTRAR POR CATEGORÍA
        async filtrarPorCategoria(categoria) {
            console.log('🍽️ Filtrando por categoría:', categoria);
            
            // Actualizar estado de categoría
            if (State.categoriaSeleccionada === categoria) {
                // Si ya está seleccionada, quitar filtro
                State.categoriaSeleccionada = null;
            } else {
                State.categoriaSeleccionada = categoria;
            }
            
            // Recargar vista inicio con filtro aplicado
            this.render('inicio');
        },

        // 🗂️ FUNCIÓN PARA MAPEAR CATEGORÍAS DE FRONTEND A BD
        getCategoryMapping() {
            return {
                'Desayuno': 'DESAYUNO',
                'Rápida': 'COMIDA_RAPIDA', 
                'Almuerzos': 'ALMUERZO',
                'Bebidas': 'BEBIDAS',
                'Postres': 'POSTRES',
                'Snacks': 'SNACKS',
                'Saludable': 'SALUDABLE',
                'Sin categoría': 'SIN_CATEGORIA'
            };
        },

        // 🔍 FUNCIÓN PARA OBTENER VALOR DE BD DESDE NOMBRE DE CATEGORÍA
        getDbValueFromCategory(categoryName) {
            const mapping = this.getCategoryMapping();
            return mapping[categoryName] || null;
        },
    };
    
    const AppController = {
        init() {
            // Configurar navegación del historial
            this.setupInitialView();
            
            document.body.addEventListener('click', e => {
                const target = e.target.closest('[data-action]');
                if (!target) {
                    if (e.target.matches('input[type="checkbox"]')) Views.updateTotalProducto();
                    return;
                }
                e.preventDefault();
                const { action, view, id, op, index } = target.dataset;
                const tiendaId = target.dataset.tiendaId; // Convierte data-tienda-id a tiendaId
                
                console.log('🖱️ Click detectado:', { action, view, id, tiendaId, target: target.outerHTML.substring(0, 100) });

                switch(action) {
                    case 'navigate': 
                        Views.render(view, { id: id || tiendaId, tiendaId }); 
                        break;
                    case 'filter-category': 
                        Views.filtrarPorCategoria(target.dataset.category); 
                        break;
                    case 'add-custom-to-cart': this.agregarProductoPersonalizado(); break;
                    case 'update-qty': this.actualizarCantidadProducto(parseInt(op)); break;
                    case 'remove-from-cart': this.removerDelCarrito(parseInt(index)); break;
                    case 'checkout': this.enviarPedido(); break;
                    case 'change-entrega': this.cambiarTipoEntrega(target.value); break;
                    case 'change-pago': this.cambiarTipoPago(target.value); break;
                    case 'set-pago': this.cambiarTipoPago(target.dataset.tipo); break;
                    case 'change-notas-generales': this.cambiarNotasGenerales(target.value); break;
                    case 'change-notas-domicilio': this.cambiarNotasDomicilio(target.value); break;
                }
            });
            Nav.addEventListener('click', e => {
                const navLink = e.target.closest('.nav-link');
                if (navLink) { e.preventDefault(); Views.render(navLink.dataset.view); }
            });
            
            // � FUNCIONALIDAD DE BÚSQUEDA
            document.addEventListener('input', e => {
                if (e.target.id === 'searchInput') {
                    this.manejarBusqueda(e.target.value);
                }
            });
            
            // �🔄 Cargar vista persistida o vista por defecto
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

        // Determinar vista inicial al cargar/refrescar
        setupInitialView() {
            const hash = window.location.hash.slice(1); // Remover #
            
            if (hash && hash !== 'login') {
                // Si hay un hash válido, intentar navegar ahí
                const [view, ...params] = hash.split('/');
                this.handleDeepLink(view, params);
            } else {
                // Vista por defecto
                Views.render('inicio');
            }
        },

        // Manejar enlaces profundos (deep links)
        async handleDeepLink(view, params) {
            try {
                switch (view) {
                    case 'tienda':
                        if (params[0]) {
                            const tiendaId = parseInt(params[0]);
                            Views.render('productosTienda', { tiendaId });
                        } else {
                            Views.render('tiendas');
                        }
                        break;
                        
                    case 'producto':
                        if (params[0]) {
                            const productoId = parseInt(params[0]);
                            Views.render('detalleProducto', { id: productoId });
                        } else {
                            Views.render('inicio');
                        }
                        break;
                        
                    case 'tiendas':
                        Views.render('tiendas');
                        break;
                        
                    case 'carrito':
                        Views.render('carrito');
                        break;
                        
                    case 'misPedidos':
                        Views.render('misPedidos');
                        break;
                        
                    default:
                        Views.render('inicio');
                }
            } catch (error) {
                console.error('Error en deep link:', error);
                Views.render('inicio');
            }
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
                tiendaId: productoBase.tienda.id,
                tiendaNombre: productoBase.tienda.nombre // Agregar nombre de la tienda
            });
            
            // 💾 Guardar carrito en localStorage
            window.CarritoPersistente.guardar();
            
            State.tiendaActual = { id: productoBase.tienda.id, nombre: productoBase.tienda.nombre };
            Toast.show(`${cantidad}x "${productoBase.nombre}" añadido.`, 'success');
            Views.renderFloatingCartButton();
            Views.render('productosTienda', { tiendaId: productoBase.tienda.id });
        },

        removerDelCarrito(index) {
            State.carrito.splice(index, 1);
            if(State.carrito.length === 0) State.tiendaActual = null;
            
            // 💾 Guardar cambios en localStorage
            window.CarritoPersistente.guardar();
            Views.render('carrito');
        },
        
        async enviarPedido() {
            // 🚨 Validación obligatoria: dirección para domicilio
            if (State.tipoEntrega === 'domicilio' && (!State.notasDomicilio || State.notasDomicilio.trim() === '')) {
                Toast.show('⚠️ La dirección de entrega es obligatoria para domicilio', 'error');
                return;
            }
            
            const boton = document.querySelector('[data-action="checkout"]');
            boton.disabled = true;
            boton.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...`;
            
            const dto = {
                tiendaId: State.tiendaActual.id,
                items: State.carrito.map(item => ({
                    id: item.productoId,
                    cantidad: item.cantidad,
                    opcionesIds: item.opciones.map(op => op.id)
                })),
                // 🚛 Incluir información de entrega y pago
                tipoEntrega: State.tipoEntrega,
                tipoPago: State.tipoPago,
                notasGenerales: State.notasGenerales || '',
                notasDomicilio: State.notasDomicilio || ''
            };

            try {
                const response = await Api.crearPedido(dto);
                
                // 🎯 ACTUALIZACIÓN INMEDIATA: Crear pedido temporal para la caché
                const nuevoPedidoTemporal = {
                    id: 'temp-' + Date.now(), // ID temporal
                    nombreTienda: State.tiendaActual?.nombre || 'Tienda',
                    total: State.carrito.reduce((sum, item) => sum + item.subtotal, 0),
                    estado: 'PENDIENTE',
                    fechaCreacion: new Date().toISOString(),
                    items: State.carrito.map(item => ({
                        id: item.productoId,
                        cantidad: item.cantidad,
                        opcionesIds: item.opciones.map(op => op.id)
                    })),
                    tipoEntrega: State.tipoEntrega,
                    tipoPago: State.tipoPago,
                    notasGenerales: State.notasGenerales || '',
                    notasDomicilio: State.notasDomicilio || ''
                };

                // � Actualizar caché inmediatamente
                const pedidosActuales = State.pedidosCache.data || [];
                const pedidosActualizados = [nuevoPedidoTemporal, ...pedidosActuales];
                SmartCache.saveToCache(pedidosActualizados);
                
                // �🕒 Marcar timestamp del pedido para flujo de notificaciones
                localStorage.setItem('last-order-time', Date.now().toString());
                
                Toast.show("¡Pedido realizado con éxito!", 'success');
                
                // 🧹 Limpiar carrito y estado
                State.carrito = [];
                State.tiendaActual = null;
                State.tipoEntrega = 'domicilio';
                State.tipoPago = 'efectivo';
                State.notasGenerales = '';
                State.notasDomicilio = '';
                
                // 💾 Limpiar localStorage del carrito
                window.CarritoPersistente.limpiar();
                
                Views.renderFloatingCartButton();
                
                // 🔔 NUEVO FLUJO: Verificar permisos DESPUÉS del pedido exitoso
                await this.handlePostOrderNotificationPermissions();
                
                // 🎯 Navegar a pedidos - ahora mostrará inmediatamente el nuevo pedido
                Views.render('misPedidos');
                
                // 🔄 Forzar actualización en 2 segundos para obtener datos reales del servidor
                setTimeout(async () => {
                    try {
                        const pedidosReales = await Api.getMisPedidos();
                        SmartCache.saveToCache(pedidosReales);
                        if (document.getElementById('app-container') && State.vistaActual === 'misPedidos') {
                            // 🎯 Solo mostrar pedidos activos por defecto (false = no mostrar todos)
                            document.getElementById('app-container').innerHTML = Views.getMisPedidosHTML(pedidosReales, false);
                        }
                    } catch (error) {
                        console.log('Error actualizando pedidos reales:', error);
                    }
                }, 2000);
                
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
        },

        // 🚛 Métodos para manejar cambios en el carrito
        cambiarTipoEntrega(tipo) {
            State.tipoEntrega = tipo;
            window.CarritoPersistente.guardar();
            console.log('🚛 Tipo de entrega cambiado a:', tipo);
            // Re-renderizar el carrito para mostrar/ocultar campos de domicilio
            Views.render('carrito');
        },

        cambiarTipoPago(tipo) {
            State.tipoPago = tipo;
            window.CarritoPersistente.guardar();
            console.log('💳 Tipo de pago cambiado a:', tipo);
            // Re-renderizar el carrito para mostrar el cambio visual
            Views.render('carrito');
        },

        cambiarNotasGenerales(notas) {
            State.notasGenerales = notas;
            window.CarritoPersistente.guardar();
            console.log('📝 Notas generales actualizadas:', notas.substring(0, 50));
        },

        cambiarNotasDomicilio(notas) {
            State.notasDomicilio = notas;
            window.CarritoPersistente.guardar();
            console.log('🏠 Notas de domicilio actualizadas:', notas.substring(0, 50));
        },
        
        // 🔍 NUEVA FUNCIONALIDAD DE BÚSQUEDA
        debounceTimer: null,
        
        manejarBusqueda(termino) {
            // Limpiar el timer anterior
            clearTimeout(this.debounceTimer);
            
            // Ejecutar la búsqueda después de 300ms de inactividad
            this.debounceTimer = setTimeout(() => {
                this.ejecutarBusqueda(termino);
            }, 300);
        },
        
        async ejecutarBusqueda(termino) {
            console.log('🔍 Ejecutando búsqueda para:', termino);
            
            try {
                if (!termino || termino.trim() === '') {
                    // Si está vacío, mostrar productos populares
                    const productos = await Api.getProductosPopulares();
                    this.mostrarResultadosBusqueda(productos, '');
                } else {
                    // Ejecutar búsqueda con el término
                    const productos = await Api.buscarProductos(termino.trim());
                    this.mostrarResultadosBusqueda(productos, termino.trim());
                }
            } catch (error) {
                console.error('❌ Error en búsqueda:', error);
                Toast.show('Error al buscar productos', 'error');
            }
        },
        
        mostrarResultadosBusqueda(productos, termino) {
            console.log('📋 Mostrando resultados de búsqueda:', productos.length, 'productos');
            
            // Buscar el contenedor de productos en la vista inicio
            const productosContainer = document.querySelector('#productos-container');
            if (!productosContainer) {
                console.warn('⚠️ No se encontró contenedor de productos');
                return;
            }
            
            // Actualizar el título de la sección
            const tituloSection = document.querySelector('#productos-title');
            if (tituloSection) {
                if (termino) {
                    tituloSection.textContent = `Resultados para "${termino}" (${productos.length})`;
                } else {
                    tituloSection.textContent = 'Productos Populares';
                }
            }
            
            // Mostrar los productos usando la función existente
            if (productos.length === 0) {
                productosContainer.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
                        <p class="text-gray-500">No se encontraron productos para "${termino}"</p>
                        <p class="text-sm text-gray-400 mt-2">Intenta con otro término de búsqueda</p>
                    </div>
                `;
            } else {
                productosContainer.innerHTML = Views.getCompactProductGridHTML(productos);
            }
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
    window.CarritoPersistente = CarritoPersistente;

    // Configurar manejo del historial antes de inicializar
    Views.setupHistoryManagement();
    
    // Inicializar controlador
    AppController.init();
    
    // 💾 Cargar carrito desde localStorage DESPUÉS de inicializar
    setTimeout(() => {
        console.log('🔍 Intentando cargar carrito desde localStorage...');
        const carritoRecuperado = CarritoPersistente.cargar();
        console.log('🛒 Estado del carrito después de cargar:', {
            recuperado: carritoRecuperado,
            carritoLength: State.carrito.length,
            carritoContent: State.carrito
        });
        
        // Forzar actualización de UI si se recuperó el carrito
        if (carritoRecuperado && State.carrito.length > 0) {
            setTimeout(() => {
                try {
                    if (typeof UI !== 'undefined' && UI.renderFloatingCartButton) {
                        UI.renderFloatingCartButton();
                        console.log('🛒🔄 UI del carrito actualizada después de la recuperación');
                    } else {
                        // Fallback: crear botón manualmente
                        let boton = document.getElementById('floating-cart-btn');
                        if (!boton) {
                            const totalItems = State.carrito.reduce((sum, item) => sum + item.cantidad, 0);
                            boton = document.createElement('div');
                            boton.id = 'floating-cart-btn';
                            boton.className = 'fixed bottom-20 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl shadow-lg flex items-center justify-center h-12 w-12 cursor-pointer z-50 transform transition-all duration-300 hover:scale-110 hover:shadow-xl';
                            boton.innerHTML = `
                                <i class="fas fa-shopping-cart text-lg"></i>
                                <span class="cart-count absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-bounce border-2 border-white">${totalItems}</span>
                            `;
                            boton.dataset.action = 'navigate';
                            boton.dataset.view = 'carrito';
                            document.body.appendChild(boton);
                            console.log('🔧 Botón del carrito creado manualmente (fallback en inicialización)');
                        }
                    }
                } catch (error) {
                    console.error('❌ Error en inicialización del carrito:', error);
                }
            }, 200);
        }
    }, 100);
});