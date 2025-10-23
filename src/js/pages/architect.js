export function initArchitect(app) {
    return {
        render() {
            return `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="card-bg p-6 rounded-lg">
                        <div class="text-center">
                            <div class="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <i class="fas fa-plus text-3xl text-white"></i>
                            </div>
                            <h2 class="text-2xl font-bold mb-2">Create New Routine</h2>
                            <p class="text-gray-400 mb-6">Build your custom workout routine with our interactive body diagram</p>
                            <button id="open-routine-builder-btn" class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 mx-auto shadow-lg hover:shadow-xl">
                                <i class="fas fa-hammer"></i>
                                <span>Open Routine Builder</span>
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

                <!-- Interactive Body Builder Overlay -->
                <div id="routine-builder-overlay" class="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 hidden">
                    <div class="h-full flex flex-col">
                        <!-- Header -->
                        <div class="bg-gradient-to-r from-green-900/80 to-emerald-900/80 border-b border-green-500/30 p-6">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-4">
                                    <div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                                        <i class="fas fa-user text-xl text-white"></i>
                                    </div>
                                    <div>
                                        <h1 class="text-2xl font-bold text-white">Interactive Body Builder</h1>
                                        <p class="text-green-200">Click on muscle groups to select exercises</p>
                                    </div>
                                </div>
                                <button id="close-routine-builder-btn" class="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg flex items-center justify-center transition-all duration-200">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Main Content -->
                        <div class="flex-1 overflow-hidden">
                            <div class="h-full grid grid-cols-1 lg:grid-cols-2 gap-0">
                                <!-- Interactive Body Panel -->
                                <div class="bg-gradient-to-br from-gray-900 to-gray-800 border-r border-gray-700 p-6 overflow-y-auto">
                                    <div class="max-w-md mx-auto">
                                        <!-- Body View Toggle -->
                                        <div class="text-center mb-6">
                                            <div class="text-sm text-gray-400 mb-3">Select muscle groups by clicking on the body</div>
                                            <div class="flex items-center justify-center space-x-4 mb-4">
                                                <button id="body-view-front" class="body-view-btn active px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">Front View</button>
                                                <button id="body-view-back" class="body-view-btn px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium">Back View</button>
                                            </div>
                                        </div>
                                        
                                        <!-- Interactive Body Diagram -->
                                        <div class="body-svg-container relative bg-gray-800/30 rounded-xl p-6 border border-gray-700">
                                            <div id="body-diagram-front" class="body-diagram active">
                                                <!-- Front view will be inserted here -->
                                            </div>
                                            <div id="body-diagram-back" class="body-diagram hidden">
                                                <!-- Back view will be inserted here -->
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Exercise Selection Panel -->
                                <div class="bg-gradient-to-br from-gray-800 to-gray-900 p-6 overflow-y-auto">
                                    <div class="mb-6">
                                        <h3 class="text-xl font-bold text-white mb-2 flex items-center">
                                            <span id="selected-muscle-group" class="text-green-400">Select a muscle group</span>
                                        </h3>
                                        <div class="text-sm text-gray-400" id="muscle-group-description">
                                            Click on a muscle group on the body diagram to see available exercises
                                        </div>
                                    </div>

                                    <!-- Exercise List -->
                                    <div id="muscle-exercises-list" class="space-y-3">
                                        <div class="text-center py-12 text-gray-500">
                                            <i class="fas fa-hand-pointer text-4xl mb-4 text-gray-600"></i>
                                            <div class="text-lg font-medium mb-2">Interactive Body Selection</div>
                                            <div class="text-sm">Click on any muscle group to see exercises</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="bg-gray-900 border-t border-gray-700 p-6">
                            <div class="flex items-center justify-center">
                                <button id="builder-cancel-btn" class="bg-gray-600 hover:bg-gray-500 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200">
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        init() {
            this.selectedMuscleGroup = null;
            this.setupEventListeners();
        },
        setupEventListeners() {
            const openBtn = document.getElementById('open-routine-builder-btn');
            const closeBtn = document.getElementById('close-routine-builder-btn');
            const cancelBtn = document.getElementById('builder-cancel-btn');

            if (openBtn) {
                openBtn.addEventListener('click', () => this.openBuilder());
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeBuilder());
            }

            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => this.closeBuilder());
            }
        },

        openBuilder() {
            const overlay = document.getElementById('routine-builder-overlay');
            if (overlay) {
                overlay.classList.remove('hidden');
                setTimeout(() => {
                    overlay.style.opacity = '1';
                }, 10);
                this.initializeBodyDiagram();
            }
        },

        closeBuilder() {
            const overlay = document.getElementById('routine-builder-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 200);
            }
        },

        initializeBodyDiagram() {
            const userGender = app.state.onboardingData?.gender || 'male';
            this.createBodyDiagram('front', userGender);
            this.createBodyDiagram('back', userGender);
            this.setupBodyInteractions();
            this.initializeMuscleData();
        },

        createBodyDiagram(view, gender) {
            const container = document.getElementById(`body-diagram-${view}`);
            if (!container) return;

            const svg = this.createBodySVG(view, gender);
            container.innerHTML = svg;
        },

        createBodySVG(view, gender) {
            const isBack = view === 'back';

            return `
                <svg viewBox="0 0 300 500" class="body-svg w-full max-w-xs mx-auto" style="max-height: 400px;">
                    <defs>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge> 
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    <!-- Body Base -->
                    <circle cx="150" cy="60" r="25" fill="#374151" stroke="#6B7280" stroke-width="1"/>
                    <rect x="145" y="80" width="10" height="15" fill="#374151" stroke="#6B7280" stroke-width="1"/>
                    <path d="M120 95 L180 95 L165 200 L175 280 L125 280 L135 200 Z" fill="#374151" stroke="#6B7280" stroke-width="1"/>
                    <ellipse cx="105" cy="140" rx="12" ry="45" fill="#374151" stroke="#6B7280" stroke-width="1"/>
                    <ellipse cx="195" cy="140" rx="12" ry="45" fill="#374151" stroke="#6B7280" stroke-width="1"/>
                    <ellipse cx="135" cy="350" rx="18" ry="60" fill="#374151" stroke="#6B7280" stroke-width="1"/>
                    <ellipse cx="165" cy="350" rx="18" ry="60" fill="#374151" stroke="#6B7280" stroke-width="1"/>
                    
                    ${isBack ? this.getBackMuscles() : this.getFrontMuscles()}
                </svg>
            `;
        },

        getFrontMuscles() {
            return `
                <!-- Chest -->
                <ellipse cx="150" cy="130" rx="25" ry="20" 
                         class="muscle-group" 
                         data-muscle="Chest" 
                         data-description="Pectorals - Build a powerful chest"
                         fill="rgba(239, 68, 68, 0.5)" 
                         stroke="rgba(239, 68, 68, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
                
                <!-- Shoulders -->
                <circle cx="120" cy="110" r="15" 
                        class="muscle-group" 
                        data-muscle="Shoulders" 
                        data-description="Deltoids - Build rounded shoulders"
                        fill="rgba(251, 191, 36, 0.5)" 
                        stroke="rgba(251, 191, 36, 0.8)" 
                        stroke-width="2"
                        style="cursor: pointer; transition: all 0.3s ease;"/>
                <circle cx="180" cy="110" r="15" 
                        class="muscle-group" 
                        data-muscle="Shoulders" 
                        data-description="Deltoids - Build rounded shoulders"
                        fill="rgba(251, 191, 36, 0.5)" 
                        stroke="rgba(251, 191, 36, 0.8)" 
                        stroke-width="2"
                        style="cursor: pointer; transition: all 0.3s ease;"/>
                
                <!-- Arms -->
                <ellipse cx="105" cy="150" rx="8" ry="20" 
                         class="muscle-group" 
                         data-muscle="Biceps" 
                         data-description="Biceps - Build impressive arm peaks"
                         fill="rgba(59, 130, 246, 0.5)" 
                         stroke="rgba(59, 130, 246, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
                <ellipse cx="195" cy="150" rx="8" ry="20" 
                         class="muscle-group" 
                         data-muscle="Biceps" 
                         data-description="Biceps - Build impressive arm peaks"
                         fill="rgba(59, 130, 246, 0.5)" 
                         stroke="rgba(59, 130, 246, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
                
                <!-- Abs -->
                <rect x="135" y="160" width="30" height="35" rx="5" 
                      class="muscle-group" 
                      data-muscle="Abs" 
                      data-description="Abdominals - Build a strong core"
                      fill="rgba(34, 197, 94, 0.5)" 
                      stroke="rgba(34, 197, 94, 0.8)" 
                      stroke-width="2"
                      style="cursor: pointer; transition: all 0.3s ease;"/>
                
                <!-- Legs -->
                <ellipse cx="135" cy="330" rx="15" ry="35" 
                         class="muscle-group" 
                         data-muscle="Quadriceps" 
                         data-description="Quads - Build powerful leg muscles"
                         fill="rgba(236, 72, 153, 0.5)" 
                         stroke="rgba(236, 72, 153, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
                <ellipse cx="165" cy="330" rx="15" ry="35" 
                         class="muscle-group" 
                         data-muscle="Quadriceps" 
                         data-description="Quads - Build powerful leg muscles"
                         fill="rgba(236, 72, 153, 0.5)" 
                         stroke="rgba(236, 72, 153, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
            `;
        },

        getBackMuscles() {
            return `
                <!-- Traps -->
                <path d="M130 100 L170 100 L160 120 L140 120 Z" 
                      class="muscle-group" 
                      data-muscle="Traps" 
                      data-description="Trapezius - Build a powerful upper back"
                      fill="rgba(251, 191, 36, 0.5)" 
                      stroke="rgba(251, 191, 36, 0.8)" 
                      stroke-width="2"
                      style="cursor: pointer; transition: all 0.3s ease;"/>
                
                <!-- Lats -->
                <ellipse cx="150" cy="160" rx="30" ry="25" 
                         class="muscle-group" 
                         data-muscle="Lats" 
                         data-description="Latissimus Dorsi - Build a wide back"
                         fill="rgba(59, 130, 246, 0.5)" 
                         stroke="rgba(59, 130, 246, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
                
                <!-- Triceps -->
                <ellipse cx="105" cy="150" rx="8" ry="18" 
                         class="muscle-group" 
                         data-muscle="Triceps" 
                         data-description="Triceps - Build strong arm muscles"
                         fill="rgba(239, 68, 68, 0.5)" 
                         stroke="rgba(239, 68, 68, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
                <ellipse cx="195" cy="150" rx="8" ry="18" 
                         class="muscle-group" 
                         data-muscle="Triceps" 
                         data-description="Triceps - Build strong arm muscles"
                         fill="rgba(239, 68, 68, 0.5)" 
                         stroke="rgba(239, 68, 68, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
                
                <!-- Glutes -->
                <ellipse cx="150" cy="250" rx="25" ry="18" 
                         class="muscle-group" 
                         data-muscle="Glutes" 
                         data-description="Glutes - Build powerful hip muscles"
                         fill="rgba(236, 72, 153, 0.5)" 
                         stroke="rgba(236, 72, 153, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
                
                <!-- Hamstrings -->
                <ellipse cx="135" cy="330" rx="12" ry="35" 
                         class="muscle-group" 
                         data-muscle="Hamstrings" 
                         data-description="Hamstrings - Build strong posterior legs"
                         fill="rgba(245, 101, 101, 0.5)" 
                         stroke="rgba(245, 101, 101, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
                <ellipse cx="165" cy="330" rx="12" ry="35" 
                         class="muscle-group" 
                         data-muscle="Hamstrings" 
                         data-description="Hamstrings - Build strong posterior legs"
                         fill="rgba(245, 101, 101, 0.5)" 
                         stroke="rgba(245, 101, 101, 0.8)" 
                         stroke-width="2"
                         style="cursor: pointer; transition: all 0.3s ease;"/>
            `;
        },
        initializeMuscleData() {
            this.muscleExercises = {
                'Chest': [
                    { name: 'Bench Press', sets: '3-4', reps: '6-10', difficulty: 'Intermediate' },
                    { name: 'Push-ups', sets: '3-4', reps: '10-20', difficulty: 'Beginner' },
                    { name: 'Incline Bench Press', sets: '3-4', reps: '8-12', difficulty: 'Intermediate' },
                    { name: 'Dumbbell Flyes', sets: '3', reps: '10-15', difficulty: 'Beginner' }
                ],
                'Shoulders': [
                    { name: 'Overhead Press', sets: '3-4', reps: '6-10', difficulty: 'Intermediate' },
                    { name: 'Lateral Raises', sets: '3', reps: '12-15', difficulty: 'Beginner' },
                    { name: 'Front Raises', sets: '3', reps: '10-12', difficulty: 'Beginner' }
                ],
                'Biceps': [
                    { name: 'Barbell Curls', sets: '3-4', reps: '8-12', difficulty: 'Beginner' },
                    { name: 'Dumbbell Curls', sets: '3', reps: '10-15', difficulty: 'Beginner' },
                    { name: 'Hammer Curls', sets: '3', reps: '10-12', difficulty: 'Beginner' }
                ],
                'Triceps': [
                    { name: 'Close-Grip Bench Press', sets: '3-4', reps: '8-12', difficulty: 'Intermediate' },
                    { name: 'Tricep Dips', sets: '3', reps: '8-15', difficulty: 'Intermediate' },
                    { name: 'Overhead Tricep Extension', sets: '3', reps: '10-12', difficulty: 'Beginner' }
                ],
                'Abs': [
                    { name: 'Crunches', sets: '3-4', reps: '15-25', difficulty: 'Beginner' },
                    { name: 'Plank', sets: '3', reps: '30-60s', difficulty: 'Beginner' },
                    { name: 'Russian Twists', sets: '3', reps: '20-30', difficulty: 'Beginner' }
                ],
                'Lats': [
                    { name: 'Pull-ups', sets: '3-4', reps: '5-12', difficulty: 'Intermediate' },
                    { name: 'Lat Pulldowns', sets: '3-4', reps: '8-12', difficulty: 'Beginner' },
                    { name: 'Bent-over Rows', sets: '3-4', reps: '8-12', difficulty: 'Intermediate' }
                ],
                'Traps': [
                    { name: 'Shrugs', sets: '3-4', reps: '12-15', difficulty: 'Beginner' },
                    { name: 'Upright Rows', sets: '3', reps: '10-12', difficulty: 'Intermediate' },
                    { name: 'Face Pulls', sets: '3', reps: '15-20', difficulty: 'Beginner' }
                ],
                'Quadriceps': [
                    { name: 'Squats', sets: '3-4', reps: '8-12', difficulty: 'Intermediate' },
                    { name: 'Leg Press', sets: '3-4', reps: '12-15', difficulty: 'Beginner' },
                    { name: 'Lunges', sets: '3', reps: '10-12', difficulty: 'Beginner' }
                ],
                'Hamstrings': [
                    { name: 'Romanian Deadlifts', sets: '3-4', reps: '8-12', difficulty: 'Intermediate' },
                    { name: 'Leg Curls', sets: '3', reps: '12-15', difficulty: 'Beginner' },
                    { name: 'Stiff-leg Deadlifts', sets: '3', reps: '10-12', difficulty: 'Intermediate' }
                ],
                'Glutes': [
                    { name: 'Hip Thrusts', sets: '3-4', reps: '12-15', difficulty: 'Beginner' },
                    { name: 'Glute Bridges', sets: '3', reps: '15-20', difficulty: 'Beginner' },
                    { name: 'Bulgarian Split Squats', sets: '3', reps: '10-12', difficulty: 'Intermediate' }
                ]
            };
        },

        setupBodyInteractions() {
            // Body view toggle
            const frontBtn = document.getElementById('body-view-front');
            const backBtn = document.getElementById('body-view-back');

            if (frontBtn && backBtn) {
                frontBtn.addEventListener('click', () => this.switchBodyView('front'));
                backBtn.addEventListener('click', () => this.switchBodyView('back'));
            }

            // Muscle group interactions
            setTimeout(() => {
                const muscleGroups = document.querySelectorAll('.muscle-group');

                muscleGroups.forEach(muscle => {
                    const muscleType = muscle.dataset.muscle;
                    const description = muscle.dataset.description;

                    // Desktop hover effects
                    if (!this.isMobileDevice()) {
                        muscle.addEventListener('mouseenter', () => {
                            this.highlightMuscle(muscle, muscleType, description);
                        });

                        muscle.addEventListener('mouseleave', () => {
                            this.unhighlightMuscle(muscle);
                        });
                    }

                    // Click/tap for both desktop and mobile
                    muscle.addEventListener('click', () => {
                        this.selectMuscle(muscle, muscleType, description);
                    });
                });
            }, 100);
        },

        switchBodyView(view) {
            const frontDiagram = document.getElementById('body-diagram-front');
            const backDiagram = document.getElementById('body-diagram-back');
            const frontBtn = document.getElementById('body-view-front');
            const backBtn = document.getElementById('body-view-back');

            if (view === 'front') {
                frontDiagram?.classList.remove('hidden');
                frontDiagram?.classList.add('active');
                backDiagram?.classList.add('hidden');
                backDiagram?.classList.remove('active');

                frontBtn?.classList.add('active', 'bg-green-600');
                frontBtn?.classList.remove('bg-gray-600');
                backBtn?.classList.remove('active', 'bg-green-600');
                backBtn?.classList.add('bg-gray-600');
            } else {
                backDiagram?.classList.remove('hidden');
                backDiagram?.classList.add('active');
                frontDiagram?.classList.add('hidden');
                frontDiagram?.classList.remove('active');

                backBtn?.classList.add('active', 'bg-green-600');
                backBtn?.classList.remove('bg-gray-600');
                frontBtn?.classList.remove('active', 'bg-green-600');
                frontBtn?.classList.add('bg-gray-600');
            }

            // Re-setup interactions for new view
            setTimeout(() => this.setupBodyInteractions(), 100);
        },

        isMobileDevice() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                window.innerWidth <= 768;
        },

        highlightMuscle(element, muscleType, description) {
            // Reset all muscles
            document.querySelectorAll('.muscle-group').forEach(muscle => {
                muscle.style.filter = 'none';
                muscle.style.transform = 'scale(1)';
            });

            // Highlight selected
            element.style.filter = 'brightness(1.3) drop-shadow(0 0 8px currentColor)';
            element.style.transform = 'scale(1.05)';

            this.updateMuscleDisplay(muscleType, description);
            this.showExercises(muscleType);
        },

        unhighlightMuscle(element) {
            if (!this.selectedMuscleGroup) {
                element.style.filter = 'none';
                element.style.transform = 'scale(1)';
            }
        },

        selectMuscle(element, muscleType, description) {
            // Clear previous selection
            document.querySelectorAll('.muscle-group').forEach(muscle => {
                muscle.classList.remove('selected');
                if (muscle !== element) {
                    muscle.style.filter = 'none';
                    muscle.style.transform = 'scale(1)';
                }
            });

            // Mark as selected
            element.classList.add('selected');
            element.style.filter = 'brightness(1.4) drop-shadow(0 0 12px currentColor)';
            element.style.transform = 'scale(1.1)';

            this.selectedMuscleGroup = muscleType;
            this.updateMuscleDisplay(muscleType, description);
            this.showExercises(muscleType);
        },

        updateMuscleDisplay(muscleType, description) {
            const muscleSpan = document.getElementById('selected-muscle-group');
            const descDiv = document.getElementById('muscle-group-description');

            if (muscleSpan) muscleSpan.textContent = muscleType;
            if (descDiv) descDiv.textContent = description;
        },

        showExercises(muscleType) {
            const exercisesList = document.getElementById('muscle-exercises-list');
            const exercises = this.muscleExercises[muscleType] || [];

            if (!exercisesList) return;

            if (exercises.length === 0) {
                exercisesList.innerHTML = `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                        <div>No exercises found for ${muscleType}</div>
                    </div>
                `;
                return;
            }

            exercisesList.innerHTML = exercises.map(exercise => `
                <div class="exercise-card p-4 bg-gray-800/50 border border-gray-600 rounded-lg hover:border-green-500 cursor-pointer transition-all duration-200 group">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="font-semibold text-white group-hover:text-green-400 transition-colors text-lg">
                                ${exercise.name}
                            </div>
                            <div class="text-sm text-gray-400 mt-1">
                                ${exercise.sets} sets × ${exercise.reps} reps
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <span class="text-xs px-3 py-1 rounded-full font-medium ${this.getDifficultyColor(exercise.difficulty)}">
                                ${exercise.difficulty}
                            </span>
                            <i class="fas fa-dumbbell text-green-400 opacity-0 group-hover:opacity-100 transition-opacity text-lg"></i>
                        </div>
                    </div>
                </div>
            `).join('');
        },

        getDifficultyColor(difficulty) {
            switch (difficulty) {
                case 'Beginner': return 'bg-green-500/20 text-green-400 border border-green-500/30';
                case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
                case 'Advanced': return 'bg-red-500/20 text-red-400 border border-red-500/30';
                default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
            }
        }
    };
}