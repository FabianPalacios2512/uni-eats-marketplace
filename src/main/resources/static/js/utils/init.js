/**
 * @file Loader principal de utilidades para Uni-Eats
 * @description Carga e inicializa todos los sistemas de utilidades
 * @version 1.0
 */

// Check if we're in a modern browser environment
if (typeof window !== 'undefined') {
    // Initialize utilities in the correct order
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize performance monitoring
        if (window.Performance) {
            Logger?.info('Utils', 'Performance utilities loaded');
        }
        
        // Initialize component system
        if (window.Components) {
            // Register common components
            Components.register('toast', new Components.ui.Toast());
            Components.register('loading', new Components.ui.LoadingOverlay());
            Components.register('modal', new Components.ui.Modal());
            
            Logger?.info('Utils', 'Component system initialized');
        }
        
        // Initialize icons system
        if (window.Icons) {
            Logger?.info('Utils', 'Icons system ready');
        }
        
        // Initialize logger
        if (window.Logger) {
            Logger.info('Utils', 'All utility systems loaded and ready');
        }
        
        // Global cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (window.Performance) {
                Performance.cleanup();
            }
            Logger?.info('Utils', 'Page cleanup completed');
        });
    });
}

// PWA optimizations
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                Logger?.info('PWA', 'Service Worker registered successfully');
            })
            .catch(error => {
                Logger?.error('PWA', 'Service Worker registration failed', error);
            });
    });
}

// Export initialization status
window.UtilsReady = true;