/**
 * PerformanceMonitor - Tracks and optimizes background system performance
 * Monitors FPS, memory usage, and automatically adjusts quality
 */
export class PerformanceMonitor {
    constructor(options = {}) {
        this.config = {
            targetFPS: 60,
            minFPS: 30,
            memoryCheckInterval: 5000, // 5 seconds
            performanceCheckInterval: 1000, // 1 second
            autoOptimize: true,
            ...options
        };
        
        // Performance metrics
        this.metrics = {
            fps: 60,
            averageFPS: 60,
            frameTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            frameDrops: 0,
            totalFrames: 0
        };
        
        // Performance history for averaging
        this.fpsHistory = [];
        this.frameTimeHistory = [];
        this.maxHistoryLength = 60; // 1 second at 60fps
        
        // Quality levels
        this.qualityLevel = 'high'; // high, medium, low
        this.qualitySettings = {
            high: {
                particleCount: 100,
                animationComplexity: 1.0,
                renderQuality: 1.0,
                enableAdvancedEffects: true
            },
            medium: {
                particleCount: 50,
                animationComplexity: 0.7,
                renderQuality: 0.8,
                enableAdvancedEffects: true
            },
            low: {
                particleCount: 20,
                animationComplexity: 0.5,
                renderQuality: 0.6,
                enableAdvancedEffects: false
            }
        };
        
        // Monitoring intervals
        this.performanceInterval = null;
        this.memoryInterval = null;
        
        // Callbacks
        this.onQualityChange = null;
        this.onPerformanceWarning = null;
        
        // Device capabilities
        this.deviceCapabilities = this.detectDeviceCapabilities();
        
        this.startMonitoring();
    }
    
    /**
     * Detect device capabilities for initial quality setting
     */
    detectDeviceCapabilities() {
        const capabilities = {
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
            hasGPU: this.checkGPUSupport(),
            memoryLimit: this.estimateMemoryLimit(),
            cpuCores: navigator.hardwareConcurrency || 4,
            pixelRatio: window.devicePixelRatio || 1
        };
        
        // Set initial quality based on capabilities
        if (capabilities.isMobile || capabilities.memoryLimit < 2000) {
            this.qualityLevel = 'medium';
        } else if (capabilities.memoryLimit < 1000) {
            this.qualityLevel = 'low';
        }
        
        return capabilities;
    }
    
    /**
     * Check if GPU acceleration is supported
     */
    checkGPUSupport() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!gl;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Estimate available memory limit
     */
    estimateMemoryLimit() {
        if ('memory' in performance) {
            return performance.memory.jsHeapSizeLimit / 1024 / 1024; // MB
        }
        
        // Fallback estimation based on device type
        if (this.deviceCapabilities?.isMobile) {
            return 1000; // 1GB estimate for mobile
        }
        
        return 4000; // 4GB estimate for desktop
    }
    
    /**
     * Start performance monitoring
     */
    startMonitoring() {
        // Performance check interval
        this.performanceInterval = setInterval(() => {
            this.checkPerformance();
        }, this.config.performanceCheckInterval);
        
        // Memory check interval
        this.memoryInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, this.config.memoryCheckInterval);
    }
    
    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
            this.performanceInterval = null;
        }
        
        if (this.memoryInterval) {
            clearInterval(this.memoryInterval);
            this.memoryInterval = null;
        }
    }
    
    /**
     * Update performance metrics with new frame data
     * @param {number} frameTime - Time taken to render the frame
     */
    updateMetrics(frameTime) {
        this.metrics.frameTime = frameTime;
        this.metrics.totalFrames++;
        
        // Calculate FPS
        if (frameTime > 0) {
            this.metrics.fps = Math.round(1000 / frameTime);
        }
        
        // Update history
        this.fpsHistory.push(this.metrics.fps);
        this.frameTimeHistory.push(frameTime);
        
        // Maintain history length
        if (this.fpsHistory.length > this.maxHistoryLength) {
            this.fpsHistory.shift();
            this.frameTimeHistory.shift();
        }
        
        // Calculate average FPS
        if (this.fpsHistory.length > 0) {
            this.metrics.averageFPS = Math.round(
                this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length
            );
        }
        
        // Track frame drops
        if (this.metrics.fps < this.config.minFPS) {
            this.metrics.frameDrops++;
        }
    }
    
    /**
     * Check overall performance and trigger optimizations if needed
     */
    checkPerformance() {
        if (!this.config.autoOptimize) return;
        
        const avgFPS = this.metrics.averageFPS;
        const frameDropRate = this.metrics.frameDrops / this.metrics.totalFrames;
        
        // Performance is poor - reduce quality
        if (avgFPS < this.config.minFPS || frameDropRate > 0.1) {
            this.reduceQuality();
        }
        // Performance is good - try to increase quality
        else if (avgFPS > this.config.targetFPS * 0.9 && frameDropRate < 0.02) {
            this.increaseQuality();
        }
    }
    
    /**
     * Check memory usage and optimize if needed
     */
    checkMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
            
            const memoryUsagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
            
            // Memory usage is high - reduce quality
            if (memoryUsagePercent > 0.8) {
                this.reduceQuality();
                
                if (this.onPerformanceWarning) {
                    this.onPerformanceWarning('high_memory', {
                        usage: this.metrics.memoryUsage,
                        percent: memoryUsagePercent * 100
                    });
                }
            }
        }
    }
    
    /**
     * Reduce quality level to improve performance
     */
    reduceQuality() {
        let newQuality = this.qualityLevel;
        
        switch (this.qualityLevel) {
            case 'high':
                newQuality = 'medium';
                break;
            case 'medium':
                newQuality = 'low';
                break;
            case 'low':
                // Already at lowest quality
                return;
        }
        
        this.setQualityLevel(newQuality);
        console.log(`Performance: Reduced quality to ${newQuality} (FPS: ${this.metrics.averageFPS})`);
    }
    
    /**
     * Increase quality level if performance allows
     */
    increaseQuality() {
        let newQuality = this.qualityLevel;
        
        switch (this.qualityLevel) {
            case 'low':
                newQuality = 'medium';
                break;
            case 'medium':
                newQuality = 'high';
                break;
            case 'high':
                // Already at highest quality
                return;
        }
        
        this.setQualityLevel(newQuality);
        console.log(`Performance: Increased quality to ${newQuality} (FPS: ${this.metrics.averageFPS})`);
    }
    
    /**
     * Set specific quality level
     * @param {string} level - Quality level (high, medium, low)
     */
    setQualityLevel(level) {
        if (!this.qualitySettings[level]) {
            console.warn(`Invalid quality level: ${level}`);
            return;
        }
        
        const oldQuality = this.qualityLevel;
        this.qualityLevel = level;
        
        // Notify callback if quality changed
        if (oldQuality !== level && this.onQualityChange) {
            this.onQualityChange(level, this.qualitySettings[level]);
        }
    }
    
    /**
     * Get current quality settings
     */
    getCurrentQualitySettings() {
        return { ...this.qualitySettings[this.qualityLevel] };
    }
    
    /**
     * Get current performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    
    /**
     * Get device capabilities
     */
    getDeviceCapabilities() {
        return { ...this.deviceCapabilities };
    }
    
    /**
     * Check if performance is acceptable
     */
    isPerformanceAcceptable() {
        return this.metrics.averageFPS >= this.config.minFPS;
    }
    
    /**
     * Get performance status
     */
    getPerformanceStatus() {
        const avgFPS = this.metrics.averageFPS;
        const frameDropRate = this.metrics.frameDrops / Math.max(this.metrics.totalFrames, 1);
        
        if (avgFPS >= this.config.targetFPS * 0.9 && frameDropRate < 0.02) {
            return 'excellent';
        } else if (avgFPS >= this.config.targetFPS * 0.7 && frameDropRate < 0.05) {
            return 'good';
        } else if (avgFPS >= this.config.minFPS && frameDropRate < 0.1) {
            return 'acceptable';
        } else {
            return 'poor';
        }
    }
    
    /**
     * Reset performance metrics
     */
    reset() {
        this.metrics = {
            fps: 60,
            averageFPS: 60,
            frameTime: 0,
            memoryUsage: 0,
            cpuUsage: 0,
            frameDrops: 0,
            totalFrames: 0
        };
        
        this.fpsHistory = [];
        this.frameTimeHistory = [];
    }
    
    /**
     * Set callback for quality changes
     * @param {Function} callback - Callback function
     */
    onQualityChanged(callback) {
        this.onQualityChange = callback;
    }
    
    /**
     * Set callback for performance warnings
     * @param {Function} callback - Callback function
     */
    onPerformanceWarning(callback) {
        this.onPerformanceWarning = callback;
    }
    
    /**
     * Destroy the performance monitor
     */
    destroy() {
        this.stopMonitoring();
        this.onQualityChange = null;
        this.onPerformanceWarning = null;
    }
}