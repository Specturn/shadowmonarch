/**
 * BackgroundIntegration - Integrates enhanced background system with the main app
 * Handles initialization, page transitions, and cleanup
 */
import { BackgroundManager } from './BackgroundManager.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { AccessibilityController } from './AccessibilityController.js';

export class BackgroundIntegration {
    constructor() {
        this.backgroundManager = null;
        this.performanceMonitor = null;
        this.accessibilityController = null;
        this.currentPage = null;
        this.isInitialized = false;
        
        // Configuration
        this.config = {
            enablePerformanceMonitoring: true,
            enableAccessibilityControls: true,
            autoInitialize: true
        };
    }
    
    /**
     * Initialize the background system
     * @param {HTMLElement} container - Container element (usually document.body)
     */
    init(container = document.body) {
        if (this.isInitialized) {
            console.warn('BackgroundIntegration already initialized');
            return;
        }
        
        try {
            // Initialize accessibility controller first
            if (this.config.enableAccessibilityControls) {
                this.accessibilityController = new AccessibilityController();
                this.setupAccessibilityHandlers();
            }
            
            // Initialize performance monitor
            if (this.config.enablePerformanceMonitoring) {
                this.performanceMonitor = new PerformanceMonitor();
                this.setupPerformanceHandlers();
            }
            
            // Initialize background manager
            this.backgroundManager = new BackgroundManager({
                enableGPUAcceleration: true,
                targetFPS: 60
            });
            
            // Connect systems
            this.connectSystems();
            
            this.isInitialized = true;
            console.log('BackgroundIntegration initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize BackgroundIntegration:', error);
            this.cleanup();
        }
    }
    
    /**
     * Setup accessibility event handlers
     */
    setupAccessibilityHandlers() {
        if (!this.accessibilityController) return;
        
        this.accessibilityController.onPreferenceChanged((key, value, allPreferences) => {
            console.log(`Accessibility preference changed: ${key} = ${value}`);
            
            // Apply accessibility styles
            this.accessibilityController.applyAccessibilityStyles();
            
            // Restart background with new accessibility settings if needed
            if (this.backgroundManager && this.currentPage) {
                this.updateBackgroundForAccessibility();
            }
        });
    }
    
    /**
     * Setup performance monitoring handlers
     */
    setupPerformanceHandlers() {
        if (!this.performanceMonitor) return;
        
        this.performanceMonitor.onQualityChanged((level, settings) => {
            console.log(`Performance: Quality changed to ${level}`, settings);
            
            // Update background manager with new quality settings
            if (this.backgroundManager) {
                this.applyQualitySettings(settings);
            }
        });
        
        this.performanceMonitor.onPerformanceWarning((type, data) => {
            console.warn(`Performance warning: ${type}`, data);
            
            // Handle specific performance warnings
            switch (type) {
                case 'high_memory':
                    this.handleHighMemoryWarning(data);
                    break;
                case 'low_fps':
                    this.handleLowFPSWarning(data);
                    break;
            }
        });
    }
    
    /**
     * Connect all systems together
     */
    connectSystems() {
        // Connect performance monitor to background manager
        if (this.performanceMonitor && this.backgroundManager) {
            // Override the render method to include performance tracking
            const originalRender = this.backgroundManager.render.bind(this.backgroundManager);
            this.backgroundManager.render = (currentTime) => {
                const startTime = performance.now();
                originalRender(currentTime);
                const endTime = performance.now();
                
                this.performanceMonitor.updateMetrics(endTime - startTime);
            };
        }
    }
    
    /**
     * Start background for a specific page
     * @param {string} pageType - Type of page (dashboard, workout, etc.)
     * @param {HTMLElement} container - Container element
     */
    startBackground(pageType, container = document.body) {
        if (!this.isInitialized) {
            console.warn('BackgroundIntegration not initialized');
            return;
        }
        
        // Stop current background if running
        this.stopBackground();
        
        try {
            // Get accessibility-adapted configuration
            let config = {};
            if (this.accessibilityController) {
                config = this.accessibilityController.getAdaptedConfig(config);
            }
            
            // Get performance-adapted configuration
            if (this.performanceMonitor) {
                const qualitySettings = this.performanceMonitor.getCurrentQualitySettings();
                config = { ...config, ...qualitySettings };
            }
            
            // Initialize background for the page
            this.backgroundManager.init(pageType, container);
            this.currentPage = pageType;
            
            // Apply initial quality settings
            if (this.performanceMonitor) {
                this.applyQualitySettings(this.performanceMonitor.getCurrentQualitySettings());
            }
            
            console.log(`Background started for page: ${pageType}`);
            
        } catch (error) {
            console.error(`Failed to start background for ${pageType}:`, error);
        }
    }
    
    /**
     * Stop the current background
     */
    stopBackground() {
        if (this.backgroundManager) {
            this.backgroundManager.destroy();
        }
        this.currentPage = null;
    }
    
    /**
     * Update background for accessibility changes
     */
    updateBackgroundForAccessibility() {
        if (!this.accessibilityController || !this.backgroundManager || !this.currentPage) {
            return;
        }
        
        // Get updated accessibility configuration
        const config = this.accessibilityController.getAdaptedConfig();
        
        // Restart background with new settings
        const container = this.backgroundManager.container;
        this.startBackground(this.currentPage, container);
    }
    
    /**
     * Apply quality settings to background manager
     * @param {Object} settings - Quality settings object
     */
    applyQualitySettings(settings) {
        if (!this.backgroundManager) return;
        
        // Apply settings to background manager
        // This will be expanded when we implement the pattern and particle systems
        console.log('Applying quality settings:', settings);
    }
    
    /**
     * Handle high memory usage warning
     * @param {Object} data - Memory usage data
     */
    handleHighMemoryWarning(data) {
        console.warn(`High memory usage detected: ${data.usage}MB (${data.percent}%)`);
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        // Reduce background complexity
        if (this.performanceMonitor) {
            this.performanceMonitor.setQualityLevel('low');
        }
    }
    
    /**
     * Handle low FPS warning
     * @param {Object} data - FPS data
     */
    handleLowFPSWarning(data) {
        console.warn(`Low FPS detected: ${data.fps}fps`);
        
        // Automatically reduce quality
        if (this.performanceMonitor) {
            this.performanceMonitor.reduceQuality();
        }
    }
    
    /**
     * Get current background status
     */
    getStatus() {
        const status = {
            initialized: this.isInitialized,
            currentPage: this.currentPage,
            backgroundActive: this.backgroundManager?.isInitialized || false
        };
        
        if (this.performanceMonitor) {
            status.performance = this.performanceMonitor.getMetrics();
            status.qualityLevel = this.performanceMonitor.qualityLevel;
        }
        
        if (this.accessibilityController) {
            status.accessibility = this.accessibilityController.getAccessibilityStatus();
        }
        
        return status;
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return this.performanceMonitor?.getMetrics() || null;
    }
    
    /**
     * Get accessibility status
     */
    getAccessibilityStatus() {
        return this.accessibilityController?.getAccessibilityStatus() || null;
    }
    
    /**
     * Manually set quality level
     * @param {string} level - Quality level (high, medium, low)
     */
    setQualityLevel(level) {
        if (this.performanceMonitor) {
            this.performanceMonitor.setQualityLevel(level);
        }
    }
    
    /**
     * Enable or disable performance monitoring
     * @param {boolean} enabled - Whether to enable monitoring
     */
    setPerformanceMonitoring(enabled) {
        if (enabled && !this.performanceMonitor) {
            this.performanceMonitor = new PerformanceMonitor();
            this.setupPerformanceHandlers();
        } else if (!enabled && this.performanceMonitor) {
            this.performanceMonitor.destroy();
            this.performanceMonitor = null;
        }
    }
    
    /**
     * Clean up all resources
     */
    cleanup() {
        try {
            if (this.backgroundManager) {
                this.backgroundManager.destroy();
                this.backgroundManager = null;
            }
            
            if (this.performanceMonitor) {
                this.performanceMonitor.destroy();
                this.performanceMonitor = null;
            }
            
            if (this.accessibilityController) {
                this.accessibilityController.destroy();
                this.accessibilityController = null;
            }
            
            this.currentPage = null;
            this.isInitialized = false;
            
            console.log('BackgroundIntegration cleaned up');
            
        } catch (error) {
            console.error('Error during BackgroundIntegration cleanup:', error);
        }
    }
    
    /**
     * Destroy the background integration system
     */
    destroy() {
        this.cleanup();
    }
}

// Create and export a singleton instance
export const backgroundIntegration = new BackgroundIntegration();