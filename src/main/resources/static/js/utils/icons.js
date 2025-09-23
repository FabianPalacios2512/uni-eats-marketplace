/**
 * @file Sistema de iconos centralizados para Uni-Eats
 * @description Evita duplicación de iconos y facilita cambios globales
 * @version 1.0
 */

const Icons = {
    // Navigation icons
    nav: {
        pedidos: 'fas fa-receipt',
        productos: 'fas fa-hamburger', 
        perfil: 'fas fa-store',
        back: 'fas fa-arrow-left',
        user: 'fas fa-user',
        cart: 'fas fa-shopping-cart',
        search: 'fas fa-search',
        filter: 'fas fa-sliders-h',
        history: 'fas fa-history'
    },

    // Status icons
    status: {
        success: 'fas fa-check-circle',
        error: 'fas fa-times-circle', 
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle',
        pending: 'fas fa-clock',
        loading: 'fas fa-spinner fa-spin'
    },

    // Action icons
    actions: {
        add: 'fas fa-plus',
        edit: 'fas fa-edit',
        delete: 'fas fa-trash',
        save: 'fas fa-save',
        cancel: 'fas fa-times',
        refresh: 'fas fa-redo',
        sync: 'fas fa-sync-alt'
    },

    // Business specific icons
    business: {
        store: 'fas fa-store',
        utensils: 'fas fa-utensils',
        receipt: 'fas fa-receipt',
        bell: 'fas fa-bell',
        hamburger: 'fas fa-hamburger',
        boxOpen: 'fas fa-box-open',
        chevronRight: 'fas fa-chevron-right'
    },

    // Helper method to generate icon HTML
    html(iconKey, additionalClasses = '', size = '') {
        const iconClass = this.getClass(iconKey);
        if (!iconClass) {
            Logger?.warn('Icons', `Icon not found: ${iconKey}`);
            return `<i class="fas fa-question ${additionalClasses} ${size}"></i>`;
        }
        return `<i class="${iconClass} ${additionalClasses} ${size}"></i>`;
    },

    // Helper method to get icon class
    getClass(iconKey) {
        // Parse nested key like 'nav.pedidos' or 'status.success'
        const keys = iconKey.split('.');
        let current = this;
        
        for (const key of keys) {
            if (current[key]) {
                current = current[key];
            } else {
                return null;
            }
        }
        
        return typeof current === 'string' ? current : null;
    },

    // Predefined common combinations
    combinations: {
        loadingButton: (text = 'Cargando...') => `${Icons.html('status.loading', 'mr-2')}${text}`,
        successToast: (text) => `${Icons.html('status.success', 'mr-2')}${text}`,
        errorToast: (text) => `${Icons.html('status.error', 'mr-2')}${text}`,
        backButton: (additionalClasses = '') => Icons.html('nav.back', `${additionalClasses} group-hover:scale-110 transition-transform`),
        navIcon: (icon, additionalClasses = '') => Icons.html(`nav.${icon}`, `nav-icon text-xl ${additionalClasses}`)
    }
};

// Export for global use
window.Icons = Icons;