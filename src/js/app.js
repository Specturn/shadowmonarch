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

class ProjectMonarch {
    constructor() {
        this.state = {
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

        this.currentPage = 'dashboard';
        this.pages = {};
        this.achievementsData = this.getAchievementsData();
        this.masterExerciseList = [
            'Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row',
            'Romanian Deadlift', 'Front Squat', 'Hip Thrust', 'Dumbbell Bench Press',
            'Incline DB Press', 'Dumbbell Row', 'Goblet Squat', 'Bulgarian Split Squat',
            'Dumbbell Shoulder Press', 'Lateral Raise', 'Dumbbell Curl', 'Hammer Curl',
            'Tricep Skullcrusher', 'Lat Pulldown', 'Cable Row', 'Tricep Pushdown',
            'Leg Press', 'Leg Extension', 'Hamstring Curl', 'Calf Raise', 'Pull-up', 'Dip',
            'Power Clean', 'Box Jump'
        ];
        this.init();
    }

    async init() {
        console.log('Initializing Project Monarch...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.setupBasicEventListeners();
            });
        } else {
            this.setupBasicEventListeners();
        }
        
        // Initialize page modules
        this.initializePages();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup auth state listener
        onAuthStateChanged(auth, async (user) => {
            const loginScreen = document.getElementById('login-screen');
            const appContent = document.getElementById('app-content');

            if (user) {
                console.log("User is signed in:", user.uid);
                this.state.user = user;
                loginScreen.classList.add('hidden');
                
                // Load user data first
                await this.loadData();
                
                // Check if onboarding is complete
                if (!this.state.onboardingComplete) {
                    // Show onboarding instead of main app
                    this.showOnboarding();
                } else {
                    // Show main app
                    this.showMainApp();
                }
            } else {
                console.log("User is signed out.");
                loginScreen.classList.remove('hidden');
                appContent.classList.add('hidden');
                document.getElementById('onboarding-overlay').classList.add('hidden');
                this.state.isInitialized = false;
                
                // Clean up any existing particles before initializing login particles
                this.destroyAllParticles();
                setTimeout(() => {
                    this.initParticles('login');
                }, 100);
            }
        });
    }

    setupBasicEventListeners() {
        // Login button
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.addEventListener('click', async () => {
                try {
                    const result = await signInWithPopup(auth, provider);
                    console.log('User signed in:', result.user);
                } catch (error) {
                    console.error('Error signing in:', error);
                    alert('Error signing in. Please try again.');
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
        // Cleanup previous page if it has a cleanup method
        if (this.currentPage && this.pages[this.currentPage] && this.pages[this.currentPage].cleanup) {
            this.pages[this.currentPage].cleanup();
        }
        
        this.currentPage = pageId;
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.nav-btn[data-page="${pageId}"]`);
        if (activeBtn) activeBtn.classList.add('active');
        
        const headerTitle = document.getElementById('header-title');
        if (headerTitle) headerTitle.textContent = pageId.charAt(0).toUpperCase() + pageId.slice(1);
        
        // Load page content
        if (this.pages[pageId] && this.pages[pageId].render) {
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = this.pages[pageId].render();
                
                // Initialize page-specific functionality with a small delay to ensure DOM is ready
                setTimeout(() => {
                    if (this.pages[pageId].init) {
                        this.pages[pageId].init();
                    }
                }, 10);
            }
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

    async loadData() {
        if (!this.state.user) return;
        const userRef = doc(db, "users", this.state.user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const data = userSnap.data();
            Object.assign(this.state, data);
            
            // Ensure arrays are properly initialized
            if (!Array.isArray(this.state.gates)) {
                this.state.gates = [];
            }
            if (!Array.isArray(this.state.completedGates)) {
                this.state.completedGates = [];
            }
            if (!Array.isArray(this.state.activityLog)) {
                this.state.activityLog = [];
            }
            if (!Array.isArray(this.state.unlockedAchievements)) {
                this.state.unlockedAchievements = [];
            }
        } else {
            // New user - initialize with default data
            this.state.accountCreationDate = new Date().toISOString();
            this.state.activityLog = [];
            this.state.unlockedAchievements = [];
            this.state.onboardingComplete = false;
            await this.saveData();
        }

        // Double-check arrays are properly initialized
        if (!Array.isArray(this.state.activityLog)) {
            this.state.activityLog = [];
        }
    }

    async saveData() {
        if (!this.state.user) return;
        const userRef = doc(db, "users", this.state.user.uid);
        
        try {
            const stateToSave = { ...this.state };
            delete stateToSave.user;
            await setDoc(userRef, stateToSave, { merge: true });
            console.log("Data saved to Firestore.");
        } catch (error) {
            console.error("Error saving data:", error);
            alert("Error saving progress to the cloud.");
        }
    }

    checkAchievements() {
        if (!this.pages.achievements) return;
        
        const achievements = this.pages.achievements.getAchievementsData();
        const userStats = this.state.stats || {};
        const previouslyUnlocked = this.state.unlockedAchievements || [];
        
        // Initialize unlocked achievements array if it doesn't exist
        if (!Array.isArray(this.state.unlockedAchievements)) {
            this.state.unlockedAchievements = [];
        }
        
        achievements.forEach(achievement => {
            const isUnlocked = this.pages.achievements.checkAchievement(achievement, userStats);
            const wasAlreadyUnlocked = previouslyUnlocked.includes(achievement.id);
            
            if (isUnlocked && !wasAlreadyUnlocked) {
                // New achievement unlocked!
                this.state.unlockedAchievements.push(achievement.id);
                this.state.xp += achievement.reward;
                
                // Show achievement notification
                this.showAchievementNotification(achievement);
                
                console.log('Achievement unlocked:', achievement.name);
            }
        });
        
        // Save data after checking achievements
        this.saveData();
    }

    showAchievementNotification(achievement) {
        // Create achievement notification with special styling for secret achievements
        const notification = document.createElement('div');
        const isSecret = achievement.secret;
        
        notification.className = `fixed top-4 right-4 z-50 ${
            isSecret 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600' 
                : 'bg-gradient-to-r from-yellow-500 to-orange-500'
        } text-white p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-500`;
        
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                    <i class="fas ${isSecret ? 'fa-star' : 'fa-trophy'} text-2xl ${isSecret ? 'animate-pulse' : ''}"></i>
                </div>
                <div>
                    <div class="font-bold">${isSecret ? 'Secret Achievement Discovered!' : 'Achievement Unlocked!'}</div>
                    <div class="text-sm">${achievement.name}</div>
                    <div class="text-xs opacity-90">+${achievement.reward} XP</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 500);
        }, 4000);
    }

    // Modal utilities
    showModal(options) {
        const overlay = document.getElementById('modal-overlay');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const actions = document.getElementById('modal-actions');
        
        title.textContent = options.title || 'Modal';
        body.innerHTML = options.html || options.message || '';
        
        // Clear and setup actions
        actions.innerHTML = '';
        if (options.actions) {
            options.actions.forEach(action => {
                const btn = document.createElement('button');
                btn.textContent = action.label;
                btn.className = `modal-btn px-4 py-2 rounded ${action.primary ? 'primary' : ''}`;
                btn.onclick = action.onClick;
                actions.appendChild(btn);
            });
        }
        
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        
        return {
            close: () => {
                overlay.classList.add('hidden');
                overlay.classList.remove('flex');
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
                html: `<p class="mb-4">${message}</p><input type="text" id="${inputId}" placeholder="${placeholder}" class="w-full p-2 bg-gray-800 rounded border border-gray-700 focus:border-indigo-500 focus:ring-0">`,
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
            html: `<p class="text-gray-200 mb-3">${gate.description}</p><label class="flex items-center gap-2 text-sm"><input type="checkbox" id="gate-confirm-${gateId}" class="h-4 w-4"> I confirm I completed this challenge.</label>`,
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

export default ProjectMonarch;