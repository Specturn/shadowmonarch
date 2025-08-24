// --- Firebase Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, deleteUser } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- ITEM DEFINITIONS ---
const itemDefs = {
    'stamina-potion': { name: 'Stamina Potion', description: 'A bubbling, effervescent liquid. Grants 50 XP upon use.', icon: '🧪', use: () => { app.addXp(50); app.showToast('Used Stamina Potion and gained 50 XP!', 'success'); return true; } },
    'key-dungeon': { name: 'Key to a Hidden Dungeon', description: 'An ornate, glowing key. Guarantees a high-rank gate for tomorrow.', icon: '🔑', use: () => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); const dateString = tomorrow.toISOString().split('T')[0]; app.state.gates = app.state.gates.filter(g => g.date !== dateString); const highRankGate = app.generateGate(true); if (highRankGate) { highRankGate.date = dateString; app.state.gates.push(highRankGate); app.showToast('A high-rank gate has been scheduled for tomorrow!', 'special'); return true; } app.showToast('Could not generate a high-rank gate.', 'error'); return false; } },
    'mana-crystal': { name: 'Mana Crystal', description: 'A crystal humming with raw power. Grants 100 Mana.', icon: '💎', use: () => { app.updateMana(100); app.showToast('Used Mana Crystal and gained 100 Mana!', 'success'); return true; } }
};

// --- THE MAIN APP OBJECT ---
const app = {
    // Properties
    progressChart: null,
    chartMetric: 'weight',
    newRoutine: { name: '', exercises: [] },
    sounds: null,
    user: null,
    db: null,

    // State
    state: {
        initialized: false,
        currentPage: 'workout',
        playerName: 'Player',
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        title: 'The Weakest',
        currentDayIndex: 0,
        week: 1,
        streak: 0,
        lastWorkoutDate: null,
        mana: 0,
        inventory: {},
        gate: null,
        gates: [],
        workoutsCompleted: 0,
        gatesCleared: 0,
        sRanksCleared: 0,
        personalRecords: {},
        customWorkouts: [],
        activeCustomWorkout: null,
        lastGateGenerationDate: null,
        lifts: { 'Squat': { weight: 20, lastCompletedSets: 0, e1rm: 0 }, 'Bench Press': { weight: 20, lastCompletedSets: 0, e1rm: 0 }, 'Barbell Row': { weight: 20, lastCompletedSets: 0, e1rm: 0 }, 'Overhead Press': { weight: 20, lastCompletedSets: 0, e1rm: 0 }, 'Deadlift': { weight: 30, lastCompletedSets: 0, e1rm: 0 }, 'Incline DB Press': { weight: 10, lastCompletedSets: 0 }, 'Tricep Pushdown': { weight: 15, lastCompletedSets: 0 }, 'Lateral Raise': { weight: 5, lastCompletedSets: 0 }, 'Lat Pulldown': { weight: 30, lastCompletedSets: 0 }, 'Bicep Curl': { weight: 10, lastCompletedSets: 0 }, 'Romanian Deadlift': { weight: 40, lastCompletedSets: 0 }, 'Leg Press': { weight: 50, lastCompletedSets: 0 }, 'Calf Raise': { weight: 40, lastCompletedSets: 0 }, 'Power Clean': { weight: 30, lastCompletedSets: 0 }, 'Kettlebell Swing': { weight: 16, lastCompletedSets: 0 }, 'Box Jump': { height: 24, lastCompletedSets: 0 }, 'Dips': { weight: 0, lastCompletedSets: 0 }, 'Face Pull': { weight: 10, lastCompletedSets: 0 }, 'Leg Curls': { weight: 20, lastCompletedSets: 0 }, },
        achievements: [],
        systemLog: [],
        history: [],
        lastWorkoutSummary: null,
    },

    // Data
    workoutPlan: [ { day: 'Monday', type: 'Push', name: 'Push Day' }, { day: 'Tuesday', type: 'Pull', name: 'Pull Day' }, { day: 'Wednesday', type: 'Legs', name: 'Leg Day' }, { day: 'Thursday', type: 'Push', name: 'Push Day' }, { day: 'Friday', type: 'Pull', name: 'Pull Day' }, { day: 'Saturday', type: 'Legs', name: 'Leg Day' }, { day: 'Sunday', type: 'Rest', name: 'Rest & Recover' }, ],
    workoutPhases: { 1: { name: "Foundational Strength", exercises: { 'Push': [ { name: 'Bench Press', sets: 3, reps: '5-8', xp: 20 }, { name: 'Overhead Press', sets: 3, reps: '5-8', xp: 20 }, { name: 'Incline DB Press', sets: 3, reps: '8-12', xp: 15 }, { name: 'Tricep Pushdown', sets: 3, reps: '8-12', xp: 10 }, { name: 'Lateral Raise', sets: 3, reps: '10-15', xp: 10 }, ], 'Pull': [ { name: 'Barbell Row', sets: 3, reps: '5-8', xp: 20 }, { name: 'Lat Pulldown', sets: 3, reps: '8-12', xp: 15 }, { name: 'Bicep Curl', sets: 3, reps: '8-12', xp: 10 }, ], 'Legs': [ { name: 'Squat', sets: 3, reps: '5-8', xp: 25 }, { name: 'Romanian Deadlift', sets: 3, reps: '8-12', xp: 20 }, { name: 'Leg Press', sets: 3, reps: '8-12', xp: 15 }, { name: 'Calf Raise', sets: 4, reps: '10-15', xp: 10 }, ] } }, 2: { name: "Strength Hypertrophy", exercises: { 'Push': [ { name: 'Bench Press', sets: 4, reps: '4-6', xp: 25 }, { name: 'Overhead Press', sets: 4, reps: '4-6', xp: 25 }, { name: 'Incline DB Press', sets: 3, reps: '8-10', xp: 15 }, { name: 'Tricep Pushdown', sets: 4, reps: '8-10', xp: 10 }, { name: 'Lateral Raise', sets: 4, reps: '10-15', xp: 10 }, ], 'Pull': [ { name: 'Deadlift', sets: 1, reps: '3-5', xp: 35 }, { name: 'Barbell Row', sets: 4, reps: '6-8', xp: 20 }, { name: 'Lat Pulldown', sets: 4, reps: '8-10', xp: 15 }, { name: 'Bicep Curl', sets: 4, reps: '8-10', xp: 10 }, ], 'Legs': [ { name: 'Squat', sets: 4, reps: '4-6', xp: 30 }, { name: 'Romanian Deadlift', sets: 3, reps: '8-10', xp: 20 }, { name: 'Leg Press', sets: 4, reps: '10-12', xp: 15 }, { name: 'Calf Raise', sets: 5, reps: '10-15', xp: 10 }, ] } }, 3: { name: "Power & Athleticism", exercises: { 'Push': [ { name: 'Overhead Press', sets: 5, reps: '3-5', xp: 30 }, { name: 'Power Clean', sets: 5, reps: '3-5', xp: 35 }, { name: 'Incline DB Press', sets: 3, reps: '6-8', xp: 20 }, { name: 'Dips', sets: 3, reps: '8-12', xp: 15 }, { name: 'Lateral Raise', sets: 4, reps: '10-15', xp: 10 }, ], 'Pull': [ { name: 'Barbell Row', sets: 5, reps: '3-5', xp: 30 }, { name: 'Kettlebell Swing', sets: 4, reps: '8-12', xp: 25 }, { name: 'Lat Pulldown', sets: 3, reps: '8-10', xp: 15 }, { name: 'Face Pull', sets: 3, reps: '12-15', xp: 10 }, ], 'Legs': [ { name: 'Squat', sets: 5, reps: '3-5', xp: 35 }, { name: 'Box Jump', sets: 5, reps: '5-8', xp: 30 }, { name: 'Romanian Deadlift', sets: 3, reps: '6-8', xp: 20 }, { name: 'Leg Press', sets: 3, reps: '10-12', xp: 15 }, ] } }, 4: { name: "Peak Strength & Specialization", exercises: { 'Push': [ { name: 'Bench Press', sets: 3, reps: '5/3/1', xp: 40, scheme: '5/3/1' }, { name: 'Overhead Press', sets: 3, reps: '8-12', xp: 20 }, { name: 'Incline DB Press', sets: 3, reps: '8-12', xp: 15 }, { name: 'Tricep Pushdown', sets: 3, reps: '10-15', xp: 10, accessory: true }, { name: 'Lateral Raise', sets: 3, reps: '10-15', xp: 10, accessory: true }, ], 'Pull': [ { name: 'Deadlift', sets: 3, reps: '5/3/1', xp: 50, scheme: '5/3/1' }, { name: 'Barbell Row', sets: 3, reps: '8-12', xp: 20 }, { name: 'Lat Pulldown', sets: 3, reps: '8-12', xp: 15 }, { name: 'Bicep Curl', sets: 3, reps: '10-15', xp: 10, accessory: true }, { name: 'Face Pull', sets: 3, reps: '12-15', xp: 10, accessory: true }, ], 'Legs': [ { name: 'Squat', sets: 3, reps: '5/3/1', xp: 45, scheme: '5/3/1' }, { name: 'Leg Press', sets: 3, reps: '8-12', xp: 20 }, { name: 'Romanian Deadlift', sets: 3, reps: '8-12', xp: 20 }, { name: 'Leg Curls', sets: 3, reps: '10-15', xp: 10, accessory: true }, { name: 'Calf Raise', sets: 4, reps: '15-20', xp: 10, accessory: true }, ] } } },
    titlesData: [ { level: 1, title: 'The Weakest' }, { level: 5, title: 'Demon Hunter' }, { level: 10, title: 'Knight Killer' }, { level: 20, title: 'Elite Knight' }, { level: 30, title: 'Commander' }, { level: 50, title: 'Monarch' }, ],
    achievementsData: [ { id: 'level_15', name: 'Elite Hunter', description: 'Reach Level 15.', condition: (s) => s.level >= 15, icon: 'fa-dragon' }, { id: 'level_40', name: 'Commander Class', description: 'Reach Level 40.', condition: (s) => s.level >= 40, icon: 'fa-chess-knight' }, { id: 'level_75', name: 'Marshal Grade', description: 'Reach Level 75.', condition: (s) => s.level >= 75, icon: 'fa-star' }, { id: 'level_100', name: 'Monarch', description: 'Reach Level 100.', condition: (s) => s.level >= 100, icon: 'fa-crown' }, { id: 'level_150', name: 'The Pinnacle', description: 'Reach Level 150.', condition: (s) => s.level >= 150, icon: 'fa-mountain-sun' }, { id: 'squat_100', name: 'The Foundation', description: 'Squat 100kg.', condition: (s) => s.lifts['Squat'].weight >= 100, icon: 'fa-mountain' }, { id: 'squat_140', name: 'Beast of the Deep', description: 'Squat 140kg.', condition: (s) => s.lifts['Squat'].weight >= 140, icon: 'fa-gavel' }, { id: 'squat_180', name: 'Earthshaker', description: 'Squat 180kg.', condition: (s) => s.lifts['Squat'].weight >= 180, icon: 'fa-diamond' }, { id: 'bench_100', name: 'The Centurion', description: 'Bench Press 100kg.', condition: (s) => s.lifts['Bench Press'].weight >= 100, icon: 'fa-gem' }, { id: 'bench_120', name: 'Titan\'s Chest', description: 'Bench Press 120kg.', condition: (s) => s.lifts['Bench Press'].weight >= 120, icon: 'fa-shield-heart' }, { id: 'deadlift_140', name: 'Gravity Master', description: 'Deadlift 140kg.', condition: (s) => s.lifts['Deadlift'].weight >= 140, icon: 'fa-globe' }, { id: 'deadlift_180', name: 'World Breaker', description: 'Deadlift 180kg.', condition: (s) => s.lifts['Deadlift'].weight >= 180, icon: 'fa-rocket' }, { id: 'deadlift_220', name: 'The Unmovable', description: 'Deadlift 220kg.', condition: (s) => s.lifts['Deadlift'].weight >= 220, icon: 'fa-anchor-circle-exclamation' }, { id: 'ohp_80', name: 'Skyward Press', description: 'Overhead Press 80kg.', condition: (s) => s.lifts['Overhead Press'].weight >= 80, icon: 'fa-arrow-up-from-ground-water' }, { id: 'streak_30', name: 'Iron Will', description: 'Maintain a 30-day workout streak.', condition: (s) => s.streak >= 30, icon: 'fa-fire' }, { id: 'streak_100', name: 'Unbreakable', description: 'Maintain a 100-day workout streak.', condition: (s) => s.streak >= 100, icon: 'fa-fire-flame-curved' }, { id: 'streak_365', name: 'Legend', description: 'Maintain a 365-day workout streak.', condition: (s) => s.streak >= 365, icon: 'fa-infinity' }, { id: 'workouts_100', name: 'Veteran Hunter', description: 'Complete 100 total workouts.', condition: (s) => s.workoutsCompleted >= 100, icon: 'fa-shield-halved' }, { id: 'workouts_500', name: 'Shadow General', description: 'Complete 500 total workouts.', condition: (s) => s.workoutsCompleted >= 500, icon: 'fa-user-astronaut' }, { id: 'gates_50', name: 'Gatekeeper', description: 'Clear 50 Gates.', condition: (s) => s.gatesCleared >= 50, icon: 'fa-dungeon' }, { id: 's_rank_gate', name: 'S-Rank Hunter', description: 'Clear your first S-Rank Gate.', condition: (s) => s.sRanksCleared >= 1, icon: 'fa-skull-crossbones' }, { id: 's_rank_10', name: 'National Level', description: 'Clear 10 S-Rank Gates.', condition: (s) => s.sRanksCleared >= 10, icon: 'fa-trophy' }, { id: 'phase_3', name: 'Power Awakened', description: 'Advance to Workout Phase III.', condition: (s) => s.week >= 25, icon: 'fa-bolt' }, { id: 'phase_4', name: 'Peak Condition', description: 'Advance to Workout Phase IV.', condition: (s) => s.week >= 37, icon: 'fa-bolt-lightning' }, { id: 'year_one', name: 'Survivor', description: 'Complete one full year of training.', condition: (s) => s.week >= 52, icon: 'fa-calendar-check' } ],
    gatesData: { 'E': [ { id: 'e_squats', description: 'Perform 20 bodyweight squats.', xp: 10, mana: 5 }, { id: 'e_hydration', description: 'Hydration Check: Log that you drank 2L of water today.', xp: 5, mana: 0 } ], 'D': [ { id: 'd_lunges', description: 'Perform 40 walking lunges.', xp: 20, mana: 10 }, { id: 'd_cardio', description: 'Cardio Burst: Complete 10 minutes of high-intensity cardio (running, jump rope).', xp: 25, mana: 5 } ], 'C': [ { id: 'c_plank', description: 'Hold a plank for a total of 3 minutes.', xp: 30, mana: 15 }, { id: 'c_time_attack', description: 'Time Attack: Complete your first 3 exercises in under 20 minutes.', xp: 40, mana: 20, requiresWorkout: true } ], 'B': [ { id: 'b_amrap', description: 'On your last set of the main lift, perform As Many Reps As Possible (AMRAP).', xp: 50, mana: 25, requiresWorkout: true }, { id: 'b_technique', description: 'Technique Focus: Record a video of your main lift and review your form.', xp: 60, mana: 30, requiresWorkout: true } ], 'A': [ { id: 'a_slow_negative', description: 'Complete your final set of your main lift with a 10-second slow negative.', xp: 75, mana: 50, requiresWorkout: true }, { id: 'a_red_gate', description: 'Red Gate: Perform your entire workout with no more than 60 seconds of rest between sets.', xp: 100, mana: 60, requiresWorkout: true } ], 'S': [ { id: 's_100_pushups', description: 'Complete your entire workout, then perform 100 push-ups.', xp: 200, mana: 100, requiresWorkout: true, canDropKey: true }, { id: 's_monarch_shadow', description: "The Monarch's Shadow: Complete your workout, then perform 50 pull-ups (can be broken into sets).", xp: 250, mana: 120, requiresWorkout: true, canDropKey: true } ] },

    // Methods
    generateGate(forceHighRank = false) {
        this.state.lastGateGenerationDate = new Date().toISOString().split('T')[0];
        if (!forceHighRank && Math.random() > 0.5) { this.state.gate = null; this.saveState(); if (forceHighRank) return null; return; }
        const rand = Math.random() * 100;
        let rank;
        if (forceHighRank) { rank = Math.random() < 0.8 ? 'A' : 'S'; }
        else { if (rand < 60) rank = 'E'; else if (rand < 80) rank = 'D'; else if (rand < 90) rank = 'C'; else if (rand < 95) rank = 'B'; else if (rand < 98) rank = 'A'; else rank = 'S'; }
        let selectedGate = null;
        if (this.gatesData[rank] && this.gatesData[rank].length > 0) { const gatePool = this.gatesData[rank]; selectedGate = { ...gatePool[Math.floor(Math.random() * gatePool.length)] }; selectedGate.rank = rank; }
        if (forceHighRank) { return selectedGate; }
        this.state.gate = selectedGate;
        this.saveState();
    },

    async init() {
        if (this.state.initialized) return; // Prevent re-initializing

        try {
            await this.loadState();
        } catch (e) {
            console.error("Failed to load state from Firestore, continuing with default state.", e);
        }
        this.initSounds();
        this.loadCustomAvatar();
        const today = new Date().toISOString().split('T')[0];
        if (this.state.lastGateGenerationDate !== today) { this.generateGate(); }
        const dayOfWeek = new Date().getDay();
        this.state.currentDayIndex = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        document.querySelectorAll('.nav-btn').forEach(btn => { btn.addEventListener('click', () => this.showPage(btn.dataset.page)); });
        document.getElementById('preview-quest-btn').addEventListener('click', () => this.previewQuest());
        document.getElementById('begin-quest-btn').addEventListener('click', () => this.confirmBeginQuest());
        document.getElementById('edit-name-btn').addEventListener('click', () => this.editPlayerName());
        document.getElementById('architect-add-exercise-btn').addEventListener('click', () => this.architectAddExercise());
        document.getElementById('architect-save-routine-btn').addEventListener('click', () => this.architectSaveRoutine());
        document.getElementById('trigger-deload-btn').addEventListener('click', () => this.confirmDeload());
        document.getElementById('delete-account-btn').addEventListener('click', () => this.confirmDelete());
        document.getElementById('export-data-btn').addEventListener('click', () => this.exportData());
        document.getElementById('import-data-btn').addEventListener('click', () => document.getElementById('import-file-input').click());
        document.getElementById('import-file-input').addEventListener('change', (e) => this.importData(e));
        document.getElementById('app').addEventListener('click', (e) => { if (e.target && e.target.id === 'gate-complete-btn') { this.completeGateChallenge(); } });
        window.addEventListener('storage', (event) => { if (event.key === 'dungeonCompletionData') { const newState = JSON.parse(event.newValue); if (newState) { this.state = newState; this.saveState(); this.render(); this.showToast('Dungeon cleared! Progress has been saved.', 'success'); localStorage.removeItem('dungeonCompletionData'); } } });
        this.setupAvatarUpload();
        this.getMotivationalQuote();
        this.render();
        this.state.initialized = true; // Set the flag at the end
    },

    initSounds() {
        this.sounds = {
            setComplete: new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 } }).toDestination(),
            levelUp: new Tone.PolySynth(Tone.Synth).toDestination(),
            achievement: new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.2 } }).toDestination(),
            itemUse: new Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0 } }).toDestination()
        };
    },

    playSound(soundName, note, duration = '8n') {
        if (!this.sounds || !this.sounds[soundName]) return;
        Tone.start();
        try {
            if (soundName === 'levelUp') { const now = Tone.now(); this.sounds.levelUp.triggerAttackRelease("C4", "8n", now); this.sounds.levelUp.triggerAttackRelease("E4", "8n", now + 0.1); this.sounds.levelUp.triggerAttackRelease("G4", "8n", now + 0.2); this.sounds.levelUp.triggerAttackRelease("C5", "8n", now + 0.3); }
            else { this.sounds[soundName].triggerAttackRelease(note, duration); }
        } catch (e) { console.error(`Error playing sound ${soundName}:`, e); }
    },

    async saveState() {
        if (!this.user) return;
        try { const userDocRef = doc(this.db, "users", this.user.uid); await setDoc(userDocRef, this.state); }
        catch (error) { console.error("Error saving state to Firestore:", error); this.showToast('Error saving progress to the cloud.', 'error'); }
    },

    async loadState() {
        if (!this.user) return;
        const userDocRef = doc(this.db, "users", this.user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) { const loadedState = docSnap.data(); this.state = { ...this.state, ...loadedState }; }
        else { console.log("No such document! Creating initial state."); this.state.playerName = this.user.displayName || 'Hunter'; await this.saveState(); }
    },

    showPage(pageId) {
        this.state.currentPage = pageId;
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(`${pageId}-page`).classList.add('active');
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.nav-btn[data-page="${pageId}"]`).classList.add('active');
        this.saveState();
        this.render();
    },

    render() {
        this.renderPlayerStats();
        this.renderInventory();
        if (this.state.currentPage === 'workout') this.renderWorkout();
        if (this.state.currentPage === 'dashboard') this.renderDashboard();
        if (this.state.currentPage === 'calendar') this.renderCalendar();
        if (this.state.currentPage === 'log') this.renderSystemLog();
        if (this.state.currentPage === 'architect') this.renderArchitect();
    },

    renderInventory() { /* ... content from original script ... */ },
    renderArchitect() { /* ... content from original script ... */ },
    architectAddExercise() { /* ... content from original script ... */ },
    architectSaveRoutine() { /* ... content from original script ... */ },
    startCustomWorkout(routineId) { /* ... content from original script ... */ },
    deleteCustomWorkout(routineId) { /* ... content from original script ... */ },
    renderWorkout() { /* ... content from original script ... */ },
    completeGateChallenge() { /* ... content from original script ... */ },
    renderSystemLog() { /* ... content from original script ... */ },
    renderPlayerStats() { /* ... content from original script ... */ },
    createExerciseElement(exercise, liftData) { /* ... content from original script ... */ },
    renderDashboard() { /* ... content from original script ... */ },
    renderProgressChart() { /* ... content from original script ... */ },
    renderWeightChart(liftName) { /* ... content from original script ... */ },
    renderVolumeChart(liftName) { /* ... content from original script ... */ },
    renderCalendar() { /* ... content from original script ... */ },
    async getMotivationalQuote() { /* ... content from original script ... */ },
    previewQuest() { /* ... content from original script ... */ },
    confirmBeginQuest() { /* ... content from original script ... */ },
    addXp(amount) { /* ... content from original script ... */ },
    triggerLevelUpAnimation() { /* ... content from original script ... */ },
    updateTitle() { /* ... content from original script ... */ },
    updateStreak() { /* ... content from original script ... */ },
    progressLifts() { /* ... content from original script ... */ },
    checkAchievements() { /* ... content from original script ... */ },
    editPlayerName() { /* ... content from original script ... */ },
    showModal(title, body, actions) { /* ... content from original script ... */ },
    hideModal() { /* ... content from original script ... */ },
    getPhaseForWeek(week) { /* ... content from original script ... */ },
    calculate1RM(weight, reps) { /* ... content from original script ... */ },
    updateMana(amount) { /* ... content from original script ... */ },
    addItemToInventory(itemId, quantity) { /* ... content from original script ... */ },
    confirmUseItem(itemId) { /* ... content from original script ... */ },
    useItem(itemId) { /* ... content from original script ... */ },
    showToast(message, type = 'info') { /* ... content from original script ... */ },
    confirmDeload() { /* ... content from original script ... */ },
    triggerDeload() { /* ... content from original script ... */ },
    confirmDelete() { /* ... content from original script ... */ },
    async deleteAccount() { /* ... content from original script ... */ },
    exportData() { /* ... content from original script ... */ },
    importData(event) { /* ... content from original script ... */ },
    loadCustomAvatar() { /* ... content from original script ... */ },
    setupAvatarUpload() { /* ... content from original script ... */ },
};

// --- Firebase Initialization and Auth Logic ---
const firebaseConfig = { apiKey: "AIzaSyAK5DS4dixAQWwJ8kms2JiKr738PPKFdA4", authDomain: "shadowmonarch-f4a17.firebaseapp.com", projectId: "shadowmonarch-f4a17", storageBucket: "shadowmonarch-f4a17.firebasestorage.app", messagingSenderId: "524012291883", appId: "1:524012291883:web:be243162b1c0912090276e", measurementId: "G-6EVHJ6EDPJ" };
const firebaseApp = initializeApp(firebaseConfig);
const analytics = getAnalytics(firebaseApp);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();

onAuthStateChanged(auth, (user) => {
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');

    if (user) {
        // User is signed in.
        app.user = user;
        app.db = db;

        // IMPORTANT: Make the app visible FIRST
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');

        // THEN, initialize the app to attach event listeners
        app.init();

    } else {
        // User is signed out.
        loginScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
        app.state.initialized = false; // Reset flag on logout
    }
});
