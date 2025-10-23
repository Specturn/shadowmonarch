/**
 * AnimationEngine - Handles smooth animations and transitions for background elements
 * Provides timeline management, easing functions, and performance-optimized animations
 */
export class AnimationEngine {
    constructor(options = {}) {
        this.config = {
            defaultDuration: 1000,
            defaultEasing: 'easeOutCubic',
            maxConcurrentAnimations: 50,
            ...options
        };
        
        // Animation state
        this.animations = new Map();
        this.timelines = new Map();
        this.animationId = 0;
        this.timelineId = 0;
        this.isRunning = false;
        this.isPaused = false;
        
        // Performance tracking
        this.activeAnimationCount = 0;
        this.completedAnimations = 0;
        
        // Bind methods
        this.update = this.update.bind(this);
        
        // Start the animation loop
        this.start();
    }
    
    /**
     * Start the animation engine
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.update();
        }
    }
    
    /**
     * Stop the animation engine
     */
    stop() {
        this.isRunning = false;
        this.animations.clear();
        this.timelines.clear();
    }
    
    /**
     * Pause all animations
     */
    pause() {
        this.isPaused = true;
    }
    
    /**
     * Resume all animations
     */
    resume() {
        this.isPaused = false;
    }
    
    /**
     * Main animation update loop
     */
    update(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        if (!this.isPaused) {
            // Update individual animations
            this.updateAnimations(currentTime);
            
            // Update timelines
            this.updateTimelines(currentTime);
        }
        
        // Schedule next frame
        requestAnimationFrame(this.update);
    }
    
    /**
     * Update all active animations
     */
    updateAnimations(currentTime) {
        const completedAnimations = [];
        
        this.animations.forEach((animation, id) => {
            if (this.updateAnimation(animation, currentTime)) {
                completedAnimations.push(id);
            }
        });
        
        // Remove completed animations
        completedAnimations.forEach(id => {
            const animation = this.animations.get(id);
            if (animation && animation.onComplete) {
                animation.onComplete(animation.target, animation.properties);
            }
            this.animations.delete(id);
            this.completedAnimations++;
            this.activeAnimationCount--;
        });
    }
    
    /**
     * Update a single animation
     * @param {Object} animation - Animation object
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} - True if animation is complete
     */
    updateAnimation(animation, currentTime) {
        if (!animation.startTime) {
            animation.startTime = currentTime + (animation.delay || 0);
            return false;
        }
        
        if (currentTime < animation.startTime) {
            return false; // Animation hasn't started yet
        }
        
        const elapsed = currentTime - animation.startTime;
        const progress = Math.min(elapsed / animation.duration, 1);
        
        // Apply easing
        const easedProgress = this.applyEasing(progress, animation.easing);
        
        // Update properties
        Object.keys(animation.properties).forEach(property => {
            const prop = animation.properties[property];
            const currentValue = this.interpolate(prop.from, prop.to, easedProgress);
            
            // Apply the value to the target
            this.applyValue(animation.target, property, currentValue, prop.unit);
        });
        
        // Call progress callback if provided
        if (animation.onProgress) {
            animation.onProgress(animation.target, easedProgress, animation.properties);
        }
        
        return progress >= 1;
    }
    
    /**
     * Update all active timelines
     */
    updateTimelines(currentTime) {
        const completedTimelines = [];
        
        this.timelines.forEach((timeline, id) => {
            if (this.updateTimeline(timeline, currentTime)) {
                completedTimelines.push(id);
            }
        });
        
        // Remove completed timelines
        completedTimelines.forEach(id => {
            const timeline = this.timelines.get(id);
            if (timeline && timeline.onComplete) {
                timeline.onComplete();
            }
            this.timelines.delete(id);
        });
    }
    
    /**
     * Update a single timeline
     * @param {Object} timeline - Timeline object
     * @param {number} currentTime - Current timestamp
     * @returns {boolean} - True if timeline is complete
     */
    updateTimeline(timeline, currentTime) {
        if (!timeline.startTime) {
            timeline.startTime = currentTime;
        }
        
        const elapsed = currentTime - timeline.startTime;
        let allComplete = true;
        
        timeline.animations.forEach(animConfig => {
            if (!animConfig.started && elapsed >= (animConfig.delay || 0)) {
                // Start this animation
                animConfig.started = true;
                animConfig.animationId = this.animate(
                    animConfig.target,
                    animConfig.properties,
                    animConfig.duration,
                    animConfig.easing,
                    {
                        onProgress: animConfig.onProgress,
                        onComplete: animConfig.onComplete
                    }
                );
            }
            
            if (!animConfig.started || this.animations.has(animConfig.animationId)) {
                allComplete = false;
            }
        });
        
        return allComplete;
    }
    
    /**
     * Animate an object's properties
     * @param {Object} target - Target object to animate
     * @param {Object} properties - Properties to animate with from/to values
     * @param {number} duration - Animation duration in milliseconds
     * @param {string} easing - Easing function name
     * @param {Object} callbacks - Optional callbacks (onProgress, onComplete)
     * @returns {number} - Animation ID
     */
    animate(target, properties, duration = this.config.defaultDuration, easing = this.config.defaultEasing, callbacks = {}) {
        if (this.activeAnimationCount >= this.config.maxConcurrentAnimations) {
            console.warn('Maximum concurrent animations reached');
            return null;
        }
        
        const id = ++this.animationId;
        
        // Normalize properties
        const normalizedProperties = {};
        Object.keys(properties).forEach(key => {
            const prop = properties[key];
            if (typeof prop === 'object' && prop.from !== undefined && prop.to !== undefined) {
                normalizedProperties[key] = prop;
            } else {
                // Assume it's a 'to' value, get current value as 'from'
                normalizedProperties[key] = {
                    from: this.getCurrentValue(target, key),
                    to: prop,
                    unit: this.detectUnit(prop)
                };
            }
        });
        
        const animation = {
            id,
            target,
            properties: normalizedProperties,
            duration,
            easing,
            startTime: null,
            delay: callbacks.delay || 0,
            onProgress: callbacks.onProgress,
            onComplete: callbacks.onComplete
        };
        
        this.animations.set(id, animation);
        this.activeAnimationCount++;
        
        return id;
    }
    
    /**
     * Create a timeline of sequential/parallel animations
     * @param {Array} animationConfigs - Array of animation configurations
     * @param {Object} options - Timeline options
     * @returns {number} - Timeline ID
     */
    createTimeline(animationConfigs, options = {}) {
        const id = ++this.timelineId;
        
        const timeline = {
            id,
            animations: animationConfigs.map(config => ({
                ...config,
                started: false,
                animationId: null
            })),
            startTime: null,
            onComplete: options.onComplete
        };
        
        this.timelines.set(id, timeline);
        
        return id;
    }
    
    /**
     * Stop a specific animation
     * @param {number} animationId - Animation ID to stop
     */
    stopAnimation(animationId) {
        if (this.animations.has(animationId)) {
            this.animations.delete(animationId);
            this.activeAnimationCount--;
        }
    }
    
    /**
     * Stop a specific timeline
     * @param {number} timelineId - Timeline ID to stop
     */
    stopTimeline(timelineId) {
        if (this.timelines.has(timelineId)) {
            const timeline = this.timelines.get(timelineId);
            
            // Stop all animations in the timeline
            timeline.animations.forEach(animConfig => {
                if (animConfig.animationId) {
                    this.stopAnimation(animConfig.animationId);
                }
            });
            
            this.timelines.delete(timelineId);
        }
    }
    
    /**
     * Apply easing function to progress value
     * @param {number} progress - Linear progress (0-1)
     * @param {string} easingName - Name of easing function
     * @returns {number} - Eased progress value
     */
    applyEasing(progress, easingName) {
        const easingFunctions = {
            linear: (t) => t,
            easeInQuad: (t) => t * t,
            easeOutQuad: (t) => t * (2 - t),
            easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
            easeInCubic: (t) => t * t * t,
            easeOutCubic: (t) => (--t) * t * t + 1,
            easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
            easeInQuart: (t) => t * t * t * t,
            easeOutQuart: (t) => 1 - (--t) * t * t * t,
            easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
            easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
            easeOutSine: (t) => Math.sin(t * Math.PI / 2),
            easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
            easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
            easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            easeInOutExpo: (t) => {
                if (t === 0) return 0;
                if (t === 1) return 1;
                if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
                return (2 - Math.pow(2, -20 * t + 10)) / 2;
            },
            easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
            easeOutCirc: (t) => Math.sqrt(1 - (--t) * t),
            easeInOutCirc: (t) => {
                if (t < 0.5) return (1 - Math.sqrt(1 - 4 * t * t)) / 2;
                return (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2;
            },
            easeInBack: (t) => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return c3 * t * t * t - c1 * t * t;
            },
            easeOutBack: (t) => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            },
            easeInOutBack: (t) => {
                const c1 = 1.70158;
                const c2 = c1 * 1.525;
                return t < 0.5
                    ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
                    : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
            }
        };
        
        const easingFunction = easingFunctions[easingName] || easingFunctions.easeOutCubic;
        return easingFunction(progress);
    }
    
    /**
     * Interpolate between two values
     * @param {number} from - Start value
     * @param {number} to - End value
     * @param {number} progress - Progress (0-1)
     * @returns {number} - Interpolated value
     */
    interpolate(from, to, progress) {
        return from + (to - from) * progress;
    }
    
    /**
     * Get current value of a property from target
     * @param {Object} target - Target object
     * @param {string} property - Property name
     * @returns {number} - Current value
     */
    getCurrentValue(target, property) {
        if (target[property] !== undefined) {
            return parseFloat(target[property]) || 0;
        }
        return 0;
    }
    
    /**
     * Detect unit from a value string
     * @param {*} value - Value to detect unit from
     * @returns {string} - Detected unit or empty string
     */
    detectUnit(value) {
        if (typeof value === 'string') {
            const match = value.match(/[a-zA-Z%]+$/);
            return match ? match[0] : '';
        }
        return '';
    }
    
    /**
     * Apply animated value to target
     * @param {Object} target - Target object
     * @param {string} property - Property name
     * @param {number} value - Animated value
     * @param {string} unit - Unit string
     */
    applyValue(target, property, value, unit = '') {
        const finalValue = unit ? `${value}${unit}` : value;
        
        // Handle different target types
        if (target.style && property in target.style) {
            // DOM element style property
            target.style[property] = finalValue;
        } else if (target[property] !== undefined) {
            // Direct property
            target[property] = value;
        } else if (target.setAttribute && typeof target.getAttribute === 'function') {
            // SVG/DOM attribute
            target.setAttribute(property, finalValue);
        }
    }
    
    /**
     * Create a spring animation with physics
     * @param {Object} target - Target object
     * @param {Object} properties - Properties to animate
     * @param {Object} springConfig - Spring configuration
     * @returns {number} - Animation ID
     */
    spring(target, properties, springConfig = {}) {
        const config = {
            tension: 120,
            friction: 14,
            mass: 1,
            ...springConfig
        };
        
        // Convert spring physics to duration and easing
        const duration = this.calculateSpringDuration(config);
        const easing = 'easeOutBack'; // Approximation of spring behavior
        
        return this.animate(target, properties, duration, easing, springConfig.callbacks);
    }
    
    /**
     * Calculate spring animation duration based on physics
     * @param {Object} config - Spring configuration
     * @returns {number} - Duration in milliseconds
     */
    calculateSpringDuration(config) {
        const { tension, friction, mass } = config;
        
        // Simplified spring duration calculation
        const dampingRatio = friction / (2 * Math.sqrt(tension * mass));
        const naturalFreq = Math.sqrt(tension / mass);
        
        if (dampingRatio < 1) {
            // Underdamped
            const dampedFreq = naturalFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
            return (4 / dampedFreq) * 1000; // Convert to milliseconds
        } else {
            // Overdamped or critically damped
            return (4 / naturalFreq) * 1000;
        }
    }
    
    /**
     * Get animation statistics
     */
    getStats() {
        return {
            activeAnimations: this.activeAnimationCount,
            completedAnimations: this.completedAnimations,
            activeTimelines: this.timelines.size,
            isRunning: this.isRunning,
            isPaused: this.isPaused
        };
    }
    
    /**
     * Clear all animations and timelines
     */
    clear() {
        this.animations.clear();
        this.timelines.clear();
        this.activeAnimationCount = 0;
    }
    
    /**
     * Destroy the animation engine
     */
    destroy() {
        this.stop();
        this.clear();
    }
}