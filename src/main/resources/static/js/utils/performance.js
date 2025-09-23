/**
 * @file Sistema de optimización de performance para Uni-Eats
 * @description Herramientas para mejorar rendimiento y reducir carga del servidor
 * @version 1.0
 */

const Performance = {
    // Cache configuration
    cache: {
        data: new Map(),
        timestamps: new Map(),
        defaultTTL: 60000, // 1 minute default cache
        maxSize: 100 // Maximum cached items
    },

    // Debouncing for search and API calls
    debounce: {
        timers: new Map(),
        
        execute(key, func, delay = 300) {
            // Clear existing timer
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
            }
            
            // Set new timer
            const timer = setTimeout(() => {
                func();
                this.timers.delete(key);
            }, delay);
            
            this.timers.set(key, timer);
        }
    },

    // Throttling for scroll and resize events
    throttle: {
        lastExecution: new Map(),
        
        execute(key, func, delay = 100) {
            const now = Date.now();
            const lastRun = this.lastExecution.get(key) || 0;
            
            if (now - lastRun >= delay) {
                func();
                this.lastExecution.set(key, now);
            }
        }
    },

    // Smart caching system
    setCacheData(key, data, ttl = null) {
        const actualTTL = ttl || this.cache.defaultTTL;
        
        // Clean cache if it's getting too large
        if (this.cache.data.size >= this.cache.maxSize) {
            this.cleanOldCache();
        }
        
        this.cache.data.set(key, data);
        this.cache.timestamps.set(key, Date.now() + actualTTL);
        
        Logger?.debug('Performance', `Data cached: ${key}`, { ttl: actualTTL });
    },

    getCacheData(key) {
        const data = this.cache.data.get(key);
        const expiry = this.cache.timestamps.get(key);
        
        if (!data || !expiry) {
            return null;
        }
        
        if (Date.now() > expiry) {
            // Cache expired
            this.cache.data.delete(key);
            this.cache.timestamps.delete(key);
            Logger?.debug('Performance', `Cache expired: ${key}`);
            return null;
        }
        
        Logger?.debug('Performance', `Cache hit: ${key}`);
        return data;
    },

    cleanOldCache() {
        const now = Date.now();
        const toDelete = [];
        
        for (const [key, expiry] of this.cache.timestamps) {
            if (now > expiry) {
                toDelete.push(key);
            }
        }
        
        toDelete.forEach(key => {
            this.cache.data.delete(key);
            this.cache.timestamps.delete(key);
        });
        
        Logger?.debug('Performance', `Cleaned ${toDelete.length} expired cache entries`);
    },

    // Lazy loading for images
    lazyLoadImages(container = document) {
        const images = container.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });
            
            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    },

    // Efficient DOM updates
    batchDOMUpdates(updates) {
        // Use requestAnimationFrame for smooth updates
        requestAnimationFrame(() => {
            updates.forEach(update => {
                if (typeof update === 'function') {
                    update();
                }
            });
        });
    },

    // Memory optimization
    cleanup() {
        // Clean expired cache
        this.cleanOldCache();
        
        // Clear debounce timers
        this.debounce.timers.forEach(timer => clearTimeout(timer));
        this.debounce.timers.clear();
        
        // Reset throttle tracking
        this.throttle.lastExecution.clear();
        
        Logger?.info('Performance', 'Memory cleanup completed');
    },

    // Polling optimization
    adaptivePolling: {
        intervals: new Map(),
        frequencies: {
            FAST: 10000,     // 10 seconds
            NORMAL: 30000,   // 30 seconds  
            SLOW: 60000,     // 1 minute
            VERY_SLOW: 300000 // 5 minutes
        },
        
        start(key, callback, frequency = 'NORMAL') {
            this.stop(key); // Stop existing
            
            const interval = setInterval(callback, this.frequencies[frequency]);
            this.intervals.set(key, interval);
            
            Logger?.debug('Performance', `Adaptive polling started: ${key}`, { 
                frequency: this.frequencies[frequency] 
            });
        },
        
        stop(key) {
            const interval = this.intervals.get(key);
            if (interval) {
                clearInterval(interval);
                this.intervals.delete(key);
                Logger?.debug('Performance', `Adaptive polling stopped: ${key}`);
            }
        },
        
        adjustFrequency(key, newFrequency) {
            const currentCallback = this.intervals.get(key)?._callback;
            if (currentCallback) {
                this.stop(key);
                this.start(key, currentCallback, newFrequency);
            }
        }
    }
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    Performance.cleanup();
});

// Export for global use
window.Performance = Performance;