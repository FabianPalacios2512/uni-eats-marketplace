/**
 * @file Sistema de logging inteligente para Uni-Eats
 * @description Logging condicional para development/production con niveles de severidad
 * @version 1.0
 */

const Logger = {
    // Configuration
    config: {
        // Set to false in production to disable all logging
        enabled: window.location.hostname === 'localhost' || window.location.hostname.includes('dev'),
        levels: {
            ERROR: 0,   // Always show in production
            WARN: 1,    // Show in development and staging
            INFO: 2,    // Show only in development
            DEBUG: 3    // Show only in development with verbose flag
        },
        currentLevel: window.location.hostname === 'localhost' ? 3 : 1, // DEBUG in dev, WARN in prod
        prefix: '🏪 Uni-Eats'
    },

    // Internal methods
    _shouldLog(level) {
        return this.config.enabled && level <= this.config.currentLevel;
    },

    _formatMessage(level, component, message, data = null) {
        const timestamp = new Date().toISOString().substr(11, 12);
        const icons = { 0: '❌', 1: '⚠️', 2: 'ℹ️', 3: '🐛' };
        const levelName = Object.keys(this.config.levels)[level];
        
        let formattedMsg = `${icons[level]} [${timestamp}] ${this.config.prefix}::${component} - ${message}`;
        
        if (data) {
            return [formattedMsg, data];
        }
        return [formattedMsg];
    },

    // Public logging methods
    error(component, message, error = null) {
        if (this._shouldLog(0)) {
            const args = this._formatMessage(0, component, message, error);
            console.error(...args);
        }
    },

    warn(component, message, data = null) {
        if (this._shouldLog(1)) {
            const args = this._formatMessage(1, component, message, data);
            console.warn(...args);
        }
    },

    info(component, message, data = null) {
        if (this._shouldLog(2)) {
            const args = this._formatMessage(2, component, message, data);
            console.log(...args);
        }
    },

    debug(component, message, data = null) {
        if (this._shouldLog(3)) {
            const args = this._formatMessage(3, component, message, data);
            console.log(...args);
        }
    },

    // Performance timing
    time(component, label) {
        if (this._shouldLog(2)) {
            console.time(`${this.config.prefix}::${component}::${label}`);
        }
    },

    timeEnd(component, label) {
        if (this._shouldLog(2)) {
            console.timeEnd(`${this.config.prefix}::${component}::${label}`);
        }
    },

    // Group logging for related operations
    group(component, title) {
        if (this._shouldLog(2)) {
            console.group(`${this.config.prefix}::${component} - ${title}`);
        }
    },

    groupEnd() {
        if (this._shouldLog(2)) {
            console.groupEnd();
        }
    }
};

// Export for use in other modules
window.Logger = Logger;