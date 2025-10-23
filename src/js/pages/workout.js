export function initWorkout(app) {
    return {
        render() {
            return `
                <div class="workout-container">
                    <!-- Daily Workout Header -->
                    <div class="card-bg p-6 rounded-lg text-center mb-6">
                        <h2 class="text-3xl font-bold mb-2">Daily Quest</h2>
                        <div id="workout-day-info" class="mb-4">
                            <p id="workout-day-title" class="text-2xl text-indigo-400 font-semibold mb-2">Loading...</p>
                            <p id="workout-day-subtitle" class="text-gray-400">Preparing your training session...</p>
                        </div>
                        <div id="workout-actions" class="flex gap-4 justify-center">
                            <div class="text-gray-400">Loading workout...</div>
                        </div>
                    </div>

                    <!-- Workout Progress Indicator -->
                    <div id="workout-progress" class="card-bg p-4 rounded-lg mb-6 hidden">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm text-gray-400">Workout Progress</span>
                            <span id="progress-text" class="text-sm text-indigo-400">0 of 6 exercises completed</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div id="progress-bar" class="bg-indigo-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                        </div>
                    </div>

                    <!-- Exercise Selection Grid -->
                    <div id="exercise-selection" class="card-bg p-6 rounded-lg mb-6 hidden">
                        <h3 class="text-xl font-bold mb-4">Choose Your Next Exercise</h3>
                        <div id="exercise-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <!-- Exercise cards will be populated here -->
                        </div>
                    </div>

                    <!-- Previous Session Data -->
                    <div id="previous-session" class="card-bg p-4 rounded-lg mb-6 hidden">
                        <h3 class="text-lg font-semibold mb-3 text-green-400">📊 Previous Session</h3>
                        <div id="previous-session-data" class="text-sm text-gray-300">
                            <!-- Previous workout data will be displayed here -->
                        </div>
                    </div>
                </div>

                <!-- Workout Execution Overlay -->
                <div id="workout-overlay" class="fixed inset-0 bg-black bg-opacity-95 z-50 hidden">
                    <div class="flex flex-col h-full">
                        <!-- Header -->
                        <div class="flex items-center justify-between p-6 border-b border-gray-700">
                            <div>
                                <h2 id="current-exercise-name" class="text-2xl font-bold">Exercise Name</h2>
                                <p id="current-exercise-progress" class="text-indigo-400">Exercise 1 of 6</p>
                            </div>
                            <div class="flex space-x-2">
                                <button id="back-to-selection-workout-btn" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded">
                                    ← Back to Exercises
                                </button>
                                <button id="pause-workout-btn" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded">
                                    ⏸️ Pause
                                </button>
                            </div>
                        </div>

                        <!-- Main Content -->
                        <div id="workout-content" class="flex-1 overflow-y-auto p-6" style="scroll-behavior: smooth; -webkit-overflow-scrolling: touch; will-change: scroll-position;">
                            <!-- Dynamic workout content -->
                        </div>

                        <!-- Footer Actions -->
                        <div class="p-6 border-t border-gray-700">
                            <div class="flex gap-4 justify-center">
                                <button id="skip-exercise-btn" class="bg-gray-600 hover:bg-gray-500 px-6 py-3 rounded">
                                    Skip Exercise
                                </button>
                                <button id="complete-exercise-btn" class="bg-green-600 hover:bg-green-500 px-8 py-3 rounded text-lg font-semibold" disabled>
                                    Complete Exercise
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rest Timer Overlay -->
                <div id="rest-timer-overlay" class="fixed inset-0 bg-black bg-opacity-90 z-60 hidden flex items-center justify-center">
                    <div class="text-center">
                        <h2 class="text-4xl font-bold mb-4">Rest Period</h2>
                        <div id="rest-timer-display" class="text-8xl font-mono font-bold text-indigo-400 mb-6">01:30</div>
                        <p id="next-exercise-preview" class="text-xl text-gray-300 mb-6">Next: Exercise Name</p>
                        <div class="flex gap-4 justify-center">
                            <button id="skip-rest-btn" class="bg-orange-600 hover:bg-orange-500 px-6 py-3 rounded">
                                Skip Rest
                            </button>
                            <button id="add-rest-time-btn" class="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded">
                                +30s
                            </button>
                        </div>
                    </div>
                </div>
            `;
        },

        init() {
            this.currentWorkoutState = {
                isActive: false,
                selectedExerciseId: null,
                currentSetIndex: 0,
                exercises: [],
                completedExercises: new Set(),
                startTime: null,
                restTimer: null,
                restTimeRemaining: 0
            };
            
            this.setupEventListeners();
            this.updateWorkoutDisplay();
            this.loadPreviousSessionData();
        },

        setupEventListeners() {
            // Remove any existing listeners first
            this.cleanup();
            
            // Store app reference for closures
            const appRef = app;
            const self = this;
            
            // Store references to bound functions for cleanup
            this.clickHandler = (event) => {
                try {
                    if (event.target.id === 'preview-workout-btn') {
                        // Add loading state
                        const btn = event.target;
                        const originalHTML = btn.innerHTML;
                        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading Preview...</span>';
                        btn.disabled = true;
                        
                        // Small delay to show loading state
                        setTimeout(() => {
                            self.previewWorkout();
                            btn.innerHTML = originalHTML;
                            btn.disabled = false;
                        }, 300);
                    } else if (event.target.id === 'start-workout-btn') {
                        self.startWorkout();
                    } else if (event.target.id === 'pause-workout-btn') {
                        self.pauseWorkout();
                    } else if (event.target.id === 'back-to-selection-workout-btn') {
                        self.currentWorkoutState.selectedExerciseId = null;
                        self.showExerciseSelectionInOverlay();
                    } else if (event.target.id === 'skip-exercise-btn') {
                        self.skipExercise();
                    } else if (event.target.id === 'complete-exercise-btn' && !event.target.disabled) {
                        self.completeExercise();
                    } else if (event.target.id === 'skip-rest-btn') {
                        self.skipRest();
                    } else if (event.target.id === 'add-rest-time-btn') {
                        self.addRestTime();
                    } else if (event.target.classList.contains('set-complete-btn')) {
                        const setIndex = parseInt(event.target.dataset.setIndex);
                        if (!isNaN(setIndex)) {
                            self.completeSet(setIndex);
                        }
                    } else if (event.target.classList.contains('weight-input') || event.target.classList.contains('reps-input')) {
                        self.updateSetData(event.target);
                    } else if (event.target.classList.contains('exercise-card-btn')) {
                        const exerciseId = event.target.dataset.exerciseId;
                        if (exerciseId) {
                            self.selectExercise(exerciseId);
                        }
                    } else if (event.target.id === 'finish-workout-btn') {
                        // Exit workout and restore navigation
                        document.getElementById('workout-overlay').classList.add('hidden');
                        self.currentWorkoutState.isActive = false;
                        
                        // Restore navigation elements
                        const appHeader = document.querySelector('.app-header');
                        const appNav = document.querySelector('.app-nav');
                        if (appHeader) appHeader.style.display = '';
                        if (appNav) appNav.style.display = '';
                    }
                } catch (error) {
                    console.error('Error in workout click handler:', error);
                    appRef.modalAlert('An error occurred. Please try again.');
                }
            };

            this.changeHandler = (event) => {
                try {
                    if (event.target.classList.contains('set-checkbox')) {
                        self.checkIfComplete();
                    } else if (event.target.classList.contains('weight-input') || event.target.classList.contains('reps-input')) {
                        self.updateSetData(event.target);
                    }
                } catch (error) {
                    console.error('Error in workout change handler:', error);
                }
            };

            this.inputHandler = (event) => {
                try {
                    if (event.target.classList.contains('weight-input') || event.target.classList.contains('reps-input')) {
                        self.updateSetData(event.target);
                    }
                } catch (error) {
                    console.error('Error in workout input handler:', error);
                }
            };

            // Add event listeners with error handling
            document.addEventListener('click', this.clickHandler);
            document.addEventListener('change', this.changeHandler);
            document.addEventListener('input', this.inputHandler);
        },

        cleanup() {
            // Clear any timers
            if (this.restTimer) {
                clearInterval(this.restTimer);
                this.restTimer = null;
            }

            // Remove event listeners to prevent memory leaks
            if (this.clickHandler) {
                document.removeEventListener('click', this.clickHandler);
                this.clickHandler = null;
            }

            if (this.changeHandler) {
                document.removeEventListener('change', this.changeHandler);
                this.changeHandler = null;
            }

            if (this.inputHandler) {
                document.removeEventListener('input', this.inputHandler);
                this.inputHandler = null;
            }

            // Reset workout state
            if (this.currentWorkoutState) {
                this.currentWorkoutState.isActive = false;
                this.currentWorkoutState.selectedExerciseId = null;
            }
        },

        updateWorkoutDisplay() {
            const workout = this.getCurrentWorkout();
            const isRestDay = !workout;
            
            const titleEl = document.getElementById('workout-day-title');
            const subtitleEl = document.getElementById('workout-day-subtitle');
            const actionsEl = document.getElementById('workout-actions');
            
            if (titleEl && subtitleEl) {
                if (isRestDay) {
                    titleEl.textContent = 'Rest Day';
                    subtitleEl.textContent = 'Recovery and regeneration time';
                } else {
                    titleEl.textContent = workout.name;
                    subtitleEl.textContent = workout.subtitle;
                }
            }
            
            if (actionsEl) {
                if (isRestDay) {
                    actionsEl.innerHTML = `
                        <div class="text-center">
                            <p class="text-gray-400 mb-4">💤 Rest is when you grow stronger</p>
                            <p class="text-sm text-gray-500">Focus on recovery, nutrition, and sleep</p>
                        </div>
                    `;
                } else {
                    const exerciseCount = workout.exercises.length;
                    const estimatedTime = this.calculateWorkoutTime(workout);
                    
                    actionsEl.innerHTML = `
                        <div class="text-center mb-4">
                            <div class="grid grid-cols-2 gap-4 mb-4 max-w-md mx-auto">
                                <div class="bg-gray-800 p-3 rounded">
                                    <div class="text-2xl font-bold text-indigo-400">${exerciseCount}</div>
                                    <div class="text-xs text-gray-400">Exercises</div>
                                </div>
                                <div class="bg-gray-800 p-3 rounded">
                                    <div class="text-2xl font-bold text-green-400">${estimatedTime}</div>
                                    <div class="text-xs text-gray-400">Est. Time</div>
                                </div>
                            </div>
                        </div>
                        <div class="flex gap-4 justify-center">
                            <button id="preview-workout-btn" class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl">
                                <i class="fas fa-eye"></i>
                                <span>Preview Workout</span>
                            </button>
                            <button id="start-workout-btn" class="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 py-3 px-8 rounded-lg font-semibold text-lg text-white transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl">
                                <i class="fas fa-play"></i>
                                <span>Start Workout</span>
                            </button>
                        </div>
                    `;
                }
            }
        },

        calculateWorkoutTime(workout) {
            // Estimate workout time based on exercises, sets, and rest periods
            let totalTime = 0;
            
            workout.exercises.forEach(exercise => {
                const setCount = exercise.sets.length;
                const avgSetTime = 45; // seconds per set
                const restTime = exercise.restTime || 60;
                
                totalTime += (setCount * avgSetTime) + ((setCount - 1) * restTime);
            });
            
            // Add 10 minutes for transitions and setup
            totalTime += 600;
            
            const minutes = Math.round(totalTime / 60);
            return `${minutes}min`;
        },

        loadPreviousSessionData() {
            const workout = this.getCurrentWorkout();
            if (!workout) return;

            // Get previous session data from app state
            const workoutHistory = app.state.workoutHistory || {};
            const workoutKey = workout.name.replace(/\s+/g, '_').toLowerCase();
            const previousSession = workoutHistory[workoutKey];

            if (previousSession && previousSession.exercises) {
                const container = document.getElementById('previous-session');
                const dataContainer = document.getElementById('previous-session-data');
                
                if (container && dataContainer) {
                    container.classList.remove('hidden');
                    
                    let html = '<div class="space-y-2">';
                    previousSession.exercises.forEach((exercise, index) => {
                        if (exercise.completedSets && exercise.completedSets.length > 0) {
                            const lastSet = exercise.completedSets[exercise.completedSets.length - 1];
                            html += `
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-gray-300">${exercise.name}</span>
                                    <span class="text-green-400">${lastSet.weight || 'BW'}kg × ${lastSet.reps}</span>
                                </div>
                            `;
                        }
                    });
                    html += '</div>';
                    
                    dataContainer.innerHTML = html;
                }
            }
        },

        checkIfComplete() {
            const checkboxes = document.querySelectorAll('.set-checkbox');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            const nextBtn = document.getElementById('next-task-btn');
            if (nextBtn) nextBtn.disabled = !allChecked;
        },

        getCurrentWorkout() {
            const today = new Date().getDay();
            const dayIndex = today === 0 ? 6 : today - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
            
            // 5-day program: Day 1-Push, Day 2-Pull, Day 3-Legs, Day 4-Rest, Day 5-Upper Power, Day 6-Conditioning, Day 7-Rest
            const weeklySchedule = [
                'Push',           // Monday (Day 1)
                'Pull',           // Tuesday (Day 2) 
                'Legs',           // Wednesday (Day 3)
                'Rest',           // Thursday (Day 4)
                'Upper Power',    // Friday (Day 5)
                'Conditioning',   // Saturday (Day 6)
                'Rest'            // Sunday (Day 7)
            ];

            const dayType = weeklySchedule[dayIndex];
            if (dayType === 'Rest') return null;

            return this.getWorkoutProgram()[dayType];
        },

        getWorkoutProgram() {
            return {
                'Push': {
                    name: 'Push Day',
                    subtitle: 'Chest, Shoulders, Triceps',
                    exercises: [
                        {
                            name: 'Incline Dumbbell Press',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Focus on controlled movement. Squeeze chest at the top.',
                            muscleGroups: ['Chest', 'Shoulders', 'Triceps']
                        },
                        {
                            name: 'Flat Barbell Bench Press',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Keep shoulder blades retracted. Control the descent.',
                            muscleGroups: ['Chest', 'Shoulders', 'Triceps']
                        },
                        {
                            name: 'Cable Lateral Raises',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Lead with your pinkies. Control the negative.',
                            muscleGroups: ['Shoulders']
                        },
                        {
                            name: 'Seated Dumbbell Shoulder Press',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Press straight up. Keep core tight.',
                            muscleGroups: ['Shoulders', 'Triceps']
                        },
                        {
                            name: 'Tricep Dips',
                            sets: [
                                { reps: 'To Failure', isWarmup: false },
                                { reps: 'To Failure', isWarmup: false },
                                { reps: 'To Failure', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Keep body upright. Full range of motion.',
                            muscleGroups: ['Triceps']
                        },
                        {
                            name: 'Cable Tricep Pushdowns',
                            sets: [
                                { reps: '15-20', isWarmup: false },
                                { reps: '15-20', isWarmup: false },
                                { reps: '15-20', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Keep elbows pinned to sides. Squeeze at the bottom.',
                            muscleGroups: ['Triceps']
                        }
                    ]
                },

                'Pull': {
                    name: 'Pull Day',
                    subtitle: 'Back, Biceps, Forearms',
                    exercises: [
                        {
                            name: 'Pull-Ups',
                            sets: [
                                { reps: 'To Failure', isWarmup: false },
                                { reps: 'To Failure', isWarmup: false },
                                { reps: 'To Failure', isWarmup: false },
                                { reps: 'To Failure', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Full range of motion. Control the descent.',
                            muscleGroups: ['Back', 'Biceps'],
                            alternative: 'Lat Pulldowns (20, 16, 14, 12 reps)'
                        },
                        {
                            name: 'Barbell Rows',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Pull to lower chest. Squeeze shoulder blades.',
                            muscleGroups: ['Back', 'Biceps']
                        },
                        {
                            name: 'Seated Cable Rows',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Keep chest up. Pull to lower ribs.',
                            muscleGroups: ['Back', 'Biceps']
                        },
                        {
                            name: 'Face Pulls',
                            sets: [
                                { reps: '15-20', isWarmup: false },
                                { reps: '15-20', isWarmup: false },
                                { reps: '15-20', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Pull to face level. External rotation at the end.',
                            muscleGroups: ['Rear Delts', 'Upper Back']
                        },
                        {
                            name: 'Barbell Curls',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Keep elbows stationary. Control the negative.',
                            muscleGroups: ['Biceps']
                        },
                        {
                            name: 'Hammer Curls',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Neutral grip. Squeeze at the top.',
                            muscleGroups: ['Biceps', 'Forearms']
                        }
                    ]
                },

                'Legs': {
                    name: 'Leg Day',
                    subtitle: 'Quads, Hamstrings, Glutes, Calves',
                    exercises: [
                        {
                            name: 'Barbell Back Squats',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 120,
                            instructions: 'Depth to parallel or below. Drive through heels.',
                            muscleGroups: ['Quads', 'Glutes', 'Hamstrings']
                        },
                        {
                            name: 'Romanian Deadlifts',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Hinge at hips. Feel the stretch in hamstrings.',
                            muscleGroups: ['Hamstrings', 'Glutes']
                        },
                        {
                            name: 'Leg Press',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Full range of motion. Control the descent.',
                            muscleGroups: ['Quads', 'Glutes']
                        },
                        {
                            name: 'Leg Extensions',
                            sets: [
                                { reps: '15-20', isWarmup: false },
                                { reps: '15-20', isWarmup: false },
                                { reps: '15-20', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Squeeze at the top. Control the negative.',
                            muscleGroups: ['Quads']
                        },
                        {
                            name: 'Seated Hamstring Curls',
                            sets: [
                                { reps: '15-20', isWarmup: false },
                                { reps: '15-20', isWarmup: false },
                                { reps: '15-20', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Full contraction. Control the return.',
                            muscleGroups: ['Hamstrings']
                        },
                        {
                            name: 'Standing Calf Raises',
                            sets: [
                                { reps: '20-25', isWarmup: false },
                                { reps: '20-25', isWarmup: false },
                                { reps: '20-25', isWarmup: false },
                                { reps: '20-25', isWarmup: false },
                                { reps: '20-25', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 45,
                            instructions: 'Full stretch at bottom. Hold contraction at top.',
                            muscleGroups: ['Calves']
                        }
                    ]
                },

                'Upper Power': {
                    name: 'Upper Body Power & Volume',
                    subtitle: 'Power and Volume Training',
                    exercises: [
                        {
                            name: 'Overhead Press (Barbell)',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Press straight up. Keep core tight.',
                            muscleGroups: ['Shoulders', 'Triceps']
                        },
                        {
                            name: 'Weighted Pull-Ups',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Add weight as able. Full range of motion.',
                            muscleGroups: ['Back', 'Biceps'],
                            alternative: 'T-Bar Rows (20, 16, 14, 12 reps)'
                        },
                        {
                            name: 'Machine Chest Press',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 16, isWarmup: false },
                                { reps: 14, isWarmup: false },
                                { reps: 12, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Controlled movement. Full range of motion.',
                            muscleGroups: ['Chest', 'Triceps']
                        },
                        {
                            name: 'Single-Arm Dumbbell Row',
                            sets: [
                                { reps: '12-15', isWarmup: false },
                                { reps: '12-15', isWarmup: false },
                                { reps: '12-15', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Pull to hip. Squeeze at the top. Each arm.',
                            muscleGroups: ['Back', 'Biceps']
                        },
                        {
                            name: 'Incline Dumbbell Curls',
                            sets: [
                                { reps: '12-15', isWarmup: false },
                                { reps: '12-15', isWarmup: false },
                                { reps: '12-15', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Full stretch at bottom. Each arm.',
                            muscleGroups: ['Biceps']
                        },
                        {
                            name: 'Overhead Tricep Extensions',
                            sets: [
                                { reps: '12-15', isWarmup: false },
                                { reps: '12-15', isWarmup: false },
                                { reps: '12-15', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Keep elbows stationary. Full stretch.',
                            muscleGroups: ['Triceps']
                        }
                    ]
                },

                'Conditioning': {
                    name: 'Full Body Stamina & Conditioning',
                    subtitle: 'Metabolic and Conditioning Work',
                    exercises: [
                        {
                            name: 'Kettlebell Swings',
                            sets: [
                                { reps: 20, isWarmup: false },
                                { reps: 20, isWarmup: false },
                                { reps: 20, isWarmup: false },
                                { reps: 20, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Hip hinge movement. Power from hips.',
                            muscleGroups: ['Full Body', 'Cardio']
                        },
                        {
                            name: "Farmer's Walk",
                            sets: [
                                { reps: '45-60s', isWarmup: false },
                                { reps: '45-60s', isWarmup: false },
                                { reps: '45-60s', isWarmup: false },
                                { reps: '45-60s', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Keep shoulders back. Steady pace.',
                            muscleGroups: ['Grip', 'Core', 'Traps']
                        },
                        {
                            name: 'Box Jumps',
                            sets: [
                                { reps: 15, isWarmup: false },
                                { reps: 15, isWarmup: false },
                                { reps: 15, isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 90,
                            instructions: 'Land softly. Step down between reps.',
                            muscleGroups: ['Legs', 'Power'],
                            alternative: 'Squat Jumps (15 reps)'
                        },
                        {
                            name: 'Push-ups',
                            sets: [
                                { reps: 'To Failure', isWarmup: false },
                                { reps: 'To Failure', isWarmup: false },
                                { reps: 'To Failure', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Perfect form. Full range of motion.',
                            muscleGroups: ['Chest', 'Triceps', 'Core']
                        },
                        {
                            name: 'Hanging Leg Raises',
                            sets: [
                                { reps: 'To Failure', isWarmup: false },
                                { reps: 'To Failure', isWarmup: false },
                                { reps: 'To Failure', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 60,
                            instructions: 'Control the movement. Avoid swinging.',
                            muscleGroups: ['Core'],
                            alternative: 'Knee Raises (To Failure)'
                        },
                        {
                            name: 'Battle Ropes',
                            sets: [
                                { reps: '30s on, 30s off', isWarmup: false },
                                { reps: '30s on, 30s off', isWarmup: false },
                                { reps: '30s on, 30s off', isWarmup: false },
                                { reps: '30s on, 30s off', isWarmup: false },
                                { reps: '30s on, 30s off', isWarmup: false, isWorkingSet: true }
                            ],
                            restTime: 30,
                            instructions: 'High intensity. Maintain rhythm.',
                            muscleGroups: ['Full Body', 'Cardio'],
                            alternative: 'Jump Rope (30s on, 30s off)'
                        }
                    ]
                }
            };
        },

        previewWorkout() {
            const workout = this.getCurrentWorkout();
            if (!workout) return;
            
            // Calculate workout statistics
            const totalExercises = workout.exercises.length;
            const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
            const estimatedTime = this.calculateDetailedWorkoutTime(workout);
            const muscleGroups = [...new Set(workout.exercises.flatMap(ex => ex.muscleGroups))];
            
            let html = `
                <div class="workout-preview-container">
                    <!-- Header Section -->
                    <div class="preview-header text-center mb-6 p-6 bg-gradient-to-r from-red-900/30 to-orange-900/30 rounded-xl border border-red-500/20">
                        <div class="flex items-center justify-center mb-3">
                            <div class="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                                <i class="fas fa-dumbbell text-2xl text-white"></i>
                            </div>
                            <div class="text-left">
                                <h3 class="text-2xl font-bold text-white">${workout.name}</h3>
                                <p class="text-red-200">${workout.subtitle}</p>
                            </div>
                        </div>
                        
                        <!-- Workout Stats -->
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div class="bg-black/20 p-3 rounded-lg border border-red-500/20">
                                <div class="text-2xl font-bold text-red-400">${totalExercises}</div>
                                <div class="text-xs text-red-200 uppercase tracking-wide">Exercises</div>
                            </div>
                            <div class="bg-black/20 p-3 rounded-lg border border-orange-500/20">
                                <div class="text-2xl font-bold text-orange-400">${totalSets}</div>
                                <div class="text-xs text-orange-200 uppercase tracking-wide">Total Sets</div>
                            </div>
                            <div class="bg-black/20 p-3 rounded-lg border border-yellow-500/20">
                                <div class="text-2xl font-bold text-yellow-400">${estimatedTime.total}min</div>
                                <div class="text-xs text-yellow-200 uppercase tracking-wide">Est. Time</div>
                            </div>
                            <div class="bg-black/20 p-3 rounded-lg border border-red-500/20">
                                <div class="text-2xl font-bold text-red-400">${muscleGroups.length}</div>
                                <div class="text-xs text-red-200 uppercase tracking-wide">Muscle Groups</div>
                            </div>
                        </div>
                        
                        <!-- Muscle Groups -->
                        <div class="mt-4">
                            <div class="text-sm text-red-200 mb-2">Target Muscles:</div>
                            <div class="flex flex-wrap gap-2 justify-center">
                                ${muscleGroups.map(group => `
                                    <span class="px-3 py-1 bg-red-500/20 text-red-200 rounded-full text-xs border border-red-500/30">
                                        ${group}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Exercise List -->
                    <div class="exercise-list space-y-3 max-h-96 overflow-y-auto pr-2">
                        ${workout.exercises.map((exercise, index) => {
                            const setInfo = exercise.sets.map((set, setIndex) => {
                                const reps = typeof set.reps === 'string' ? set.reps : `${set.reps} reps`;
                                const isWorkingSet = set.isWorkingSet;
                                return `<span class="set-info ${isWorkingSet ? 'working-set' : ''}">${reps}</span>`;
                            }).join('');
                            
                            const restMinutes = Math.floor(exercise.restTime / 60);
                            const restSeconds = exercise.restTime % 60;
                            const restDisplay = restMinutes > 0 ? `${restMinutes}:${restSeconds.toString().padStart(2, '0')}` : `${exercise.restTime}s`;
                            
                            return `
                                <div class="exercise-card p-4 bg-gradient-to-r from-gray-800/80 to-gray-900/80 rounded-xl border border-gray-700/50 hover:border-red-500/30 transition-all duration-200">
                                    <div class="flex items-start justify-between mb-3">
                                        <div class="flex items-center">
                                            <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mr-3 text-white font-bold text-sm">
                                                ${index + 1}
                                            </div>
                                            <div>
                                                <h4 class="font-semibold text-white text-lg">${exercise.name}</h4>
                                                <div class="text-sm text-gray-400">${exercise.muscleGroups.join(' • ')}</div>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-xs text-red-400 font-medium">
                                                <i class="fas fa-clock mr-1"></i>${restDisplay} rest
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Sets Display -->
                                    <div class="sets-container mb-3">
                                        <div class="text-sm text-gray-300 mb-2">
                                            <span class="font-medium">${exercise.sets.length} sets:</span>
                                            <div class="flex flex-wrap gap-1 mt-1">
                                                ${setInfo}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Instructions -->
                                    <div class="instructions p-3 bg-black/20 rounded-lg border border-gray-700/30">
                                        <div class="text-xs text-gray-400 mb-1">
                                            <i class="fas fa-info-circle mr-1"></i>Instructions:
                                        </div>
                                        <div class="text-sm text-gray-300">${exercise.instructions}</div>
                                    </div>
                                    
                                    ${exercise.alternative ? `
                                        <div class="alternative mt-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                            <div class="text-xs text-yellow-400">
                                                <i class="fas fa-exchange-alt mr-1"></i>Alternative: ${exercise.alternative}
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Time Breakdown -->
                    <div class="time-breakdown mt-6 p-4 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl border border-blue-500/20">
                        <h4 class="text-lg font-semibold text-blue-300 mb-3">
                            <i class="fas fa-stopwatch mr-2"></i>Time Breakdown
                        </h4>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div class="text-center">
                                <div class="text-blue-400 font-bold">${estimatedTime.working}min</div>
                                <div class="text-blue-200 text-xs">Working Time</div>
                            </div>
                            <div class="text-center">
                                <div class="text-indigo-400 font-bold">${estimatedTime.rest}min</div>
                                <div class="text-indigo-200 text-xs">Rest Time</div>
                            </div>
                            <div class="text-center">
                                <div class="text-purple-400 font-bold">${estimatedTime.setup}min</div>
                                <div class="text-purple-200 text-xs">Setup Time</div>
                            </div>
                            <div class="text-center">
                                <div class="text-blue-400 font-bold">${estimatedTime.total}min</div>
                                <div class="text-blue-200 text-xs">Total Time</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            const instance = app.showModal({
                title: 'Workout Preview',
                html,
                size: 'large',
                actions: [
                    { 
                        label: 'Close', 
                        onClick: () => instance.close(),
                        className: 'bg-gray-600 hover:bg-gray-500'
                    },
                    { 
                        label: 'Start Workout', 
                        primary: true, 
                        onClick: () => { 
                            instance.close(); 
                            this.startWorkout(); 
                        },
                        className: 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
                    }
                ]
            });
        },

        calculateDetailedWorkoutTime(workout) {
            let workingTime = 0; // Time actually lifting
            let restTime = 0;    // Time resting between sets
            let setupTime = 5;   // Initial setup time
            
            workout.exercises.forEach(exercise => {
                const setCount = exercise.sets.length;
                const avgSetTime = 45; // seconds per set
                const restBetweenSets = exercise.restTime || 60;
                
                // Working time for this exercise
                workingTime += (setCount * avgSetTime);
                
                // Rest time (one less rest period than sets)
                restTime += ((setCount - 1) * restBetweenSets);
                
                // Setup time between exercises
                setupTime += 30;
            });
            
            const totalSeconds = workingTime + restTime + setupTime;
            const totalMinutes = Math.round(totalSeconds / 60);
            
            return {
                working: Math.round(workingTime / 60),
                rest: Math.round(restTime / 60),
                setup: Math.round(setupTime / 60),
                total: totalMinutes
            };
        },

        startWorkout() {
            const workout = this.getCurrentWorkout();
            if (!workout) return;

            // Initialize workout state
            this.currentWorkoutState = {
                isActive: true,
                selectedExerciseId: null,
                currentSetIndex: 0,
                exercises: workout.exercises.map(ex => ({
                    ...ex,
                    id: ex.name.replace(/\s+/g, '_').toLowerCase(),
                    completedSets: [],
                    isCompleted: false
                })),
                completedExercises: new Set(),
                startTime: Date.now(),
                restTimer: null,
                restTimeRemaining: 0
            };

            // Hide navigation elements to maximize screen space
            const appHeader = document.querySelector('.app-header');
            const appNav = document.querySelector('.app-nav');
            if (appHeader) appHeader.style.display = 'none';
            if (appNav) appNav.style.display = 'none';
            
            // Show workout overlay
            document.getElementById('workout-overlay').classList.remove('hidden');
            document.getElementById('workout-progress').classList.remove('hidden');
            
            // Show unified exercise selection in overlay
            this.showExerciseSelectionInOverlay();
        },



        selectExercise(exerciseId) {
            this.currentWorkoutState.selectedExerciseId = exerciseId;
            this.currentWorkoutState.currentSetIndex = 0;
            
            // Find the exercise and set current set index to first incomplete set
            const exercise = this.currentWorkoutState.exercises.find(ex => ex.id === exerciseId);
            if (exercise) {
                const firstIncompleteSet = exercise.completedSets.findIndex(completed => !completed);
                this.currentWorkoutState.currentSetIndex = firstIncompleteSet >= 0 ? firstIncompleteSet : 0;
            }
            
            this.renderCurrentExercise();
        },

        showExerciseSelectionInOverlay() {
            const content = document.getElementById('workout-content');
            const { exercises, completedExercises } = this.currentWorkoutState;
            
            // Create exercise grid HTML
            let exerciseGridHTML = '';
            exercises.forEach(exercise => {
                const isCompleted = completedExercises.has(exercise.id);
                const completedSetsCount = exercise.completedSets.filter(Boolean).length;
                const totalSets = exercise.sets.length;
                
                exerciseGridHTML += `
                    <div class="exercise-card p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                        isCompleted 
                            ? 'bg-green-900 border-green-500 opacity-75' 
                            : 'bg-gray-800 border-gray-600 hover:border-red-500 hover:bg-gray-700'
                    }" data-exercise-id="${exercise.id}">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-lg">${exercise.name}</h4>
                            ${isCompleted ? '<i class="fas fa-check-circle text-green-400 text-xl"></i>' : ''}
                        </div>
                        <div class="text-sm text-gray-400 mb-2">${exercise.muscleGroups.join(' • ')}</div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm">${totalSets} sets</span>
                            <span class="text-sm ${isCompleted ? 'text-green-400' : 'text-indigo-400'}">
                                ${completedSetsCount}/${totalSets} sets
                            </span>
                        </div>
                        ${!isCompleted ? `
                            <button class="exercise-card-btn w-full mt-3 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded font-semibold" data-exercise-id="${exercise.id}">
                                ${completedSetsCount > 0 ? 'Continue Exercise' : 'Start Exercise'}
                            </button>
                        ` : `
                            <div class="w-full mt-3 bg-green-600 text-white py-2 px-4 rounded font-semibold text-center">
                                ✓ Completed
                            </div>
                        `}
                    </div>
                `;
            });
            
            content.innerHTML = `
                <div class="p-6">
                    <div class="text-center mb-6">
                        <h2 class="text-4xl font-bold mb-4 text-red-400">Choose Your Exercise</h2>
                        <p class="text-xl text-gray-300 mb-8">Select any exercise to start your workout. Complete them in any order you prefer!</p>
                        <div class="bg-gray-800 rounded-lg p-4 mb-6">
                            <div class="flex items-center justify-center space-x-6 text-sm">
                                <div class="flex items-center space-x-2">
                                    <div class="w-4 h-4 bg-gray-600 rounded"></div>
                                    <span>Not Started</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="w-4 h-4 bg-indigo-500 rounded"></div>
                                    <span>In Progress</span>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="w-4 h-4 bg-green-500 rounded"></div>
                                    <span>Completed</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                        ${exerciseGridHTML}
                    </div>
                </div>
            `;
            
            // Update progress
            this.updateWorkoutProgress();
        },



        updateWorkoutProgress() {
            const { exercises, completedExercises } = this.currentWorkoutState;
            const completedCount = completedExercises.size;
            const totalCount = exercises.length;
            const progressPercent = (completedCount / totalCount) * 100;
            
            document.getElementById('progress-bar').style.width = `${progressPercent}%`;
            document.getElementById('progress-text').textContent = 
                `${completedCount} of ${totalCount} exercises completed`;
        },

        showReadyCountdown() {
            const overlay = document.getElementById('workout-overlay');
            const content = document.getElementById('workout-content');
            
            content.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <h2 class="text-4xl font-bold mb-4">Ready to Go!</h2>
                        <div id="countdown-display" class="text-8xl font-mono font-bold text-green-400 mb-6">3</div>
                        <p class="text-xl text-gray-300">Prepare for your first exercise</p>
                    </div>
                </div>
            `;

            let countdown = 3;
            const countdownEl = document.getElementById('countdown-display');
            
            const countdownInterval = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    countdownEl.textContent = countdown;
                } else {
                    clearInterval(countdownInterval);
                    this.renderCurrentExercise();
                }
            }, 1000);
        },

        renderCurrentExercise() {
            const { selectedExerciseId, exercises } = this.currentWorkoutState;
            const exercise = exercises.find(ex => ex.id === selectedExerciseId);
            
            if (!exercise) {
                this.showExerciseSelectionInOverlay();
                return;
            }

            // Update header
            document.getElementById('current-exercise-name').textContent = exercise.name;
            document.getElementById('current-exercise-progress').textContent = 
                `${exercise.name} - ${exercise.completedSets.filter(Boolean).length}/${exercise.sets.length} sets`;

            // Update progress bar
            this.updateWorkoutProgress();

            // Render exercise content
            this.renderExerciseContent(exercise);
        },

        renderExerciseContent(exercise) {
            const content = document.getElementById('workout-content');
            
            // Ensure completedSets array is properly sized
            if (!exercise.completedSets) {
                exercise.completedSets = [];
            }
            while (exercise.completedSets.length < exercise.sets.length) {
                exercise.completedSets.push(null);
            }
            
            let setsHtml = '';
            exercise.sets.forEach((set, index) => {
                const isCompleted = exercise.completedSets[index];
                const isWorkingSet = set.isWorkingSet;
                
                setsHtml += `
                    <div class="set-row p-5 rounded-lg border-2 ${isCompleted ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800'} mb-4" style="transform: translateZ(0);">
                        <!-- Set Header -->
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center space-x-4">
                                <span class="text-xl font-bold ${isWorkingSet ? 'text-yellow-400' : 'text-white'}">
                                    Set ${index + 1} ${isWorkingSet ? '⭐' : ''}
                                </span>
                                <span class="text-gray-400 text-base">Target: ${set.reps} reps</span>
                            </div>
                            ${isCompleted ? '<span class="text-green-400 font-semibold">✓ Completed</span>' : ''}
                        </div>
                        
                        <!-- Input Row -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4 flex-1">
                                ${typeof set.reps === 'number' ? `
                                    <div class="flex items-center space-x-3">
                                        <label class="text-gray-300 font-medium">Weight:</label>
                                        <input type="number" 
                                               class="weight-input w-24 p-3 bg-gray-700 rounded-lg text-center text-base font-medium" 
                                               placeholder="kg" 
                                               data-set-index="${index}"
                                               ${isCompleted ? 'disabled' : ''}>
                                        <span class="text-gray-400 text-lg">kg</span>
                                    </div>
                                    <div class="flex items-center space-x-3">
                                        <label class="text-gray-300 font-medium">Reps:</label>
                                        <input type="number" 
                                               class="reps-input w-20 p-3 bg-gray-700 rounded-lg text-center text-base font-medium" 
                                               placeholder="${set.reps}" 
                                               data-set-index="${index}"
                                               ${isCompleted ? 'disabled' : ''}>
                                    </div>
                                ` : `
                                    <div class="flex items-center space-x-3">
                                        <label class="text-gray-300 font-medium">Target:</label>
                                        <span class="text-indigo-400 text-lg font-semibold">${set.reps}</span>
                                    </div>
                                `}
                            </div>
                            <button class="set-complete-btn px-6 py-3 rounded-lg font-bold text-base min-w-[120px] ${
                                isCompleted 
                                    ? 'bg-green-600 text-white cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }" 
                                    data-set-index="${index}" 
                                    ${isCompleted ? 'disabled' : ''}>
                                ${isCompleted ? '✓ Done' : 'Complete'}
                            </button>
                        </div>
                    </div>
                `;
            });

            content.innerHTML = `
                <div class="max-w-4xl mx-auto">
                    <!-- Exercise Info -->
                    <div class="text-center mb-6">
                        <h2 class="text-3xl font-bold mb-2">${exercise.name}</h2>
                        <p class="text-indigo-400 mb-2">${exercise.muscleGroups.join(' • ')}</p>
                        <p class="text-gray-400 text-sm">${exercise.instructions}</p>
                        ${exercise.alternative ? `<p class="text-yellow-400 text-sm mt-2">Alternative: ${exercise.alternative}</p>` : ''}
                    </div>

                    <!-- Exercise Animation Placeholder -->
                    <div class="bg-gray-800 rounded-lg p-8 mb-6 text-center">
                        <div class="text-6xl mb-4">🏋️</div>
                        <p class="text-gray-400">Exercise animation/video would go here</p>
                    </div>

                    <!-- Sets -->
                    <div class="space-y-3">
                        ${setsHtml}
                    </div>

                    <!-- Exercise Notes -->
                    <div class="mt-6 p-4 bg-blue-900/20 border border-blue-600 rounded-lg">
                        <h4 class="font-semibold text-blue-400 mb-2">💡 Tips</h4>
                        <p class="text-sm text-gray-300">${exercise.instructions}</p>
                        <p class="text-xs text-gray-400 mt-2">Rest ${exercise.restTime} seconds between sets</p>
                    </div>
                </div>
            `;

            // Update complete exercise button state
            this.updateCompleteExerciseButton();
        },

        completeSet(setIndex) {
            const { selectedExerciseId, exercises } = this.currentWorkoutState;
            const exercise = exercises.find(ex => ex.id === selectedExerciseId);
            
            if (!exercise) {
                console.error('Exercise not found:', selectedExerciseId);
                return;
            }

            // Ensure completedSets array is properly sized
            if (!exercise.completedSets) {
                exercise.completedSets = [];
            }
            while (exercise.completedSets.length < exercise.sets.length) {
                exercise.completedSets.push(null);
            }
            
            if (exercise.completedSets[setIndex]) return; // Already completed

            // Get input values
            const weightInput = document.querySelector(`.weight-input[data-set-index="${setIndex}"]`);
            const repsInput = document.querySelector(`.reps-input[data-set-index="${setIndex}"]`);
            
            const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
            const reps = repsInput ? parseInt(repsInput.value) || 0 : 0;

            // Validate inputs for numbered reps
            if (typeof exercise.sets[setIndex].reps === 'number' && (!weight || !reps)) {
                app.modalAlert('Please enter both weight and reps before completing the set.');
                return;
            }

            // Mark set as completed
            exercise.completedSets[setIndex] = {
                weight: weight || null,
                reps: reps || exercise.sets[setIndex].reps,
                completedAt: Date.now()
            };

            // Re-render to show completed state
            this.renderExerciseContent(exercise);

            // Check if all sets are completed
            const allSetsCompleted = exercise.sets.every((_, index) => exercise.completedSets[index]);
            if (allSetsCompleted) {
                exercise.isCompleted = true;
                this.updateCompleteExerciseButton();
            } else {
                // Start rest timer for next set
                this.startRestTimer(exercise.restTime);
            }
        },

        updateSetData(input) {
            const setIndex = parseInt(input.dataset.setIndex);
            const { selectedExerciseId, exercises } = this.currentWorkoutState;
            const exercise = exercises.find(ex => ex.id === selectedExerciseId);
            
            if (!exercise || isNaN(setIndex)) return;

            // Store the input value in a temporary data structure
            if (!exercise.tempSetData) {
                exercise.tempSetData = {};
            }
            if (!exercise.tempSetData[setIndex]) {
                exercise.tempSetData[setIndex] = {};
            }

            // Update the temporary data based on input type
            if (input.classList.contains('weight-input')) {
                exercise.tempSetData[setIndex].weight = parseFloat(input.value) || 0;
            } else if (input.classList.contains('reps-input')) {
                exercise.tempSetData[setIndex].reps = parseInt(input.value) || 0;
            }

            // Check if this set can be marked as ready to complete
            this.updateSetCompletionState(setIndex);
        },

        updateSetCompletionState(setIndex) {
            const { selectedExerciseId, exercises } = this.currentWorkoutState;
            const exercise = exercises.find(ex => ex.id === selectedExerciseId);
            
            if (!exercise) return;

            // Ensure completedSets array is properly sized
            if (!exercise.completedSets) {
                exercise.completedSets = [];
            }
            while (exercise.completedSets.length < exercise.sets.length) {
                exercise.completedSets.push(null);
            }

            const setCompleteBtn = document.querySelector(`.set-complete-btn[data-set-index="${setIndex}"]`);
            if (!setCompleteBtn) return;

            // Check if set is already completed
            if (exercise.completedSets[setIndex]) {
                setCompleteBtn.disabled = true;
                setCompleteBtn.textContent = '✓ Complete';
                setCompleteBtn.classList.add('bg-green-600');
                setCompleteBtn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
                return;
            }

            // Check if inputs have valid values
            const weightInput = document.querySelector(`.weight-input[data-set-index="${setIndex}"]`);
            const repsInput = document.querySelector(`.reps-input[data-set-index="${setIndex}"]`);
            
            const hasWeight = weightInput && parseFloat(weightInput.value) > 0;
            const hasReps = repsInput && parseInt(repsInput.value) > 0;
            
            // For exercises with specific rep counts, require both weight and reps
            const targetReps = exercise.sets[setIndex].reps;
            if (typeof targetReps === 'number') {
                setCompleteBtn.disabled = !(hasWeight && hasReps);
            } else {
                // For "To Failure" or time-based sets, just require reps
                setCompleteBtn.disabled = !hasReps;
            }
        },

        updateCompleteExerciseButton() {
            const { selectedExerciseId, exercises } = this.currentWorkoutState;
            const exercise = exercises.find(ex => ex.id === selectedExerciseId);
            const button = document.getElementById('complete-exercise-btn');
            
            if (button && exercise) {
                // Ensure completedSets array is properly sized
                if (!exercise.completedSets) {
                    exercise.completedSets = [];
                }
                while (exercise.completedSets.length < exercise.sets.length) {
                    exercise.completedSets.push(null);
                }
                
                const allSetsCompleted = exercise.sets.every((_, index) => exercise.completedSets[index]);
                button.disabled = !allSetsCompleted;
                button.textContent = allSetsCompleted ? 'Complete Exercise' : 'Complete All Sets First';
            }
        },

        completeExercise() {
            const { selectedExerciseId, exercises, completedExercises } = this.currentWorkoutState;
            const exercise = exercises.find(ex => ex.id === selectedExerciseId);
            
            if (exercise) {
                // Mark exercise as completed
                exercise.isCompleted = true;
                completedExercises.add(selectedExerciseId);
                
                // Clear selected exercise
                this.currentWorkoutState.selectedExerciseId = null;
                
                // Check if all exercises are completed
                if (completedExercises.size >= exercises.length) {
                    this.completeWorkout();
                } else {
                    // Show exercise selection for next exercise
                    this.showExerciseCompletionTransition(exercise);
                }
            }
        },

        showExerciseCompletionTransition(completedExercise) {
            const content = document.getElementById('workout-content');
            const { completedExercises, exercises } = this.currentWorkoutState;
            
            content.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center max-w-md mx-auto">
                        <h2 class="text-3xl font-bold mb-4 text-green-400">Exercise Complete! 💪</h2>
                        <p class="text-xl text-gray-300 mb-2">${completedExercise.name}</p>
                        <p class="text-gray-400 mb-6">Great work! Choose your next exercise.</p>
                        <div class="bg-gray-800 rounded-lg p-4 mb-6">
                            <p class="text-sm text-gray-300">Progress: ${completedExercises.size}/${exercises.length} exercises completed</p>
                        </div>
                        <button id="choose-next-exercise-btn" class="bg-red-600 hover:bg-red-500 text-white py-3 px-6 rounded-lg font-semibold">
                            Choose Next Exercise
                        </button>
                    </div>
                </div>
            `;
            
            document.getElementById('choose-next-exercise-btn').addEventListener('click', () => {
                this.showExerciseSelectionInOverlay();
            });
            
            // Auto-transition after 3 seconds
            setTimeout(() => {
                this.showExerciseSelectionInOverlay();
            }, 3000);
        },

        showExerciseTransition() {
            const { selectedExerciseId, exercises } = this.currentWorkoutState;
            const currentExercise = exercises.find(ex => ex.id === selectedExerciseId);
            
            if (!currentExercise) return;
            
            const content = document.getElementById('workout-content');
            content.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <h2 class="text-3xl font-bold mb-4 text-green-400">Exercise Complete! 💪</h2>
                        <p class="text-xl text-gray-300 mb-6">Great work! Moving to next exercise...</p>
                        <div class="text-2xl font-semibold text-indigo-400">${currentExercise.name}</div>
                        <p class="text-gray-400">${currentExercise.muscleGroups.join(' • ')}</p>
                    </div>
                </div>
            `;

            // Auto-advance after 3 seconds
            setTimeout(() => {
                this.renderCurrentExercise();
            }, 3000);
        },

        startRestTimer(duration) {
            this.currentWorkoutState.restTimeRemaining = duration;
            
            const overlay = document.getElementById('rest-timer-overlay');
            const display = document.getElementById('rest-timer-display');
            const nextExerciseEl = document.getElementById('next-exercise-preview');
            
            // Show next set info
            const { selectedExerciseId, exercises } = this.currentWorkoutState;
            const exercise = exercises.find(ex => ex.id === selectedExerciseId);
            
            if (!exercise) return;
            
            const nextSetIndex = exercise.completedSets.filter(Boolean).length;
            
            if (nextSetIndex < exercise.sets.length) {
                nextExerciseEl.textContent = `Next: Set ${nextSetIndex + 1} - ${exercise.sets[nextSetIndex].reps} reps`;
            } else {
                nextExerciseEl.textContent = 'Next: Complete Exercise';
            }
            
            overlay.classList.remove('hidden');
            
            this.currentWorkoutState.restTimer = setInterval(() => {
                this.currentWorkoutState.restTimeRemaining--;
                
                const minutes = Math.floor(this.currentWorkoutState.restTimeRemaining / 60);
                const seconds = this.currentWorkoutState.restTimeRemaining % 60;
                display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                if (this.currentWorkoutState.restTimeRemaining <= 0) {
                    this.skipRest();
                }
            }, 1000);
        },

        skipRest() {
            if (this.currentWorkoutState.restTimer) {
                clearInterval(this.currentWorkoutState.restTimer);
                this.currentWorkoutState.restTimer = null;
            }
            
            document.getElementById('rest-timer-overlay').classList.add('hidden');
        },

        addRestTime() {
            this.currentWorkoutState.restTimeRemaining += 30;
        },

        skipExercise() {
            app.modalConfirm('Are you sure you want to skip this exercise?').then(confirmed => {
                if (confirmed) {
                    this.completeExercise();
                }
            });
        },

        pauseWorkout() {
            app.modalConfirm('Pause workout? Your progress will be saved.').then(confirmed => {
                if (confirmed) {
                    this.saveWorkoutProgress();
                    document.getElementById('workout-overlay').classList.add('hidden');
                    this.currentWorkoutState.isActive = false;
                    
                    // Restore navigation elements
                    const appHeader = document.querySelector('.app-header');
                    const appNav = document.querySelector('.app-nav');
                    if (appHeader) appHeader.style.display = '';
                    if (appNav) appNav.style.display = '';
                }
            });
        },

        completeWorkout() {
            const { exercises, startTime } = this.currentWorkoutState;
            const endTime = Date.now();
            const duration = Math.round((endTime - startTime) / 1000 / 60); // minutes

            // Save workout data
            this.saveCompletedWorkout(exercises, duration);

            // Show completion screen
            const content = document.getElementById('workout-content');
            content.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <h2 class="text-5xl font-bold mb-4 text-green-400">Congratulations! 🎉</h2>
                        <p class="text-2xl text-gray-300 mb-6">Workout Complete!</p>
                        <div class="grid grid-cols-2 gap-4 mb-6 max-w-md mx-auto">
                            <div class="bg-gray-800 p-4 rounded">
                                <div class="text-3xl font-bold text-indigo-400">${exercises.length}</div>
                                <div class="text-sm text-gray-400">Exercises</div>
                            </div>
                            <div class="bg-gray-800 p-4 rounded">
                                <div class="text-3xl font-bold text-green-400">${duration}min</div>
                                <div class="text-sm text-gray-400">Duration</div>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <button id="rate-workout-btn" class="bg-blue-600 hover:bg-blue-500 px-8 py-3 rounded-lg font-semibold">
                                Rate This Workout
                            </button>
                            <button id="finish-workout-btn" class="bg-green-600 hover:bg-green-500 px-8 py-3 rounded-lg font-semibold">
                                Finish & Return
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Hide footer actions
            document.querySelector('#workout-overlay .p-6.border-t').style.display = 'none';
        },

        saveCompletedWorkout(exercises, duration) {
            const workout = this.getCurrentWorkout();
            if (!workout) return;

            // Initialize workout history if needed
            if (!app.state.workoutHistory) {
                app.state.workoutHistory = {};
            }

            const workoutKey = workout.name.replace(/\s+/g, '_').toLowerCase();
            const workoutData = {
                name: workout.name,
                date: new Date().toISOString(),
                duration: duration,
                exercises: exercises.map(ex => ({
                    name: ex.name,
                    completedSets: ex.completedSets,
                    isCompleted: ex.isCompleted
                }))
            };

            app.state.workoutHistory[workoutKey] = workoutData;

            // Update stats
            app.state.stats.totalWorkouts = (app.state.stats.totalWorkouts || 0) + 1;
            app.state.stats.dungeonsCleared = (app.state.stats.dungeonsCleared || 0) + 1;

            // Add XP and level progression
            const xpGain = 100; // Base XP for completing workout
            app.state.xp += xpGain;
            
            // Check for level up
            while (app.state.xp >= app.state.xpToNextLevel) {
                app.state.xp -= app.state.xpToNextLevel;
                app.state.level++;
                app.state.xpToNextLevel = Math.round(app.state.xpToNextLevel * 1.2);
            }

            // Update streak
            const today = new Date().toISOString().split('T')[0];
            if (!app.state.lastWorkoutDate) {
                app.state.streak = 1;
            } else {
                const last = new Date(app.state.lastWorkoutDate);
                const now = new Date(today);
                const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24));
                if (diffDays === 1) app.state.streak++;
                else if (diffDays > 1) app.state.streak = 1;
            }
            app.state.lastWorkoutDate = today;
            app.state.longestStreak = Math.max(app.state.longestStreak || 0, app.state.streak);

            // Add to activity log
            app.state.activityLog.push({
                type: 'workout_completed',
                workoutName: workout.name,
                duration: duration,
                timestamp: Date.now()
            });

            // Check for achievements after workout completion
            if (app.checkAchievements) {
                app.checkAchievements();
            }

            app.saveData();
        },

        saveWorkoutProgress() {
            // Save current workout state for resuming later
            const workout = this.getCurrentWorkout();
            if (!workout) return;

            app.state.currentWorkoutProgress = {
                workoutName: workout.name,
                state: this.currentWorkoutState,
                savedAt: Date.now()
            };

            app.saveData();
        },



        cleanup() {
            // Clean up timers
            if (this.currentWorkoutState && this.currentWorkoutState.restTimer) {
                clearInterval(this.currentWorkoutState.restTimer);
            }

            // Remove event listeners to prevent memory leaks
            if (this.clickHandler) {
                document.removeEventListener('click', this.clickHandler);
                this.clickHandler = null;
            }
            if (this.changeHandler) {
                document.removeEventListener('change', this.changeHandler);
                this.changeHandler = null;
            }

            // Hide overlays
            const workoutOverlay = document.getElementById('workout-overlay');
            const restOverlay = document.getElementById('rest-timer-overlay');
            if (workoutOverlay) workoutOverlay.classList.add('hidden');
            if (restOverlay) restOverlay.classList.add('hidden');
            
            // Restore navigation elements
            const appHeader = document.querySelector('.app-header');
            const appNav = document.querySelector('.app-nav');
            if (appHeader) appHeader.style.display = '';
            if (appNav) appNav.style.display = '';
        }
    };
}