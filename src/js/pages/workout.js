export function initWorkout(app) {
    return {
        render() {
            return `
                <div class="card-bg p-6 rounded-lg text-center mb-6">
                    <h2 class="text-2xl font-bold mb-2">Daily Quest</h2>
                    <p id="workout-day-title" class="text-indigo-400 font-semibold mb-4">Loading...</p>
                    <div id="workout-actions" class="flex gap-4 justify-center">
                        <div class="text-gray-400">Loading workout...</div>
                    </div>
                </div>
                <div id="gate-container" class="hidden">
                    <div class="card-bg p-6 rounded-lg text-center gate-card">
                        <h2 class="text-2xl font-bold mb-2 text-amber-400">Warning: Gate Detected!</h2>
                        <p id="gate-description" class="text-gray-300 mb-4"></p>
                        <button id="complete-gate-btn" class="bg-amber-500 hover:bg-amber-400 py-2 px-4 rounded">Complete Gate Challenge</button>
                    </div>
                </div>
            `;
        },

        init() {
            this.setupEventListeners();
            this.updateWorkoutDisplay();
        },

        setupEventListeners() {
            // Remove any existing listeners first
            this.cleanup();
            
            // Store references to bound functions for cleanup
            this.clickHandler = (event) => {
                if (event.target.id === 'preview-quest-btn') {
                    this.previewQuest();
                } else if (event.target.id === 'begin-quest-btn') {
                    this.beginQuest();
                } else if (event.target.id === 'complete-dungeon-btn') {
                    this.completeDungeon();
                } else if (event.target.id === 'next-task-btn' && !event.target.disabled) {
                    app.state.dungeon.currentExerciseIndex++;
                    this.renderDungeon();
                } else if (event.target.id === 'cancel-dungeon-btn') {
                    app.modalConfirm("Are you sure you want to abandon the quest? Your progress will not be saved.").then((ok) => {
                        if (ok) {
                            app.state.dungeon.isActive = false;
                            document.getElementById('dungeon-overlay').classList.add('hidden');
                            document.getElementById('dungeon-overlay').classList.remove('flex');
                        }
                    });
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
            const actionsEl = document.getElementById('workout-actions');
            
            if (titleEl) {
                titleEl.textContent = isRestDay ? 'Rest Day - Recovery Mode' : `${workout.type} Day - Phase ${workout.phase}`;
            }
            
            if (actionsEl) {
                if (isRestDay) {
                    actionsEl.innerHTML = '<p class="text-gray-400">Rest is when you grow stronger. Recover well.</p>';
                } else {
                    actionsEl.innerHTML = `
                        <button id="preview-quest-btn" class="btn-primary py-2 px-4 rounded">Preview Quest</button>
                        <button id="begin-quest-btn" class="bg-green-600 hover:bg-green-500 py-2 px-4 rounded">Begin Quest</button>
                    `;
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
            const phase = Math.min(4, Math.floor((app.state.week - 1) / 12) + 1);
            const today = new Date().getDay();
            const dayIndex = today === 0 ? 6 : today - 1;
            const dayType = ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'][dayIndex];

            if (dayType === 'Rest') return null;

            // Simplified workout program
            const workoutProgram = [
                {
                    phase: 1, type: 'Push', exercises: [
                        { name: 'Bench Press', sets: 3, reps: '5-8' },
                        { name: 'Overhead Press', sets: 3, reps: '5-8' },
                        { name: 'Incline DB Press', sets: 3, reps: '8-12' }
                    ]
                },
                {
                    phase: 1, type: 'Pull', exercises: [
                        { name: 'Barbell Row', sets: 3, reps: '5-8' },
                        { name: 'Lat Pulldown', sets: 3, reps: '8-12' },
                        { name: 'Bicep Curl', sets: 3, reps: '8-12' }
                    ]
                },
                {
                    phase: 1, type: 'Legs', exercises: [
                        { name: 'Squat', sets: 3, reps: '5-8' },
                        { name: 'Romanian Deadlift', sets: 3, reps: '8-12' },
                        { name: 'Leg Press', sets: 3, reps: '12-15' }
                    ]
                }
            ];

            return workoutProgram.find(w => w.phase === phase && w.type === dayType);
        },

        previewQuest() {
            const workout = this.getCurrentWorkout();
            if (!workout) return;
            
            let html = `<div class="space-y-3">
                <p class="text-indigo-400 font-semibold">${workout.type} Day - Phase ${workout.phase}</p>
                <div class="space-y-2">`;
            
            workout.exercises.forEach(ex => {
                const weight = app.state.lifts[ex.name] ? app.state.lifts[ex.name].weight : 'N/A';
                html += `<div class="p-3 bg-gray-800 rounded">
                    <div class="flex items-center justify-between">
                        <span class="font-semibold">${ex.name}</span>
                        <span class="text-sm text-gray-300">${ex.sets} x ${ex.reps} @ ${weight} kg</span>
                    </div>
                </div>`;
            });
            
            html += `</div></div>`;
            
            const instance = app.showModal({
                title: 'Quest Preview',
                html,
                actions: [
                    { label: 'Close', onClick: () => instance.close() },
                    { label: 'Begin Quest', primary: true, onClick: () => { instance.close(); this.beginQuest(); } }
                ]
            });
        },

        beginQuest() {
            const workout = this.getCurrentWorkout();
            if (!workout) return;

            app.state.dungeon.isActive = true;
            app.state.dungeon.currentExerciseIndex = 0;
            app.state.dungeon.exercises = workout.exercises.map(ex => ({ 
                ...ex, 
                description: this.getExerciseDescription(ex.name)
            }));

            this.renderDungeon();
            document.getElementById('dungeon-overlay').classList.remove('hidden');
            document.getElementById('dungeon-overlay').classList.add('flex');
        },

        getExerciseDescription(name) {
            const descriptions = {
                'Bench Press': 'Builds raw pushing strength and chest mass.',
                'Overhead Press': 'Develops shoulder strength and stability.',
                'Incline DB Press': 'Targets upper chest for hypertrophy.',
                'Barbell Row': 'Builds back thickness and pulling power.',
                'Lat Pulldown': 'Targets lats for width and strength.',
                'Bicep Curl': 'Isolates the biceps for size.',
                'Squat': 'Foundation lift for total-leg strength.',
                'Romanian Deadlift': 'Emphasizes hamstrings and glutes.',
                'Leg Press': 'Quad-dominant lower-body volume.'
            };
            return descriptions[name] || 'Train with focus and perfect form.';
        },

        renderDungeon() {
            const content = document.getElementById('dungeon-content');
            if (!app.state.dungeon.isActive) {
                content.innerHTML = '';
                return;
            }

            const index = app.state.dungeon.currentExerciseIndex;
            const exercises = app.state.dungeon.exercises;

            if (index >= exercises.length) {
                content.innerHTML = `
                    <div class="text-center">
                        <h2 class="text-3xl font-bold text-green-400 mb-4">Quest Complete!</h2>
                        <p class="mb-6">You have cleared the dungeon. Return to base to claim your rewards.</p>
                        <button id="complete-dungeon-btn" class="btn-primary py-2 px-4 rounded">Return to Base</button>
                    </div>
                `;
                
                // Event listener handled by delegation in setupEventListeners
            } else {
                const ex = exercises[index];
                const weight = app.state.lifts[ex.name] ? app.state.lifts[ex.name].weight : 'N/A';

                let setsHtml = '';
                for (let i = 1; i <= ex.sets; i++) {
                    setsHtml += `<div class="flex items-center p-2 bg-stone-800 rounded-md">
                        <input id="set-${i}" type="checkbox" class="set-checkbox w-5 h-5 bg-stone-700 rounded text-indigo-500 focus:ring-0">
                        <label for="set-${i}" class="ml-3 font-semibold">Set ${i} Completed</label>
                    </div>`;
                }

                content.innerHTML = `
                    <div class="flex flex-col md:flex-row gap-8">
                        <div class="flex-1 text-center">
                            <div class="w-full h-48 bg-stone-900 rounded-lg flex items-center justify-center mb-4">
                                <p class="text-stone-500 text-2xl">[${ex.name} Image]</p>
                            </div>
                            <p class="text-stone-300">${ex.description}</p>
                        </div>

                        <div class="flex-1">
                            <p class="text-sm text-stone-400">Task ${index + 1} / ${exercises.length}</p>
                            <h2 class="text-3xl font-bold mb-2">${ex.name}</h2>
                            <p class="text-xl text-indigo-400 mb-4">${ex.sets} sets of ${ex.reps} reps @ ${weight} kg</p>

                            <div class="space-y-2 mb-6">
                                ${setsHtml}
                            </div>

                            <div class="flex gap-4 justify-center">
                                <button id="cancel-dungeon-btn" class="bg-red-600 hover:bg-red-500 py-2 px-4 rounded">Cancel Quest</button>
                                <button id="next-task-btn" class="btn-primary py-2 px-6 rounded" disabled>Next Task</button>
                            </div>
                        </div>
                    </div>
                `;

                // All event listeners handled by delegation in setupEventListeners
                // Initialize checkbox state
                this.checkIfComplete();
            }
        },

        completeDungeon() {
            app.state.dungeon.isActive = false;
            document.getElementById('dungeon-overlay').classList.add('hidden');
            document.getElementById('dungeon-overlay').classList.remove('flex');
            
            // Update stats
            app.state.stats.totalWorkouts++;
            app.state.stats.dungeonsCleared++;
            
            // XP and level up logic
            const xpGain = 50;
            app.state.xp += xpGain;
            app.state.mana += 50;
            
            let leveledUp = false;
            while (app.state.xp >= app.state.xpToNextLevel) {
                app.state.xp -= app.state.xpToNextLevel;
                app.state.level++;
                app.state.xpToNextLevel = Math.round(app.state.xpToNextLevel * 1.2);
                leveledUp = true;
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
            
            // Log activity
            const existingWorkout = app.state.activityLog.find(log => log.date === today && log.type === 'workout');
            if (!existingWorkout) {
                app.state.activityLog.push({ 
                    date: today, 
                    type: 'workout',
                    description: 'Daily Quest completed',
                    timestamp: new Date().toISOString()
                });
            }
            
            app.saveData();
            
            // Try to spawn a random gate after workout completion
            if (app.pages.gates && app.pages.gates.trySpawnRandomGate) {
                app.pages.gates.trySpawnRandomGate();
            }
            
            if (leveledUp) {
                app.showModal({
                    title: 'Level Up!',
                    html: `<div class="text-center"><div class="text-5xl font-black text-indigo-400 level-up">Lv ${app.state.level}</div><p class="mt-2 text-gray-300">Your power grows.</p></div>`,
                    actions: [{ label: 'Continue', primary: true, onClick: () => { } }]
                });
            } else {
                app.modalAlert("Workout logged!");
            }
        },

        cleanup() {
            // Remove event listeners to prevent memory leaks
            if (this.clickHandler) {
                document.removeEventListener('click', this.clickHandler);
                this.clickHandler = null;
            }
            if (this.changeHandler) {
                document.removeEventListener('change', this.changeHandler);
                this.changeHandler = null;
            }
        }
    };
}