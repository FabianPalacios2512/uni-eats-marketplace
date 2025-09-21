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
        vistaActual: null,
        tiendaActual: null,
        productoSeleccionado: null,
        carrito: [],
        csrfToken: document.querySelector("meta[name='_csrf']")?.getAttribute("content"),
        csrfHeader: document.querySelector("meta[name='_csrf_header']")?.getAttribute("content"),
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

    // Módulo para renderizar todas las vistas y componentes
    const Views = {
        formatPrice: (price, sign = true) => {
            if (price === 0 && sign) return 'Gratis';
            const prefix = sign && price > 0 ? '+ ' : '';
            return prefix + new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price);
        },

        async render(view, params = null) {
            State.vistaActual = view;
            this.updateNav();
            this.renderSkeleton(view);

            try {
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
                        const pedidos = await Api.getMisPedidos();
                        Container.innerHTML = this.getMisPedidosHTML(pedidos);
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
                case 'inicio': return `<div class="relative w-full px-4 mt-2">
       <input type="search" placeholder="Buscar..." class="w-11/12 mx-auto bg-slate-100 placeholder-gray-500 text-gray-800 border border-transparent rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500 transition-shadow duration-150 shadow-sm">
       <span class="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-search"></i></span>
    </div>`;
                case 'tiendas': return `<h1 class="text-xl font-bold text-slate-800">Todas las Tiendas</h1>`;
                case 'perfil': return `<h1 class="text-xl font-bold text-slate-800">Mi Perfil</h1>`;
                case 'carrito': return `<div class="flex items-center gap-3"><button class="nav-back-btn" data-action="navigate" data-view="tiendas" data-id="${State.tiendaActual?.id}"><i class="fas fa-arrow-left"></i></button><h1 class="text-xl font-bold text-slate-800">Tu Pedido</h1></div>`;
                case 'misPedidos': return `<div class="flex items-center gap-3"><button class="nav-back-btn" data-action="navigate" data-view="perfil"><i class="fas fa-arrow-left"></i></button><h1 class="text-xl font-bold text-slate-800">Mis Pedidos</h1></div>`;
                case 'detalleProducto': return `<div class="flex items-center gap-3"><button class="nav-back-btn" data-action="navigate" data-view="${backViewTarget}" data-id="${State.tiendaActual?.id}"><i class="fas fa-arrow-left"></i></button><h1 class="text-xl font-bold text-slate-800 truncate">${data.nombre}</h1></div>`;
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
                            <img src="${p.imagenUrl || 'https://via.placeholder.com/300'}" class="w-full h-24 object-cover">
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
                        <img src="${producto.imagenUrl || 'https://via.placeholder.com/400x200'}" class="w-full h-48 object-cover rounded-t-2xl">
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
            
            const total = State.carrito.reduce((sum, item) => sum + item.precioFinal * item.cantidad, 0);
            const itemsHtml = State.carrito.map((item, index) => `
                <div class="flex items-start gap-4 py-4 border-b">
                    <div class="flex-grow">
                        <p class="font-bold">${item.cantidad}x ${item.nombre}</p>
                        ${item.opciones.map(op => `<p class="text-xs text-slate-500">+ ${op.nombre}</p>`).join('')}
                    </div>
                    <p class="font-semibold w-24 text-right">${this.formatPrice(item.precioFinal * item.cantidad, false)}</p>
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
            if (!pedidos || pedidos.length === 0) return `<div class="text-center p-10"><i class="fas fa-box-open text-5xl text-slate-300"></i><p class="mt-4 text-slate-500">Aún no has realizado pedidos.</p></div>`;
            
            const statusConfig = {
                'PENDIENTE': { text: 'En espera de aprobación', icon: 'fa-hourglass-start', color: 'text-amber-500' },
                'EN_PREPARACION': { text: 'Pedido en preparación', icon: 'fa-utensils', color: 'text-blue-500' },
                'LISTO_PARA_RECOGER': { text: '¡Listo para recoger!', icon: 'fa-shopping-bag', color: 'text-green-500' },
                'COMPLETADO': { text: 'Entregado', icon: 'fa-check-circle', color: 'text-gray-500' },
                'CANCELADO': { text: 'Cancelado', icon: 'fa-times-circle', color: 'text-red-500' }
            };

            return pedidos.map(pedido => {
                const currentStatus = statusConfig[pedido.estado] || {};
                return `
                <div class="bg-white rounded-xl shadow-sm p-4 mb-4 space-y-3">
                    <div class="flex justify-between items-center">
                        <div><p class="font-bold text-slate-800">${pedido.nombreTienda}</p><p class="text-xs text-slate-500">Pedido #${pedido.id} &bull; ${new Date(pedido.fechaCreacion).toLocaleDateString()}</p></div>
                        <p class="font-bold text-lg">${this.formatPrice(pedido.total, false)}</p>
                    </div>
                    <div class="border-t pt-3">
                        <p class="font-semibold text-md ${currentStatus.color} flex items-center gap-2"><i class="fas ${currentStatus.icon}"></i><span>${currentStatus.text}</span></p>
                        <div class="flex justify-between text-xs text-center mt-2">
                            <div class="w-1/4 ${pedido.estado === 'PENDIENTE' ? 'font-bold text-indigo-600' : 'text-slate-400'}"><i class="fas fa-receipt"></i><p>Pedido</p></div>
                            <div class="w-1/4 ${pedido.estado === 'EN_PREPARACION' ? 'font-bold text-indigo-600' : 'text-slate-400'}"><i class="fas fa-utensils"></i><p>Preparando</p></div>
                            <div class="w-1/4 ${pedido.estado === 'LISTO_PARA_RECOGER' ? 'font-bold text-indigo-600' : 'text-slate-400'}"><i class="fas fa-shopping-bag"></i><p>Listo</p></div>
                            <div class="w-1/4 ${pedido.estado === 'COMPLETADO' ? 'font-bold text-indigo-600' : 'text-slate-400'}"><i class="fas fa-check"></i><p>Entregado</p></div>
                        </div>
                    </div>
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
                                    <img src="${p.imagenUrl || 'https://via.placeholder.com/120'}" class="w-full h-20 object-cover">
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
            Views.render('inicio');
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
                Toast.show("¡Pedido realizado con éxito!", 'success');
                State.carrito = [];
                State.tiendaActual = null;
                Views.renderFloatingCartButton();
                Views.render('misPedidos');
            } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
                boton.disabled = false;
                boton.innerHTML = 'Confirmar Pedido';
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

    AppController.init();
});