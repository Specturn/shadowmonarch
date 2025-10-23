// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Page modules
import { initDashboard } from './pages/dashboard.js';
import { initWorkout } from './pages/workout.js';
import { initGates } from './pages/gates.js';
import { initArchitect } from './pages/architect.js';
import { initAchievements } from './pages/achievements.js';
import { initSettings } from './pages/settings.js';

// Enhanced background system
import { backgroundIntegration } from './background/BackgroundIntegration.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAK5DS4dixAQWwJ8kms2JiKr738PPKFdA4",
    authDomain: "shadowmonarch-f4a17.firebaseapp.com",
    projectId: "shadowmonarch-f4a17",
    storageBucket: "shadowmonarch-f4a17.appspot.com",
    messagingSenderId: "524012291883",
    appId: "1:524012291883:web:be243162b1c0912090276e",
    measurementId: "G-6EVHJ6EDPJ"
};

const fbApp = initializeApp(firebaseConfig);
const auth = getAuth(fbApp);
const db = getFirestore(fbApp);
const provider = new GoogleAuthProvider();

// Default state constants for user session isolation
const DEFAULT_USER_STATE = {
    user: null,
    isInitialized: false,
    playerName: 'Player',
    customAvatar: null,
    currentArchitectExercise: null,
    currentCustomWorkout: { name: '', exercises: [] },
    savedRoutines: [],
    achievements: [],
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    mana: 0,
    week: 1,
    difficulty: 'Normal',
    lifts: {
        'Squat': { weight: 20 }, 'Bench Press': { weight: 20 }, 'Deadlift': { weight: 30 }, 
        'Overhead Press': { weight: 20 }, 'Barbell Row': { weight: 20 },
        'Incline DB Press': { weight: 10 }, 'Tricep Pushdown': { weight: 15 }, 
        'Lateral Raise': { weight: 5 }, 'Lat Pulldown': { weight: 30 },
        'Bicep Curl': { weight: 10 }, 'Romanian Deadlift': { weight: 40 }, 
        'Leg Press': { weight: 50 }, 'Calf Raise': { weight: 40 },
        'Power Clean': { weight: 20 }, 'Box Jump': { weight: 0 }
    },
    dungeon: {
        isActive: false,
        currentExerciseIndex: 0,
        exercises: []
    },
    activeGate: null,
    lastGateDate: null,
    lastWorkoutDate: null,
    streak: 0,
    stats: { 
        dungeonsCleared: 0, gatesCleared: 0, sRanksCleared: 0, aRanksCleared: 0, 
        bRanksCleared: 0, cRanksCleared: 0, dRanksCleared: 0, eRanksCleared: 0, 
        totalWorkouts: 0, totalVolumeKg: 0, maxVolumeInSession: 0 
    },
    liftHistory: { 'Squat': [], 'Bench Press': [], 'Deadlift': [], 'Overhead Press': [] },
    longestStreak: 0,
    showcase: [],
    gates: [],
    completedGates: [],
    activityLog: [],
    accountCreationDate: new Date().toISOString(),
    onboardingComplete: false,
    onboardingData: {
        gender: null,
        goal: null,
        focusArea: null,
        experienceLevel: null,
        weight: 70,
        height: 170
    }
};

class ProjectMonarch {
    constructor() {
        // Initialize state using the default state constants
        this.state = JSON.parse(JSON.stringify(DEFAULT_USER_STATE));

        this.currentPage = 'dashboard';
        this.pages = {};
        this.achievementsData = this.getAchievementsData();
        this.notifications = []; // Track active notifications for proper stacking
        this.isLoggingIn = false; // Prevent multiple login attempts
        
        // State management and persistence properties
        this.pendingSaveTimeout = null;
        this.connectionStatus = 'unknown';
        this.lastSaveAttempt = null;
        this.saveQueue = [];
        
        // Auto-save interval for periodic backups
        this.autoSaveInterval = null;
        
        // Organized exercise list by muscle groups
        this.exercisesByMuscleGroup = {
            'Chest': [
                'Bench Press', 'Dumbbell Bench Press', 'Incline DB Press', 'Dip'
            ],
            'Back': [
                'Deadlift', 'Barbell Row', 'Lat Pulldown', 'Cable Row', 'Dumbbell Row', 'Pull-up'
            ],
            'Shoulders': [
                'Overhead Press', 'Dumbbell Shoulder Press', 'Lateral Raise'
            ],
            'Arms': [
                'Dumbbell Curl', 'Hammer Curl', 'Tricep Skullcrusher', 'Tricep Pushdown'
            ],
            'Legs': [
                'Squat', 'Front Squat', 'Goblet Squat', 'Bulgarian Split Squat', 
                'Romanian Deadlift', 'Leg Press', 'Leg Extension', 'Hamstring Curl', 'Calf Raise'
            ],
            'Glutes': [
                'Hip Thrust', 'Romanian Deadlift', 'Bulgarian Split Squat'
            ],
            'Full Body': [
                'Power Clean', 'Box Jump'
            ]
        };
        
        // Flat list for backward compatibility
        this.masterExerciseList = Object.values(this.exercisesByMuscleGroup).flat();
        this.init();
        this.initConnectionMonitoring();
    }

    initConnectionMonitoring() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            console.log('Connection restored');
            this.connectionStatus = 'online';
            this.showSuccessNotification('Connection restored. Syncing data...');
            this.processSaveQueue();
        });

        window.addEventListener('offline', () => {
            console.log('Connection lost');
            this.connectionStatus = 'offline';
            this.showInfoNotification('Working offline. Changes will sync when connection is restored.');
        });

        // Initial connection status
        this.connectionStatus = navigator.onLine ? 'online' : 'offline';
    }

    async processSaveQueue() {
        if (this.saveQueue.length === 0) return;
        
        console.log(`Processing ${this.saveQueue.length} queued save operations`);
        
        // Process the most recent save operation
        const latestSave = this.saveQueue[this.saveQueue.length - 1];
        this.saveQueue = []; // Clear queue
        
        try {
            const success = await this.saveData();
            if (success) {
                this.showSuccessNotification('Data synced successfully');
            }
        } catch (error) {
            console.error('Error processing save queue:', error);
        }
    }

    queueSaveOperation() {
        const saveOperation = {
            timestamp: Date.now(),
            state: JSON.parse(JSON.stringify(this.state))
        };
        
        this.saveQueue.push(saveOperation);
        
        // Keep only the last 5 save operations to prevent memory issues
        if (this.saveQueue.length > 5) {
            this.saveQueue = this.saveQueue.slice(-5);
        }
    }

    // State reset functionality for user session isolation
    resetToDefaultState() {
        console.log('Resetting application state to defaults');
        
        // Deep clone the default state to avoid reference issues
        const defaultState = JSON.parse(JSON.stringify(DEFAULT_USER_STATE));
        
        // Preserve the current user reference if it exists
        const currentUser = this.state.user;
        
        // Reset all state to defaults
        this.state = { ...defaultState };
        
        // Restore the current user reference
        this.state.user = currentUser;
        
        // Reset current page to dashboard
        this.currentPage = 'dashboard';
        
        // Clear any active notifications
        this.clearAllNotifications();
        
        console.log('State reset complete');
    }

    clearUserSpecificData() {
        console.log('Clearing user-specific data');
        
        // Clear user-specific data while preserving app configuration
        this.state.playerName = 'Player';
        this.state.customAvatar = null;
        this.state.level = 1;
        this.state.xp = 0;
        this.state.mana = 0;
        this.state.streak = 0;
        this.state.longestStreak = 0;
        this.state.stats = { 
            dungeonsCleared: 0, gatesCleared: 0, sRanksCleared: 0, aRanksCleared: 0, 
            bRanksCleared: 0, cRanksCleared: 0, dRanksCleared: 0, eRanksCleared: 0, 
            totalWorkouts: 0, totalVolumeKg: 0, maxVolumeInSession: 0 
        };
        this.state.activityLog = [];
        this.state.gates = [];
        this.state.completedGates = [];
        this.state.achievements = [];
        this.state.showcase = [];
        this.state.savedRoutines = [];
        this.state.liftHistory = { 'Squat': [], 'Bench Press': [], 'Deadlift': [], 'Overhead Press': [] };
        this.state.onboardingComplete = false;
        this.state.accountCreationDate = new Date().toISOString();
        
        // Reset lifts to default values
        this.state.lifts = JSON.parse(JSON.stringify(DEFAULT_USER_STATE.lifts));
        
        // Reset dungeon state
        this.state.dungeon = {
            isActive: false,
            currentExerciseIndex: 0,
            exercises: []
        };
        
        // Reset gates and workout state
        this.state.activeGate = null;
        this.state.lastGateDate = null;
        this.state.lastWorkoutDate = null;
        
        // Reset onboarding data
        this.state.onboardingData = {
            gender: null,
            goal: null,
            focusArea: null,
            experienceLevel: null,
            weight: 70,
            height: 170
        };
        
        console.log('User-specific data cleared');
        
        // Clear notifications when clearing user data
        this.clearAllNotifications();
    }

    applyPolishedDropdowns() {
        // Apply polished styling to all select elements
        document.querySelectorAll('select').forEach(select => {
            if (!select.classList.contains('polished-dropdown')) {
                select.classList.add('polished-dropdown');
            }
        });
    }

    createCustomDropdown(selectElement) {
        // Don't convert if already converted
        if (selectElement.dataset.customDropdown === 'true') return;
        
        const options = Array.from(selectElement.options);
        const selectedValue = selectElement.value;
        const selectedText = selectElement.options[selectElement.selectedIndex]?.text || 'Select an option';
        
        // Create custom dropdown structure
        const customDropdown = document.createElement('div');
        customDropdown.className = 'custom-dropdown';
        
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'custom-dropdown-button';
        button.textContent = selectedText;
        
        const menu = document.createElement('div');
        menu.className = 'custom-dropdown-menu';
        
        // Create options
        options.forEach(option => {
            if (option.value === '') return; // Skip empty options
            
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-dropdown-option';
            optionElement.textContent = option.text;
            optionElement.dataset.value = option.value;
            
            if (option.value === selectedValue) {
                optionElement.classList.add('selected');
            }
            
            optionElement.addEventListener('click', () => {
                // Update original select
                selectElement.value = option.value;
                selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Update custom dropdown
                button.textContent = option.text;
                menu.querySelectorAll('.custom-dropdown-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                optionElement.classList.add('selected');
                
                // Close dropdown
                customDropdown.classList.remove('open');
            });
            
            menu.appendChild(optionElement);
        });
        
        // Toggle dropdown
        button.addEventListener('click', (e) => {
            e.preventDefault();
            customDropdown.classList.toggle('open');
            
            // Close other dropdowns
            document.querySelectorAll('.custom-dropdown.open').forEach(dropdown => {
                if (dropdown !== customDropdown) {
                    dropdown.classList.remove('open');
                }
            });
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!customDropdown.contains(e.target)) {
                customDropdown.classList.remove('open');
            }
        });
        
        customDropdown.appendChild(button);
        customDropdown.appendChild(menu);
        
        // Replace original select
        selectElement.style.display = 'none';
        selectElement.dataset.customDropdown = 'true';
        selectElement.parentNode.insertBefore(customDropdown, selectElement.nextSibling);
        
        return customDropdown;
    }

    convertAllDropdowns() {
        document.querySelectorAll('select').forEach(select => {
            this.createCustomDropdown(select);
        });
    }

    setAutoLogin(enabled) {
        localStorage.setItem('autoLogin', enabled.toString());
        console.log('Auto-login preference set to:', enabled);
    }

    getAutoLogin() {
        return localStorage.getItem('autoLogin') === 'true';
    }

    async handleUserTransition(user) {
        console.log('Handling user transition:', user ? user.uid : 'logout');
        
        try {
            if (user) {
                // User is signing in or switching accounts
                const previousUserId = this.state.user ? this.state.user.uid : null;
                const newUserId = user.uid;
                
                // Check if this is a different user
                if (previousUserId && previousUserId !== newUserId) {
                    console.log('Different user detected, resetting state');
                    // Different user - reset everything
                    this.resetToDefaultState();
                    // Clean up page modules
                    this.destroyAllPageModules();
                    // Reinitialize page modules with clean state
                    this.reinitializePageModules();
                } else if (!previousUserId) {
                    console.log('First time login, clearing any cached data');
                    // First login - ensure clean state
                    this.clearUserSpecificData();
                    // Clean up and reinitialize page modules to ensure clean state
                    this.destroyAllPageModules();
                    this.reinitializePageModules();
                }
                
                // Set the new user
                this.state.user = user;
                
                // Load user data safely
                await this.loadUserDataSafely(user);
                
                // Hide login screen
                const loginScreen = document.getElementById('login-screen');
                if (loginScreen) loginScreen.classList.add('hidden');
                
                // Start auto-save for logged in user
                this.startAutoSave();
                
                // Check onboarding and show appropriate screen
                if (!this.state.onboardingComplete) {
                    this.showOnboarding();
                } else {
                    this.showMainApp();
                }
                
            } else {
                // User is signing out
                console.log('User signing out, clearing all data');
                
                // Stop auto-save
                this.stopAutoSave();
                
                // Clear all user data
                this.resetToDefaultState();
                
                // Clean up page modules
                this.destroyAllPageModules();
                // Reinitialize with clean state
                this.reinitializePageModules();
                
                // Show login screen
                const loginScreen = document.getElementById('login-screen');
                const appContent = document.getElementById('app-content');
                const onboardingOverlay = document.getElementById('onboarding-overlay');
                
                if (loginScreen) loginScreen.classList.remove('hidden');
                if (appContent) appContent.classList.add('hidden');
                if (onboardingOverlay) onboardingOverlay.classList.add('hidden');
                
                this.state.isInitialized = false;
                
                // Clean up particles and reinitialize for login
                this.destroyAllParticles();
                setTimeout(() => {
                    this.initParticles('login');
                }, 100);
            }
        } catch (error) {
            console.error('Error during user transition:', error);
            this.handleAuthenticationError(error, 'user_transition');
        }
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('login-screen');
        const appContent = document.getElementById('app-content');
        const onboardingOverlay = document.getElementById('onboarding-overlay');
        
        if (loginScreen) loginScreen.classList.remove('hidden');
        if (appContent) appContent.classList.add('hidden');
        if (onboardingOverlay) onboardingOverlay.classList.add('hidden');
        
        this.state.isInitialized = false;
    }

    destroyAllPageModules() {
        console.log('Destroying all page modules');
        
        // Clean up each page module if it has a cleanup method
        Object.keys(this.pages).forEach(pageKey => {
            if (this.pages[pageKey] && typeof this.pages[pageKey].cleanup === 'function') {
                try {
                    console.log(`Cleaning up page module: ${pageKey}`);
                    this.pages[pageKey].cleanup();
                } catch (error) {
                    console.warn(`Error cleaning up page module ${pageKey}:`, error);
                }
            }
        });
        
        // Clear the main content area
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = '';
        }
        
        // Clear page references
        this.pages = {};
        
        // Reset current page
        this.currentPage = 'dashboard';
        
        console.log('Page modules destroyed');
    }

    reinitializePageModules() {
        console.log('Reinitializing page modules with clean state');
        
        // Ensure pages object is clean
        this.pages = {};
        
        // Reinitialize all page modules
        this.initializePages();
        
        console.log('Page modules reinitialized');
    }

    async loadUserDataSafely(user) {
        console.log('Loading user data safely for:', user.uid);
        
        if (!user || !user.uid) {
            console.error('Invalid user provided to loadUserDataSafely');
            return;
        }
        
        let cloudData = null;
        let cachedData = null;
        
        try {
            // Try to load from Firestore first
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                cloudData = userSnap.data();
                console.log('Cloud data loaded successfully');
            }
            
        } catch (error) {
            console.warn('Error loading cloud data, will try cached data:', error);
        }
        
        // Try to load cached data as fallback
        try {
            cachedData = await this.loadCachedData();
            if (cachedData) {
                console.log('Cached data available as fallback');
            }
        } catch (error) {
            console.warn('Error loading cached data:', error);
        }
        
        // Determine which data to use
        let dataToUse = null;
        
        if (cloudData && cachedData) {
            // Both available - use the most recent
            const cloudTime = new Date(cloudData.lastSaved || 0).getTime();
            const cacheTime = new Date(cachedData.lastSaved || 0).getTime();
            
            if (cloudTime >= cacheTime) {
                dataToUse = cloudData;
                console.log('Using cloud data (more recent)');
            } else {
                dataToUse = cachedData;
                console.log('Using cached data (more recent)');
                // Schedule a save to sync cached data to cloud
                setTimeout(() => this.saveData(), 1000);
            }
        } else if (cloudData) {
            dataToUse = cloudData;
            console.log('Using cloud data (only source)');
        } else if (cachedData) {
            dataToUse = cachedData;
            console.log('Using cached data (offline mode)');
            this.showInfoNotification('Working offline. Changes will sync when connection is restored.');
        }
        
        if (dataToUse) {
            // Validate that the data belongs to the current user
            if (dataToUse.userId && dataToUse.userId !== user.uid) {
                console.warn('Data user ID mismatch, initializing with defaults');
                this.initializeNewUser(user);
                return;
            }
            
            // Validate data integrity
            if (dataToUse.dataChecksum) {
                const expectedChecksum = this.generateDataChecksum({
                    ...dataToUse,
                    dataChecksum: undefined // Exclude checksum from checksum calculation
                });
                
                if (dataToUse.dataChecksum !== expectedChecksum) {
                    console.warn('Data integrity check failed, data may be corrupted');
                    // Still try to use the data but log the issue
                }
            }
            
            // Safely merge user data, preserving current user reference
            this.mergeUserDataSafely(dataToUse, user);
            
            console.log('User data loaded and merged successfully');
        } else {
            // No data available - initialize new user
            console.log('No data available, initializing new user');
            this.initializeNewUser(user);
        }
        
        // Validate final state after loading
        if (!this.validateStateIntegrity()) {
            console.error('State integrity validation failed after loading, reinitializing');
            this.initializeNewUser(user);
        }
    }

    mergeUserDataSafely(data, user) {
        console.log('Merging user data safely');
        
        try {
            // First validate the data
            if (!this.validateUserData(data, user.uid)) {
                console.warn('Data validation failed, initializing with defaults');
                this.initializeNewUser(user);
                return;
            }
            
            // Sanitize the data
            const sanitizedData = this.sanitizeUserData(data, user.uid);
            
            // Set the user reference
            sanitizedData.user = user;
            
            // Replace the state with the sanitized data
            this.state = sanitizedData;
            
            console.log('User data merged safely');
            
        } catch (error) {
            console.error('Error merging user data:', error);
            this.handleStateCorruption(error, 'mergeUserDataSafely');
        }
    }

    async performLogout(disableAutoLogin = true) {
        console.log('Performing complete logout cleanup');
        
        try {
            // Disable auto-login if requested
            if (disableAutoLogin) {
                this.setAutoLogin(false);
            }
            
            // Clear all user data immediately
            this.resetToDefaultState();
            
            // Clean up page modules
            this.destroyAllPageModules();
            
            // Clean up UI components
            this.resetUIToLoginState();
            
            // Clean up any running timers or intervals
            this.cleanupTimersAndIntervals();
            
            // Clean up particles
            this.destroyAllParticles();
            
            // Sign out from Firebase
            const { signOut } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
            const { auth } = await import('./firebase-config.js');
            await signOut(auth);
            
            console.log('Logout completed successfully');
            
        } catch (error) {
            console.error('Error during logout:', error);
            this.handleAuthenticationError(error, 'logout');
        }
    }

    resetUIToLoginState() {
        console.log('Resetting UI to login state');
        
        const loginScreen = document.getElementById('login-screen');
        const appContent = document.getElementById('app-content');
        const onboardingOverlay = document.getElementById('onboarding-overlay');
        const mainContent = document.getElementById('main-content');
        
        // Show login screen
        if (loginScreen) loginScreen.classList.remove('hidden');
        
        // Hide app content
        if (appContent) appContent.classList.add('hidden');
        
        // Hide onboarding
        if (onboardingOverlay) onboardingOverlay.classList.add('hidden');
        
        // Clear main content
        if (mainContent) mainContent.innerHTML = '';
        
        // Reset navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Reset header
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) headerTitle.textContent = 'Dashboard';
        
        // Reset initialization flag
        this.state.isInitialized = false;
        
        // Reset background to default login background
        this.updatePageBackground('login');
        
        // Initialize login particles after a delay
        setTimeout(() => {
            this.initParticles('login');
        }, 100);
    }

    cleanupTimersAndIntervals() {
        console.log('Cleaning up timers and intervals');
        
        // Clear any resize timeout
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        
        // Clear any other timers that might be running
        // Note: Individual page modules should clean up their own timers in their cleanup() methods
    }

    handleAuthenticationError(error, context = 'authentication') {
        console.error(`Authentication error in ${context}:`, error);
        
        // Log the error for debugging
        this.logError('authentication', error, context);
        
        // Reset to safe state
        this.resetToDefaultState();
        
        // Show login screen
        this.resetUIToLoginState();
        
        // Show user-friendly error message
        const errorMessage = this.getAuthErrorMessage(error);
        setTimeout(() => {
            this.showErrorNotification(errorMessage);
        }, 1000);
    }

    handleDataLoadError(error, userId, context = 'data_load') {
        console.error(`Data load error for user ${userId} in ${context}:`, error);
        
        // Log the error
        this.logError('data_load', error, { userId, context });
        
        // Try to recover by initializing with defaults
        try {
            if (this.state.user && this.state.user.uid === userId) {
                console.log('Attempting recovery with default user data');
                this.initializeNewUser(this.state.user);
                this.showErrorNotification('Unable to load your data. Starting with defaults.');
            } else {
                console.log('User mismatch during error recovery, forcing logout');
                this.handleAuthenticationError(new Error('User context mismatch'), 'data_load_recovery');
            }
        } catch (recoveryError) {
            console.error('Recovery failed:', recoveryError);
            this.handleCriticalError(recoveryError, 'data_load_recovery');
        }
    }

    handleStateCorruption(error, context = 'state_corruption') {
        console.error(`State corruption detected in ${context}:`, error);
        
        // Log the critical error
        this.logError('state_corruption', error, context);
        
        // Try to recover from cached data first
        const recovered = this.attemptStateRecovery();
        
        if (recovered) {
            console.log('State recovered from backup data');
            this.showInfoNotification('Recovered from a data error using backup data.');
            return;
        }
        
        // Force complete reset if recovery failed
        try {
            console.log('Performing emergency state reset');
            this.resetToDefaultState();
            this.destroyAllPageModules();
            this.reinitializePageModules();
            
            // If user is still authenticated, try to reload their data
            if (this.state.user) {
                this.loadUserDataSafely(this.state.user).catch(loadError => {
                    console.error('Failed to reload data after state corruption:', loadError);
                    this.handleAuthenticationError(loadError, 'post_corruption_recovery');
                });
            } else {
                this.resetUIToLoginState();
            }
            
            this.showErrorNotification('Application state was reset due to an error. Please check your data.');
            
        } catch (resetError) {
            console.error('Emergency reset failed:', resetError);
            this.handleCriticalError(resetError, 'emergency_reset');
        }
    }

    attemptStateRecovery() {
        try {
            console.log('Attempting state recovery from backup data');
            
            // Try to load cached data as recovery
            const cachedData = this.loadCachedData();
            if (cachedData && this.validateUserData(cachedData, this.state.user?.uid)) {
                console.log('Valid cached data found, attempting recovery');
                this.mergeUserDataSafely(cachedData, this.state.user);
                
                // Validate recovered state
                if (this.validateStateIntegrity()) {
                    console.log('State recovery successful');
                    return true;
                }
            }
            
            // Try to recover from a previous state backup
            const backupKey = `shadowmonarch_backup_${this.state.user?.uid}`;
            const backupStr = localStorage.getItem(backupKey);
            
            if (backupStr) {
                const backupData = JSON.parse(backupStr);
                if (this.validateUserData(backupData.state, this.state.user?.uid)) {
                    console.log('Valid backup data found, attempting recovery');
                    this.mergeUserDataSafely(backupData.state, this.state.user);
                    
                    if (this.validateStateIntegrity()) {
                        console.log('State recovery from backup successful');
                        return true;
                    }
                }
            }
            
            console.log('No valid recovery data found');
            return false;
            
        } catch (error) {
            console.error('Error during state recovery attempt:', error);
            return false;
        }
    }

    createStateBackup() {
        try {
            if (!this.state.user?.uid) return;
            
            const backupKey = `shadowmonarch_backup_${this.state.user.uid}`;
            const backupData = {
                state: { ...this.state },
                timestamp: Date.now(),
                version: '2.0'
            };
            
            // Remove user object from backup
            delete backupData.state.user;
            
            localStorage.setItem(backupKey, JSON.stringify(backupData));
            console.log('State backup created');
        } catch (error) {
            console.error('Error creating state backup:', error);
        }
    }

    handleCriticalError(error, context = 'critical') {
        console.error(`Critical error in ${context}:`, error);
        
        // Log the critical error
        this.logError('critical', error, context);
        
        // Force complete application reset
        try {
            // Reset everything to initial state
            this.resetToDefaultState();
            this.resetUIToLoginState();
            this.destroyAllPageModules();
            
            // Clear any remaining timers or intervals
            this.cleanupTimersAndIntervals();
            
            // Show critical error message
            this.showCriticalErrorMessage();
            
        } catch (finalError) {
            console.error('Final error handler failed:', finalError);
            // Last resort - reload the page
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    }

    logError(type, error, context) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            type,
            message: error.message,
            stack: error.stack,
            context,
            userId: this.state.user ? this.state.user.uid : null,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Log to console for debugging
        console.error('Error logged:', errorLog);
        
        // In a production app, you might want to send this to an error tracking service
        // this.sendErrorToService(errorLog);
    }

    getAuthErrorMessage(error) {
        if (!error) return 'An unknown authentication error occurred.';
        
        const errorCode = error.code || '';
        const errorMessage = error.message || '';
        
        // Common Firebase Auth error codes
        if (errorCode.includes('network-request-failed')) {
            return 'Network error. Please check your internet connection and try again.';
        }
        
        if (errorCode.includes('too-many-requests')) {
            return 'Too many failed attempts. Please wait a moment and try again.';
        }
        
        if (errorCode.includes('user-disabled')) {
            return 'This account has been disabled. Please contact support.';
        }
        
        if (errorCode.includes('popup-closed-by-user')) {
            return 'Sign-in was cancelled. Please try again.';
        }
        
        if (errorCode.includes('popup-blocked')) {
            return 'Pop-up was blocked. Please allow pop-ups for this site and try again.';
        }
        
        // Generic error message
        return 'Authentication failed. Please try signing in again.';
    }

    showNotification(options) {
        console.log('🔔 showNotification called with options:', options);
        
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 5000,
            icon = 'fa-info-circle',
            closable = true
        } = options;

        // Create notification element
        const notification = document.createElement('div');
        const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        notification.id = notificationId;
        
        // Calculate position based on existing notifications
        const topOffset = 16 + (this.notifications.length * 80); // 16px base + 80px per notification
        
        // Set base classes and positioning
        notification.className = `fixed right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-all duration-500 max-w-sm`;
        notification.style.top = `${topOffset}px`;
        
        // Set type-specific styling
        const typeStyles = {
            error: 'bg-red-600 text-white',
            success: 'bg-green-600 text-white',
            warning: 'bg-yellow-600 text-white',
            info: 'bg-blue-600 text-white',
            achievement: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white',
            secret: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
        };
        
        notification.className += ` ${typeStyles[type] || typeStyles.info}`;
        
        // Create notification content
        const closeButton = closable ? `
            <button class="ml-4 text-white hover:text-gray-200 flex-shrink-0" onclick="window.app.removeNotification('${notificationId}')">
                <i class="fas fa-times"></i>
            </button>
        ` : '';
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                    <i class="fas ${icon} text-xl ${type === 'secret' ? 'animate-pulse' : ''}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    ${title ? `<div class="font-semibold">${title}</div>` : ''}
                    <div class="text-sm ${title ? '' : 'font-semibold'}">${message}</div>
                </div>
                ${closeButton}
            </div>
        `;
        
        // Add to notifications array and DOM
        this.notifications.push({
            id: notificationId,
            element: notification,
            removeTimeout: null
        });
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after duration
        if (duration > 0) {
            const removeTimeout = setTimeout(() => {
                this.removeNotification(notificationId);
            }, duration);
            
            // Store timeout reference
            const notificationData = this.notifications.find(n => n.id === notificationId);
            if (notificationData) {
                notificationData.removeTimeout = removeTimeout;
            }
        }
        
        return notificationId;
    }

    removeNotification(notificationId) {
        const notificationIndex = this.notifications.findIndex(n => n.id === notificationId);
        if (notificationIndex === -1) return;
        
        const notificationData = this.notifications[notificationIndex];
        const notification = notificationData.element;
        
        // Clear timeout if exists
        if (notificationData.removeTimeout) {
            clearTimeout(notificationData.removeTimeout);
        }
        
        // Animate out
        notification.style.transform = 'translateX(100%)';
        
        // Remove from array and DOM
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
            
            // Remove from notifications array
            this.notifications.splice(notificationIndex, 1);
            
            // Reposition remaining notifications
            this.repositionNotifications();
        }, 500);
    }

    repositionNotifications() {
        this.notifications.forEach((notificationData, index) => {
            const topOffset = 16 + (index * 80);
            notificationData.element.style.top = `${topOffset}px`;
        });
    }

    showErrorNotification(message) {
        this.showNotification({
            type: 'error',
            title: 'Error',
            message: message,
            icon: 'fa-exclamation-triangle',
            duration: 10000
        });
    }

    showCriticalErrorMessage() {
        const message = `
            <div class="text-center p-8">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-red-600 mb-4">Critical Error</h2>
                <p class="text-gray-600 mb-4">
                    The application encountered a critical error and needs to reset.
                    Please refresh the page to continue.
                </p>
                <button onclick="window.location.reload()" class="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded">
                    Refresh Page
                </button>
            </div>
        `;
        
        // Show in modal if available, otherwise replace page content
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        
        if (modalOverlay && modalContent) {
            modalContent.innerHTML = message;
            modalOverlay.classList.remove('hidden');
            modalOverlay.classList.add('flex');
        } else {
            document.body.innerHTML = `
                <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
                    ${message}
                </div>
            `;
        }
    }

    initializeNewUser(user) {
        console.log('Initializing new user with defaults');
        
        // Reset to defaults but keep user reference
        this.clearUserSpecificData();
        this.state.user = user;
        this.state.accountCreationDate = new Date().toISOString();
        this.state.onboardingComplete = false;
        
        // Generate sample activity data for new users
        if (this.generateSampleActivityData) {
            this.state.activityLog = this.generateSampleActivityData();
        }
        
        // Save the new user data
        this.saveData().catch(error => {
            console.error('Error saving new user data:', error);
        });
    }

    // Test functions for user session isolation validation
    runUserSessionIsolationTests() {
        console.log('🧪 Running User Session Isolation Tests...');
        
        const tests = [
            this.testStateResetFunctionality.bind(this),
            this.testUserDataValidation.bind(this),
            this.testDataSanitization.bind(this),
            this.testPageModuleCleanup.bind(this),
            this.testErrorHandling.bind(this)
        ];
        
        let passed = 0;
        let failed = 0;
        
        tests.forEach((test, index) => {
            try {
                const result = test();
                if (result) {
                    console.log(`✅ Test ${index + 1} passed: ${test.name}`);
                    passed++;
                } else {
                    console.log(`❌ Test ${index + 1} failed: ${test.name}`);
                    failed++;
                }
            } catch (error) {
                console.log(`❌ Test ${index + 1} error: ${test.name}`, error);
                failed++;
            }
        });
        
        console.log(`🧪 Test Results: ${passed} passed, ${failed} failed`);
        return { passed, failed };
    }

    testStateResetFunctionality() {
        console.log('Testing state reset functionality...');
        
        // Save original state
        const originalState = JSON.parse(JSON.stringify(this.state));
        
        // Modify state with test data
        this.state.playerName = 'TestUser';
        this.state.level = 99;
        this.state.xp = 5000;
        this.state.stats.totalWorkouts = 100;
        this.state.activityLog = ['test', 'data'];
        
        // Test resetToDefaultState
        this.resetToDefaultState();
        
        // Verify state was reset
        const isReset = (
            this.state.playerName === 'Player' &&
            this.state.level === 1 &&
            this.state.xp === 0 &&
            this.state.stats.totalWorkouts === 0 &&
            Array.isArray(this.state.activityLog) &&
            this.state.activityLog.length === 0
        );
        
        // Restore original state
        this.state = originalState;
        
        return isReset;
    }

    testUserDataValidation() {
        console.log('Testing user data validation...');
        
        const testUserId = 'test-user-123';
        
        // Test valid data
        const validData = {
            userId: testUserId,
            playerName: 'TestPlayer',
            level: 5,
            xp: 250,
            stats: { totalWorkouts: 10 },
            gates: [],
            activityLog: []
        };
        
        const validResult = this.validateUserData(validData, testUserId);
        
        // Test invalid data - wrong user ID
        const invalidData = {
            userId: 'different-user',
            playerName: 'TestPlayer',
            level: 5,
            xp: 250,
            stats: { totalWorkouts: 10 }
        };
        
        const invalidResult = this.validateUserData(invalidData, testUserId);
        
        // Test malformed data
        const malformedData = {
            playerName: 123, // Should be string
            level: 'five', // Should be number
            stats: 'not an object' // Should be object
        };
        
        const malformedResult = this.validateUserData(malformedData, testUserId);
        
        return validResult && !invalidResult && !malformedResult;
    }

    testDataSanitization() {
        console.log('Testing data sanitization...');
        
        const testUserId = 'test-user-456';
        
        // Test data with various issues
        const dirtyData = {
            playerName: '  TestPlayer  ', // Extra whitespace
            level: 5.7, // Should be integer
            xp: -100, // Should be non-negative
            stats: null, // Should be object
            gates: 'not an array', // Should be array
            lifts: {
                'Squat': { weight: 'heavy' } // Should be number
            }
        };
        
        const sanitized = this.sanitizeUserData(dirtyData, testUserId);
        
        const isClean = (
            sanitized.playerName === 'TestPlayer' &&
            sanitized.level === 5 &&
            sanitized.xp === 0 && // Negative values should be reset
            typeof sanitized.stats === 'object' &&
            Array.isArray(sanitized.gates) &&
            typeof sanitized.lifts.Squat.weight === 'number' &&
            sanitized.userId === testUserId
        );
        
        return isClean;
    }

    testPageModuleCleanup() {
        console.log('Testing page module cleanup...');
        
        // Check if all page modules have cleanup methods
        const pageModules = ['dashboard', 'workout', 'gates', 'architect', 'achievements', 'settings'];
        
        let allHaveCleanup = true;
        
        pageModules.forEach(moduleName => {
            if (!this.pages[moduleName] || typeof this.pages[moduleName].cleanup !== 'function') {
                console.warn(`Page module ${moduleName} missing cleanup method`);
                allHaveCleanup = false;
            }
        });
        
        // Test destroyAllPageModules doesn't throw errors
        try {
            const originalPages = { ...this.pages };
            this.destroyAllPageModules();
            this.pages = originalPages; // Restore for continued operation
            return allHaveCleanup;
        } catch (error) {
            console.error('destroyAllPageModules threw error:', error);
            return false;
        }
    }

    testErrorHandling() {
        console.log('Testing error handling...');
        
        // Test that error handlers don't throw
        try {
            const testError = new Error('Test error');
            
            // These should not throw errors
            this.logError('test', testError, 'unit_test');
            this.getAuthErrorMessage(testError);
            this.getAuthErrorMessage({ code: 'auth/network-request-failed' });
            
            return true;
        } catch (error) {
            console.error('Error handling test failed:', error);
            return false;
        }
    }

    // Utility function to simulate user account switching for testing
    simulateUserSwitch(fromUserId, toUserId) {
        console.log(`🔄 Simulating user switch from ${fromUserId} to ${toUserId}`);
        
        // Create mock user objects
        const fromUser = { uid: fromUserId, email: `${fromUserId}@test.com` };
        const toUser = { uid: toUserId, email: `${toUserId}@test.com` };
        
        // Set initial user
        this.state.user = fromUser;
        this.state.playerName = `Player${fromUserId}`;
        this.state.level = 10;
        this.state.xp = 1000;
        
        console.log('Initial state:', {
            user: this.state.user.uid,
            playerName: this.state.playerName,
            level: this.state.level,
            xp: this.state.xp
        });
        
        // Simulate user transition
        return this.handleUserTransition(toUser).then(() => {
            console.log('Final state:', {
                user: this.state.user ? this.state.user.uid : null,
                playerName: this.state.playerName,
                level: this.state.level,
                xp: this.state.xp
            });
            
            // Verify state was properly reset for new user
            const isIsolated = (
                this.state.user.uid === toUserId &&
                this.state.playerName === 'Player' && // Should be reset to default
                this.state.level === 1 && // Should be reset to default
                this.state.xp === 0 // Should be reset to default
            );
            
            console.log('User isolation test:', isIsolated ? '✅ PASSED' : '❌ FAILED');
            return isIsolated;
        });
    }

    // Function to validate current state integrity
    validateStateIntegrity() {
        console.log('🔍 Validating state integrity...');
        
        const issues = [];
        
        // Check required fields
        if (!this.state.hasOwnProperty('playerName')) issues.push('Missing playerName');
        if (!this.state.hasOwnProperty('level')) issues.push('Missing level');
        if (!this.state.hasOwnProperty('xp')) issues.push('Missing xp');
        if (!this.state.hasOwnProperty('stats')) issues.push('Missing stats');
        
        // Check data types
        if (typeof this.state.playerName !== 'string') issues.push('playerName is not string');
        if (typeof this.state.level !== 'number') issues.push('level is not number');
        if (typeof this.state.xp !== 'number') issues.push('xp is not number');
        if (typeof this.state.stats !== 'object') issues.push('stats is not object');
        
        // Check arrays
        if (!Array.isArray(this.state.gates)) issues.push('gates is not array');
        if (!Array.isArray(this.state.activityLog)) issues.push('activityLog is not array');
        if (!Array.isArray(this.state.achievements)) issues.push('achievements is not array');
        
        if (issues.length === 0) {
            console.log('✅ State integrity check passed');
            return true;
        } else {
            console.log('❌ State integrity issues found:', issues);
            return false;
        }
    }

    validateUserData(data, expectedUserId) {
        console.log('Validating user data for user:', expectedUserId);
        
        if (!data || typeof data !== 'object') {
            console.warn('Invalid data object provided');
            return false;
        }
        
        // Check if data has a user ID and it matches the expected user
        if (data.userId && data.userId !== expectedUserId) {
            console.error('User ID mismatch in data:', data.userId, 'expected:', expectedUserId);
            return false;
        }
        
        // Validate required fields exist and are of correct type
        const requiredFields = {
            playerName: 'string',
            level: 'number',
            xp: 'number',
            stats: 'object'
        };
        
        for (const [field, expectedType] of Object.entries(requiredFields)) {
            if (!data.hasOwnProperty(field)) {
                console.warn(`Missing required field: ${field}`);
                continue; // Allow missing fields, we'll use defaults
            }
            
            if (typeof data[field] !== expectedType) {
                console.warn(`Invalid type for field ${field}: expected ${expectedType}, got ${typeof data[field]}`);
                return false;
            }
        }
        
        // Validate array fields
        const arrayFields = ['gates', 'completedGates', 'activityLog', 'achievements', 'savedRoutines'];
        for (const field of arrayFields) {
            if (data.hasOwnProperty(field) && !Array.isArray(data[field])) {
                console.warn(`Field ${field} should be an array but is ${typeof data[field]}`);
                return false;
            }
        }
        
        // Validate object fields
        const objectFields = ['lifts', 'stats', 'liftHistory', 'dungeon', 'onboardingData'];
        for (const field of objectFields) {
            if (data.hasOwnProperty(field) && (typeof data[field] !== 'object' || data[field] === null)) {
                console.warn(`Field ${field} should be an object but is ${typeof data[field]}`);
                return false;
            }
        }
        
        console.log('User data validation passed');
        return true;
    }

    sanitizeUserData(data, userId) {
        console.log('Sanitizing user data for user:', userId);
        
        if (!data || typeof data !== 'object') {
            console.warn('Cannot sanitize invalid data, returning defaults');
            return JSON.parse(JSON.stringify(DEFAULT_USER_STATE));
        }
        
        // Create a sanitized copy
        const sanitized = {};
        
        // Sanitize string fields
        sanitized.playerName = typeof data.playerName === 'string' ? data.playerName.trim() : 'Player';
        sanitized.customAvatar = typeof data.customAvatar === 'string' ? data.customAvatar : null;
        sanitized.difficulty = typeof data.difficulty === 'string' ? data.difficulty : 'Normal';
        
        // Sanitize number fields
        sanitized.level = typeof data.level === 'number' && data.level > 0 ? Math.floor(data.level) : 1;
        sanitized.xp = typeof data.xp === 'number' && data.xp >= 0 ? Math.floor(data.xp) : 0;
        sanitized.xpToNextLevel = typeof data.xpToNextLevel === 'number' && data.xpToNextLevel > 0 ? Math.floor(data.xpToNextLevel) : 100;
        sanitized.mana = typeof data.mana === 'number' && data.mana >= 0 ? Math.floor(data.mana) : 0;
        sanitized.week = typeof data.week === 'number' && data.week > 0 ? Math.floor(data.week) : 1;
        sanitized.streak = typeof data.streak === 'number' && data.streak >= 0 ? Math.floor(data.streak) : 0;
        sanitized.longestStreak = typeof data.longestStreak === 'number' && data.longestStreak >= 0 ? Math.floor(data.longestStreak) : 0;
        
        // Sanitize boolean fields
        sanitized.isInitialized = false; // Always reset this
        sanitized.onboardingComplete = typeof data.onboardingComplete === 'boolean' ? data.onboardingComplete : false;
        
        // Sanitize date fields
        sanitized.accountCreationDate = typeof data.accountCreationDate === 'string' ? data.accountCreationDate : new Date().toISOString();
        sanitized.lastGateDate = typeof data.lastGateDate === 'string' ? data.lastGateDate : null;
        sanitized.lastWorkoutDate = typeof data.lastWorkoutDate === 'string' ? data.lastWorkoutDate : null;
        
        // Sanitize array fields
        sanitized.gates = Array.isArray(data.gates) ? data.gates : [];
        sanitized.completedGates = Array.isArray(data.completedGates) ? data.completedGates : [];
        sanitized.activityLog = Array.isArray(data.activityLog) ? data.activityLog : [];
        sanitized.achievements = Array.isArray(data.achievements) ? data.achievements : [];
        sanitized.savedRoutines = Array.isArray(data.savedRoutines) ? data.savedRoutines : [];
        sanitized.showcase = Array.isArray(data.showcase) ? data.showcase : [];
        
        // Sanitize object fields with defaults
        sanitized.stats = this.sanitizeStats(data.stats);
        sanitized.lifts = this.sanitizeLifts(data.lifts);
        sanitized.liftHistory = this.sanitizeLiftHistory(data.liftHistory);
        sanitized.dungeon = this.sanitizeDungeon(data.dungeon);
        sanitized.onboardingData = this.sanitizeOnboardingData(data.onboardingData);
        
        // Add user validation fields
        sanitized.userId = userId;
        sanitized.user = null; // Never store user object in data
        
        // Set other fields to defaults
        sanitized.activeGate = data.activeGate || null;
        sanitized.currentArchitectExercise = data.currentArchitectExercise || null;
        sanitized.currentCustomWorkout = data.currentCustomWorkout || { name: '', exercises: [] };
        
        console.log('User data sanitization completed');
        return sanitized;
    }

    sanitizeStats(stats) {
        const defaultStats = JSON.parse(JSON.stringify(DEFAULT_USER_STATE.stats));
        
        if (!stats || typeof stats !== 'object') {
            return defaultStats;
        }
        
        const sanitized = {};
        Object.keys(defaultStats).forEach(key => {
            sanitized[key] = typeof stats[key] === 'number' && stats[key] >= 0 ? Math.floor(stats[key]) : defaultStats[key];
        });
        
        return sanitized;
    }

    sanitizeLifts(lifts) {
        const defaultLifts = JSON.parse(JSON.stringify(DEFAULT_USER_STATE.lifts));
        
        if (!lifts || typeof lifts !== 'object') {
            return defaultLifts;
        }
        
        const sanitized = {};
        Object.keys(defaultLifts).forEach(liftName => {
            if (lifts[liftName] && typeof lifts[liftName] === 'object') {
                sanitized[liftName] = {
                    weight: typeof lifts[liftName].weight === 'number' && lifts[liftName].weight >= 0 
                        ? Math.floor(lifts[liftName].weight) 
                        : defaultLifts[liftName].weight
                };
            } else {
                sanitized[liftName] = { ...defaultLifts[liftName] };
            }
        });
        
        return sanitized;
    }

    sanitizeLiftHistory(liftHistory) {
        const defaultHistory = JSON.parse(JSON.stringify(DEFAULT_USER_STATE.liftHistory));
        
        if (!liftHistory || typeof liftHistory !== 'object') {
            return defaultHistory;
        }
        
        const sanitized = {};
        Object.keys(defaultHistory).forEach(liftName => {
            sanitized[liftName] = Array.isArray(liftHistory[liftName]) ? liftHistory[liftName] : [];
        });
        
        return sanitized;
    }

    sanitizeDungeon(dungeon) {
        const defaultDungeon = JSON.parse(JSON.stringify(DEFAULT_USER_STATE.dungeon));
        
        if (!dungeon || typeof dungeon !== 'object') {
            return defaultDungeon;
        }
        
        return {
            isActive: typeof dungeon.isActive === 'boolean' ? dungeon.isActive : false,
            currentExerciseIndex: typeof dungeon.currentExerciseIndex === 'number' && dungeon.currentExerciseIndex >= 0 
                ? Math.floor(dungeon.currentExerciseIndex) : 0,
            exercises: Array.isArray(dungeon.exercises) ? dungeon.exercises : []
        };
    }

    sanitizeOnboardingData(onboardingData) {
        const defaultData = JSON.parse(JSON.stringify(DEFAULT_USER_STATE.onboardingData));
        
        if (!onboardingData || typeof onboardingData !== 'object') {
            return defaultData;
        }
        
        return {
            gender: typeof onboardingData.gender === 'string' ? onboardingData.gender : null,
            goal: typeof onboardingData.goal === 'string' ? onboardingData.goal : null,
            focusArea: typeof onboardingData.focusArea === 'string' ? onboardingData.focusArea : null,
            experienceLevel: typeof onboardingData.experienceLevel === 'string' ? onboardingData.experienceLevel : null,
            weight: typeof onboardingData.weight === 'number' && onboardingData.weight > 0 
                ? Math.floor(onboardingData.weight) : 70,
            height: typeof onboardingData.height === 'number' && onboardingData.height > 0 
                ? Math.floor(onboardingData.height) : 170
        };
    }

    async init() {
        console.log('Initializing Project Monarch...');
        
        // Validate initial state integrity
        if (!this.validateStateIntegrity()) {
            console.warn('Initial state validation failed, resetting to defaults');
            this.resetToDefaultState();
        }
        
        // Create initial state backup
        this.createStateBackup();
        
        // Check auto-login preference immediately and set initial UI state
        const autoLogin = localStorage.getItem('autoLogin') === 'true';
        console.log('Auto-login preference:', autoLogin);
        
        if (!autoLogin) {
            console.log('Auto-login disabled, showing login screen');
            this.showLoginScreen();
        } else {
            console.log('Auto-login enabled, waiting for authentication...');
            // Hide login screen initially if auto-login is enabled
            const loginScreen = document.getElementById('login-screen');
            if (loginScreen) {
                loginScreen.classList.add('hidden');
            }
        }
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupBasicEventListeners();
            });
        } else {
            this.setupBasicEventListeners();
        }
        
        // Initialize enhanced background system
        try {
            backgroundIntegration.init(document.body);
            console.log('Enhanced background system initialized');
        } catch (error) {
            console.error('Failed to initialize background system:', error);
        }
        
        // Initialize page modules
        this.initializePages();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup enhanced auth state listener with proper user transition handling
        onAuthStateChanged(auth, async (user) => {
            // Check if user wants to stay logged in (check localStorage)
            // Default to false (require explicit opt-in for auto-login)
            const autoLogin = localStorage.getItem('autoLogin') === 'true';
            
            if (user && !autoLogin) {
                // User is authenticated but auto-login is disabled, sign them out
                console.log('Auto-login disabled, signing out user');
                const { signOut } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js");
                await signOut(auth);
                return;
            }
            
            await this.handleUserTransition(user);
        });
    }

    setupBasicEventListeners() {
        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', async () => {
                try {
                    // Enable auto-login when user explicitly chooses to sign in
                    this.setAutoLogin(true);
                    
                    const result = await signInWithPopup(auth, provider);
                    console.log('User signed in:', result.user);
                } catch (error) {
                    console.error('Error signing in:', error);
                    this.showErrorNotification('Error signing in. Please try again.');
                }
            });
        }

        // Modal close functionality
        const modalClose = document.getElementById('modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                document.getElementById('modal-overlay').classList.add('hidden');
                document.getElementById('modal-overlay').classList.remove('flex');
            });
        }

        // Setup onboarding event listeners
        this.setupOnboardingListeners();
    }

    initializePages() {
        this.pages.dashboard = initDashboard(this);
        this.pages.workout = initWorkout(this);
        this.pages.gates = initGates(this);
        this.pages.architect = initArchitect(this);
        this.pages.achievements = initAchievements(this);
        this.pages.settings = initSettings(this);
    }

    setupNavigation() {
        // Use event delegation for better reliability
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('nav-btn')) {
                const page = event.target.dataset.page;
                if (page) {
                    this.showPage(page);
                }
            }
        });

        // Add window resize handler to prevent particles overflow issues
        window.addEventListener('resize', () => {
            // Debounce resize events
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                // Reinitialize particles on resize to prevent overflow
                if (this.state.isInitialized) {
                    this.destroyAllParticles();
                    setTimeout(() => {
                        this.initParticles('dashboard');
                    }, 100);
                } else {
                    this.destroyAllParticles();
                    setTimeout(() => {
                        this.initParticles('login');
                    }, 100);
                }
            }, 250);
        });
    }

    showPage(pageId) {
        try {
            // Cleanup previous page if it has a cleanup method
            if (this.currentPage && this.pages[this.currentPage] && typeof this.pages[this.currentPage].cleanup === 'function') {
                console.log(`Cleaning up page: ${this.currentPage}`);
                this.pages[this.currentPage].cleanup();
            }
            
            this.currentPage = pageId;
            
            // Update page-specific background
            this.updatePageBackground(pageId);
            
            // Update navigation
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const activeBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
            if (activeBtn) activeBtn.classList.add('active');
            
            const headerTitle = document.getElementById('header-title');
            if (headerTitle) headerTitle.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
            
            // Load page content
            if (this.pages[pageId] && typeof this.pages[pageId].render === 'function') {
                const mainContent = document.getElementById('main-content');
                if (mainContent) {
                    mainContent.innerHTML = this.pages[pageId].render();
                    
                    // Initialize page-specific functionality with a small delay to ensure DOM is ready
                    setTimeout(() => {
                        try {
                            if (this.pages[pageId] && typeof this.pages[pageId].init === 'function') {
                                console.log(`Initializing page: ${pageId}`);
                                this.pages[pageId].init();
                            }
                            
                            // Apply polished dropdown styling to any new dropdowns
                            this.applyPolishedDropdowns();
                        } catch (initError) {
                            console.error(`Error initializing page ${pageId}:`, initError);
                            this.showErrorNotification(`Failed to initialize ${pageId} page. Please refresh and try again.`);
                        }
                    }, 10);
                }
            } else {
                console.error(`Page ${pageId} not found or missing render method`);
                this.showErrorNotification(`Page ${pageId} not found.`);
            }
        } catch (error) {
            console.error(`Error showing page ${pageId}:`, error);
            this.showErrorNotification(`Failed to load ${pageId} page. Please refresh and try again.`);
        }
    }

    updatePageBackground(pageId) {
        // Remove all existing page background classes (for fallback CSS)
        const pageClasses = ['page-dashboard', 'page-workout', 'page-gates', 'page-architect', 'page-achievements', 'page-settings', 'page-login'];
        pageClasses.forEach(className => {
            document.body.classList.remove(className);
        });
        
        // Add the new page background class (for fallback CSS)
        if (pageId) {
            document.body.classList.add(`page-${pageId}`);
        }
        
        // Start enhanced background for the page
        try {
            backgroundIntegration.startBackground(pageId, document.body);
            console.log(`Enhanced background started for: ${pageId}`);
        } catch (error) {
            console.error(`Failed to start enhanced background for ${pageId}:`, error);
            // Fallback to CSS-only backgrounds if enhanced system fails
        }
    }

    showOnboarding() {
        document.getElementById('onboarding-overlay').classList.remove('hidden');
        this.currentOnboardingStep = 1;
        this.showOnboardingStep(1);
    }

    setupOnboardingListeners() {
        // Step 1: Begin Calibration
        const beginBtn = document.getElementById('begin-calibration-btn');
        if (beginBtn) {
            beginBtn.addEventListener('click', () => {
                this.nextOnboardingStep();
            });
        }

        // Step 2: Gender Selection
        document.querySelectorAll('.gender-card').forEach(card => {
            card.addEventListener('click', () => {
                const gender = card.dataset.gender;
                this.state.onboardingData.gender = gender;
                
                // Update UI
                document.querySelectorAll('.gender-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Enable next button
                const nextBtn = document.getElementById('gender-next-btn');
                nextBtn.disabled = false;
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            });
        });

        const genderNextBtn = document.getElementById('gender-next-btn');
        if (genderNextBtn) {
            genderNextBtn.addEventListener('click', () => {
                if (!genderNextBtn.disabled) {
                    this.nextOnboardingStep();
                }
            });
        }

        // Step 3: Goal Selection
        document.querySelectorAll('.goal-card').forEach(card => {
            card.addEventListener('click', () => {
                const goal = card.dataset.goal;
                this.state.onboardingData.goal = goal;
                
                // Update UI
                document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Enable next button
                const nextBtn = document.getElementById('goal-next-btn');
                nextBtn.disabled = false;
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            });
        });

        const goalNextBtn = document.getElementById('goal-next-btn');
        if (goalNextBtn) {
            goalNextBtn.addEventListener('click', () => {
                if (!goalNextBtn.disabled) {
                    this.nextOnboardingStep();
                }
            });
        }

        // Step 4: Focus Area Selection
        document.querySelectorAll('.focus-option').forEach(option => {
            option.addEventListener('click', () => {
                const focus = option.dataset.focus;
                this.state.onboardingData.focusArea = focus;
                
                // Update UI
                document.querySelectorAll('.focus-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                
                // Highlight body part
                this.highlightBodyPart(focus);
                
                // Enable next button
                const nextBtn = document.getElementById('focus-next-btn');
                nextBtn.disabled = false;
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            });
        });

        const focusNextBtn = document.getElementById('focus-next-btn');
        if (focusNextBtn) {
            focusNextBtn.addEventListener('click', () => {
                if (!focusNextBtn.disabled) {
                    this.nextOnboardingStep();
                }
            });
        }

        // Step 5: Experience Level
        document.querySelectorAll('.experience-option').forEach(option => {
            option.addEventListener('click', () => {
                const level = option.dataset.level;
                this.state.onboardingData.experienceLevel = level;
                
                // Update UI
                document.querySelectorAll('.experience-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                
                // Enable next button
                const nextBtn = document.getElementById('experience-next-btn');
                nextBtn.disabled = false;
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            });
        });

        const experienceNextBtn = document.getElementById('experience-next-btn');
        if (experienceNextBtn) {
            experienceNextBtn.addEventListener('click', () => {
                if (!experienceNextBtn.disabled) {
                    this.nextOnboardingStep();
                }
            });
        }

        // Step 6: Biometrics
        const weightSlider = document.getElementById('weight-slider');
        const heightSlider = document.getElementById('height-slider');
        const weightValue = document.getElementById('weight-value');
        const heightValue = document.getElementById('height-value');

        if (weightSlider && weightValue) {
            weightSlider.addEventListener('input', () => {
                this.state.onboardingData.weight = parseInt(weightSlider.value);
                weightValue.textContent = weightSlider.value;
            });
        }

        if (heightSlider && heightValue) {
            heightSlider.addEventListener('input', () => {
                this.state.onboardingData.height = parseInt(heightSlider.value);
                heightValue.textContent = heightSlider.value;
            });
        }

        const biometricsNextBtn = document.getElementById('biometrics-next-btn');
        if (biometricsNextBtn) {
            biometricsNextBtn.addEventListener('click', () => {
                this.nextOnboardingStep();
                this.startCalibration();
            });
        }

        // Step 8: Enter System
        const enterSystemBtn = document.getElementById('enter-system-btn');
        if (enterSystemBtn) {
            enterSystemBtn.addEventListener('click', () => {
                this.completeOnboarding();
            });
        }
    }

    showOnboardingStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.onboarding-step').forEach(step => {
            step.classList.remove('active');
            step.classList.add('hidden');
        });

        // Show current step with animation
        const currentStepEl = document.getElementById(`onboarding-step-${stepNumber}`);
        if (currentStepEl) {
            currentStepEl.classList.remove('hidden');
            
            // Animate in
            if (window.anime) {
                anime({
                    targets: currentStepEl,
                    opacity: [0, 1],
                    translateX: [100, 0],
                    duration: 600,
                    easing: 'easeOutCubic',
                    complete: () => {
                        currentStepEl.classList.add('active');
                    }
                });
            } else {
                currentStepEl.classList.add('active');
            }
        }
    }

    nextOnboardingStep() {
        const currentStepEl = document.getElementById(`onboarding-step-${this.currentOnboardingStep}`);
        
        if (window.anime && currentStepEl) {
            // Animate out current step
            anime({
                targets: currentStepEl,
                opacity: [1, 0],
                translateX: [0, -100],
                duration: 400,
                easing: 'easeInCubic',
                complete: () => {
                    this.currentOnboardingStep++;
                    this.showOnboardingStep(this.currentOnboardingStep);
                }
            });
        } else {
            this.currentOnboardingStep++;
            this.showOnboardingStep(this.currentOnboardingStep);
        }
    }

    highlightBodyPart(focus) {
        // Reset all highlights
        document.querySelectorAll('#body-diagram *').forEach(part => {
            part.classList.remove('highlight');
        });
        
        // Highlight selected part
        const partMap = {
            'full-body': ['head', 'torso', 'left-arm', 'right-arm', 'abs-area', 'left-leg', 'right-leg'],
            'arm': ['left-arm', 'right-arm'],
            'chest': ['torso'],
            'abs': ['abs-area'],
            'leg': ['left-leg', 'right-leg']
        };
        
        const parts = partMap[focus] || [];
        parts.forEach(partId => {
            const element = document.getElementById(partId);
            if (element) {
                element.classList.add('highlight');
            }
        });
    }

    startCalibration() {
        const progressCircle = document.getElementById('progress-circle');
        const progressPercentage = document.getElementById('progress-percentage');
        const calibrationStatus = document.getElementById('calibration-status');
        
        const messages = [
            'Analyzing physical metrics...',
            'Calculating optimal training parameters...',
            'Personalizing workout intensity...',
            'Finalizing your hunter profile...',
            'Your personalized system is ready'
        ];
        
        let progress = 0;
        let messageIndex = 0;
        
        const interval = setInterval(() => {
            progress += 20;
            
            // Update progress circle
            if (progressCircle) {
                const circumference = 314;
                const offset = circumference - (progress / 100) * circumference;
                progressCircle.style.strokeDashoffset = offset;
            }
            
            // Update percentage
            if (progressPercentage) {
                progressPercentage.textContent = `${progress}%`;
            }
            
            // Update status message
            if (calibrationStatus && messageIndex < messages.length) {
                calibrationStatus.textContent = messages[messageIndex];
                messageIndex++;
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    this.nextOnboardingStep();
                }, 1000);
            }
        }, 1000);
    }

    completeOnboarding() {
        // Apply onboarding data to user profile
        this.state.onboardingComplete = true;
        
        if (this.state.onboardingData.experienceLevel === 'beginner') {
            // Reduce starting weights for beginners
            Object.keys(this.state.lifts).forEach(lift => {
                this.state.lifts[lift].weight = Math.round(this.state.lifts[lift].weight * 0.7);
            });
        } else if (this.state.onboardingData.experienceLevel === 'advanced') {
            // Increase starting weights for advanced users
            Object.keys(this.state.lifts).forEach(lift => {
                this.state.lifts[lift].weight = Math.round(this.state.lifts[lift].weight * 1.3);
            });
        }
        
        this.saveData().then(() => {
            // Hide onboarding overlay with animation
            const overlay = document.getElementById('onboarding-overlay');
            
            if (window.anime) {
                anime({
                    targets: overlay,
                    opacity: [1, 0],
                    duration: 800,
                    easing: 'easeInCubic',
                    complete: () => {
                        overlay.classList.add('hidden');
                        this.showMainApp();
                        this.modalAlert("Welcome to Project Monarch! Your journey begins now.", "System Activated");
                    }
                });
            } else {
                overlay.classList.add('hidden');
                this.showMainApp();
                this.modalAlert("Welcome to Project Monarch! Your journey begins now.", "System Activated");
            }
        });
    }

    showMainApp() {
        document.getElementById('app-content').classList.remove('hidden');
        this.state.isInitialized = true;
        
        // Ensure clean state before showing dashboard
        this.destroyAllParticles();
        
        this.showPage('dashboard');
        
        // Ensure dashboard background is applied
        this.updatePageBackground('dashboard');
        
        // Initialize particles with a small delay to ensure DOM is ready
        setTimeout(() => {
            this.initParticles('dashboard');
        }, 100);
        
        // Start periodic gate spawning checks
        this.startGateSpawning();
    }

    startGateSpawning() {
        // Check for gate spawning every 30 minutes
        setInterval(() => {
            if (this.pages.gates && this.pages.gates.trySpawnRandomGate) {
                this.pages.gates.trySpawnRandomGate();
            }
        }, 30 * 60 * 1000); // 30 minutes
        
        // Also check once on startup (after a delay)
        setTimeout(() => {
            if (this.pages.gates && this.pages.gates.trySpawnRandomGate) {
                this.pages.gates.trySpawnRandomGate();
            }
        }, 5000); // 5 seconds after startup
    }

    initParticles(type) {
        if (!window.particlesJS) return;
        
        // Destroy ALL existing particles instances first
        this.destroyAllParticles();
        
        // Only initialize if the target container exists
        const targetContainer = document.getElementById(`particles-${type}`);
        if (!targetContainer) return;
        
        const config = {
            particles: { 
                number: { value: type === 'login' ? 35 : 40 }, 
                color: { value: type === 'login' ? '#4f46e5' : '#6366f1' }, 
                shape: { type: 'circle' }, 
                opacity: { value: type === 'login' ? 0.25 : 0.2 }, 
                size: { value: 2 }, 
                move: { 
                    enable: true, 
                    speed: 1,
                    direction: 'none',
                    random: false,
                    straight: false,
                    out_mode: 'out',
                    bounce: false
                } 
            }, 
            interactivity: { 
                detect_on: 'canvas',
                events: { 
                    onhover: { enable: false },
                    onclick: { enable: false },
                    resize: true
                } 
            }, 
            retina_detect: true 
        };
        
        try {
            particlesJS(`particles-${type}`, config);
        } catch (error) {
            console.warn('Particles initialization failed:', error);
        }
    }

    destroyAllParticles() {
        // More thorough cleanup of particles
        if (window.pJSDom && window.pJSDom.length > 0) {
            window.pJSDom.forEach(pjs => {
                try {
                    if (pjs.pJS && pjs.pJS.fn && pjs.pJS.fn.vendors && pjs.pJS.fn.vendors.destroypJS) {
                        pjs.pJS.fn.vendors.destroypJS();
                    }
                } catch (error) {
                    console.warn('Error destroying particles:', error);
                }
            });
            window.pJSDom = [];
        }
        
        // Also clear any canvas elements that might be left behind
        const particleContainers = document.querySelectorAll('[id^="particles-"]');
        particleContainers.forEach(container => {
            const canvas = container.querySelector('canvas');
            if (canvas) {
                canvas.remove();
            }
        });
    }

    // Legacy loadData method - kept for backward compatibility but enhanced with validation
    async loadData() {
        console.warn('loadData() called - consider using loadUserDataSafely() instead');
        
        if (!this.state.user) {
            console.error('No user available for loadData');
            return;
        }
        
        // Use the safer loading method
        await this.loadUserDataSafely(this.state.user);
    }

    async saveData(retryCount = 0) {
        if (!this.state.user || !this.state.user.uid) {
            console.error('Cannot save data: no valid user');
            return false;
        }
        
        const userRef = doc(db, "users", this.state.user.uid);
        const maxRetries = 3;
        
        try {
            // Validate state before saving
            if (!this.validateStateIntegrity()) {
                console.error('State validation failed, cannot save corrupted data');
                return false;
            }
            
            // Create a safe copy of state for saving
            const stateToSave = { ...this.state };
            
            // Remove the user object from saved data
            delete stateToSave.user;
            delete stateToSave.isInitialized;
            
            // Add metadata for validation and recovery
            stateToSave.userId = this.state.user.uid;
            stateToSave.lastSaved = new Date().toISOString();
            stateToSave.saveVersion = '2.0'; // Version for future migrations
            stateToSave.dataChecksum = this.generateDataChecksum(stateToSave);
            
            // Validate critical data before saving
            if (!stateToSave.playerName) {
                stateToSave.playerName = 'Player';
            }
            
            if (!stateToSave.stats || typeof stateToSave.stats !== 'object') {
                stateToSave.stats = JSON.parse(JSON.stringify(DEFAULT_USER_STATE.stats));
            }
            
            // Save to Firestore with merge to preserve any server-side data
            await setDoc(userRef, stateToSave, { merge: true });
            
            // Cache data locally for offline access
            this.cacheDataLocally(stateToSave);
            
            console.log("Data saved to Firestore for user:", this.state.user.uid);
            
            // Clear any pending save operations
            this.clearPendingSave();
            
            return true;
            
        } catch (error) {
            console.error("Error saving data:", error);
            
            // Handle specific Firebase errors
            if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
                console.log('Firebase temporarily unavailable, caching data locally');
                this.cacheDataLocally({ ...this.state });
                this.schedulePendingSave();
                return false;
            }
            
            // Retry logic for transient errors
            if (retryCount < maxRetries && this.isRetryableError(error)) {
                console.log(`Retrying save operation (${retryCount + 1}/${maxRetries})`);
                await this.delay(1000 * (retryCount + 1)); // Exponential backoff
                return this.saveData(retryCount + 1);
            }
            
            // Cache data locally as fallback
            this.cacheDataLocally({ ...this.state });
            
            // Show user-friendly error message
            if (retryCount === 0) {
                this.showErrorNotification('Unable to save progress to cloud. Data cached locally.');
            }
            
            return false;
        }
    }

    validateStateIntegrity() {
        try {
            // Check critical state properties
            if (!this.state || typeof this.state !== 'object') {
                console.error('State is not a valid object');
                return false;
            }
            
            // Validate required fields
            const requiredFields = ['playerName', 'level', 'xp', 'stats'];
            for (const field of requiredFields) {
                if (!this.state.hasOwnProperty(field)) {
                    console.error(`Missing required state field: ${field}`);
                    return false;
                }
            }
            
            // Validate data types
            if (typeof this.state.level !== 'number' || this.state.level < 1) {
                console.error('Invalid level value');
                return false;
            }
            
            if (typeof this.state.xp !== 'number' || this.state.xp < 0) {
                console.error('Invalid XP value');
                return false;
            }
            
            // Validate arrays
            const arrayFields = ['gates', 'completedGates', 'activityLog'];
            for (const field of arrayFields) {
                if (this.state[field] && !Array.isArray(this.state[field])) {
                    console.error(`Field ${field} should be an array`);
                    return false;
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error validating state integrity:', error);
            return false;
        }
    }

    generateDataChecksum(data) {
        // Simple checksum for data integrity validation
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    cacheDataLocally(data) {
        try {
            const cacheKey = `shadowmonarch_cache_${this.state.user?.uid || 'anonymous'}`;
            const cacheData = {
                data: data,
                timestamp: Date.now(),
                version: '2.0'
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            console.log('Data cached locally for offline access');
        } catch (error) {
            console.error('Error caching data locally:', error);
        }
    }

    async loadCachedData() {
        try {
            if (!this.state.user?.uid) return null;
            
            const cacheKey = `shadowmonarch_cache_${this.state.user.uid}`;
            const cachedStr = localStorage.getItem(cacheKey);
            
            if (!cachedStr) return null;
            
            const cached = JSON.parse(cachedStr);
            
            // Check cache age (max 7 days)
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
            if (Date.now() - cached.timestamp > maxAge) {
                localStorage.removeItem(cacheKey);
                return null;
            }
            
            console.log('Loaded cached data from local storage');
            return cached.data;
        } catch (error) {
            console.error('Error loading cached data:', error);
            return null;
        }
    }

    isRetryableError(error) {
        const retryableCodes = [
            'unavailable',
            'deadline-exceeded',
            'internal',
            'resource-exhausted'
        ];
        return retryableCodes.includes(error.code);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    schedulePendingSave() {
        // Schedule a retry when connection is restored
        if (this.pendingSaveTimeout) {
            clearTimeout(this.pendingSaveTimeout);
        }
        
        this.pendingSaveTimeout = setTimeout(() => {
            console.log('Attempting to save pending data...');
            this.saveData();
        }, 30000); // Retry after 30 seconds
    }

    clearPendingSave() {
        if (this.pendingSaveTimeout) {
            clearTimeout(this.pendingSaveTimeout);
            this.pendingSaveTimeout = null;
        }
    }

    // Safe save method that handles offline scenarios
    async safeSave() {
        try {
            // Create backup before attempting save
            this.createStateBackup();
            
            if (this.connectionStatus === 'offline') {
                console.log('Offline mode: queuing save operation');
                this.queueSaveOperation();
                this.cacheDataLocally({ ...this.state });
                return false;
            }
            
            const success = await this.saveData();
            
            if (!success && this.connectionStatus !== 'offline') {
                // Save failed but we're online - queue for retry
                this.queueSaveOperation();
            }
            
            return success;
        } catch (error) {
            console.error('Error in safeSave:', error);
            this.queueSaveOperation();
            this.cacheDataLocally({ ...this.state });
            return false;
        }
    }

    // Start auto-save functionality
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Auto-save every 5 minutes
        this.autoSaveInterval = setInterval(() => {
            if (this.state.user && this.state.isInitialized) {
                console.log('Auto-saving data...');
                this.safeSave();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    // Stop auto-save functionality
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    checkAchievements() {
        console.log('🏆 Checking achievements...');
        
        if (!this.pages.achievements) {
            console.log('❌ No achievements page available');
            return;
        }
        
        const achievements = this.pages.achievements.getAchievementsData();
        const userStats = this.state.stats || {};
        const previouslyUnlocked = this.state.unlockedAchievements || [];
        
        console.log('📊 Current stats:', userStats);
        console.log('🔓 Previously unlocked:', previouslyUnlocked);
        
        // Initialize unlocked achievements array if it doesn't exist
        if (!Array.isArray(this.state.unlockedAchievements)) {
            this.state.unlockedAchievements = [];
        }
        
        achievements.forEach(achievement => {
            const isUnlocked = this.pages.achievements.checkAchievement(achievement, userStats);
            const wasAlreadyUnlocked = previouslyUnlocked.includes(achievement.id);
            
            if (isUnlocked && !wasAlreadyUnlocked) {
                // New achievement unlocked!
                console.log('🎉 NEW ACHIEVEMENT UNLOCKED:', achievement.name);
                this.state.unlockedAchievements.push(achievement.id);
                this.state.xp += achievement.reward;
                
                // Show achievement notification
                console.log('📢 Showing achievement notification...');
                this.showAchievementNotification(achievement);
                
                console.log('Achievement unlocked:', achievement.name);
            }
        });
        
        // Save data after checking achievements
        this.saveData();
    }

    showAchievementNotification(achievement) {
        console.log('🔔 showAchievementNotification called for:', achievement.name);
        const isSecret = achievement.secret;
        
        console.log('📱 Calling showNotification with options...');
        this.showNotification({
            type: isSecret ? 'secret' : 'achievement',
            title: isSecret ? 'Secret Achievement Discovered!' : 'Achievement Unlocked!',
            message: `${achievement.name}<br><span class="text-xs opacity-90">+${achievement.reward} XP</span>`,
            icon: isSecret ? 'fa-star' : 'fa-trophy',
            duration: 6000,
            closable: true
        });
    }

    // Helper methods for different notification types
    showSuccessNotification(message, title = 'Success') {
        this.showNotification({
            type: 'success',
            title: title,
            message: message,
            icon: 'fa-check-circle',
            duration: 4000
        });
    }

    showWarningNotification(message, title = 'Warning') {
        this.showNotification({
            type: 'warning',
            title: title,
            message: message,
            icon: 'fa-exclamation-triangle',
            duration: 6000
        });
    }

    showInfoNotification(message, title = 'Info') {
        this.showNotification({
            type: 'info',
            title: title,
            message: message,
            icon: 'fa-info-circle',
            duration: 4000
        });
    }

    clearAllNotifications() {
        // Clear all active notifications
        this.notifications.forEach(notificationData => {
            if (notificationData.removeTimeout) {
                clearTimeout(notificationData.removeTimeout);
            }
            if (notificationData.element && notificationData.element.parentElement) {
                notificationData.element.remove();
            }
        });
        
        this.notifications = [];
    }

    // Modal utilities
    showModal(options) {
        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const actions = document.getElementById('modal-actions');
        const modalContent = overlay.querySelector('.modal-content');
        
        title.textContent = options.title || 'Modal';
        body.innerHTML = options.html || options.message || '';
        
        // Handle modal size
        if (modalContent) {
            modalContent.classList.remove('large', 'medium', 'small');
            if (options.size) {
                modalContent.classList.add(options.size);
            }
        }
        
        // Clear and setup actions
        actions.innerHTML = '';
        if (options.actions) {
            options.actions.forEach(action => {
                const btn = document.createElement('button');
                btn.textContent = action.label;
                
                // Enhanced button styling
                let className = 'modal-btn px-6 py-3 rounded-lg font-medium transition-all duration-200';
                if (action.className) {
                    className += ` ${action.className}`;
                } else if (action.primary) {
                    className += ' bg-indigo-600 hover:bg-indigo-500 text-white';
                } else {
                    className += ' bg-gray-600 hover:bg-gray-500 text-white';
                }
                
                btn.className = className;
                btn.onclick = action.onClick;
                actions.appendChild(btn);
            });
        }
        
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        
        // Add fade-in animation
        setTimeout(() => {
            overlay.style.opacity = '1';
        }, 10);
        
        return {
            close: () => {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                    overlay.style.opacity = '';
                }, 200);
            }
        };
    }

    modalAlert(message, title = 'Alert') {
        return new Promise(resolve => {
            const instance = this.showModal({
                title,
                message,
                actions: [
                    { label: 'OK', primary: true, onClick: () => { instance.close(); resolve(); } }
                ]
            });
        });
    }

    modalConfirm(options) {
        const message = typeof options === 'string' ? options : options.message;
        const title = typeof options === 'object' ? options.title : 'Confirm';
        
        return new Promise(resolve => {
            const instance = this.showModal({
                title,
                message,
                actions: [
                    { label: 'Cancel', onClick: () => { instance.close(); resolve(false); } },
                    { label: 'Confirm', primary: true, onClick: () => { instance.close(); resolve(true); } }
                ]
            });
        });
    }

    modalPrompt(options) {
        const message = typeof options === 'string' ? options : options.message;
        const title = typeof options === 'object' ? options.title : 'Input';
        const placeholder = typeof options === 'object' ? options.placeholder : '';
        
        return new Promise(resolve => {
            const inputId = `prompt-input-${Date.now()}`;
            const instance = this.showModal({
                title,
                html: `<p class="mb-4">${message}</p><input type="text" id="${inputId}" placeholder="${placeholder}">`,
                actions: [
                    { label: 'Cancel', onClick: () => { instance.close(); resolve(null); } },
                    { label: 'OK', primary: true, onClick: () => { 
                        const input = document.getElementById(inputId);
                        const value = input ? input.value : '';
                        instance.close(); 
                        resolve(value); 
                    }}
                ]
            });
        });
    }

    // Page creation methods

    createGatesPage() {
        const self = this;
        return {
            render: () => {
                return `
                    <div class="card-bg p-6 rounded-lg">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-2xl font-bold">Active Gates</h2>
                            <button id="generate-gate-btn" class="btn-primary py-2 px-4 rounded">Generate Gate</button>
                        </div>
                        <div id="gates-list" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                    </div>
                `;
            },
            init: () => {
                const generateBtn = document.getElementById('generate-gate-btn');
                if (generateBtn) {
                    generateBtn.addEventListener('click', () => {
                        self.generateGate();
                    });
                }
                self.renderGatesList();
            }
        };
    }

    createArchitectPage() {
        return {
            render: () => {
                return `
                    <div class="card-bg p-6 rounded-lg">
                        <h2 class="text-2xl font-bold mb-4">Create New Routine</h2>
                        <div class="text-center text-gray-400 py-8">Routine architect coming soon!</div>
                    </div>
                `;
            },
            init: () => {}
        };
    }



    generateSampleActivityData() {
        const activities = [];
        const today = new Date();
        
        // Generate activity for the last year (365 days)
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            
            // More realistic activity patterns
            const daysAgo = i;
            let activityChance = 0;
            
            // Recent activity (last 30 days) - high activity
            if (daysAgo < 30) {
                activityChance = 0.8;
            }
            // Medium activity (30-90 days ago)
            else if (daysAgo < 90) {
                activityChance = 0.6;
            }
            // Lower activity (90-180 days ago)
            else if (daysAgo < 180) {
                activityChance = 0.4;
            }
            // Very low activity (older than 180 days)
            else {
                activityChance = 0.2;
            }
            
            // Skip weekends occasionally for more realistic patterns
            const dayOfWeek = date.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                activityChance *= 0.7; // 30% less likely on weekends
            }
            
            if (Math.random() < activityChance) {
                const hasWorkout = Math.random() < 0.85;
                const hasGate = Math.random() < 0.25;
                
                if (hasWorkout) {
                    activities.push({
                        date: dateString,
                        type: 'workout',
                        description: 'Daily Quest completed',
                        timestamp: date.toISOString()
                    });
                }
                
                if (hasGate) {
                    activities.push({
                        date: dateString,
                        type: 'gate',
                        description: 'Gate completed',
                        timestamp: date.toISOString()
                    });
                }
            }
        }
        
        return activities;
    }

    // Helper methods
    renderAvatar() {
        const placeholder = document.getElementById('avatar-placeholder');
        const avatarImg = document.getElementById('dashboard-avatar-img');
        
        if (this.state.customAvatar && avatarImg && placeholder) {
            avatarImg.src = this.state.customAvatar;
            avatarImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else if (placeholder && avatarImg) {
            avatarImg.classList.add('hidden');
            placeholder.classList.remove('hidden');
        }
    }

    renderRadarChart() {
        const canvas = document.getElementById('radar-chart');
        if (!canvas || !window.Chart) return;

        const ctx = canvas.getContext('2d');
        
        const data = {
            labels: ['Squat', 'Bench', 'Deadlift', 'OHP', 'Row'],
            datasets: [{
                label: 'Current Strength',
                data: [
                    this.state.lifts.Squat?.weight || 0,
                    this.state.lifts['Bench Press']?.weight || 0,
                    this.state.lifts.Deadlift?.weight || 0,
                    this.state.lifts['Overhead Press']?.weight || 0,
                    this.state.lifts['Barbell Row']?.weight || 0
                ],
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderColor: 'rgba(79, 70, 229, 1)',
                borderWidth: 2
            }]
        };

        new Chart(ctx, {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: {
                            color: '#374151'
                        },
                        angleLines: {
                            color: '#374151'
                        },
                        pointLabels: {
                            color: '#d1d5db'
                        },
                        ticks: {
                            color: '#9ca3af',
                            backdropColor: 'transparent'
                        }
                    }
                }
            }
        });
    }



    // Achievements data
    getAchievementsData() {
        return [
            // Streak Achievements
            { id: 'streak_3', name: 'Consistency Hunter', description: 'Complete workouts for 3 days in a row', icon: 'fa-fire', target: 3, progress: (state) => state.streak },
            { id: 'streak_7', name: 'Week Warrior', description: 'Complete workouts for 7 days in a row', icon: 'fa-fire', target: 7, progress: (state) => state.streak },
            { id: 'streak_14', name: 'Fortnight Specialist', description: 'Complete workouts for 14 days in a row', icon: 'fa-fire', target: 14, progress: (state) => state.streak },
            { id: 'streak_30', name: 'Monthly Master', description: 'Complete workouts for 30 days in a row', icon: 'fa-fire', target: 30, progress: (state) => state.streak },
            { id: 'streak_100', name: 'Centurion Elite', description: 'Complete workouts for 100 days in a row', icon: 'fa-fire', target: 100, progress: (state) => state.streak },

            // Workout Count
            { id: 'workouts_1', name: 'First Steps Hunter', description: 'Complete your first workout', icon: 'fa-dumbbell', target: 1, progress: (state) => state.stats.totalWorkouts },
            { id: 'workouts_10', name: 'Dedicated Specialist', description: 'Complete 10 total workouts', icon: 'fa-dumbbell', target: 10, progress: (state) => state.stats.totalWorkouts },
            { id: 'workouts_50', name: 'Committed Master', description: 'Complete 50 total workouts', icon: 'fa-dumbbell', target: 50, progress: (state) => state.stats.totalWorkouts },
            { id: 'workouts_100', name: 'Century Elite', description: 'Complete 100 total workouts', icon: 'fa-dumbbell', target: 100, progress: (state) => state.stats.totalWorkouts },
            { id: 'workouts_365', name: 'Annual Veteran', description: 'Complete 365 total workouts', icon: 'fa-dumbbell', target: 365, progress: (state) => state.stats.totalWorkouts },

            // Gate Clearing
            { id: 'gates_1', name: 'Gate Breaker Hunter', description: 'Clear your first gate', icon: 'fa-door-open', target: 1, progress: (state) => state.stats.gatesCleared },
            { id: 'gates_10', name: 'Portal Specialist', description: 'Clear 10 gates', icon: 'fa-door-open', target: 10, progress: (state) => state.stats.gatesCleared },
            { id: 'gates_50', name: 'Dimension Master', description: 'Clear 50 gates', icon: 'fa-door-open', target: 50, progress: (state) => state.stats.gatesCleared },

            // Volume Achievements
            { id: 'volume_1000', name: 'Tonnage Hunter', description: 'Lift 1,000 kg total volume', icon: 'fa-weight-hanging', target: 1000, progress: (state) => state.stats.totalVolumeKg },
            { id: 'volume_10000', name: 'Heavy Specialist', description: 'Lift 10,000 kg total volume', icon: 'fa-weight-hanging', target: 10000, progress: (state) => state.stats.totalVolumeKg },
            { id: 'volume_100000', name: 'Mountain Master', description: 'Lift 100,000 kg total volume', icon: 'fa-weight-hanging', target: 100000, progress: (state) => state.stats.totalVolumeKg },

            // Customization
            { id: 'avatar_upload', name: 'Personal Touch Hunter', description: 'Upload a custom avatar', icon: 'fa-user-circle', target: 1, progress: (state) => state.customAvatar ? 1 : 0 },
            { id: 'name_change', name: 'Identity Specialist', description: 'Change your player name', icon: 'fa-id-card', target: 1, progress: (state) => state.playerName !== 'Player' ? 1 : 0 },
            { id: 'routine_create', name: 'Architect Master', description: 'Create a custom routine', icon: 'fa-tools', target: 1, progress: (state) => state.savedRoutines ? state.savedRoutines.length : 0 }
        ];
    }

    renderAchievementsPage() {
        const grid = document.getElementById('achievements-grid');
        if (!grid) return;
        grid.innerHTML = '';

        // Group achievements by category
        const achievementGroups = {
            'Streak Achievements': [],
            'Workout Count': [],
            'Gate Clearing': [],
            'Volume Achievements': [],
            'Customization': []
        };

        this.achievementsData.forEach(ach => {
            // Categorize achievements
            if (ach.id.startsWith('streak_')) {
                achievementGroups['Streak Achievements'].push(ach);
            } else if (ach.id.startsWith('workouts_')) {
                achievementGroups['Workout Count'].push(ach);
            } else if (ach.id.startsWith('gates_')) {
                achievementGroups['Gate Clearing'].push(ach);
            } else if (ach.id.startsWith('volume_')) {
                achievementGroups['Volume Achievements'].push(ach);
            } else if (ach.id.includes('avatar') || ach.id.includes('name') || ach.id.includes('routine')) {
                achievementGroups['Customization'].push(ach);
            }
        });

        // Render each group
        Object.entries(achievementGroups).forEach(([groupName, achievements]) => {
            if (achievements.length === 0) return;

            // Group header
            grid.innerHTML += `<h3 class="col-span-full text-lg font-bold text-indigo-400 mt-6 mb-2">${groupName}</h3>`;

            achievements.forEach(ach => {
                const isUnlocked = this.state.achievements.includes(ach.id);
                let progress = 0;
                if (ach.progress && typeof ach.progress === 'function') {
                    try {
                        progress = ach.progress(this.state) || 0;
                    } catch (e) {
                        progress = 0;
                    }
                }
                
                const progressPercentage = Math.min(100, Math.max(0, (progress / ach.target) * 100));
                
                grid.innerHTML += `
                    <div class="card-bg p-4 rounded-lg transition-all duration-300 ${!isUnlocked ? 'achievement-locked' : ''}">
                        <div class="flex items-center mb-3">
                            <i class="fas ${ach.icon} text-3xl ${isUnlocked ? 'text-indigo-400' : 'text-stone-500'} mr-3"></i>
                            <div class="flex-1">
                                <p class="font-bold text-base">${ach.name}</p>
                                <p class="text-xs text-stone-400">${ach.description}</p>
                            </div>
                        </div>
                        
                        ${!isUnlocked ? `
                            <div class="w-full bg-stone-600 rounded-full h-2.5 mb-2">
                                <div class="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" style="width: ${progressPercentage}%"></div>
                            </div>
                            <p class="text-xs text-stone-500">${Math.floor(progress)} / ${ach.target}</p>
                        ` : `
                            <p class="text-xs text-indigo-400">Unlocked!</p>
                        `}
                    </div>
                `;
            });
        });
    }

    renderActivityCalendar() {
        const container = document.getElementById('activity-calendar-container');
        if (!container) return;

        // Calculate activity statistics
        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        const totalContributions = this.state.activityLog.filter(log => {
            const logDate = new Date(log.date);
            return logDate >= oneYearAgo && logDate <= today;
        }).length;

        const dailyQuests = this.state.activityLog.filter(log => log.type === 'workout').length;
        const gatesCompleted = this.state.activityLog.filter(log => log.type === 'gate').length;

        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold">Activity Log</h3>
                <div class="text-sm text-gray-400">
                    ${totalContributions} activities in the last year
                </div>
            </div>
            <div class="activity-graph-container">
                <div class="activity-main-grid">
                    <div class="activity-weekdays">
                        <div class="weekday-label">Sun</div>
                        <div class="weekday-label">Mon</div>
                        <div class="weekday-label">Tue</div>
                        <div class="weekday-label">Wed</div>
                        <div class="weekday-label">Thu</div>
                        <div class="weekday-label">Fri</div>
                        <div class="weekday-label">Sat</div>
                    </div>
                    <div class="activity-content">
                        <div id="activity-months" class="activity-months-row"></div>
                        <div id="activity-grid" class="activity-grid"></div>
                    </div>
                </div>
                <div class="activity-legend">
                    <div class="activity-legend-items">
                        <div class="activity-legend-item">
                            <div class="activity-legend-square daily-quest"></div>
                            <span>Daily Quest (${dailyQuests})</span>
                        </div>
                        <div class="activity-legend-item">
                            <div class="activity-legend-square gate-completed"></div>
                            <span>Gate Completed (${gatesCompleted})</span>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500">
                        Hover squares for details
                    </div>
                </div>
            </div>
        `;

        this.renderActivityGrid();
    }

    renderActivityGrid() {
        const grid = document.getElementById('activity-grid');
        const monthsContainer = document.getElementById('activity-months');
        if (!grid || !monthsContainer) return;

        // Clear existing content
        grid.innerHTML = '';
        monthsContainer.innerHTML = '';

        const today = new Date();
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        // Start from the Sunday of the week containing oneYearAgo
        const startDate = new Date(oneYearAgo);
        startDate.setDate(startDate.getDate() - startDate.getDay());
        
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Calculate weeks
        const weeks = [];
        let currentDate = new Date(startDate);
        
        while (currentDate <= today) {
            weeks.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 7);
        }

        // Create month labels
        weeks.forEach((weekStart, index) => {
            const label = document.createElement('div');
            label.className = 'activity-month-label';
            
            if (index === 0 || weekStart.getDate() <= 7) {
                label.textContent = months[weekStart.getMonth()];
            }
            
            monthsContainer.appendChild(label);
        });

        // Create activity squares organized by weeks
        weeks.forEach((weekStart) => {
            const weekColumn = document.createElement('div');
            weekColumn.className = 'activity-week';
            
            for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
                const currentDate = new Date(weekStart);
                currentDate.setDate(weekStart.getDate() + dayOfWeek);
                
                const square = document.createElement('div');
                square.className = 'activity-square';
                
                if (currentDate <= today) {
                    const dateString = currentDate.toISOString().split('T')[0];
                    const dayActivities = this.state.activityLog.filter(log => log.date === dateString);
                    
                    square.title = this.getActivityTooltip(currentDate, dayActivities);
                    
                    if (dayActivities.length === 0) {
                        square.classList.add('no-activity');
                    } else {
                        const hasWorkout = dayActivities.some(a => a.type === 'workout');
                        const hasGate = dayActivities.some(a => a.type === 'gate');
                        
                        if (hasWorkout && hasGate) {
                            square.classList.add('dual-activity');
                        } else if (hasGate) {
                            square.classList.add('gate-completed');
                        } else if (hasWorkout) {
                            square.classList.add('daily-quest');
                        }
                    }
                } else {
                    square.style.visibility = 'hidden';
                }
                
                weekColumn.appendChild(square);
            }
            
            grid.appendChild(weekColumn);
        });
    }

    getActivityTooltip(date, activities) {
        const dateStr = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        
        if (activities.length === 0) {
            return `No activity on ${dateStr}`;
        }
        
        const workouts = activities.filter(a => a.type === 'workout').length;
        const gates = activities.filter(a => a.type === 'gate').length;
        
        let tooltip = `${dateStr}\n`;
        if (workouts > 0) tooltip += `✓ ${workouts} Daily Quest${workouts > 1 ? 's' : ''}\n`;
        if (gates > 0) tooltip += `⚡ ${gates} Gate${gates > 1 ? 's' : ''} completed`;
        
        return tooltip.trim();
    }

    // Gates System
    generateGate() {
        if (!Array.isArray(this.state.gates)) this.state.gates = [];
        if (!Array.isArray(this.state.completedGates)) this.state.completedGates = [];
        
        const now = Date.now();
        
        // Remove expired gates
        this.state.gates = this.state.gates.filter(g => g.expiresAt > now);
        
        if (this.state.gates.length >= 3) {
            this.modalAlert('Maximum number of active gates reached!');
            return;
        }

        const gatesData = [
            { rank: 'E', description: 'Complete 20 push-ups without stopping', reward: 25 },
            { rank: 'D', description: 'Hold a plank for 2 minutes straight', reward: 50 },
            { rank: 'C', description: 'Complete 50 squats in under 5 minutes', reward: 75 },
            { rank: 'B', description: 'Run 1 mile in under 10 minutes', reward: 100 },
            { rank: 'A', description: 'Complete 100 burpees in one session', reward: 150 },
            { rank: 'S', description: 'Deadlift 2x your bodyweight', reward: 250 }
        ];

        // Filter available gates
        let availableGates = gatesData.filter(gate =>
            !this.state.gates.some(active => active.rank === gate.rank) &&
            !this.state.completedGates.includes(gate.rank)
        );

        if (availableGates.length === 0) {
            this.modalAlert('No new gates available at this time.');
            return;
        }

        const selectedGate = availableGates[Math.floor(Math.random() * availableGates.length)];
        const durations = { 'S': 60 * 60 * 1000, 'A': 3 * 60 * 60 * 1000, 'B': 6 * 60 * 60 * 1000, 'C': 12 * 60 * 60 * 1000, 'D': 18 * 60 * 60 * 1000, 'E': 24 * 60 * 60 * 1000 };
        const expiresAt = now + (durations[selectedGate.rank] || 6 * 60 * 60 * 1000);
        const id = `gate_${now}_${Math.random().toString(36).slice(2, 7)}`;

        this.state.gates.push({ id, ...selectedGate, createdAt: now, expiresAt });
        this.saveData();
        
        this.renderGatesList();
        this.modalAlert(`New ${selectedGate.rank}-Rank Gate has appeared!`);
    }

    renderGatesList() {
        const list = document.getElementById('gates-list');
        if (!list) return;
        
        const now = Date.now();
        const gates = (this.state.gates || []).filter(g => g.expiresAt > now);
        
        list.innerHTML = '';
        
        if (!gates.length) {
            list.innerHTML = '<div class="col-span-2 text-center text-gray-400 py-8">No active gates. Click "Generate Gate" to create one!</div>';
            return;
        }

        gates.forEach(gate => {
            const timeLeft = this.getTimeLeft(gate.expiresAt);
            const card = document.createElement('div');
            card.className = 'gate-card card-bg p-4 rounded-lg border-l-4 border-amber-500';
            card.innerHTML = `
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-bold text-amber-400">${gate.rank}-Rank Gate</h3>
                    <span class="text-sm text-gray-400">${timeLeft}</span>
                </div>
                <p class="text-gray-300 mb-3">${gate.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-indigo-400">Reward: ${gate.reward} XP</span>
                    <button class="complete-gate-btn bg-amber-500 hover:bg-amber-400 py-1 px-3 rounded text-sm" data-gate-id="${gate.id}">
                        Complete
                    </button>
                </div>
            `;
            
            // Add event listener for complete button
            const completeBtn = card.querySelector('.complete-gate-btn');
            completeBtn.addEventListener('click', () => {
                this.completeGate(gate.id);
            });
            
            list.appendChild(card);
        });
    }

    getTimeLeft(expiresAt) {
        const now = Date.now();
        const timeLeft = expiresAt - now;
        
        if (timeLeft <= 0) return 'Expired';
        
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m left`;
        } else {
            return `${minutes}m left`;
        }
    }

    completeGate(gateId) {
        const gate = this.state.gates.find(g => g.id === gateId);
        if (!gate) return;

        const instance = this.showModal({
            title: `${gate.rank}-Rank Gate Confirmation`,
            html: `<p class="text-gray-200 mb-3">${gate.description}</p><label class="flex items-center gap-2 text-sm"><input type="checkbox" id="gate-confirm-${gateId}"> I confirm I completed this challenge.</label>`,
            actions: [
                { label: 'Cancel', onClick: () => instance.close() },
                {
                    label: 'Claim Reward', primary: true, onClick: () => {
                        const checkbox = document.getElementById(`gate-confirm-${gateId}`);
                        if (!checkbox || !checkbox.checked) return;
                        
                        instance.close();
                        this.modalAlert(`Gate Cleared! You earned ${gate.reward} XP.`);
                        
                        // Update stats
                        this.state.stats.gatesCleared++;
                        this.state.xp += gate.reward;
                        this.state.mana += 25;
                        
                        // Level up check
                        while (this.state.xp >= this.state.xpToNextLevel) {
                            this.state.xp -= this.state.xpToNextLevel;
                            this.state.level++;
                            this.state.xpToNextLevel = Math.round(this.state.xpToNextLevel * 1.2);
                        }
                        
                        // Add to completed gates
                        if (!this.state.completedGates.includes(gate.rank)) {
                            this.state.completedGates.push(gate.rank);
                        }
                        
                        // Remove from active gates
                        this.state.gates = this.state.gates.filter(g => g.id !== gateId);
                        
                        // Log activity
                        const today = new Date().toISOString().split('T')[0];
                        const existingGate = this.state.activityLog.find(log => log.date === today && log.type === 'gate');
                        if (!existingGate) {
                            this.state.activityLog.push({ 
                                date: today, 
                                type: 'gate',
                                description: `Gate completed (Rank ${gate.rank})`,
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        this.saveData();
                        this.renderGatesList();
                    }
                }
            ]
        });
    }
}

// Initialize the application
window.app = new ProjectMonarch();

// Expose test functions globally for easy testing
window.testUserSessionIsolation = () => window.app.runUserSessionIsolationTests();
window.simulateUserSwitch = (from, to) => window.app.simulateUserSwitch(from, to);
window.validateStateIntegrity = () => window.app.validateStateIntegrity();

// Expose notification functions globally for easy access
window.showNotification = (options) => window.app.showNotification(options);
window.showSuccess = (message, title) => window.app.showSuccessNotification(message, title);
window.showError = (message, title) => window.app.showErrorNotification(message, title);
window.showWarning = (message, title) => window.app.showWarningNotification(message, title);
window.showInfo = (message, title) => window.app.showInfoNotification(message, title);

// Expose auth control functions
window.disableAutoLogin = () => {
    window.app.setAutoLogin(false);
    console.log('Auto-login disabled. Refresh the page to see the login screen.');
};
window.enableAutoLogin = () => {
    window.app.setAutoLogin(true);
    console.log('Auto-login enabled.');
};
window.forceLogout = () => window.app.performLogout(true);
window.clearSession = () => {
    localStorage.setItem('autoLogin', 'false');
    window.location.reload();
};

// Force apply polished dropdown styling
window.applyPolishedDropdowns = () => {
    document.querySelectorAll('select').forEach(select => {
        select.classList.add('polished-dropdown');
    });
    console.log('Polished dropdown styling applied to all select elements');
};

// Convert to custom dropdowns
window.convertDropdowns = () => {
    window.app.convertAllDropdowns();
    console.log('Converted all dropdowns to custom styled dropdowns');
};

// Restore dropdowns to normal state
window.restoreDropdowns = () => {
    // Show all hidden selects
    document.querySelectorAll('select[style*="display: none"]').forEach(select => {
        select.style.display = '';
        select.dataset.customDropdown = 'false';
    });
    
    // Remove custom dropdown elements
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        dropdown.remove();
    });
    
    console.log('Restored all dropdowns to normal state');
};

// Development helper functions
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🧪 Development mode detected. Test functions available:');
    console.log('- testUserSessionIsolation(): Run all isolation tests');
    console.log('- simulateUserSwitch(fromId, toId): Simulate switching users');
    console.log('- validateStateIntegrity(): Check current state integrity');
    console.log('- app.performLogout(): Test logout functionality');
    console.log('- showSuccess("message"): Test success notification');
    console.log('- showError("message"): Test error notification');
    console.log('- clearSession(): Clear current session and reload');
    console.log('- disableAutoLogin(): Disable auto-login');
    
    // Check if user is auto-logged in without permission
    const autoLogin = localStorage.getItem('autoLogin');
    if (autoLogin !== 'true') {
        console.log('🔐 Auto-login is disabled. If you see the app instead of login screen, run: clearSession()');
    }
    
    // Test notification system on load
    setTimeout(() => {
        if (window.app && window.app.showSuccessNotification) {
            window.app.showSuccessNotification('Notification system loaded successfully!', 'System Ready');
        }
    }, 2000);
}

export default ProjectMonarch;