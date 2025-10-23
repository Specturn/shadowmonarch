/**
 * AccessibilityController - Handles motion and contrast preferences
 * Ensures background system respects user accessibility needs
 */
export class AccessibilityController {
    constructor(options = {}) {
        this.config = {
            respectMotionPreference: true,
            respectContrastPreference: true,
            enableForcedColors: true,
            ...options
        };
        
        // Accessibility state
        this.preferences = {
            reducedMotion: false,
            highContrast: false,
            forcedColors: false,
            colorScheme: 'dark' // dark, light, auto
        };
        
        // Media query listeners
        this.mediaQueries = new Map();
        
        // Callbacks
        this.onPreferenceChange = null;
        
        this.initializePreferences();
        this.setupMediaQueryListeners();
    }
    
    /**
     * Initialize accessibility preferences
     */
    initializePreferences() {
        // Check reduced motion preference
        this.preferences.reducedMotion = this.checkReducedMotionPreference();
        
        // Check high contrast preference
        this.preferences.highContrast = this.checkHighContrastPreference();
        
        // Check forced colors (Windows high contrast mode)
        this.preferences.forcedColors = this.checkForcedColorsPreference();
        
        // Check color scheme preference
        this.preferences.colorScheme = this.checkColorSchemePreference();
        
        console.log('Accessibility preferences initialized:', this.preferences);
    }
    
    /**
     * Setup media query listeners for dynamic preference changes
     */
    setupMediaQueryListeners() {
        // Reduced motion listener
        if (this.config.respectMotionPreference) {
            this.addMediaQueryListener(
                '(prefers-reduced-motion: reduce)',
                'reducedMotion',
                (matches) => {
                    this.preferences.reducedMotion = matches;
                    this.notifyPreferenceChange('reducedMotion', matches);
                }
            );
        }
        
        // High contrast listener
        if (this.config.respectContrastPreference) {
            this.addMediaQueryListener(
                '(prefers-contrast: high)',
                'highContrast',
                (matches) => {
                    this.preferences.highContrast = matches;
                    this.notifyPreferenceChange('highContrast', matches);
                }
            );
        }
        
        // Forced colors listener (Windows high contrast)
        if (this.config.enableForcedColors) {
            this.addMediaQueryListener(
                '(forced-colors: active)',
                'forcedColors',
                (matches) => {
                    this.preferences.forcedColors = matches;
                    this.notifyPreferenceChange('forcedColors', matches);
                }
            );
        }
        
        // Color scheme listener
        this.addMediaQueryListener(
            '(prefers-color-scheme: dark)',
            'colorScheme',
            (matches) => {
                this.preferences.colorScheme = matches ? 'dark' : 'light';
                this.notifyPreferenceChange('colorScheme', this.preferences.colorScheme);
            }
        );
    }
    
    /**
     * Add a media query listener
     * @param {string} query - Media query string
     * @param {string} key - Preference key
     * @param {Function} callback - Callback function
     */
    addMediaQueryListener(query, key, callback) {
        try {
            const mediaQuery = window.matchMedia(query);
            const handler = (e) => callback(e.matches);
            
            // Add listener
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handler);
            } else {
                // Fallback for older browsers
                mediaQuery.addListener(handler);
            }
            
            // Store for cleanup
            this.mediaQueries.set(key, { mediaQuery, handler });
            
        } catch (error) {
            console.warn(`Failed to setup media query listener for ${query}:`, error);
        }
    }
    
    /**
     * Check reduced motion preference
     */
    checkReducedMotionPreference() {
        try {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        } catch (error) {
            console.warn('Failed to check reduced motion preference:', error);
            return false;
        }
    }
    
    /**
     * Check high contrast preference
     */
    checkHighContrastPreference() {
        try {
            return window.matchMedia('(prefers-contrast: high)').matches;
        } catch (error) {
            console.warn('Failed to check high contrast preference:', error);
            return false;
        }
    }
    
    /**
     * Check forced colors preference (Windows high contrast)
     */
    checkForcedColorsPreference() {
        try {
            return window.matchMedia('(forced-colors: active)').matches;
        } catch (error) {
            console.warn('Failed to check forced colors preference:', error);
            return false;
        }
    }
    
    /**
     * Check color scheme preference
     */
    checkColorSchemePreference() {
        try {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
                return 'light';
            }
            return 'auto';
        } catch (error) {
            console.warn('Failed to check color scheme preference:', error);
            return 'auto';
        }
    }
    
    /**
     * Get accessibility-adapted configuration for background system
     * @param {Object} baseConfig - Base configuration object
     */
    getAdaptedConfig(baseConfig = {}) {
        const adaptedConfig = { ...baseConfig };
        
        // Adapt for reduced motion
        if (this.preferences.reducedMotion) {
            adaptedConfig.enableAnimations = false;
            adaptedConfig.enableParticles = false;
            adaptedConfig.enableInteractiveEffects = false;
            adaptedConfig.animationSpeed = 0;
            adaptedConfig.particleCount = 0;
        }
        
        // Adapt for high contrast
        if (this.preferences.highContrast || this.preferences.forcedColors) {
            adaptedConfig.useHighContrastColors = true;
            adaptedConfig.increaseOpacity = true;
            adaptedConfig.simplifyPatterns = true;
            adaptedConfig.enableSubtleEffects = false;
        }
        
        // Adapt for color scheme
        if (this.preferences.colorScheme === 'light') {
            adaptedConfig.useLightTheme = true;
        }
        
        return adaptedConfig;
    }
    
    /**
     * Get accessibility-adapted colors
     * @param {Object} colors - Base color configuration
     */
    getAdaptedColors(colors = {}) {
        const adaptedColors = { ...colors };
        
        if (this.preferences.highContrast || this.preferences.forcedColors) {
            // Increase contrast for better visibility
            adaptedColors.opacity = Math.min((adaptedColors.opacity || 0.5) * 1.5, 1);
            adaptedColors.strokeWidth = (adaptedColors.strokeWidth || 1) * 1.5;
            
            // Use system colors if forced colors is active
            if (this.preferences.forcedColors) {
                adaptedColors.primary = 'CanvasText';
                adaptedColors.background = 'Canvas';
                adaptedColors.accent = 'Highlight';
            }
        }
        
        return adaptedColors;
    }
    
    /**
     * Get accessibility-adapted animation settings
     * @param {Object} animations - Base animation configuration
     */
    getAdaptedAnimations(animations = {}) {
        const adaptedAnimations = { ...animations };
        
        if (this.preferences.reducedMotion) {
            // Disable or significantly reduce animations
            adaptedAnimations.enabled = false;
            adaptedAnimations.duration = 0;
            adaptedAnimations.speed = 0;
            adaptedAnimations.particles = false;
            adaptedAnimations.interactive = false;
        } else {
            // Ensure animations are smooth and not jarring
            adaptedAnimations.easing = 'ease-out';
            adaptedAnimations.respectTiming = true;
        }
        
        return adaptedAnimations;
    }
    
    /**
     * Check if animations should be enabled
     */
    shouldEnableAnimations() {
        return !this.preferences.reducedMotion;
    }
    
    /**
     * Check if particles should be enabled
     */
    shouldEnableParticles() {
        return !this.preferences.reducedMotion;
    }
    
    /**
     * Check if interactive effects should be enabled
     */
    shouldEnableInteractiveEffects() {
        return !this.preferences.reducedMotion;
    }
    
    /**
     * Check if high contrast mode is active
     */
    isHighContrastMode() {
        return this.preferences.highContrast || this.preferences.forcedColors;
    }
    
    /**
     * Get current accessibility preferences
     */
    getPreferences() {
        return { ...this.preferences };
    }
    
    /**
     * Manually set a preference (for testing or user override)
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    setPreference(key, value) {
        if (key in this.preferences) {
            const oldValue = this.preferences[key];
            this.preferences[key] = value;
            
            if (oldValue !== value) {
                this.notifyPreferenceChange(key, value);
            }
        }
    }
    
    /**
     * Notify callback of preference change
     * @param {string} key - Preference key that changed
     * @param {*} value - New preference value
     */
    notifyPreferenceChange(key, value) {
        if (this.onPreferenceChange) {
            this.onPreferenceChange(key, value, this.preferences);
        }
        
        console.log(`Accessibility preference changed: ${key} = ${value}`);
    }
    
    /**
     * Set callback for preference changes
     * @param {Function} callback - Callback function
     */
    onPreferenceChanged(callback) {
        this.onPreferenceChange = callback;
    }
    
    /**
     * Get accessibility status summary
     */
    getAccessibilityStatus() {
        return {
            reducedMotion: this.preferences.reducedMotion,
            highContrast: this.preferences.highContrast,
            forcedColors: this.preferences.forcedColors,
            colorScheme: this.preferences.colorScheme,
            animationsEnabled: this.shouldEnableAnimations(),
            particlesEnabled: this.shouldEnableParticles(),
            interactiveEnabled: this.shouldEnableInteractiveEffects()
        };
    }
    
    /**
     * Create accessibility-compliant CSS custom properties
     */
    createAccessibilityCSS() {
        const css = [];
        
        // Motion preferences
        if (this.preferences.reducedMotion) {
            css.push('--animation-duration: 0s');
            css.push('--transition-duration: 0s');
        } else {
            css.push('--animation-duration: 0.3s');
            css.push('--transition-duration: 0.2s');
        }
        
        // Contrast preferences
        if (this.preferences.highContrast) {
            css.push('--background-opacity: 0.9');
            css.push('--border-width: 2px');
        } else {
            css.push('--background-opacity: 0.6');
            css.push('--border-width: 1px');
        }
        
        return css.join('; ');
    }
    
    /**
     * Apply accessibility styles to document
     */
    applyAccessibilityStyles() {
        const root = document.documentElement;
        const css = this.createAccessibilityCSS();
        
        // Apply CSS custom properties
        css.split('; ').forEach(property => {
            const [key, value] = property.split(': ');
            if (key && value) {
                root.style.setProperty(key.trim(), value.trim());
            }
        });
    }
    
    /**
     * Clean up media query listeners
     */
    cleanup() {
        this.mediaQueries.forEach(({ mediaQuery, handler }, key) => {
            try {
                if (mediaQuery.removeEventListener) {
                    mediaQuery.removeEventListener('change', handler);
                } else {
                    // Fallback for older browsers
                    mediaQuery.removeListener(handler);
                }
            } catch (error) {
                console.warn(`Failed to remove media query listener for ${key}:`, error);
            }
        });
        
        this.mediaQueries.clear();
    }
    
    /**
     * Destroy the accessibility controller
     */
    destroy() {
        this.cleanup();
        this.onPreferenceChange = null;
    }
}