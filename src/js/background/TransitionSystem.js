/**
 * TransitionSystem - Handles smooth transitions between different background states
 * Provides page transitions, theme changes, and state morphing capabilities
 */
import { AnimationEngine } from './AnimationEngine.js';

export class TransitionSystem {
    constructor(options = {}) {
        this.config = {
            defaultTransitionDuration: 1000,
            crossfadeDuration: 800,
            morphDuration: 1200,
            enableParallax: true,
            ...options
        };
        
        // Animation engine for transitions
        this.animationEngine = new AnimationEngine();
        
        // Transition state
        this.isTransitioning = false;
        this.currentTransition = null;
        this.transitionQueue = [];
        
        // Canvas layers for smooth transitions
        this.transitionCanvas = null;
        this.transitionContext = null;
        
        // Callbacks
        this.onTransitionStart = null;
        this.onTransitionComplete = null;
        this.onTransitionProgress = null;
    }
    
    /**
     * Initialize transition system with canvas
     * @param {HTMLElement} container - Container element
     */
    init(container) {
        this.container = container;
        this.createTransitionCanvas();
    }
    
    /**
     * Create transition canvas for smooth crossfades
     */
    createTransitionCanvas() {
        if (!this.container) return;
        
        this.transitionCanvas = document.createElement('canvas');
        this.transitionCanvas.className = 'transition-canvas';
        this.transitionCanvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -2;
            pointer-events: none;
            opacity: 0;
        `;
        
        this.transitionContext = this.transitionCanvas.getContext('2d', {
            alpha: true,
            desynchronized: true
        });
        
        this.container.appendChild(this.transitionCanvas);
        this.updateTransitionCanvasSize();
    }
    
    /**
     * Update transition canvas size
     */
    updateTransitionCanvasSize() {
        if (!this.transitionCanvas || !this.container) return;
        
        const rect = this.container.getBoundingClientRect();
        const pixelRatio = window.devicePixelRatio || 1;
        
        this.transitionCanvas.width = rect.width * pixelRatio;
        this.transitionCanvas.height = rect.height * pixelRatio;
        this.transitionCanvas.style.width = rect.width + 'px';
        this.transitionCanvas.style.height = rect.height + 'px';
        
        this.transitionContext.scale(pixelRatio, pixelRatio);
    }
    
    /**
     * Transition between two page backgrounds
     * @param {string} fromPage - Current page type
     * @param {string} toPage - Target page type
     * @param {Object} options - Transition options
     */
    async transitionPages(fromPage, toPage, options = {}) {
        if (this.isTransitioning) {
            // Queue the transition
            this.transitionQueue.push({ fromPage, toPage, options });
            return;
        }
        
        const transitionConfig = {
            type: 'crossfade',
            duration: this.config.defaultTransitionDuration,
            easing: 'easeInOutCubic',
            ...options
        };
        
        this.isTransitioning = true;
        this.currentTransition = { fromPage, toPage, config: transitionConfig };
        
        try {
            // Notify transition start
            if (this.onTransitionStart) {
                this.onTransitionStart(fromPage, toPage);
            }
            
            // Execute transition based on type
            switch (transitionConfig.type) {
                case 'crossfade':
                    await this.executeCrossfadeTransition(fromPage, toPage, transitionConfig);
                    break;
                case 'slide':
                    await this.executeSlideTransition(fromPage, toPage, transitionConfig);
                    break;
                case 'morph':
                    await this.executeMorphTransition(fromPage, toPage, transitionConfig);
                    break;
                case 'fade':
                    await this.executeFadeTransition(fromPage, toPage, transitionConfig);
                    break;
                default:
                    await this.executeCrossfadeTransition(fromPage, toPage, transitionConfig);
            }
            
            // Notify transition complete
            if (this.onTransitionComplete) {
                this.onTransitionComplete(fromPage, toPage);
            }
            
        } catch (error) {
            console.error('Transition failed:', error);
        } finally {
            this.isTransitioning = false;
            this.currentTransition = null;
            
            // Process queued transitions
            if (this.transitionQueue.length > 0) {
                const nextTransition = this.transitionQueue.shift();
                setTimeout(() => {
                    this.transitionPages(nextTransition.fromPage, nextTransition.toPage, nextTransition.options);
                }, 50);
            }
        }
    }
    
    /**
     * Execute crossfade transition between pages
     * @param {string} fromPage - Source page
     * @param {string} toPage - Target page
     * @param {Object} config - Transition configuration
     */
    async executeCrossfadeTransition(fromPage, toPage, config) {
        return new Promise((resolve) => {
            // Create fade out animation for current background
            const fadeOutId = this.animationEngine.animate(
                { opacity: 1 },
                { opacity: 0 },
                config.duration * 0.6,
                config.easing,
                {
                    onProgress: (target, progress) => {
                        this.updateBackgroundOpacity(1 - progress);
                        
                        if (this.onTransitionProgress) {
                            this.onTransitionProgress(progress * 0.5, fromPage, toPage);
                        }
                    }
                }
            );
            
            // Create fade in animation for new background (delayed)
            setTimeout(() => {
                const fadeInId = this.animationEngine.animate(
                    { opacity: 0 },
                    { opacity: 1 },
                    config.duration * 0.8,
                    config.easing,
                    {
                        onProgress: (target, progress) => {
                            this.updateBackgroundOpacity(progress);
                            
                            if (this.onTransitionProgress) {
                                this.onTransitionProgress(0.5 + progress * 0.5, fromPage, toPage);
                            }
                        },
                        onComplete: () => {
                            resolve();
                        }
                    }
                );
            }, config.duration * 0.2);
        });
    }
    
    /**
     * Execute slide transition between pages
     * @param {string} fromPage - Source page
     * @param {string} toPage - Target page
     * @param {Object} config - Transition configuration
     */
    async executeSlideTransition(fromPage, toPage, config) {
        return new Promise((resolve) => {
            const direction = config.direction || 'left';
            const distance = config.distance || window.innerWidth;
            
            // Slide out current background
            const slideOutTarget = { x: 0 };
            const slideOutTo = direction === 'left' ? -distance : distance;
            
            this.animationEngine.animate(
                slideOutTarget,
                { x: slideOutTo },
                config.duration * 0.6,
                'easeInCubic',
                {
                    onProgress: (target, progress) => {
                        this.updateBackgroundTransform(`translateX(${target.x}px)`);
                        
                        if (this.onTransitionProgress) {
                            this.onTransitionProgress(progress * 0.5, fromPage, toPage);
                        }
                    }
                }
            );
            
            // Slide in new background
            setTimeout(() => {
                const slideInTarget = { x: direction === 'left' ? distance : -distance };
                
                this.animationEngine.animate(
                    slideInTarget,
                    { x: 0 },
                    config.duration * 0.8,
                    'easeOutCubic',
                    {
                        onProgress: (target, progress) => {
                            this.updateBackgroundTransform(`translateX(${target.x}px)`);
                            
                            if (this.onTransitionProgress) {
                                this.onTransitionProgress(0.5 + progress * 0.5, fromPage, toPage);
                            }
                        },
                        onComplete: () => {
                            this.updateBackgroundTransform('translateX(0px)');
                            resolve();
                        }
                    }
                );
            }, config.duration * 0.1);
        });
    }
    
    /**
     * Execute morph transition between pages
     * @param {string} fromPage - Source page
     * @param {string} toPage - Target page
     * @param {Object} config - Transition configuration
     */
    async executeMorphTransition(fromPage, toPage, config) {
        return new Promise((resolve) => {
            // Create morphing animation using multiple properties
            const morphTarget = {
                scale: 1,
                rotation: 0,
                opacity: 1,
                hue: 0
            };
            
            // Phase 1: Morph out
            this.animationEngine.animate(
                morphTarget,
                {
                    scale: 0.8,
                    rotation: 5,
                    opacity: 0.3,
                    hue: 30
                },
                config.duration * 0.4,
                'easeInBack',
                {
                    onProgress: (target, progress) => {
                        this.updateBackgroundMorph(target);
                        
                        if (this.onTransitionProgress) {
                            this.onTransitionProgress(progress * 0.4, fromPage, toPage);
                        }
                    },
                    onComplete: () => {
                        // Phase 2: Morph in
                        this.animationEngine.animate(
                            morphTarget,
                            {
                                scale: 1,
                                rotation: 0,
                                opacity: 1,
                                hue: 0
                            },
                            config.duration * 0.6,
                            'easeOutBack',
                            {
                                onProgress: (target, progress) => {
                                    this.updateBackgroundMorph(target);
                                    
                                    if (this.onTransitionProgress) {
                                        this.onTransitionProgress(0.4 + progress * 0.6, fromPage, toPage);
                                    }
                                },
                                onComplete: () => {
                                    this.resetBackgroundTransform();
                                    resolve();
                                }
                            }
                        );
                    }
                }
            );
        });
    }
    
    /**
     * Execute simple fade transition
     * @param {string} fromPage - Source page
     * @param {string} toPage - Target page
     * @param {Object} config - Transition configuration
     */
    async executeFadeTransition(fromPage, toPage, config) {
        return new Promise((resolve) => {
            const fadeTarget = { opacity: 1 };
            
            this.animationEngine.animate(
                fadeTarget,
                { opacity: 0 },
                config.duration * 0.5,
                config.easing,
                {
                    onProgress: (target, progress) => {
                        this.updateBackgroundOpacity(target.opacity);
                        
                        if (this.onTransitionProgress) {
                            this.onTransitionProgress(progress * 0.5, fromPage, toPage);
                        }
                    },
                    onComplete: () => {
                        // Fade back in with new background
                        this.animationEngine.animate(
                            fadeTarget,
                            { opacity: 1 },
                            config.duration * 0.5,
                            config.easing,
                            {
                                onProgress: (target, progress) => {
                                    this.updateBackgroundOpacity(target.opacity);
                                    
                                    if (this.onTransitionProgress) {
                                        this.onTransitionProgress(0.5 + progress * 0.5, fromPage, toPage);
                                    }
                                },
                                onComplete: () => {
                                    resolve();
                                }
                            }
                        );
                    }
                }
            );
        });
    }
    
    /**
     * Create a spring-based transition
     * @param {string} fromPage - Source page
     * @param {string} toPage - Target page
     * @param {Object} springConfig - Spring physics configuration
     */
    async springTransition(fromPage, toPage, springConfig = {}) {
        const config = {
            tension: 120,
            friction: 14,
            mass: 1,
            ...springConfig
        };
        
        return new Promise((resolve) => {
            const springTarget = { 
                scale: 0.95,
                opacity: 0.8,
                y: 10
            };
            
            // Spring animation
            const springId = this.animationEngine.spring(
                springTarget,
                {
                    scale: 1,
                    opacity: 1,
                    y: 0
                },
                {
                    ...config,
                    callbacks: {
                        onProgress: (target, progress) => {
                            this.updateBackgroundSpring(target);
                            
                            if (this.onTransitionProgress) {
                                this.onTransitionProgress(progress, fromPage, toPage);
                            }
                        },
                        onComplete: () => {
                            this.resetBackgroundTransform();
                            resolve();
                        }
                    }
                }
            );
        });
    }
    
    /**
     * Update background opacity during transition
     * @param {number} opacity - Opacity value (0-1)
     */
    updateBackgroundOpacity(opacity) {
        const backgroundCanvas = document.querySelector('.background-canvas');
        if (backgroundCanvas) {
            backgroundCanvas.style.opacity = opacity;
        }
    }
    
    /**
     * Update background transform during transition
     * @param {string} transform - CSS transform string
     */
    updateBackgroundTransform(transform) {
        const backgroundCanvas = document.querySelector('.background-canvas');
        if (backgroundCanvas) {
            backgroundCanvas.style.transform = transform;
        }
    }
    
    /**
     * Update background morph properties
     * @param {Object} morphProps - Morph properties
     */
    updateBackgroundMorph(morphProps) {
        const backgroundCanvas = document.querySelector('.background-canvas');
        if (backgroundCanvas) {
            const transform = `scale(${morphProps.scale}) rotate(${morphProps.rotation}deg)`;
            const filter = `hue-rotate(${morphProps.hue}deg)`;
            
            backgroundCanvas.style.transform = transform;
            backgroundCanvas.style.filter = filter;
            backgroundCanvas.style.opacity = morphProps.opacity;
        }
    }
    
    /**
     * Update background spring properties
     * @param {Object} springProps - Spring properties
     */
    updateBackgroundSpring(springProps) {
        const backgroundCanvas = document.querySelector('.background-canvas');
        if (backgroundCanvas) {
            const transform = `scale(${springProps.scale}) translateY(${springProps.y}px)`;
            
            backgroundCanvas.style.transform = transform;
            backgroundCanvas.style.opacity = springProps.opacity;
        }
    }
    
    /**
     * Reset background transform to default
     */
    resetBackgroundTransform() {
        const backgroundCanvas = document.querySelector('.background-canvas');
        if (backgroundCanvas) {
            backgroundCanvas.style.transform = '';
            backgroundCanvas.style.filter = '';
            backgroundCanvas.style.opacity = '';
        }
    }
    
    /**
     * Create a custom transition with timeline
     * @param {Array} timeline - Array of animation steps
     * @param {Object} options - Timeline options
     */
    async customTransition(timeline, options = {}) {
        return new Promise((resolve) => {
            const timelineId = this.animationEngine.createTimeline(timeline, {
                onComplete: () => {
                    resolve();
                }
            });
        });
    }
    
    /**
     * Get transition presets
     */
    getTransitionPresets() {
        return {
            // Quick and snappy
            quick: {
                type: 'fade',
                duration: 300,
                easing: 'easeOutQuad'
            },
            
            // Smooth and elegant
            smooth: {
                type: 'crossfade',
                duration: 800,
                easing: 'easeInOutCubic'
            },
            
            // Dynamic and energetic
            dynamic: {
                type: 'slide',
                duration: 600,
                easing: 'easeOutBack',
                direction: 'left'
            },
            
            // Organic and natural
            organic: {
                type: 'morph',
                duration: 1000,
                easing: 'easeInOutSine'
            },
            
            // Bouncy and playful
            bouncy: {
                tension: 200,
                friction: 12,
                mass: 0.8
            }
        };
    }
    
    /**
     * Apply transition preset
     * @param {string} presetName - Name of preset
     * @param {string} fromPage - Source page
     * @param {string} toPage - Target page
     */
    async applyPreset(presetName, fromPage, toPage) {
        const presets = this.getTransitionPresets();
        const preset = presets[presetName];
        
        if (!preset) {
            console.warn(`Transition preset '${presetName}' not found`);
            return this.transitionPages(fromPage, toPage);
        }
        
        if (preset.tension !== undefined) {
            // Spring transition
            return this.springTransition(fromPage, toPage, preset);
        } else {
            // Regular transition
            return this.transitionPages(fromPage, toPage, preset);
        }
    }
    
    /**
     * Set transition callbacks
     * @param {Object} callbacks - Callback functions
     */
    setCallbacks(callbacks) {
        this.onTransitionStart = callbacks.onStart;
        this.onTransitionComplete = callbacks.onComplete;
        this.onTransitionProgress = callbacks.onProgress;
    }
    
    /**
     * Check if currently transitioning
     */
    isCurrentlyTransitioning() {
        return this.isTransitioning;
    }
    
    /**
     * Get current transition info
     */
    getCurrentTransition() {
        return this.currentTransition;
    }
    
    /**
     * Cancel current transition
     */
    cancelTransition() {
        if (this.isTransitioning && this.currentTransition) {
            // Stop all animations
            this.animationEngine.clear();
            
            // Reset state
            this.resetBackgroundTransform();
            this.isTransitioning = false;
            this.currentTransition = null;
            
            console.log('Transition cancelled');
        }
    }
    
    /**
     * Resize handler for responsive transitions
     */
    handleResize() {
        this.updateTransitionCanvasSize();
    }
    
    /**
     * Destroy the transition system
     */
    destroy() {
        // Cancel any active transition
        this.cancelTransition();
        
        // Clear queue
        this.transitionQueue = [];
        
        // Destroy animation engine
        if (this.animationEngine) {
            this.animationEngine.destroy();
        }
        
        // Remove transition canvas
        if (this.transitionCanvas && this.transitionCanvas.parentNode) {
            this.transitionCanvas.parentNode.removeChild(this.transitionCanvas);
        }
        
        // Clear references
        this.transitionCanvas = null;
        this.transitionContext = null;
        this.container = null;
        
        // Clear callbacks
        this.onTransitionStart = null;
        this.onTransitionComplete = null;
        this.onTransitionProgress = null;
    }
}