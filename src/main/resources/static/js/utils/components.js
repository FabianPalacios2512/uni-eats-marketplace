/**
 * @file Sistema de componentes modulares para Uni-Eats
 * @description Framework ligero para componentes reutilizables sin overhead
 * @version 1.0
 */

const Components = {
    // Component registry
    registry: new Map(),
    
    // Register a new component
    register(name, component) {
        if (this.registry.has(name)) {
            Logger?.warn('Components', `Component ${name} already exists, overwriting`);
        }
        
        this.registry.set(name, component);
        Logger?.debug('Components', `Component registered: ${name}`);
    },
    
    // Get a component
    get(name) {
        return this.registry.get(name);
    },
    
    // Base component class
    BaseComponent: class {
        constructor(containerId, options = {}) {
            this.containerId = containerId;
            this.options = { ...this.defaultOptions, ...options };
            this.state = {};
            this.isInitialized = false;
        }
        
        get defaultOptions() {
            return {};
        }
        
        get container() {
            return document.getElementById(this.containerId);
        }
        
        setState(newState) {
            this.state = { ...this.state, ...newState };
            if (this.isInitialized) {
                this.render();
            }
        }
        
        render() {
            throw new Error('render() method must be implemented');
        }
        
        init() {
            this.isInitialized = true;
            this.render();
            this.bindEvents();
        }
        
        bindEvents() {
            // Override in subclasses
        }
        
        destroy() {
            if (this.container) {
                this.container.innerHTML = '';
            }
            this.isInitialized = false;
        }
    },
    
    // Common UI components
    ui: {
        // Toast notification component
        Toast: class {
            show(message, type = 'info', duration = 3000) {
                const toast = document.createElement('div');
                const iconClass = Icons.getClass(`status.${type}`) || Icons.getClass('status.info');
                
                toast.className = `fixed bottom-24 right-5 px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 animate-fadeIn z-50 ${this.getTypeClasses(type)}`;
                toast.innerHTML = `
                    <i class="${iconClass}"></i>
                    <p class="font-medium">${message}</p>
                `;
                
                document.body.appendChild(toast);
                
                setTimeout(() => {
                    toast.classList.add('animate-fadeOut');
                    toast.addEventListener('animationend', () => toast.remove());
                }, duration);
            }
            
            getTypeClasses(type) {
                const classes = {
                    success: 'bg-green-500 text-white',
                    error: 'bg-red-500 text-white', 
                    warning: 'bg-yellow-500 text-white',
                    info: 'bg-blue-500 text-white'
                };
                return classes[type] || classes.info;
            }
        },
        
        // Loading overlay component
        LoadingOverlay: class {
            show(message = 'Cargando...') {
                const overlay = document.createElement('div');
                overlay.id = 'loading-overlay';
                overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
                overlay.innerHTML = `
                    <div class="bg-white p-8 rounded-2xl shadow-xl text-center">
                        ${Icons.html('status.loading', 'text-4xl text-indigo-500 mb-4')}
                        <h2 class="text-xl font-bold text-slate-800 mb-2">${message}</h2>
                        <p class="text-slate-600">Por favor espera...</p>
                    </div>
                `;
                
                document.body.appendChild(overlay);
            }
            
            hide() {
                const overlay = document.getElementById('loading-overlay');
                if (overlay) {
                    overlay.remove();
                }
            }
        },
        
        // Modal component
        Modal: class {
            constructor(options = {}) {
                this.isOpen = false;
            }
            
            show(title, content, actions = []) {
                if (this.isOpen) return;
                
                const modal = document.createElement('div');
                modal.id = 'dynamic-modal';
                modal.className = 'fixed inset-0 z-50 flex justify-center items-center p-4';
                modal.innerHTML = `
                    <div class="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm modal-backdrop"></div>
                    <div class="relative w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
                        <div class="p-6 border-b flex justify-between items-center">
                            <h2 class="text-xl font-bold">${title}</h2>
                            <button class="modal-close text-2xl text-slate-500 hover:text-slate-800">&times;</button>
                        </div>
                        <div class="p-6 overflow-y-auto flex-1">
                            ${content}
                        </div>
                        ${actions.length > 0 ? `
                            <div class="px-6 py-4 bg-slate-50 flex justify-end space-x-3 border-t">
                                ${actions.map(action => `
                                    <button class="modal-action ${action.class || 'bg-gray-300 text-gray-700'} font-semibold py-2 px-4 rounded-lg" data-action="${action.action}">
                                        ${action.label}
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                
                document.body.appendChild(modal);
                this.isOpen = true;
                
                // Bind close events
                modal.addEventListener('click', (e) => {
                    if (e.target.classList.contains('modal-backdrop') || 
                        e.target.classList.contains('modal-close')) {
                        this.hide();
                    }
                });
                
                // Bind action events
                modal.addEventListener('click', (e) => {
                    if (e.target.classList.contains('modal-action')) {
                        const action = e.target.getAttribute('data-action');
                        if (this.options.onAction) {
                            this.options.onAction(action);
                        }
                        this.hide();
                    }
                });
            }
            
            hide() {
                const modal = document.getElementById('dynamic-modal');
                if (modal) {
                    modal.remove();
                    this.isOpen = false;
                }
            }
        }
    }
};

// Export for global use
window.Components = Components;