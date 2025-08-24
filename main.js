// --- IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- FIREBASE CONFIG ---
const firebaseConfig = {
    apiKey: "AIzaSyAK5DS4dixAQWwJ8kms2JiKr738PPKFdA4",
    authDomain: "shadowmonarch-f4a17.firebaseapp.com",
    projectId: "shadowmonarch-f4a17",
    storageBucket: "shadowmonarch-f4a17.firebasestorage.app",
    messagingSenderId: "524012291883",
    appId: "1:524012291883:web:be243162b1c0912090276e",
    measurementId: "G-6EVHJ6EDPJ"
};

// --- FIREBASE INITIALIZATION ---
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const provider = new GoogleAuthProvider();

// --- DOM ELEMENTS ---
const loginScreen = document.getElementById('login-screen');
const appContent = document.getElementById('app-content');
const loginBtn = document.getElementById('login-btn');
const pageContent = document.getElementById('page-content');

// --- APP OBJECT ---
const app = {
    // STATE: All dynamic data for the application
    state: {
        user: null,
        isInitialized: false,
        currentPage: 'dashboard',
        playerName: 'Hunter',
        customAvatar: null,
        customWorkouts: [],
        currentCustomWorkout: null, // e.g., { name: 'My Routine', exercises: [{name: 'Squat', sets: 3, reps: '5-8'}] }
    },

    masterExerciseList: [
        'Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row',
        'Romanian Deadlift', 'Front Squat', 'Good Morning', 'Hip Thrust',
        'Dumbbell Bench Press', 'Incline DB Press', 'Dumbbell Row', 'Goblet Squat',
        'Bulgarian Split Squat', 'Dumbbell Shoulder Press', 'Lateral Raise',
        'Dumbbell Curl', 'Hammer Curl', 'Tricep Skullcrusher', 'Dumbbell Fly',
        'Lat Pulldown', 'Cable Row', 'Tricep Pushdown', 'Cable Crossover',
        'Leg Press', 'Leg Extension', 'Hamstring Curl', 'Calf Raise',
        'Pec Deck', 'Machine Shoulder Press',
        'Pull-up', 'Chin-up', 'Dip', 'Push-up', 'Plank', 'Lunge'
    ],

    // INIT: Called once after login to setup the app
    async init() {
        if (this.state.isInitialized) return;
        console.log('App initializing...');

        await this.loadData();
        this.render();
        this.bindEvents();

        this.state.isInitialized = true;
        console.log('App initialized successfully.');
    },

    // BIND EVENTS: Central function to attach all event listeners
    bindEvents() {
        console.log('Binding events...');

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.currentPage = btn.dataset.page;
                this.render();
            });
        });

        // Event Delegation for dynamic content
        pageContent.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'avatar-container') {
                document.getElementById('avatar-upload-input').click();
            }
            if (e.target && e.target.id === 'edit-name-btn') {
                this.editPlayerName();
            }
            if (e.target && e.target.id === 'add-exercise-btn') {
                this.addExerciseToRoutine();
            }
            if (e.target && e.target.id === 'save-routine-btn') {
                this.saveCurrentRoutine();
            }
            if (e.target && e.target.id === 'new-routine-btn') {
                this.startNewRoutine();
            }
        });

        pageContent.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'avatar-upload-input') {
                this.handleAvatarUpload(e);
            }
        });
    },

    // RENDER: Main render function to update the UI
    render() {
        console.log(`Rendering page: ${this.state.currentPage}`);

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.page === this.state.currentPage);
        });

        if (this.state.currentPage === 'dashboard') {
            this.renderDashboard();
        } else if (this.state.currentPage === 'architect') {
            this.renderArchitect();
        }
    },

    renderDashboard() {
        const avatarSrc = this.state.customAvatar || 'https://i.ibb.co/6n20s2v/avatar-placeholder.png';
        pageContent.innerHTML = `
            <div class="text-center">
                <div id="avatar-container" class="relative w-40 h-40 mx-auto mb-4 cursor-pointer group">
                    <img id="dashboard-avatar-img" src="${avatarSrc}" alt="Player Avatar" class="w-full h-full rounded-full object-cover border-4 border-indigo-500">
                    <div class="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <i class="fas fa-camera text-white text-2xl"></i>
                    </div>
                </div>
                <input type="file" id="avatar-upload-input" class="hidden" accept="image/*">
                <h2 id="dashboard-player-name" class="text-3xl font-bold">${this.state.playerName}</h2>
                <button id="edit-name-btn" class="text-sm text-gray-400 hover:text-white mt-1">
                    <i class="fas fa-pencil-alt mr-1"></i> Edit Name
                </button>
            </div>
        `;
    },

    renderArchitect() {
        let content = `
            <h2 class="text-2xl font-bold mb-4">Workout Architect</h2>
            <div class="bg-gray-800 p-6 rounded-lg">
        `;

        if (this.state.currentCustomWorkout) {
            content += `
                <h3 class="text-xl font-bold mb-2">${this.state.currentCustomWorkout.name}</h3>
                <div id="exercise-list" class="space-y-2 mb-4">
                    ${this.state.currentCustomWorkout.exercises.map(ex => `
                        <div class="bg-gray-700 p-2 rounded">${ex.name} - ${ex.sets} sets x ${ex.reps} reps</div>
                    `).join('')}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select id="architect-exercise-select" class="bg-gray-700 p-2 rounded"></select>
                    <input id="architect-sets-input" type="number" placeholder="Sets" class="bg-gray-700 p-2 rounded">
                    <input id="architect-reps-input" type="text" placeholder="Reps" class="bg-gray-700 p-2 rounded">
                </div>
                <button id="add-exercise-btn" class="bg-indigo-600 hover:bg-indigo-700 w-full py-2 rounded mt-4">Add Exercise</button>
                <button id="save-routine-btn" class="bg-green-600 hover:bg-green-700 w-full py-2 rounded mt-2">Save Routine</button>
            `;
            this.populateExerciseDropdown();
        } else {
            content += `
                <p class="mb-2">Enter a name for your new routine:</p>
                <input id="new-routine-name-input" type="text" placeholder="e.g., 'Push Day Hypertrophy'" class="bg-gray-700 p-2 rounded w-full mb-4">
                <button id="new-routine-btn" class="bg-indigo-600 hover:bg-indigo-700 w-full py-2 rounded">Create New Routine</button>
            `;
        }

        content += '</div>';
        pageContent.innerHTML = content;
    },

    // FIRESTORE: Functions for data persistence
    async loadData() {
        console.log('Loading data from Firestore...');
        const docRef = doc(db, "users", this.state.user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            this.state = { ...this.state, ...data, user: this.state.user, isInitialized: this.state.isInitialized };
            console.log("User data loaded");
        } else {
            console.log("No such document! Creating initial user data.");
            this.state.playerName = this.state.user.displayName || 'Hunter';
            await this.saveData();
        }
    },

    async saveData() {
        console.log('Saving data to Firestore...');
        const dataToSave = {
            playerName: this.state.playerName,
            customAvatar: this.state.customAvatar,
            customWorkouts: this.state.customWorkouts,
        };
        await setDoc(doc(db, "users", this.state.user.uid), dataToSave, { merge: true });
        console.log("Data saved.");
    },

    // ACTION FUNCTIONS
    editPlayerName() {
        const newName = prompt("Enter your new name:", this.state.playerName);
        if (newName && newName.trim() !== '') {
            this.state.playerName = newName.trim();
            this.render();
            this.saveData();
        }
    },

    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.customAvatar = e.target.result;
            this.render();
            this.saveData();
        };
        reader.readAsDataURL(file);
    },

    startNewRoutine() {
        const input = document.getElementById('new-routine-name-input');
        const routineName = input.value.trim();
        if (!routineName) {
            alert('Please enter a name for your new routine.');
            return;
        }
        this.state.currentCustomWorkout = {
            id: `custom_${Date.now()}`,
            name: routineName,
            exercises: []
        };
        this.render();
    },

    populateExerciseDropdown() {
        // This is called right after innerHTML is set in renderArchitect
        const selectEl = document.getElementById('architect-exercise-select');
        if (!selectEl) return;
        selectEl.innerHTML = '<option value="" disabled selected>Select an exercise...</option>';
        this.masterExerciseList.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = exercise;
            selectEl.appendChild(option);
        });
    },

    addExerciseToRoutine() {
        const selectEl = document.getElementById('architect-exercise-select');
        const setsEl = document.getElementById('architect-sets-input');
        const repsEl = document.getElementById('architect-reps-input');

        const newExercise = {
            name: selectEl.value,
            sets: setsEl.value || 3,
            reps: repsEl.value || '8-12'
        };

        if (!newExercise.name) {
            alert('Please select an exercise from the dropdown.');
            return;
        }

        this.state.currentCustomWorkout.exercises.push(newExercise);
        this.render();
    },

    saveCurrentRoutine() {
        if (!this.state.currentCustomWorkout || this.state.currentCustomWorkout.exercises.length === 0) {
            alert('Please add at least one exercise before saving.');
            return;
        }

        // Check if a routine with the same id already exists and update it, otherwise add it.
        const existingIndex = this.state.customWorkouts.findIndex(w => w.id === this.state.currentCustomWorkout.id);
        if (existingIndex > -1) {
            this.state.customWorkouts[existingIndex] = this.state.currentCustomWorkout;
        } else {
            this.state.customWorkouts.push(this.state.currentCustomWorkout);
        }

        this.state.currentCustomWorkout = null;
        this.saveData();
        this.render();
        alert('Routine saved successfully!');
    }
};

// --- AUTHENTICATION LISTENER ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('User signed in:', user.uid);
        app.state.user = user;
        loginScreen.classList.add('hidden');
        appContent.classList.remove('hidden');
        app.init();
    } else {
        console.log('User signed out.');
        app.state.user = null;
        app.state.isInitialized = false;
        loginScreen.classList.remove('hidden');
        appContent.classList.add('hidden');
    }
});

// Initial event listener for the login button
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch((error) => {
        console.error("Authentication failed:", error);
        alert("Login failed. Please try again.");
    });
});
