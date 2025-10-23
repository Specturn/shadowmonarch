/**
 * BackgroundManager - Core controller for enhanced background system
 * Manages canvas rendering, layers, and responsive scaling
 */
import { AnimationEngine } from './AnimationEngine.js';
import { TransitionSystem } from './TransitionSystem.js';

export class BackgroundManager {
    constructor(options = {}) {
        this.canvas = null;
        this.context = null;
        this.container = null;
        this.animationId = null;
        this.isInitialized = false;
        this.isAnimating = false;
        
        // Configuration
        this.config = {
            pixelRatio: window.devicePixelRatio || 1,
            targetFPS: 60,
            enableGPUAcceleration: true,
            ...options
        };
        
        // Layer system
        this.layers = new Map();
        this.layerOrder = ['base', 'patterns', 'particles', 'interactive', 'overlay'];
        
        // Animation and transition systems
        this.animationEngine = new AnimationEngine();
        this.transitionSystem = new TransitionSystem();
        
        // Performance tracking
        this.performance = {
            fps: 60,
            frameTime: 0,
            lastFrameTime: 0,
            frameCount: 0
        };
        
        // Responsive handling
        this.dimensions = {
            width: 0,
            height: 0,
            aspectRatio: 1
        };
        
        // Bind methods
        this.render = this.render.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }
    
    /**
     * Initialize the background system
     * @param {string} pageType - Type of page (dashboard, workout, etc.)
     * @param {HTMLElement} container - Container element for the canvas
     */
    init(pageType, container) {
        if (this.isInitialized) {
            this.destroy();
        }
        
        this.container = container;
        this.pageType = pageType;
        
        // Create and setup canvas
        this.createCanvas();
        this.setupCanvas();
        this.setupEventListeners();
        
        // Initialize transition system
        this.transitionSystem.init(container);
        
        // Initialize layers
        this.initializeLayers();
        
        // Start rendering
        this.startAnimation();
        
        this.isInitialized = true;
        console.log(`BackgroundManager initialized for ${pageType}`);
    }
    
    /**
     * Create the main canvas element
     */
    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'background-canvas';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        `;
        
        this.context = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: this.config.enableGPUAcceleration
        });
        
        this.container.appendChild(this.canvas);
    }
    
    /**
     * Setup canvas properties and dimensions
     */
    setupCanvas() {
        this.updateDimensions();
        
        // Enable GPU acceleration if supported
        if (this.config.enableGPUAcceleration) {
            this.context.imageSmoothingEnabled = true;
            this.context.imageSmoothingQuality = 'high';
        }
    }
    
    /**
     * Update canvas dimensions for responsive design
     */
    updateDimensions() {
        const rect = this.container.getBoundingClientRect();
        const pixelRatio = this.config.pixelRatio;
        
        this.dimensions.width = rect.width;
        this.dimensions.height = rect.height;
        this.dimensions.aspectRatio = rect.width / rect.height;
        
        // Set canvas size with pixel ratio for crisp rendering
        this.canvas.width = rect.width * pixelRatio;
        this.canvas.height = rect.height * pixelRatio;
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Scale context for pixel ratio
        this.context.scale(pixelRatio, pixelRatio);
    }
    
    /**
     * Setup event listeners for responsive behavior
     */
    setupEventListeners() {
        window.addEventListener('resize', this.handleResize);
        
        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimation();
            } else {
                this.resumeAnimation();
            }
        });
    }
    
    /**
     * Handle window resize events
     */
    handleResize() {
        this.updateDimensions();
        
        // Notify all layers of resize
        this.layers.forEach(layer => {
            if (layer.resize) {
                layer.resize(this.dimensions);
            }
        });
    }
    
    /**
     * Initialize background layers
     */
    initializeLayers() {
        this.layerOrder.forEach(layerName => {
            const layer = this.createLayer(layerName);
            if (layer) {
                this.layers.set(layerName, layer);
            }
        });
    }
    
    /**
     * Create a specific layer based on type
     * @param {string} layerName - Name of the layer to create
     */
    createLayer(layerName) {
        // Base layer configuration
        const baseConfig = {
            name: layerName,
            pageType: this.pageType,
            dimensions: this.dimensions,
            context: this.context
        };
        
        switch (layerName) {
            case 'base':
                return {
                    ...baseConfig,
                    render: this.renderBaseLayer.bind(this)
                };
            case 'patterns':
                return {
                    ...baseConfig,
                    render: this.renderPatternsLayer.bind(this)
                };
            case 'particles':
                return {
                    ...baseConfig,
                    render: this.renderParticlesLayer.bind(this)
                };
            case 'interactive':
                return {
                    ...baseConfig,
                    render: this.renderInteractiveLayer.bind(this)
                };
            case 'overlay':
                return {
                    ...baseConfig,
                    render: this.renderOverlayLayer.bind(this)
                };
            default:
                return null;
        }
    }
    
    /**
     * Main render loop
     */
    render(currentTime = 0) {
        if (!this.isAnimating || !this.isInitialized) return;
        
        // Calculate frame timing
        const deltaTime = currentTime - this.performance.lastFrameTime;
        this.performance.frameTime = deltaTime;
        this.performance.lastFrameTime = currentTime;
        
        // Update FPS calculation
        this.performance.frameCount++;
        if (this.performance.frameCount % 60 === 0) {
            this.performance.fps = Math.round(1000 / deltaTime);
        }
        
        // Clear canvas
        this.context.clearRect(0, 0, this.dimensions.width, this.dimensions.height);
        
        // Render all layers in order
        this.layerOrder.forEach(layerName => {
            const layer = this.layers.get(layerName);
            if (layer && layer.render) {
                this.context.save();
                layer.render(currentTime, deltaTime);
                this.context.restore();
            }
        });
        
        // Schedule next frame
        this.animationId = requestAnimationFrame(this.render);
    }
    
    /**
     * Start the animation loop
     */
    startAnimation() {
        if (!this.isAnimating) {
            this.isAnimating = true;
            this.animationId = requestAnimationFrame(this.render);
        }
    }
    
    /**
     * Pause the animation loop
     */
    pauseAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    /**
     * Resume the animation loop
     */
    resumeAnimation() {
        if (!this.isAnimating) {
            this.startAnimation();
        }
    }
    
    /**
     * Render base layer (gradients and foundation)
     */
    renderBaseLayer(currentTime, deltaTime) {
        const { width, height } = this.dimensions;
        const ctx = this.context;
        
        // Create base gradient based on page type
        const gradient = this.createBaseGradient();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    /**
     * Render patterns layer (geometric and organic shapes)
     */
    renderPatternsLayer(currentTime, deltaTime) {
        // Placeholder for patterns - will be implemented in pattern generation tasks
        const ctx = this.context;
        ctx.globalAlpha = 0.1;
        
        // Simple placeholder pattern
        ctx.strokeStyle = this.getPageColor();
        ctx.lineWidth = 1;
        
        const spacing = 50;
        for (let x = 0; x < this.dimensions.width; x += spacing) {
            for (let y = 0; y < this.dimensions.height; y += spacing) {
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.globalAlpha = 1;
    }
    
    /**
     * Render particles layer (floating elements)
     */
    renderParticlesLayer(currentTime, deltaTime) {
        // Placeholder for particles - will be implemented in particle system tasks
    }
    
    /**
     * Render interactive layer (mouse/touch responsive elements)
     */
    renderInteractiveLayer(currentTime, deltaTime) {
        // Placeholder for interactive elements - will be implemented in interaction tasks
    }
    
    /**
     * Render overlay layer (subtle textures and lighting)
     */
    renderOverlayLayer(currentTime, deltaTime) {
        // Placeholder for overlay effects - will be implemented in advanced effects tasks
    }
    
    /**
     * Create base gradient for the current page type
     */
    createBaseGradient() {
        const { width, height } = this.dimensions;
        const ctx = this.context;
        
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        
        switch (this.pageType) {
            case 'dashboard':
                gradient.addColorStop(0, '#1e293b');
                gradient.addColorStop(0.5, '#0f172a');
                gradient.addColorStop(1, '#1e1b4b');
                break;
            case 'workout':
                gradient.addColorStop(0, '#7c2d12');
                gradient.addColorStop(0.5, '#1c1917');
                gradient.addColorStop(1, '#450a0a');
                break;
            case 'gates':
                gradient.addColorStop(0, '#581c87');
                gradient.addColorStop(0.5, '#1e1b4b');
                gradient.addColorStop(1, '#312e81');
                break;
            case 'architect':
                gradient.addColorStop(0, '#065f46');
                gradient.addColorStop(0.5, '#064e3b');
                gradient.addColorStop(1, '#022c22');
                break;
            case 'achievements':
                gradient.addColorStop(0, '#b45309');
                gradient.addColorStop(0.5, '#92400e');
                gradient.addColorStop(1, '#451a03');
                break;
            case 'settings':
                gradient.addColorStop(0, '#374151');
                gradient.addColorStop(0.5, '#1f2937');
                gradient.addColorStop(1, '#111827');
                break;
            default:
                gradient.addColorStop(0, '#1e293b');
                gradient.addColorStop(0.5, '#0f172a');
                gradient.addColorStop(1, '#1e1b4b');
        }
        
        return gradient;
    }
    
    /**
     * Get primary color for the current page type
     */
    getPageColor() {
        switch (this.pageType) {
            case 'dashboard': return '#6366f1';
            case 'workout': return '#ef4444';
            case 'gates': return '#9333ea';
            case 'architect': return '#10b981';
            case 'achievements': return '#f59e0b';
            case 'settings': return '#6b7280';
            default: return '#6366f1';
        }
    }
    
    /**
     * Transition to a new page background
     * @param {string} newPageType - Target page type
     * @param {Object} transitionOptions - Transition configuration
     */
    async transitionToPage(newPageType, transitionOptions = {}) {
        if (!this.transitionSystem) return;
        
        const currentPageType = this.pageType;
        
        // Use transition system for smooth page changes
        await this.transitionSystem.transitionPages(currentPageType, newPageType, transitionOptions);
        
        // Update page type
        this.pageType = newPageType;
        
        // Recreate layers for new page
        this.initializeLayers();
    }
    
    /**
     * Get available transition presets
     */
    getTransitionPresets() {
        return this.transitionSystem?.getTransitionPresets() || {};
    }
    
    /**
     * Apply a transition preset
     * @param {string} presetName - Name of the preset
     * @param {string} newPageType - Target page type
     */
    async applyTransitionPreset(presetName, newPageType) {
        if (!this.transitionSystem) return;
        
        await this.transitionSystem.applyPreset(presetName, this.pageType, newPageType);
        this.pageType = newPageType;
        this.initializeLayers();
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performance };
    }
    
    /**
     * Clean up resources and destroy the background system
     */
    destroy() {
        if (!this.isInitialized) return;
        
        // Stop animation
        this.pauseAnimation();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Clean up animation and transition systems
        if (this.animationEngine) {
            this.animationEngine.destroy();
        }
        
        if (this.transitionSystem) {
            this.transitionSystem.destroy();
        }
        
        // Clean up layers
        this.layers.clear();
        
        // Remove canvas
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        
        // Reset state
        this.canvas = null;
        this.context = null;
        this.container = null;
        this.isInitialized = false;
        this.isAnimating = false;
        
        console.log('BackgroundManager destroyed');
    }
}