export function initDashboard(app) {
    return {
        render() {
            return `
                <div class="dashboard-layout">
                    <!-- Fixed Player Card (Left Column) -->
                    <div class="dashboard-player-card card-bg p-6 rounded-lg text-center">
                        <div id="avatar-container" class="relative w-32 h-32 mx-auto mb-4 cursor-pointer group">
                            <div id="avatar-placeholder" class="w-full h-full rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-800">
                                <i class="fas fa-user text-4xl text-gray-500"></i>
                            </div>
                            <img id="dashboard-avatar-img" src="" class="hidden w-full h-full rounded-full object-cover border-2 border-indigo-500">
                            <div class="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <i class="fas fa-camera text-white text-2xl"></i>
                            </div>
                        </div>
                        <input type="file" id="avatar-upload-input" class="hidden" accept="image/*">
                        <h2 id="player-name-display" class="text-2xl font-bold">Loading...</h2>
                        <button id="edit-name-btn" class="text-sm text-gray-400 hover:text-white">
                            <i class="fas fa-pencil-alt mr-1"></i> Edit Name
                        </button>
                        <div class="grid grid-cols-2 gap-3 mt-4 text-left">
                            <div class="p-3 bg-gray-800 rounded">
                                <p class="text-xs uppercase text-gray-400">Level</p>
                                <p id="pc-level" class="text-xl font-bold">-</p>
                            </div>
                            <div class="p-3 bg-gray-800 rounded">
                                <p class="text-xs uppercase text-gray-400">Current Streak</p>
                                <p id="pc-streak" class="text-xl font-bold">-</p>
                            </div>
                            <div class="p-3 bg-gray-800 rounded col-span-2">
                                <p class="text-xs uppercase text-gray-400">Longest Streak</p>
                                <p id="pc-longest" class="text-xl font-bold">-</p>
                            </div>
                        </div>
                        <div class="mt-4 text-left">
                            <div class="flex items-center justify-between mb-2">
                                <p class="text-sm font-semibold">Showcased Achievements</p>
                                <button id="select-showcase-btn" class="text-xs px-2 py-1 bg-gray-800 rounded border border-gray-700 hover:border-indigo-500">
                                    Select Showcase
                                </button>
                            </div>
                            <div id="showcase-achievements" class="grid grid-cols-3 gap-2"></div>
                        </div>
                    </div>
                    
                    <!-- Scrollable Content Area (Right Column) -->
                    <div class="dashboard-content-area">
                        <div class="dashboard-content-inner grid grid-cols-1 gap-6">
                        <div class="card-bg p-6 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div class="text-center">
                                <p class="text-xs uppercase text-gray-400">Level</p>
                                <p id="stat-level" class="text-2xl font-bold">-</p>
                                <div class="progress-bar mt-2">
                                    <div id="xp-bar" class="progress-bar-inner" style="width: 0%"></div>
                                </div>
                                <p id="stat-xp" class="text-xs text-gray-400 mt-1">- / - XP</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs uppercase text-gray-400">Mana</p>
                                <p id="stat-mana" class="text-2xl font-bold">-</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs uppercase text-gray-400">Streak</p>
                                <p id="stat-streak" class="text-2xl font-bold">-</p>
                            </div>
                            <div class="text-center">
                                <p class="text-xs uppercase text-gray-400">Workouts</p>
                                <p id="stat-workouts" class="text-2xl font-bold">-</p>
                            </div>
                        </div>

                        <div class="card-bg p-6 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="text-xl font-bold">Strength Profile</h3>
                            </div>
                            <canvas id="radar-chart" height="120"></canvas>
                        </div>
                        
                        <!-- Activity Calendar (Full Width in Content Area) -->
                        <div id="activity-calendar-container" class="card-bg p-6 rounded-lg">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xl font-bold">Activity Calendar</h3>
                                <div class="flex items-center gap-4 text-xs">
                                    <div class="flex items-center gap-1">
                                        <div class="w-3 h-3 bg-green-500 rounded"></div>
                                        <span class="text-gray-400">Workout</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <div class="w-3 h-3 bg-purple-500 rounded"></div>
                                        <span class="text-gray-400">Gate</span>
                                    </div>
                                    <div class="flex items-center gap-1">
                                        <div class="w-3 h-3 bg-blue-500 rounded"></div>
                                        <span class="text-gray-400">Both</span>
                                    </div>
                                </div>
                            </div>
                            <div id="activity-calendar" class="activity-calendar">
                                <!-- Calendar will be rendered here -->
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            `;
        },

        init() {
            this.setupEventListeners();
            this.updateContent();
            this.renderAvatar();
            this.renderRadarChart();
        },

        updateContent() {
            // Update all dynamic content after render to prevent infinite loops
            const playerNameEl = document.getElementById('player-name-display');
            const pcLevelEl = document.getElementById('pc-level');
            const pcStreakEl = document.getElementById('pc-streak');
            const pcLongestEl = document.getElementById('pc-longest');
            const statLevelEl = document.getElementById('stat-level');
            const statManaEl = document.getElementById('stat-mana');
            const statStreakEl = document.getElementById('stat-streak');
            const statWorkoutsEl = document.getElementById('stat-workouts');
            const xpBarEl = document.getElementById('xp-bar');
            const statXpEl = document.getElementById('stat-xp');

            if (playerNameEl) playerNameEl.textContent = app.state.playerName;
            if (pcLevelEl) pcLevelEl.textContent = app.state.level;
            if (pcStreakEl) pcStreakEl.textContent = app.state.streak;
            if (pcLongestEl) pcLongestEl.textContent = app.state.longestStreak;
            if (statLevelEl) statLevelEl.textContent = app.state.level;
            if (statManaEl) statManaEl.textContent = app.state.mana;
            if (statStreakEl) statStreakEl.textContent = app.state.streak;
            if (statWorkoutsEl) statWorkoutsEl.textContent = app.state.stats.totalWorkouts;
            
            if (xpBarEl) {
                const xpPercentage = (app.state.xp / app.state.xpToNextLevel) * 100;
                xpBarEl.style.width = `${xpPercentage}%`;
            }
            
            if (statXpEl) {
                statXpEl.textContent = `${app.state.xp} / ${app.state.xpToNextLevel} XP`;
            }
        },

        setupEventListeners() {
            // Remove any existing listeners first
            this.cleanup();

            // Store references to bound functions for cleanup
            this.avatarClickHandler = () => {
                const avatarInput = document.getElementById('avatar-upload-input');
                if (avatarInput) avatarInput.click();
            };

            this.avatarChangeHandler = (event) => {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    app.state.customAvatar = e.target.result;
                    app.saveData();
                    this.renderAvatar();
                };
                reader.readAsDataURL(file);
            };

            this.editNameHandler = () => {
                app.modalPrompt({
                    title: 'Edit Name',
                    message: 'Enter your new name:',
                    placeholder: app.state.playerName
                }).then((val) => {
                    if (val && val.trim() !== '') {
                        app.state.playerName = val.trim();
                        app.saveData();
                        document.getElementById('player-name-display').textContent = app.state.playerName;
                    }
                });
            };

            this.showcaseHandler = () => {
                // This would open showcase selector - simplified for now
                app.modalAlert('Showcase selector coming soon!');
            };

            // Add event listeners with proper references
            const avatarContainer = document.getElementById('avatar-container');
            const avatarInput = document.getElementById('avatar-upload-input');
            const editNameBtn = document.getElementById('edit-name-btn');
            const showcaseBtn = document.getElementById('select-showcase-btn');
            
            if (avatarContainer) {
                avatarContainer.addEventListener('click', this.avatarClickHandler);
            }

            if (avatarInput) {
                avatarInput.addEventListener('change', this.avatarChangeHandler);
            }

            if (editNameBtn) {
                editNameBtn.addEventListener('click', this.editNameHandler);
            }

            if (showcaseBtn) {
                showcaseBtn.addEventListener('click', this.showcaseHandler);
            }
        },

        renderAvatar() {
            const placeholder = document.getElementById('avatar-placeholder');
            const avatarImg = document.getElementById('dashboard-avatar-img');
            
            if (app.state.customAvatar && avatarImg && placeholder) {
                avatarImg.src = app.state.customAvatar;
                avatarImg.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else if (placeholder && avatarImg) {
                avatarImg.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }
        },

        renderRadarChart() {
            const canvas = document.getElementById('radar-chart');
            if (!canvas || !window.Chart) return;

            // Destroy existing chart if it exists to prevent multiple instances
            if (this.radarChart) {
                this.radarChart.destroy();
                this.radarChart = null;
            }

            const ctx = canvas.getContext('2d');
            
            // Sample data - in real app this would be calculated from user's lifts
            const data = {
                labels: ['Squat', 'Bench', 'Deadlift', 'OHP', 'Row'],
                datasets: [{
                    label: 'Current Strength',
                    data: [
                        app.state.lifts.Squat?.weight || 0,
                        app.state.lifts['Bench Press']?.weight || 0,
                        app.state.lifts.Deadlift?.weight || 0,
                        app.state.lifts['Overhead Press']?.weight || 0,
                        app.state.lifts['Barbell Row']?.weight || 0
                    ],
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 2
                }]
            };

            this.radarChart = new Chart(ctx, {
                type: 'radar',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    backgroundColor: 'transparent',
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            backgroundColor: 'transparent',
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
                    },
                    elements: {
                        point: {
                            backgroundColor: 'rgba(79, 70, 229, 1)'
                        }
                    }
                }
            });
            
            // Ensure canvas background is transparent
            canvas.style.backgroundColor = 'transparent';
        },

        cleanup() {
            // Clean up chart instance when leaving the page
            if (this.radarChart) {
                this.radarChart.destroy();
                this.radarChart = null;
            }

            // Remove event listeners to prevent memory leaks
            const avatarContainer = document.getElementById('avatar-container');
            const avatarInput = document.getElementById('avatar-upload-input');
            const editNameBtn = document.getElementById('edit-name-btn');
            const showcaseBtn = document.getElementById('select-showcase-btn');

            if (avatarContainer && this.avatarClickHandler) {
                avatarContainer.removeEventListener('click', this.avatarClickHandler);
            }

            if (avatarInput && this.avatarChangeHandler) {
                avatarInput.removeEventListener('change', this.avatarChangeHandler);
            }

            if (editNameBtn && this.editNameHandler) {
                editNameBtn.removeEventListener('click', this.editNameHandler);
            }

            if (showcaseBtn && this.showcaseHandler) {
                showcaseBtn.removeEventListener('click', this.showcaseHandler);
            }

            // Clear handler references
            this.avatarClickHandler = null;
            this.avatarChangeHandler = null;
            this.editNameHandler = null;
            this.showcaseHandler = null;
        }
    };
}