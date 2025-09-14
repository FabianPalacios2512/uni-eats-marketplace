/**
 * @file Script principal para el Dashboard de Vendedores de Uni-Eats.
 * @description Gestiona la renderización, lógica y comunicación con el API para el panel de control del vendedor.
 * @version 6.0.0 (Header Condicional y Lógica de UI Final)
 */

document.addEventListener('DOMContentLoaded', () => {

    const App = {
        config: {
            container: document.getElementById('vendor-dashboard-container'),
            csrfToken: document.querySelector("meta[name='_csrf']")?.getAttribute("content"),
            csrfHeader: document.querySelector("meta[name='_csrf_header']")?.getAttribute("content"),
            apiEndpoints: {
                getDashboard: '/api/vendedor/dashboard',
                createStore: '/api/vendedor/tienda/crear',
                updateStore: '/api/vendedor/tienda/actualizar',
                createProduct: '/api/vendedor/productos/crear',
                updateSchedules: '/api/vendedor/horarios/actualizar'
            }
        },

        state: {
            tienda: null,
            productos: [],
            horarios: [],
            fabButton: null
        },

        api: {
            async request(endpoint, options = {}, submitButton = null) {
                const originalButtonContent = submitButton ? submitButton.innerHTML : '';
                if (submitButton) {
                    submitButton.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...`;
                    submitButton.disabled = true;
                }
                try {
                    const headers = { [App.config.csrfHeader]: App.config.csrfToken, ...options.headers };
                    if (options.body instanceof FormData) {
                        delete headers['Content-Type'];
                    } else if (options.body) {
                        headers['Content-Type'] = 'application/json';
                    }
                    const response = await fetch(endpoint, { ...options, headers });
                    if (!response.ok) {
                        const errorText = await response.text();
                        throw new Error(errorText || `Error del servidor: ${response.status}`);
                    }
                    return response;
                } catch (error) {
                    console.error(`Error en la petición a ${endpoint}:`, error);
                    App.ui.showToast(`Error: ${error.message}`, 'error');
                    throw error;
                } finally {
                    if (submitButton) {
                        submitButton.innerHTML = originalButtonContent;
                        submitButton.disabled = false;
                    }
                }
            }
        },

        ui: {
            render(html) { App.config.container.innerHTML = html; },

            showToast(message, type = 'success') {
                const toast = document.createElement('div');
                const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
                const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500' };
                toast.className = `fixed bottom-24 right-5 ${colors[type]} text-white py-3 px-5 rounded-lg shadow-xl flex items-center gap-3 animate-fadeIn z-50`;
                toast.innerHTML = `<i class="fas ${icons[type]}"></i><p>${message}</p>`;
                document.body.appendChild(toast);
                setTimeout(() => {
                    toast.classList.add('animate-fadeOut');
                    toast.addEventListener('animationend', () => toast.remove());
                }, 3000);
            },

            switchView(targetId) {
                document.querySelectorAll('.main-view').forEach(view => { view.style.display = 'none'; });
                document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
                const activeView = document.getElementById(`view-${targetId}`);
                if (activeView) {
                    activeView.style.display = 'block';
                }
                const activeLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
                if (activeLink) activeLink.classList.add('active');
                if (App.state.fabButton) {
                    App.state.fabButton.style.display = (targetId === 'productos') ? 'flex' : 'none';
                }
            },
            
            initModal(modalId, onOpen = () => {}) {
                const modal = document.getElementById(modalId);
                if (!modal) return;
                const openTriggers = document.querySelectorAll(`[data-modal-open="${modalId}"]`);
                const closeModal = () => modal.classList.add('hidden');
                modal.querySelectorAll('[data-modal-close]').forEach(btn => btn.addEventListener('click', closeModal));
                const specificCloseBtn = document.getElementById(`${modalId}-close-btn`);
                const specificCancelBtn = document.getElementById(`${modalId}-cancel-btn`);
                const specificScrim = document.getElementById(`${modalId}-scrim`);
                if (specificCloseBtn) specificCloseBtn.addEventListener('click', closeModal);
                if (specificCancelBtn) specificCancelBtn.addEventListener('click', closeModal);
                if (specificScrim) specificScrim.addEventListener('click', closeModal);
                openTriggers.forEach(btn => btn.addEventListener('click', (e) => {
                    if (e) e.preventDefault();
                    onOpen();
                    modal.classList.remove('hidden');
                }));
            }
        },
        
        components: {
            Welcome: {
                render() {
                    return `
                        <div class="flex flex-col items-center justify-center min-h-screen p-4 overflow-hidden">
                            <div id="welcome-step" class="w-full max-w-md text-center transition-opacity duration-500 animate-fadeIn">
                                <div class="w-24 h-24 mb-6 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-lg animate-pulse-slow"><i class="fas fa-store text-4xl"></i></div>
                                <h1 class="text-3xl font-bold text-slate-800">¡Bienvenido a Uni-Eats!</h1>
                                <p class="text-slate-500 mt-4 max-w-sm mx-auto">Para empezar a vender, configura la información de tu tienda.</p>
                                <button id="continue-button" class="mt-8 w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-transform">Continuar <i class="fas fa-arrow-right ml-2"></i></button>
                            </div>
                            <div id="form-step" class="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl transition-opacity duration-500 opacity-0" style="display: none;">
                                <h1 class="text-2xl font-bold text-slate-800 text-center mb-6">Información de tu Tienda</h1>
                                <form id="crear-tienda-form" class="space-y-6">
                                    <div class="relative"><input type="text" name="nombre" class="input-field block w-full px-4 py-4 border-2 border-slate-300 rounded-lg" placeholder=" " required><label class="floating-label">Nombre de la Tienda</label></div>
                                    <div class="relative"><input type="text" name="nit" class="input-field block w-full px-4 py-4 border-2 border-slate-300 rounded-lg" placeholder=" " required><label class="floating-label">NIT o Documento</label></div>
                                    <div class="relative"><textarea name="descripcion" rows="3" class="textarea-field block w-full px-4 py-4 border-2 border-slate-300 rounded-lg" placeholder=" " required></textarea><label class="floating-label">Descripción Corta</label></div>
                                    <div><label class="block text-sm font-medium text-slate-700 mb-2">Logo de la Tienda</label><input type="file" name="logo" class="w-full" accept="image/png, image/jpeg" required></div>
                                    <button type="submit" class="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg">Enviar para Aprobación</button>
                                </form>
                            </div>
                        </div>`;
                },
                init() {
                    const continueButton = document.getElementById('continue-button');
                    const welcomeStep = document.getElementById('welcome-step');
                    const formStep = document.getElementById('form-step');
                    const form = document.getElementById('crear-tienda-form');
                    if (continueButton) {
                        continueButton.addEventListener('click', () => {
                            welcomeStep.classList.add('animate-fadeOut');
                            welcomeStep.addEventListener('animationend', () => {
                                welcomeStep.style.display = 'none';
                                formStep.style.display = 'block';
                                formStep.classList.add('animate-fadeIn');
                            }, { once: true });
                        });
                    }
                    if (form) {
                        form.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const formData = new FormData(form);
                            const submitButton = form.querySelector('button[type="submit"]');
                            try {
                                await App.api.request(App.config.apiEndpoints.createStore, { method: 'POST', body: formData }, submitButton);
                                App.ui.showToast('¡Tienda enviada para aprobación!');
                                setTimeout(() => window.location.reload(), 1500);
                            } catch (error) { /* Error manejado */ }
                        });
                    }
                }
            },
            
            // --- ESTRUCTURA PRINCIPAL SIMPLIFICADA ---
            Dashboard: {
                render(tienda) {
                    return `
                        <div class="w-full max-w-lg mx-auto pb-24 bg-slate-50 min-h-screen">
                            <main id="main-content"></main>
                            <nav class="fixed bottom-0 left-0 right-0 w-full max-w-lg mx-auto bg-white/90 backdrop-blur-md border-t-2 border-slate-200 flex justify-around z-40 shadow-t-lg">
                                <a href="#" class="nav-link" data-target="pedidos"><div class="flex flex-col items-center justify-center w-full pt-2 pb-1"><i class="fas fa-receipt nav-icon text-xl"></i><span class="text-xs mt-1 font-medium">Pedidos</span><span class="nav-indicator"></span></div></a>
                                <a href="#" class="nav-link" data-target="productos"><div class="flex flex-col items-center justify-center w-full pt-2 pb-1"><i class="fas fa-hamburger nav-icon text-xl"></i><span class="text-xs mt-1 font-medium">Productos</span><span class="nav-indicator"></span></div></a>
                                <a href="#" class="nav-link" data-target="perfil"><div class="flex flex-col items-center justify-center w-full pt-2 pb-1"><i class="fas fa-store nav-icon text-xl"></i><span class="text-xs mt-1 font-medium">Mi Tienda</span><span class="nav-indicator"></span></div></a>
                            </nav>
                            <button data-modal-open="product-modal" class="fixed bottom-24 right-5 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-30 transform hover:scale-110 active:scale-100 transition-transform duration-200">
                                <i class="fas fa-plus text-xl"></i>
                            </button>
                        </div>`;
                },
                init(data) {
                    const mainContent = document.getElementById('main-content');
                    if (!mainContent) return;
                    App.state.fabButton = document.querySelector('[data-modal-open="product-modal"]');
                    mainContent.innerHTML = `
                        ${App.components.Pedidos.render(data)}
                        ${App.components.Productos.render(data)}
                        ${App.components.Perfil.render(data)}
                    `;
                    App.components.Pedidos.init(data);
                    App.components.Productos.init(data);
                    App.components.Perfil.init(data);
                    document.querySelectorAll('.nav-link').forEach(link => {
                        link.addEventListener('click', (e) => { e.preventDefault(); App.ui.switchView(link.dataset.target); });
                    });
                    App.ui.switchView('productos');
                }
            },
            
            // --- VISTA DE PEDIDOS AHORA INCLUYE EL HEADER ---
            Pedidos: {
                render(data) {
                    const tienda = App.state.tienda;
                    const statusConfig = {
                        PENDIENTE:  { label: 'En Revisión', icon: 'fas fa-clock', colors: 'bg-amber-100 text-amber-800' },
                        ACTIVA:     { label: 'Activa', icon: 'fas fa-check-circle', colors: 'bg-green-100 text-green-800' },
                        INACTIVA:   { label: 'Inactiva', icon: 'fas fa-times-circle', colors: 'bg-red-100 text-red-800' },
                        DEFAULT:    { label: 'Desconocido', icon: 'fas fa-question-circle', colors: 'bg-slate-100 text-slate-800' }
                    };
                    const status = statusConfig[tienda.estado] || statusConfig.DEFAULT;
                    const statusHtml = `<span class="px-2 py-0.5 text-xs font-semibold rounded-full ${status.colors} inline-flex items-center gap-1.5"><i class="${status.icon}"></i>${status.label}</span>`;
                    const ventasHoy = (tienda.ventasHoy || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
                    const pedidosNuevos = tienda.pedidosNuevos || 0;
                    const estaAbierta = tienda.estaAbierta !== false;

                    return `
                        <div id="view-pedidos" class="main-view">
                            <header class="bg-white p-4 sticky top-0 z-30 rounded-b-2xl shadow-lg space-y-4 mb-4">
                                <div class="flex items-center gap-3">
                                    <img src="${tienda.logoUrl || 'https://via.placeholder.com/150'}" alt="Logo" class="w-12 h-12 rounded-full object-cover border-2 border-indigo-100">
                                    <div><h1 class="text-lg font-bold text-slate-800 leading-tight">${tienda.nombre}</h1>${statusHtml}</div>
                                </div>
                                <div class="grid grid-cols-2 gap-4 text-center">
                                    <div class="bg-slate-100 p-3 rounded-xl"><p class="text-xs font-semibold text-slate-500">VENTAS DE HOY</p><p class="text-2xl font-bold text-indigo-600">${ventasHoy}</p></div>
                                    <div class="bg-slate-100 p-3 rounded-xl"><p class="text-xs font-semibold text-slate-500">PEDIDOS NUEVOS</p><p class="text-2xl font-bold text-indigo-600">${pedidosNuevos}</p></div>
                                </div>
                                <div class="border-t pt-3 flex justify-between items-center">
                                    <p class="font-bold text-slate-700">Recibiendo Pedidos</p>
                                    <label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" id="store-status-toggle" ${estaAbierta ? 'checked' : ''} class="sr-only peer"><div class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div></label>
                                </div>
                            </header>
                            <div class="p-4 pt-0"><div class="bg-white p-6 rounded-xl shadow-md text-center"><i class="fas fa-receipt text-4xl text-indigo-400 mb-3"></i><h2 class="text-xl font-bold">Pedidos Activos</h2><p class="mt-2 text-slate-500">Los nuevos pedidos aparecerán aquí.</p></div></div>
                        </div>`;
                },
                init(data) { /* Lógica futura */ }
            },
            
            Productos: {
                render(data) {
                    const emptyStateHtml = `<div class="col-span-full bg-white p-8 rounded-2xl shadow-lg text-center"><i class="fas fa-box-open text-5xl text-slate-400 mb-4"></i><h2 class="text-xl font-bold">Tu menú está vacío</h2><p class="mt-2 text-slate-500">Usa el botón (+) para añadir tu primer producto.</p></div>`;
                    const productosHtml = data.productos.length > 0 ? data.productos.map(p => {
                        const formattedPrice = (p.precio || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
                        return `<div class="product-card bg-white rounded-xl shadow-md overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1" data-product-id="${p.id}"><img src="${p.imagenUrl || 'https://via.placeholder.com/400x300'}" alt="${p.nombre}" class="w-full h-20 object-cover"><div class="p-2 flex flex-col flex-grow"><h3 class="font-bold text-sm text-slate-800 truncate">${p.nombre}</h3><p class="text-xs text-slate-500 flex-grow min-h-[2.5rem]">${p.descripcion ? p.descripcion.substring(0, 35) : ''}${p.descripcion && p.descripcion.length > 35 ? '...' : ''}</p><div class="flex justify-between items-end mt-1"><p class="text-base text-indigo-600 font-bold">${formattedPrice}</p><div class="flex items-center space-x-1 text-slate-400"><button data-action="edit" class="p-1 hover:text-blue-600 transition-colors"><i class="fas fa-pencil-alt fa-sm"></i></button><button data-action="delete" class="p-1 hover:text-red-600 transition-colors"><i class="fas fa-trash-alt fa-sm"></i></button></div></div></div></div>`;
                    }).join('') : emptyStateHtml;
                    return `<div id="view-productos" class="main-view p-4"><header class="mb-4"><h1 class="text-2xl font-bold text-slate-800">Mis Productos</h1></header><div class="grid grid-cols-2 gap-2">${productosHtml}</div></div>`;
                },
                init(data) {
                    App.ui.initModal('product-modal', () => {
                        document.getElementById('product-form')?.reset();
                        const preview = document.getElementById('image-preview');
                        if(preview) preview.src = 'https://via.placeholder.com/300x200';
                    });
                    const productForm = document.getElementById('product-form');
                    if (productForm) {
                        productForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const formData = new FormData(productForm);
                            const submitButton = productForm.querySelector('button[type="submit"]');
                            try {
                                await App.api.request(App.config.apiEndpoints.createProduct, { method: 'POST', body: formData }, submitButton);
                                App.ui.showToast('Producto añadido con éxito');
                                setTimeout(() => window.location.reload(), 1500);
                            } catch (error) { /* Error manejado */ }
                        });
                    }
                    const productContainer = document.getElementById('view-productos');
                    if (productContainer) {
                        productContainer.addEventListener('click', (e) => {
                            const button = e.target.closest('button[data-action]');
                            if (!button) return;
                            const card = button.closest('.product-card');
                            const productId = card.dataset.productId;
                            const action = button.dataset.action;
                            if (action === 'edit') {
                                App.ui.showToast(`Editar producto #${productId}. (Función no implementada)`, 'info');
                            } else if (action === 'delete') {
                                if (confirm('¿Estás seguro de eliminar este producto?')) {
                                    App.ui.showToast(`Eliminar producto #${productId}. (Función no implementada)`, 'info');
                                }
                            }
                        });
                    }
                }
            },

            Perfil: {
                render(data) {
                    return `<div id="view-perfil" class="main-view p-4"><header class="mb-4"><h1 class="text-2xl font-bold text-slate-800">Mi Tienda</h1></header><div class="space-y-4"><div class="bg-white rounded-xl shadow-md"><nav class="flex flex-col"><a href="#" data-modal-open="edit-store-modal" class="flex items-center gap-4 p-4 border-b hover:bg-slate-50"><i class="fas fa-store w-6 text-center text-indigo-500"></i><div><p class="font-semibold">Perfil de la Tienda</p><p class="text-sm text-slate-500">Edita nombre, logo y descripción</p></div><i class="fas fa-chevron-right text-slate-400 ml-auto"></i></a><a href="#" data-modal-open="schedule-modal" class="flex items-center gap-4 p-4 border-b hover:bg-slate-50"><i class="fas fa-clock w-6 text-center text-blue-500"></i><div><p class="font-semibold">Horarios de Atención</p><p class="text-sm text-slate-500">Define cuándo recibes pedidos</p></div><i class="fas fa-chevron-right text-slate-400 ml-auto"></i></a><a href="#" class="flex items-center gap-4 p-4 border-b hover:bg-slate-50"><i class="fas fa-tags w-6 text-center text-amber-500"></i><div><p class="font-semibold">Promociones</p><p class="text-sm text-slate-500">Crea ofertas y paquetes</p></div><i class="fas fa-chevron-right text-slate-400 ml-auto"></i></a></nav></div><form id="logout-form" action="/logout" method="post"><input type="hidden" name="_csrf" value="${App.config.csrfToken}" /><button type="submit" class="w-full bg-white hover:bg-red-50 text-red-600 font-semibold py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-3"><i class="fas fa-sign-out-alt"></i>Cerrar Sesión</button></form></div></div>`;
                },
                init(data) {
                     App.ui.initModal('edit-store-modal', () => {
                         document.getElementById('edit-nombre-tienda').value = data.tienda.nombre;
                         document.getElementById('edit-descripcion-tienda').value = data.tienda.descripcion;
                         document.getElementById('edit-logo-preview').src = data.tienda.logoUrl || 'https://via.placeholder.com/150';
                     });
                     const editForm = document.getElementById('edit-store-form');
                     if (editForm) {
                         editForm.addEventListener('submit', async (e) => {
                             e.preventDefault();
                             const formData = new FormData(editForm);
                             const submitButton = editForm.querySelector('button[type="submit"]');
                             try {
                                 await App.api.request(App.config.apiEndpoints.updateStore, { method: 'POST', body: formData }, submitButton);
                                 App.ui.showToast('¡Perfil actualizado con éxito!');
                                 setTimeout(() => window.location.reload(), 1500);
                             } catch (error) { /* Error manejado */ }
                         });
                     }
                     App.ui.initModal('schedule-modal', () => {
                         this.ScheduleManager.init(data.horarios);
                     });
                },
                ScheduleManager: {
                    init(horarios) {
                        const container = document.getElementById('schedule-days-container');
                        const form = document.getElementById('schedule-form');
                        if (!container || !form) return;
                        const dias = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
                        container.innerHTML = dias.map(dia => {
                            const horarioExistente = horarios.find(h => h.dia === dia);
                            const estaAbierto = horarioExistente?.abierto || false;
                            const apertura = horarioExistente?.horaApertura?.substring(0, 5) || '08:00';
                            const cierre = horarioExistente?.horaCierre?.substring(0, 5) || '17:00';
                            return `<div class="grid grid-cols-3 items-center gap-3 border-b pb-3" data-day="${dia}"><div class="flex items-center gap-2"><input type="checkbox" id="check-${dia}" class="day-toggle h-5 w-5 rounded" ${estaAbierto ? 'checked' : ''}><label for="check-${dia}" class="font-semibold capitalize">${dia.toLowerCase()}</label></div><input type="time" class="time-input border rounded px-2 py-1" value="${apertura}" ${!estaAbierto ? 'disabled' : ''}><input type="time" class="time-input border rounded px-2 py-1" value="${cierre}" ${!estaAbierto ? 'disabled' : ''}></div>`;
                        }).join('');
                        container.querySelectorAll('.day-toggle').forEach(checkbox => {
                            checkbox.addEventListener('change', (e) => {
                                e.target.closest('[data-day]').querySelectorAll('.time-input').forEach(input => input.disabled = !e.target.checked);
                            });
                        });
                        form.onsubmit = async (e) => {
                            e.preventDefault();
                            const submitButton = form.querySelector('button[type="submit"]');
                            const horariosPayload = Array.from(container.querySelectorAll('[data-day]')).map(row => ({ dia: row.dataset.day, abierto: row.querySelector('.day-toggle').checked, horaApertura: row.querySelectorAll('.time-input')[0].value, horaCierre: row.querySelectorAll('.time-input')[1].value }));
                            try {
                                await App.api.request(App.config.apiEndpoints.updateSchedules, {
                                    method: 'POST',
                                    body: JSON.stringify(horariosPayload)
                                }, submitButton);
                                App.ui.showToast('¡Horarios actualizados!');
                                setTimeout(() => {
                                    document.getElementById('schedule-modal')?.classList.add('hidden');
                                    window.location.reload();
                                }, 1500);
                            } catch (error) { /* Error manejado */ }
                        };
                    }
                }
            }
        },

        async init() {
            if (!this.config.container) {
                console.error('Error crítico: El contenedor del dashboard no fue encontrado.');
                document.body.innerHTML = '<p class="text-red-500 text-center mt-10">Error de configuración: #vendor-dashboard-container no existe.</p>';
                return;
            }
            this.config.container.innerHTML = `<div class="flex justify-center items-center h-screen"><i class="fas fa-spinner fa-spin text-4xl text-indigo-500"></i></div>`;
            try {
                const response = await fetch(this.config.apiEndpoints.getDashboard);
                if (response.status === 404) {
                    this.ui.render(this.components.Welcome.render());
                    this.components.Welcome.init();
                } else if (response.ok) {
                    const data = await response.json();
                    this.state = { ...this.state, ...data };
                    this.ui.render(this.components.Dashboard.render(this.state.tienda));
                    this.components.Dashboard.init(this.state);
                } else {
                    throw new Error(`Error del servidor: ${await response.text()}`);
                }
            } catch (error) {
                this.ui.render(`<div class="p-8 text-center text-red-600"><p><strong>Error al cargar el dashboard:</strong> ${error.message}</p></div>`);
            }
        }
    };

    App.init();
});