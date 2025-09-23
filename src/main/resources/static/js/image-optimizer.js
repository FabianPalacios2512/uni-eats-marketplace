/**
 * 🖼️ IMAGE OPTIMIZATION MANAGER
 * Maneja lazy loading, optimización y fallbacks de imágenes
 */
class ImageOptimizationManager {
    constructor() {
        this.observer = null;
        this.imageCache = new Map();
        this.loadingImages = new Set();
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupImageErrorHandling();
        this.processExistingImages();
        this.addImageUtilities();
    }

    setupIntersectionObserver() {
        // Configuración para lazy loading
        const options = {
            root: null,
            rootMargin: '50px 0px', // Cargar 50px antes de ser visible
            threshold: 0.01
        };

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                }
            });
        }, options);
    }

    setupImageErrorHandling() {
        // Interceptar errores de imágenes globalmente
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            }
        }, true);
    }

    processExistingImages() {
        // Procesar imágenes existentes en el DOM
        const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');
        images.forEach(img => this.observeImage(img));
    }

    observeImage(img) {
        // Añadir clase de loading
        img.classList.add('image-loading');
        
        // Crear contenedor si no existe
        if (!img.parentElement.classList.contains('image-container')) {
            this.wrapImage(img);
        }

        // Observar para lazy loading
        if (img.dataset.src && !img.src) {
            this.observer.observe(img);
        } else if (img.complete) {
            this.handleImageLoad(img);
        } else {
            img.addEventListener('load', () => this.handleImageLoad(img));
            img.addEventListener('error', () => this.handleImageError(img));
        }
    }

    wrapImage(img) {
        // Crear contenedor con skeleton loader
        const container = document.createElement('div');
        container.className = 'image-container relative overflow-hidden bg-gray-200 rounded-lg';
        
        // Skeleton loader
        const skeleton = document.createElement('div');
        skeleton.className = 'image-skeleton absolute inset-0 pwa-skeleton';
        skeleton.innerHTML = `
            <div class="w-full h-full bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 pwa-loading-shimmer"></div>
        `;

        // Placeholder icon
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder absolute inset-0 flex items-center justify-center text-gray-400';
        placeholder.innerHTML = '<i class="fas fa-image text-2xl"></i>';

        // Error state
        const errorState = document.createElement('div');
        errorState.className = 'image-error absolute inset-0 flex flex-col items-center justify-center text-gray-500 hidden';
        errorState.innerHTML = `
            <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
            <span class="text-xs">Error al cargar</span>
            <button class="retry-image mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors">
                Reintentar
            </button>
        `;

        // Wrap image
        img.parentNode.insertBefore(container, img);
        container.appendChild(skeleton);
        container.appendChild(placeholder);
        container.appendChild(img);
        container.appendChild(errorState);

        // Event listener para retry
        errorState.querySelector('.retry-image').addEventListener('click', () => {
            this.retryImage(img);
        });
    }

    async loadImage(img) {
        if (this.loadingImages.has(img) || img.src) return;

        this.loadingImages.add(img);
        const dataSrc = img.dataset.src;

        try {
            // Precargar imagen
            await this.preloadImage(dataSrc);
            
            // Asignar src y remover data-src
            img.src = dataSrc;
            img.removeAttribute('data-src');
            
            // Dejar de observar
            this.observer.unobserve(img);
            
        } catch (error) {
            console.warn('Error cargando imagen:', dataSrc, error);
            this.handleImageError(img);
        } finally {
            this.loadingImages.delete(img);
        }
    }

    preloadImage(src) {
        // Usar cache si ya está disponible
        if (this.imageCache.has(src)) {
            return Promise.resolve(this.imageCache.get(src));
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                this.imageCache.set(src, img);
                resolve(img);
            };
            
            img.onerror = () => {
                reject(new Error(`Failed to load image: ${src}`));
            };
            
            // Agregar headers de optimización
            img.crossOrigin = 'anonymous';
            img.src = src;
        });
    }

    handleImageLoad(img) {
        const container = img.closest('.image-container');
        if (!container) return;

        // Remover loading states
        img.classList.remove('image-loading');
        img.classList.add('image-loaded');
        
        // Ocultar skeleton y placeholder
        const skeleton = container.querySelector('.image-skeleton');
        const placeholder = container.querySelector('.image-placeholder');
        const errorState = container.querySelector('.image-error');
        
        if (skeleton) skeleton.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';
        if (errorState) errorState.classList.add('hidden');

        // Fade in effect
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
        
        requestAnimationFrame(() => {
            img.style.opacity = '1';
        });

        // Reset retry count
        this.retryAttempts.delete(img);
    }

    handleImageError(img) {
        const container = img.closest('.image-container');
        if (!container) return;

        const retries = this.retryAttempts.get(img) || 0;
        
        if (retries < this.maxRetries) {
            // Incrementar intentos y retry
            this.retryAttempts.set(img, retries + 1);
            console.log(`Reintentando imagen (${retries + 1}/${this.maxRetries}):`, img.src);
            
            setTimeout(() => {
                this.retryImage(img);
            }, 1000 * Math.pow(2, retries)); // Backoff exponencial
            
        } else {
            // Mostrar error state después de todos los intentos
            this.showImageError(img);
        }
    }

    retryImage(img) {
        const container = img.closest('.image-container');
        if (!container) return;

        // Ocultar error state
        const errorState = container.querySelector('.image-error');
        if (errorState) errorState.classList.add('hidden');

        // Mostrar skeleton loading
        const skeleton = container.querySelector('.image-skeleton');
        if (skeleton) skeleton.style.display = 'block';

        // Reset y recargar
        const originalSrc = img.src || img.dataset.src;
        img.src = '';
        
        setTimeout(() => {
            img.src = originalSrc + '?retry=' + Date.now();
        }, 100);
    }

    showImageError(img) {
        const container = img.closest('.image-container');
        if (!container) return;

        // Ocultar skeleton y placeholder
        const skeleton = container.querySelector('.image-skeleton');
        const placeholder = container.querySelector('.image-placeholder');
        const errorState = container.querySelector('.image-error');
        
        if (skeleton) skeleton.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';
        if (errorState) errorState.classList.remove('hidden');

        // Aplicar fallback image si está disponible
        const fallbackSrc = img.dataset.fallback;
        if (fallbackSrc && img.src !== fallbackSrc) {
            img.src = fallbackSrc;
        }
    }

    // Optimización automática de imágenes
    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            if (img.dataset.optimized) return;
            
            // Calcular tamaño óptimo basado en el contenedor
            const rect = img.getBoundingClientRect();
            const devicePixelRatio = window.devicePixelRatio || 1;
            
            const optimalWidth = Math.ceil(rect.width * devicePixelRatio);
            const optimalHeight = Math.ceil(rect.height * devicePixelRatio);
            
            // Si el src original es más grande de lo necesario, optimizar
            if (img.naturalWidth > optimalWidth * 1.5) {
                this.generateOptimizedSrc(img, optimalWidth, optimalHeight);
            }
            
            img.dataset.optimized = 'true';
        });
    }

    generateOptimizedSrc(img, width, height) {
        const originalSrc = img.src;
        
        // Si tenemos un servicio de optimización de imágenes
        if (window.IMAGE_OPTIMIZATION_ENDPOINT) {
            const optimizedSrc = `${window.IMAGE_OPTIMIZATION_ENDPOINT}?url=${encodeURIComponent(originalSrc)}&w=${width}&h=${height}&q=80`;
            img.dataset.originalSrc = originalSrc;
            img.src = optimizedSrc;
        }
    }

    // Progressive loading para imágenes grandes
    setupProgressiveLoading(img) {
        const lowQualitySrc = img.dataset.lowres;
        const highQualitySrc = img.dataset.src || img.src;
        
        if (!lowQualitySrc) return;

        // Cargar versión de baja calidad primero
        img.src = lowQualitySrc;
        img.classList.add('low-quality');
        
        // Precargar versión de alta calidad
        this.preloadImage(highQualitySrc).then(() => {
            img.src = highQualitySrc;
            img.classList.remove('low-quality');
            img.classList.add('high-quality');
        });
    }

    addImageUtilities() {
        // Agregar estilos CSS dinámicamente
        const style = document.createElement('style');
        style.textContent = `
            .image-loading {
                background: #f3f4f6;
                min-height: 100px;
            }
            
            .image-loaded {
                background: transparent;
            }
            
            .low-quality {
                filter: blur(2px);
                transition: filter 0.3s ease;
            }
            
            .high-quality {
                filter: blur(0);
            }
            
            .image-container img {
                display: block;
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            
            .image-fade-in {
                animation: imagesFadeIn 0.3s ease forwards;
            }
            
            @keyframes imagesFadeIn {
                from { opacity: 0; transform: scale(1.02); }
                to { opacity: 1; transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    // API pública
    processNewImages(container = document) {
        const newImages = container.querySelectorAll('img:not([data-optimized])');
        newImages.forEach(img => this.observeImage(img));
    }

    clearCache() {
        this.imageCache.clear();
        console.log('🗑️ Cache de imágenes limpiado');
    }

    getCacheInfo() {
        return {
            size: this.imageCache.size,
            loadingCount: this.loadingImages.size,
            retryCount: this.retryAttempts.size
        };
    }

    // Configurar responsive images automáticamente
    setupResponsiveImages() {
        const images = document.querySelectorAll('img[data-responsive]');
        
        images.forEach(img => {
            const baseSrc = img.dataset.responsive;
            const sizes = [480, 768, 1024, 1280, 1920];
            
            let srcset = sizes.map(size => 
                `${baseSrc}?w=${size} ${size}w`
            ).join(', ');
            
            img.srcset = srcset;
            img.sizes = '(max-width: 480px) 100vw, (max-width: 768px) 90vw, (max-width: 1024px) 80vw, 70vw';
        });
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.imageCache.clear();
        this.loadingImages.clear();
        this.retryAttempts.clear();
    }
}

// Auto-inicializar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.ImageOptimizer = new ImageOptimizationManager();
    });
} else {
    window.ImageOptimizer = new ImageOptimizationManager();
}

// Exportar para uso global
window.ImageOptimizationManager = ImageOptimizationManager;