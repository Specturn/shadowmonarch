export function initArchitect(app) {
    return {
        render() {
            return `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="card-bg p-6 rounded-lg">
                        <h2 class="text-2xl font-bold mb-4">Create New Routine</h2>
                        <div class="space-y-4">
                            <input id="architect-routine-name" type="text" placeholder="Routine Name" 
                                   class="w-full p-2 bg-gray-800 rounded border border-gray-700 focus:border-indigo-500 focus:ring-0">
                            
                            <div id="architect-exercise-section" class="hidden space-y-2">
                                <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                                    <div class="sm:col-span-2">
                                        <label class="text-sm text-gray-400">Add Exercise</label>
                                        <select id="architect-exercise-select" class="w-full p-2 bg-gray-800 rounded border border-gray-700 focus:border-indigo-500 focus:ring-0">
                                            <option value="">Select Exercise</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="text-sm text-gray-400">Sets</label>
                                        <input id="architect-sets" type="number" placeholder="e.g., 3" 
                                               class="w-full p-2 bg-gray-800 rounded border border-gray-700 focus:border-indigo-500 focus:ring-0">
                                    </div>
                                    <div>
                                        <label class="text-sm text-gray-400">Reps</label>
                                        <input id="architect-reps" type="text" placeholder="e.g., 5-8" 
                                               class="w-full p-2 bg-gray-800 rounded border border-gray-700 focus:border-indigo-500 focus:ring-0">
                                    </div>
                                </div>
                                <button id="architect-add-exercise-btn" class="w-full btn-primary mt-2 py-2 rounded">
                                    Add Exercise to Routine
                                </button>
                            </div>
                            
                            <div id="architect-routine-preview" class="mt-4 space-y-2">
                                <div class="text-gray-400 text-center py-4">No exercises added yet</div>
                            </div>
                            
                            <button id="architect-save-routine-btn" class="w-full bg-green-600 hover:bg-green-500 py-2 rounded mt-4 hidden">
                                Save Routine
                            </button>
                        </div>
                    </div>
                    
                    <div class="card-bg p-6 rounded-lg">
                        <h2 class="text-2xl font-bold mb-4">Saved Routines</h2>
                        <div id="saved-routines-list" class="space-y-2">
                            <div class="text-gray-400 text-center py-4">No saved routines yet</div>
                        </div>
                    </div>
                </div>
            `;
        },

        init() {
            this.setupEventListeners();
            this.populateExerciseDropdown();
            this.updateRoutinePreview();
            this.updateSavedRoutines();
        },

        setupEventListeners() {
            // Remove any existing listeners first
            this.cleanup();

            // Store references to bound functions for cleanup
            this.routineNameInputHandler = (event) => {
                const name = event.target.value.trim();
                const exerciseSection = document.getElementById('architect-exercise-section');
                if (name) {
                    app.state.currentCustomWorkout.name = name;
                    exerciseSection?.classList.remove('hidden');
                } else {
                    exerciseSection?.classList.add('hidden');
                }
            };

            this.addExerciseHandler = () => {
                this.addExerciseToRoutine();
            };

            this.saveRoutineHandler = () => {
                this.saveCurrentRoutine();
            };

            this.delegatedClickHandler = (event) => {
                if (event.target.classList.contains('remove-exercise-btn') || 
                    event.target.closest('.remove-exercise-btn')) {
                    const btn = event.target.closest('.remove-exercise-btn') || event.target;
                    const index = parseInt(btn.dataset.index);
                    this.removeExercise(index);
                } else if (event.target.classList.contains('use-routine-btn')) {
                    const routineId = event.target.dataset.routineId;
                    this.useRoutine(routineId);
                } else if (event.target.classList.contains('delete-routine-btn')) {
                    const routineId = event.target.dataset.routineId;
                    this.deleteRoutine(routineId);
                }
            };

            // Add event listeners with proper references
            const routineNameInput = document.getElementById('architect-routine-name');
            const addExerciseBtn = document.getElementById('architect-add-exercise-btn');
            const saveRoutineBtn = document.getElementById('architect-save-routine-btn');

            if (routineNameInput) {
                routineNameInput.addEventListener('input', this.routineNameInputHandler);
            }

            if (addExerciseBtn) {
                addExerciseBtn.addEventListener('click', this.addExerciseHandler);
            }

            if (saveRoutineBtn) {
                saveRoutineBtn.addEventListener('click', this.saveRoutineHandler);
            }

            // Event delegation for dynamic buttons
            document.addEventListener('click', this.delegatedClickHandler);
        },

        populateExerciseDropdown() {
            const select = document.getElementById('architect-exercise-select');
            if (!select) return;

            const masterExerciseList = [
                'Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row',
                'Romanian Deadlift', 'Front Squat', 'Hip Thrust', 'Dumbbell Bench Press',
                'Incline DB Press', 'Dumbbell Row', 'Goblet Squat', 'Bulgarian Split Squat',
                'Dumbbell Shoulder Press', 'Lateral Raise', 'Dumbbell Curl', 'Hammer Curl',
                'Tricep Skullcrusher', 'Lat Pulldown', 'Cable Row', 'Tricep Pushdown',
                'Leg Press', 'Leg Extension', 'Hamstring Curl', 'Calf Raise', 'Pull-up', 'Dip',
                'Power Clean', 'Box Jump'
            ];

            // Clear existing options except the first one
            select.innerHTML = '<option value="">Select Exercise</option>';
            
            masterExerciseList.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise;
                option.textContent = exercise;
                select.appendChild(option);
            });
        },

        updateRoutinePreview() {
            const previewContainer = document.getElementById('architect-routine-preview');
            const saveBtn = document.getElementById('architect-save-routine-btn');
            
            if (!previewContainer) return;

            if (!app.state.currentCustomWorkout.exercises || app.state.currentCustomWorkout.exercises.length === 0) {
                previewContainer.innerHTML = '<div class="text-gray-400 text-center py-4">No exercises added yet</div>';
                if (saveBtn) saveBtn.classList.add('hidden');
                return;
            }

            const html = `
                <h3 class="text-lg font-semibold mb-2">Routine Preview</h3>
                ${app.state.currentCustomWorkout.exercises.map((exercise, index) => `
                    <div class="flex items-center justify-between p-3 bg-gray-800 rounded">
                        <div>
                            <span class="font-semibold">${exercise.name}</span>
                            <span class="text-sm text-gray-400 ml-2">${exercise.sets} x ${exercise.reps}</span>
                        </div>
                        <button class="remove-exercise-btn text-red-400 hover:text-red-300" data-index="${index}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('')}
            `;
            
            previewContainer.innerHTML = html;
            if (saveBtn) saveBtn.classList.remove('hidden');
        },

        addExerciseToRoutine() {
            const exerciseSelect = document.getElementById('architect-exercise-select');
            const setsInput = document.getElementById('architect-sets');
            const repsInput = document.getElementById('architect-reps');

            const exercise = exerciseSelect?.value;
            const sets = setsInput?.value;
            const reps = repsInput?.value;

            if (!exercise || !sets || !reps) {
                app.modalAlert("Please fill out all exercise fields.");
                return;
            }

            if (!app.state.currentCustomWorkout.exercises) {
                app.state.currentCustomWorkout.exercises = [];
            }

            app.state.currentCustomWorkout.exercises.push({
                name: exercise,
                sets: parseInt(sets),
                reps: reps
            });

            // Clear inputs
            if (exerciseSelect) exerciseSelect.value = '';
            if (setsInput) setsInput.value = '';
            if (repsInput) repsInput.value = '';

            // Update preview without full page re-render
            this.updateRoutinePreview();
        },

        saveCurrentRoutine() {
            if (!app.state.currentCustomWorkout.name || !app.state.currentCustomWorkout.exercises || app.state.currentCustomWorkout.exercises.length === 0) {
                app.modalAlert("Please add a name and at least one exercise to your routine.");
                return;
            }

            if (!app.state.savedRoutines) {
                app.state.savedRoutines = [];
            }

            // Add unique ID and timestamp
            const routine = {
                ...app.state.currentCustomWorkout,
                id: `routine_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                createdAt: Date.now()
            };

            app.state.savedRoutines.push(routine);
            app.saveData();
            
            app.modalAlert(`Routine "${app.state.currentCustomWorkout.name}" saved!`, 'Routine Saved');
            
            // Reset current workout
            app.state.currentCustomWorkout = { name: '', exercises: [] };
            
            // Clear form and update displays
            const nameInput = document.getElementById('architect-routine-name');
            const exerciseSection = document.getElementById('architect-exercise-section');
            if (nameInput) nameInput.value = '';
            if (exerciseSection) exerciseSection.classList.add('hidden');
            
            this.updateRoutinePreview();
            this.updateSavedRoutines();
        },

        removeExercise(index) {
            if (!app.state.currentCustomWorkout.exercises || index < 0 || index >= app.state.currentCustomWorkout.exercises.length) {
                return;
            }

            app.state.currentCustomWorkout.exercises.splice(index, 1);
            this.updateRoutinePreview();
        },

        updateSavedRoutines() {
            const container = document.getElementById('saved-routines-list');
            if (!container) return;

            if (!app.state.savedRoutines || app.state.savedRoutines.length === 0) {
                container.innerHTML = '<div class="text-gray-400 text-center py-4">No saved routines yet</div>';
                return;
            }

            const html = app.state.savedRoutines.map(routine => `
                <div class="p-4 bg-gray-800 rounded-lg">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-lg">${routine.name}</h4>
                        <div class="flex gap-2">
                            <button class="use-routine-btn bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded text-sm" data-routine-id="${routine.id}">
                                Use
                            </button>
                            <button class="delete-routine-btn bg-red-600 hover:bg-red-500 px-3 py-1 rounded text-sm" data-routine-id="${routine.id}">
                                Delete
                            </button>
                        </div>
                    </div>
                    <div class="text-sm text-gray-400 mb-2">${routine.exercises.length} exercises</div>
                    <div class="space-y-1">
                        ${routine.exercises.map(exercise => `
                            <div class="text-sm">
                                <span class="text-gray-300">${exercise.name}</span>
                                <span class="text-gray-500 ml-2">${exercise.sets} x ${exercise.reps}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            container.innerHTML = html;
        },

        useRoutine(routineId) {
            const routine = app.state.savedRoutines.find(r => r.id === routineId);
            if (!routine) {
                app.modalAlert('Routine not found!');
                return;
            }

            // Copy routine to current workout (without ID and timestamp)
            app.state.currentCustomWorkout = {
                name: routine.name,
                exercises: [...routine.exercises]
            };

            // Update form
            const nameInput = document.getElementById('architect-routine-name');
            const exerciseSection = document.getElementById('architect-exercise-section');
            
            if (nameInput) nameInput.value = routine.name;
            if (exerciseSection) exerciseSection.classList.remove('hidden');

            this.updateRoutinePreview();
            
            app.modalAlert(`Loaded routine "${routine.name}" for editing.`);
        },

        deleteRoutine(routineId) {
            app.modalConfirm('Are you sure you want to delete this routine?').then(confirmed => {
                if (confirmed) {
                    const index = app.state.savedRoutines.findIndex(r => r.id === routineId);
                    if (index !== -1) {
                        const routineName = app.state.savedRoutines[index].name;
                        app.state.savedRoutines.splice(index, 1);
                        app.saveData();
                        this.updateSavedRoutines();
                        app.modalAlert(`Routine "${routineName}" deleted.`);
                    }
                }
            });
        },

        cleanup() {
            // Remove event listeners to prevent memory leaks
            const routineNameInput = document.getElementById('architect-routine-name');
            const addExerciseBtn = document.getElementById('architect-add-exercise-btn');
            const saveRoutineBtn = document.getElementById('architect-save-routine-btn');

            if (routineNameInput && this.routineNameInputHandler) {
                routineNameInput.removeEventListener('input', this.routineNameInputHandler);
            }

            if (addExerciseBtn && this.addExerciseHandler) {
                addExerciseBtn.removeEventListener('click', this.addExerciseHandler);
            }

            if (saveRoutineBtn && this.saveRoutineHandler) {
                saveRoutineBtn.removeEventListener('click', this.saveRoutineHandler);
            }

            if (this.delegatedClickHandler) {
                document.removeEventListener('click', this.delegatedClickHandler);
            }

            // Clear handler references
            this.routineNameInputHandler = null;
            this.addExerciseHandler = null;
            this.saveRoutineHandler = null;
            this.delegatedClickHandler = null;
        }
    };
}