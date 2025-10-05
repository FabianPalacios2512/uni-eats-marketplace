/**
 * @file Inicializador final de utilidades para Uni-Eats
 * @description Configuración final después de que todo esté cargado
 * @version 1.0
 */

// Only initialize after DOM is ready and all scripts are loaded
window.addEventListener('load', () => {
    // All utilities should be ready by now
    if (window.Logger) {
        Logger.info('Utils', 'All utility systems loaded and ready');
    }
    
    // Register common components if Components is available
    if (window.Components) {
        try {
            Components.register('toast', new Components.ui.Toast());
            Components.register('loading', new Components.ui.LoadingOverlay());
            Components.register('modal', new Components.ui.Modal());
            
            if (window.Logger) {
                Logger.info('Utils', 'Component system initialized');
            }
        } catch (error) {
            console.warn('Component registration failed:', error);
        }
    }
    
    // PWA Service Worker registration
    // PWA Service Worker temporarily disabled to prevent errors
    // TODO: Re-enable when service-worker.js is implemented
    /*
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                if (window.Logger) {
                    Logger.info('PWA', 'Service Worker registered successfully');
                }
            })
            .catch(error => {
                if (window.Logger) {
                    Logger.error('PWA', 'Service Worker registration failed', error);
                }
            });
    }
    */
    
    // Global cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (window.Performance) {
            Performance.cleanup();
        }
        if (window.Logger) {
            Logger.info('Utils', 'Page cleanup completed');
        }
    });
});

// Export initialization status
window.UtilsReady = true;