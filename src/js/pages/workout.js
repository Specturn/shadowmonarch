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
                            <span id="progress-text" class="text-sm text-indigo-400">Exercise 1 of 6</span>
                        </div>
                        <div class="w-full bg-gray-700 rounded-full h-2">
                            <div id="progress-bar" class="bg-indigo-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
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
                            <button id="pause-workout-btn" class="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded">
                                ⏸️ Pause
                            </button>
                        </div>

                        <!-- Main Content -->
                        <div id="workout-content" class="flex-1 overflow-y-auto p-6">
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
                currentExerciseIndex: 0,
                currentSetIndex: 0,
                exercises: [],
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
            
            // Store references to bound functions for cleanup
            this.clickHandler = (event) => {
                if (event.target.id === 'preview-workout-btn') {
                    this.previewWorkout();
                } else if (event.target.id === 'start-workout-btn') {
                    this.startWorkout();
                } else if (event.target.id === 'pause-workout-btn') {
                    this.pauseWorkout();
                } else if (event.target.id === 'skip-exercise-btn') {
                    this.skipExercise();
                } else if (event.target.id === 'complete-exercise-btn' && !event.target.disabled) {
                    this.completeExercise();
                } else if (event.target.id === 'skip-rest-btn') {
                    this.skipRest();
                } else if (event.target.id === 'add-rest-time-btn') {
                    this.addRestTime();
                } else if (event.target.classList.contains('set-complete-btn')) {
                    const setIndex = parseInt(event.target.dataset.setIndex);
                    this.completeSet(setIndex);
                } else if (event.target.classList.contains('weight-input') || event.target.classList.contains('reps-input')) {
                    this.updateSetData(event.target);
                }
            };

            this.changeHandler = (event) => {
                if (event.target.classList.contains('set-checkbox')) {
                    this.checkIfComplete();
                }
            };

            // Add event listeners
            document.addEventListener('click', this.clickHandler);
            document.addEventListener('change', this.changeHandler);
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
                            <button id="preview-workout-btn" class="bg-blue-600 hover:bg-blue-500 py-3 px-6 rounded-lg font-semibold">
                                📋 Preview Workout
                            </button>
                            <button id="start-workout-btn" class="bg-green-600 hover:bg-green-500 py-3 px-8 rounded-lg font-semibold text-lg">
                                🚀 Start Workout
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
            
            let html = `<div class="space-y-4">
                <div class="text-center">
                    <h3 class="text-xl font-bold text-indigo-400">${workout.name}</h3>
                    <p class="text-gray-400">${workout.subtitle}</p>
                </div>
                <div class="space-y-3 max-h-96 overflow-y-auto">`;
            
            workout.exercises.forEach((exercise, index) => {
                const setInfo = exercise.sets.map(set => {
                    if (typeof set.reps === 'string') {
                        return set.reps;
                    }
                    return `${set.reps} reps`;
                }).join(', ');
                
                html += `
                    <div class="p-4 bg-gray-800 rounded-lg">
                        <div class="flex items-start justify-between mb-2">
                            <div>
                                <span class="font-semibold text-white">${index + 1}. ${exercise.name}</span>
                                <div class="text-sm text-gray-400">${exercise.muscleGroups.join(', ')}</div>
                            </div>
                            <span class="text-xs text-indigo-400">${exercise.restTime}s rest</span>
                        </div>
                        <div class="text-sm text-gray-300 mb-2">${exercise.sets.length} sets: ${setInfo}</div>
                        <div class="text-xs text-gray-500">${exercise.instructions}</div>
                        ${exercise.alternative ? `<div class="text-xs text-yellow-400 mt-1">Alt: ${exercise.alternative}</div>` : ''}
                    </div>
                `;
            });
            
            html += `</div></div>`;
            
            const instance = app.showModal({
                title: 'Workout Preview',
                html,
                actions: [
                    { label: 'Close', onClick: () => instance.close() },
                    { label: 'Start Workout', primary: true, onClick: () => { instance.close(); this.startWorkout(); } }
                ]
            });
        },

        startWorkout() {
            const workout = this.getCurrentWorkout();
            if (!workout) return;

            // Initialize workout state
            this.currentWorkoutState = {
                isActive: true,
                currentExerciseIndex: 0,
                currentSetIndex: 0,
                exercises: workout.exercises.map(ex => ({
                    ...ex,
                    completedSets: [],
                    isCompleted: false
                })),
                startTime: Date.now(),
                restTimer: null,
                restTimeRemaining: 0
            };

            // Show workout overlay
            document.getElementById('workout-overlay').classList.remove('hidden');
            document.getElementById('workout-progress').classList.remove('hidden');
            
            // Start with ready countdown
            this.showReadyCountdown();
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
            const { currentExerciseIndex, exercises } = this.currentWorkoutState;
            const exercise = exercises[currentExerciseIndex];
            
            if (!exercise) {
                this.completeWorkout();
                return;
            }

            // Update header
            document.getElementById('current-exercise-name').textContent = exercise.name;
            document.getElementById('current-exercise-progress').textContent = 
                `Exercise ${currentExerciseIndex + 1} of ${exercises.length}`;

            // Update progress bar
            const progressPercent = ((currentExerciseIndex) / exercises.length) * 100;
            document.getElementById('progress-bar').style.width = `${progressPercent}%`;
            document.getElementById('progress-text').textContent = 
                `Exercise ${currentExerciseIndex + 1} of ${exercises.length}`;

            // Render exercise content
            this.renderExerciseContent(exercise);
        },

        renderExerciseContent(exercise) {
            const content = document.getElementById('workout-content');
            
            let setsHtml = '';
            exercise.sets.forEach((set, index) => {
                const isCompleted = exercise.completedSets[index];
                const isWorkingSet = set.isWorkingSet;
                
                setsHtml += `
                    <div class="set-row p-4 rounded-lg border-2 ${isCompleted ? 'border-green-500 bg-green-900/20' : 'border-gray-600 bg-gray-800'} mb-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <span class="text-lg font-semibold ${isWorkingSet ? 'text-yellow-400' : 'text-white'}">
                                    Set ${index + 1} ${isWorkingSet ? '⭐' : ''}
                                </span>
                                <span class="text-gray-400">Target: ${set.reps} reps</span>
                            </div>
                            <div class="flex items-center space-x-3">
                                ${typeof set.reps === 'number' ? `
                                    <input type="number" 
                                           class="weight-input w-20 p-2 bg-gray-700 rounded text-center" 
                                           placeholder="Weight" 
                                           data-set-index="${index}"
                                           ${isCompleted ? 'disabled' : ''}>
                                    <span class="text-gray-400">kg ×</span>
                                    <input type="number" 
                                           class="reps-input w-16 p-2 bg-gray-700 rounded text-center" 
                                           placeholder="${set.reps}" 
                                           data-set-index="${index}"
                                           ${isCompleted ? 'disabled' : ''}>
                                    <span class="text-gray-400">reps</span>
                                ` : `
                                    <span class="text-indigo-400">${set.reps}</span>
                                `}
                                <button class="set-complete-btn px-4 py-2 rounded font-semibold ${
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
            const { currentExerciseIndex, exercises } = this.currentWorkoutState;
            const exercise = exercises[currentExerciseIndex];
            
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

        updateCompleteExerciseButton() {
            const { currentExerciseIndex, exercises } = this.currentWorkoutState;
            const exercise = exercises[currentExerciseIndex];
            const button = document.getElementById('complete-exercise-btn');
            
            if (button) {
                const allSetsCompleted = exercise.sets.every((_, index) => exercise.completedSets[index]);
                button.disabled = !allSetsCompleted;
                button.textContent = allSetsCompleted ? 'Complete Exercise' : 'Complete All Sets First';
            }
        },

        completeExercise() {
            const { currentExerciseIndex, exercises } = this.currentWorkoutState;
            
            // Move to next exercise
            this.currentWorkoutState.currentExerciseIndex++;
            
            if (this.currentWorkoutState.currentExerciseIndex >= exercises.length) {
                this.completeWorkout();
            } else {
                // Show transition to next exercise
                this.showExerciseTransition();
            }
        },

        showExerciseTransition() {
            const { currentExerciseIndex, exercises } = this.currentWorkoutState;
            const nextExercise = exercises[currentExerciseIndex];
            
            const content = document.getElementById('workout-content');
            content.innerHTML = `
                <div class="flex items-center justify-center h-full">
                    <div class="text-center">
                        <h2 class="text-3xl font-bold mb-4 text-green-400">Exercise Complete! 💪</h2>
                        <p class="text-xl text-gray-300 mb-6">Great work! Moving to next exercise...</p>
                        <div class="text-2xl font-semibold text-indigo-400">${nextExercise.name}</div>
                        <p class="text-gray-400">${nextExercise.muscleGroups.join(' • ')}</p>
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
            const { currentExerciseIndex, exercises } = this.currentWorkoutState;
            const exercise = exercises[currentExerciseIndex];
            const nextSetIndex = exercise.completedSets.length;
            
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
        }
    };
}