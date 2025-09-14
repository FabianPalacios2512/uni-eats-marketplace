/**
 * @file Script principal para la App de Compradores de Uni-Eats.
 * @description Gestiona la renderización, lógica y comunicación con el API.
 * @version 2.0 (Diseño Pro y Ciclo de Compra Completo)
 */
document.addEventListener("DOMContentLoaded", () => {
    const appContainer = document.getElementById("app-container");

    const App = {
        state: {
            carrito: [],
            tiendaActual: null,
            vistaActual: 'listaTiendas', // 'listaTiendas', 'detalleTienda', 'carrito'
            csrfToken: document.querySelector("meta[name='_csrf']")?.getAttribute("content"),
            csrfHeader: document.querySelector("meta[name='_csrf_header']")?.getAttribute("content"),
        },

        // --- NÚCLEO DE LA APP ---
        async init() {
            // Usamos delegación de eventos en el contenedor principal para manejar todos los clics
            appContainer.addEventListener('click', (e) => this.handleGlobalClick(e));
            this.navigate('listaTiendas');
        },

        async navigate(view, params = null) {
            this.state.vistaActual = view;
            Views.renderLoading();
            try {
                switch (view) {
                    case 'listaTiendas':
                        const tiendas = await Api.getTiendas();
                        Views.renderStoreList(tiendas);
                        break;
                    case 'detalleTienda':
                        const tienda = await Api.getTiendaDetalle(params.id);
                        this.state.tiendaActual = tienda;
                        Views.renderStoreDetail(tienda);
                        break;
                    case 'carrito':
                        Views.renderCartView();
                        break;
                }
            } catch (error) {
                Views.renderError(error.message);
            }
        },

        handleGlobalClick(e) {
            const tiendaCard = e.target.closest('[data-action="ver-tienda"]');
            const addToCartBtn = e.target.closest('[data-action="add-to-cart"]');
            const verCarritoBtn = e.target.closest('[data-action="ver-carrito"]');
            const cartActionBtn = e.target.closest('[data-cart-action]');
            const realizarPedidoBtn = e.target.closest('[data-action="realizar-pedido"]');

            if (tiendaCard) this.navigate('detalleTienda', { id: tiendaCard.dataset.id });
            if (verCarritoBtn) this.navigate('carrito');
            if (realizarPedidoBtn) this.enviarPedido();
            
            if (addToCartBtn) {
                const productoCard = addToCartBtn.closest('.producto-card');
                this.agregarAlCarrito(productoCard.dataset);
            }
            if (cartActionBtn) {
                this.actualizarCantidadCarrito(cartActionBtn.dataset.cartAction, parseInt(cartActionBtn.dataset.id));
            }
        },

        // --- LÓGICA DEL CARRITO ---
        agregarAlCarrito(productoData) {
            const productoId = parseInt(productoData.productId);

            // Regla: No se puede añadir de otra tienda sin vaciar el carrito
            if (this.state.carrito.length > 0 && this.state.carrito[0].tiendaId !== this.state.tiendaActual.id) {
                Toast.show("Solo puedes pedir de una tienda a la vez.", "error");
                return;
            }

            let item = this.state.carrito.find(p => p.id === productoId);
            if (item) {
                item.cantidad++;
            } else {
                this.state.carrito.push({
                    id: productoId,
                    nombre: productoData.productNombre,
                    precio: parseFloat(productoData.productPrecio),
                    cantidad: 1,
                    tiendaId: this.state.tiendaActual.id
                });
            }
            Toast.show(`"${productoData.productNombre}" añadido al carrito.`, 'success');
            Views.renderFloatingCartButton();
        },

        actualizarCantidadCarrito(action, productoId) {
            let item = this.state.carrito.find(p => p.id === productoId);
            if (!item) return;

            if (action === 'increase') {
                item.cantidad++;
            } else if (action === 'decrease') {
                item.cantidad--;
                if (item.cantidad === 0) {
                    this.state.carrito = this.state.carrito.filter(p => p.id !== productoId);
                }
            }
            this.navigate('carrito'); // Re-renderiza la vista del carrito
        },
        
        async enviarPedido() {
            const boton = document.querySelector('[data-action="realizar-pedido"]');
            boton.disabled = true;
            boton.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...`;

            const pedidoDTO = {
                tiendaId: this.state.tiendaActual.id,
                items: this.state.carrito.map(item => ({ id: item.id, cantidad: item.cantidad }))
            };

            try {
                await Api.crearPedido(pedidoDTO);
                Toast.show("¡Pedido realizado con éxito!", 'success');
                this.state.carrito = [];
                this.navigate('listaTiendas');
            } catch (error) {
                Toast.show(`Error: ${error.message}`, 'error');
                boton.disabled = false;
                boton.innerHTML = 'Reintentar Pedido';
            }
        }
    };

    // --- MÓDULO DE API (Llamadas al Backend) ---
    const Api = {
        _fetch: async (url, options = {}) => {
            const headers = { 'Content-Type': 'application/json', ...options.headers };
            if (options.method === 'POST') {
                headers[App.state.csrfHeader] = App.state.csrfToken;
            }
            const response = await fetch(url, { ...options, headers });
            if (!response.ok) throw new Error(await response.text());
            return response.json();
        },
        getTiendas: () => Api._fetch('/api/marketplace/tiendas'),
        getTiendaDetalle: (id) => Api._fetch(`/api/marketplace/tiendas/${id}`),
        crearPedido: (dto) => Api._fetch('/api/pedidos/crear', { method: 'POST', body: JSON.stringify(dto) })
    };

    // --- MÓDULO DE VISTAS (Todo el HTML) ---
    const Views = {
        formatPrice: (price) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price),

        renderLoading: () => { appContainer.innerHTML = `<div class="flex justify-center items-center h-screen"><i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i></div>`; },
        renderError: (msg) => { appContainer.innerHTML = `<div class="p-8 text-center text-red-600"><p><strong>Error:</strong> ${msg}</p></div>`; },

        renderStoreList(tiendas) {
            Views.renderFloatingCartButton(true); // Ocultar el botón
            const tiendasHtml = tiendas.map(tienda => `
                <div class="bg-white rounded-2xl shadow-lg m-4 overflow-hidden cursor-pointer transition-transform hover:scale-105" data-action="ver-tienda" data-id="${tienda.id}">
                    <div class="h-40 bg-cover bg-center" style="background-image: url('${tienda.logoUrl || 'https://via.placeholder.com/400x200'}')"></div>
                    <div class="p-4">
                        <h2 class="font-bold text-xl text-slate-800">${tienda.nombre}</h2>
                        <p class="text-slate-600 text-sm mt-1 line-clamp-2">${tienda.descripcion}</p>
                    </div>
                </div>`).join('');
            appContainer.innerHTML = `
                <header class="p-4 sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
                    <h1 class="text-3xl font-bold text-slate-900">Uni-Eats</h1>
                    <p class="text-slate-500">Pide de las mejores tiendas.</p>
                </header>
                <div class="grid grid-cols-1 md:grid-cols-2">${tiendasHtml}</div>`;
        },

        renderStoreDetail(tienda) {
            const productosHtml = tienda.productos.map(p => `
                <div class="producto-card" data-product-id="${p.id}" data-product-nombre="${p.nombre}" data-product-precio="${p.precio}">
                    <div class="flex-grow">
                        <h3 class="font-semibold text-slate-800">${p.nombre}</h3>
                        <p class="text-sm text-slate-500">${p.descripcion || ''}</p>
                        <p class="font-bold text-indigo-600 mt-1">${this.formatPrice(p.precio)}</p>
                    </div>
                    <img src="${p.imagenUrl || 'https://via.placeholder.com/150'}" alt="${p.nombre}" class="w-24 h-24 rounded-lg object-cover">
                    <button class="add-to-cart-btn" data-action="add-to-cart"><i class="fas fa-plus"></i></button>
                </div>`).join('');
            appContainer.innerHTML = `
                <header class="p-4">
                    <button class="text-indigo-600 font-semibold mb-4" data-action="ver-tienda" data-id=""><i class="fas fa-arrow-left mr-2"></i>Volver a tiendas</button>
                    <div class="flex items-center gap-4">
                        <img src="${tienda.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" class="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg">
                        <div>
                            <h1 class="text-3xl font-bold text-slate-900">${tienda.nombre}</h1>
                            <p class="text-slate-500">${tienda.descripcion}</p>
                        </div>
                    </div>
                </header>
                <div class="p-4 space-y-3">${productosHtml}</div>`;
            Views.renderFloatingCartButton();
        },

        renderCartView() {
            Views.renderFloatingCartButton(true); // Ocultar el botón
            if (App.state.carrito.length === 0) {
                appContainer.innerHTML = `<div class="p-4"><button class="text-indigo-600 font-semibold mb-4" data-action="ver-tienda" data-id="${App.state.tiendaActual.id}"><i class="fas fa-arrow-left mr-2"></i>Volver a la tienda</button><div class="text-center p-10"><i class="fas fa-shopping-cart text-5xl text-slate-300"></i><p class="mt-4 text-slate-500">Tu carrito está vacío.</p></div></div>`;
                return;
            }
            
            const total = App.state.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
            const itemsHtml = App.state.carrito.map(item => `
                <div class="flex items-center gap-4 py-4 border-b">
                    <div class="flex-grow">
                        <p class="font-semibold">${item.nombre}</p>
                        <p class="text-sm text-slate-500">${this.formatPrice(item.precio)}</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button class="cart-qty-btn" data-cart-action="decrease" data-id="${item.id}">-</button>
                        <span class="font-bold w-5 text-center">${item.cantidad}</span>
                        <button class="cart-qty-btn" data-cart-action="increase" data-id="${item.id}">+</button>
                    </div>
                    <p class="font-semibold w-20 text-right">${this.formatPrice(item.precio * item.cantidad)}</p>
                </div>`).join('');

            appContainer.innerHTML = `
                <header class="p-4">
                    <button class="text-indigo-600 font-semibold mb-4" data-action="ver-tienda" data-id="${App.state.tiendaActual.id}"><i class="fas fa-arrow-left mr-2"></i>Volver a la tienda</button>
                    <h1 class="text-3xl font-bold text-slate-900">Tu Pedido</h1>
                </header>
                <div class="p-4">${itemsHtml}</div>
                <div class="p-4 mt-4 bg-white rounded-t-2xl shadow-inner-top">
                    <div class="flex justify-between items-center text-xl font-bold">
                        <span>Total:</span>
                        <span>${this.formatPrice(total)}</span>
                    </div>
                    <button class="w-full mt-4 bg-green-500 text-white font-bold py-4 rounded-xl text-lg" data-action="realizar-pedido">Confirmar Pedido</button>
                </div>`;
        },

        renderFloatingCartButton(hide = false) {
            let boton = document.getElementById('floating-cart-btn');
            if (hide || App.state.carrito.length === 0) {
                boton?.remove();
                return;
            }
            const totalItems = App.state.carrito.reduce((sum, item) => sum + item.cantidad, 0);
            if (boton) {
                boton.querySelector('span').textContent = totalItems;
            } else {
                boton = document.createElement('div');
                boton.id = 'floating-cart-btn';
                boton.className = 'fixed bottom-5 right-5 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center h-16 w-16 cursor-pointer z-50 animate-pop-in';
                boton.innerHTML = `<i class="fas fa-shopping-bag text-2xl"></i><span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">${totalItems}</span>`;
                boton.dataset.action = 'ver-carrito';
                document.body.appendChild(boton);
                appContainer.appendChild(boton); // Adjuntar al contenedor para que el event listener global lo capture
            }
        }
    };

    // --- MÓDULO DE TOASTS (Notificaciones) ---
    const Toast = {
        show(message, type = 'success') {
            const icons = { success: 'fa-check-circle', error: 'fa-times-circle' };
            const colors = { success: 'bg-green-500', error: 'bg-red-500' };
            const toast = document.createElement('div');
            toast.className = `fixed top-5 left-1/2 -translate-x-1/2 ${colors[type]} text-white py-3 px-5 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-slide-down`;
            toast.innerHTML = `<i class="fas ${icons[type]}"></i><p>${message}</p>`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('animate-fade-out');
                toast.addEventListener('animationend', () => toast.remove());
            }, 3000);
        }
    };

    App.init();
});