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

                        <!-- Progressive Analytics Section -->
                        <div class="card-bg p-6 rounded-lg">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xl font-bold">💪 Strength Progression</h3>
                                <select id="progression-timeframe" class="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm">
                                    <option value="4">Last 4 Weeks</option>
                                    <option value="8">Last 8 Weeks</option>
                                    <option value="12">Last 12 Weeks</option>
                                    <option value="all">All Time</option>
                                </select>
                            </div>
                            <div id="strength-progression-content">
                                <!-- Strength progression charts will be rendered here -->
                            </div>
                        </div>

                        <!-- Volume & Performance Analytics -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="card-bg p-6 rounded-lg">
                                <h3 class="text-lg font-bold mb-4">📊 Volume Trends</h3>
                                <div id="volume-analytics">
                                    <!-- Volume analytics will be rendered here -->
                                </div>
                            </div>
                            
                            <div class="card-bg p-6 rounded-lg">
                                <h3 class="text-lg font-bold mb-4">⏱️ Workout Performance</h3>
                                <div id="workout-performance">
                                    <!-- Workout performance metrics will be rendered here -->
                                </div>
                            </div>
                        </div>

                        <!-- Personal Records & Achievements -->
                        <div class="card-bg p-6 rounded-lg">
                            <h3 class="text-xl font-bold mb-4">🏆 Personal Records</h3>
                            <div id="personal-records" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <!-- Personal records will be rendered here -->
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

            // Update progressive analytics
            this.updateProgressiveAnalytics();
            this.updateActivityCalendar();
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
        },

        updateProgressiveAnalytics() {
            this.updateStrengthProgression();
            this.updateVolumeAnalytics();
            this.updateWorkoutPerformance();
            this.updatePersonalRecords();
        },

        updateStrengthProgression() {
            const container = document.getElementById('strength-progression-content');
            if (!container) return;

            const timeframe = document.getElementById('progression-timeframe')?.value || '4';
            const workoutHistory = app.state.workoutHistory || [];
            
            if (workoutHistory.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-400 py-8">
                        <i class="fas fa-chart-line text-4xl mb-3"></i>
                        <div>No workout data yet</div>
                        <div class="text-sm text-gray-500 mt-1">Complete workouts to see your strength progression</div>
                    </div>
                `;
                return;
            }

            // Get recent workouts based on timeframe
            const cutoffDate = timeframe === 'all' ? 0 : Date.now() - (parseInt(timeframe) * 7 * 24 * 60 * 60 * 1000);
            const recentWorkouts = workoutHistory.filter(w => w.completedAt > cutoffDate);

            if (recentWorkouts.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-400 py-8">
                        <div>No workouts in selected timeframe</div>
                        <div class="text-sm text-gray-500 mt-1">Try selecting a longer timeframe</div>
                    </div>
                `;
                return;
            }

            // Analyze strength progression for main lifts
            const mainLifts = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row'];
            const progressionData = this.calculateStrengthProgression(recentWorkouts, mainLifts);

            const html = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${progressionData.map(lift => `
                        <div class="p-4 bg-gray-800 rounded-lg">
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-semibold text-sm">${lift.name}</h4>
                                <span class="text-xs px-2 py-1 rounded ${lift.trend > 0 ? 'bg-green-600' : lift.trend < 0 ? 'bg-red-600' : 'bg-gray-600'}">
                                    ${lift.trend > 0 ? '+' : ''}${lift.trend}%
                                </span>
                            </div>
                            <div class="text-lg font-bold text-white mb-1">${lift.currentWeight} kg</div>
                            <div class="text-xs text-gray-400">
                                ${lift.sessions} sessions • ${lift.totalVolume} kg volume
                            </div>
                            <div class="w-full bg-gray-700 rounded-full h-1 mt-2">
                                <div class="bg-indigo-600 h-1 rounded-full transition-all duration-300" 
                                     style="width: ${Math.min(100, (lift.currentWeight / lift.maxWeight) * 100)}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;

            container.innerHTML = html;
        },

        calculateStrengthProgression(workouts, lifts) {
            return lifts.map(liftName => {
                const liftData = workouts
                    .filter(w => w.exercises && w.exercises.some(e => e.name === liftName))
                    .map(w => {
                        const exercise = w.exercises.find(e => e.name === liftName);
                        return {
                            date: w.completedAt,
                            weight: exercise.weight || 0,
                            volume: (exercise.weight || 0) * (exercise.sets || 0) * (exercise.reps || 0)
                        };
                    })
                    .sort((a, b) => a.date - b.date);

                if (liftData.length === 0) {
                    return {
                        name: liftName,
                        currentWeight: app.state.lifts[liftName]?.weight || 0,
                        maxWeight: app.state.lifts[liftName]?.weight || 100,
                        trend: 0,
                        sessions: 0,
                        totalVolume: 0
                    };
                }

                const firstWeight = liftData[0].weight;
                const lastWeight = liftData[liftData.length - 1].weight;
                const trend = firstWeight > 0 ? Math.round(((lastWeight - firstWeight) / firstWeight) * 100) : 0;
                const totalVolume = liftData.reduce((sum, d) => sum + d.volume, 0);

                return {
                    name: liftName,
                    currentWeight: lastWeight,
                    maxWeight: Math.max(...liftData.map(d => d.weight), 100),
                    trend,
                    sessions: liftData.length,
                    totalVolume: Math.round(totalVolume)
                };
            });
        },

        updateVolumeAnalytics() {
            const container = document.getElementById('volume-analytics');
            if (!container) return;

            const workoutHistory = app.state.workoutHistory || [];
            
            if (workoutHistory.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-400 py-6">
                        <i class="fas fa-chart-bar text-3xl mb-2"></i>
                        <div class="text-sm">No volume data yet</div>
                    </div>
                `;
                return;
            }

            // Calculate weekly volume trends
            const weeklyVolume = this.calculateWeeklyVolume(workoutHistory);
            const totalVolume = workoutHistory.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
            const avgVolume = Math.round(totalVolume / workoutHistory.length);

            const html = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="text-center p-3 bg-gray-800 rounded">
                            <div class="text-lg font-bold text-indigo-400">${Math.round(totalVolume / 1000)}k</div>
                            <div class="text-xs text-gray-400">Total Volume (kg)</div>
                        </div>
                        <div class="text-center p-3 bg-gray-800 rounded">
                            <div class="text-lg font-bold text-green-400">${Math.round(avgVolume)}</div>
                            <div class="text-xs text-gray-400">Avg per Workout</div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="text-sm font-semibold text-gray-300">Recent Weeks</div>
                        ${weeklyVolume.slice(-4).map((week, index) => `
                            <div class="flex items-center justify-between p-2 bg-gray-800 rounded">
                                <span class="text-xs text-gray-400">Week ${index + 1}</span>
                                <span class="text-sm font-semibold">${Math.round(week)} kg</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            container.innerHTML = html;
        },

        calculateWeeklyVolume(workouts) {
            const weeklyData = {};
            
            workouts.forEach(workout => {
                const weekStart = new Date(workout.completedAt);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];
                
                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = 0;
                }
                weeklyData[weekKey] += workout.totalVolume || 0;
            });

            return Object.values(weeklyData);
        },

        updateWorkoutPerformance() {
            const container = document.getElementById('workout-performance');
            if (!container) return;

            const workoutHistory = app.state.workoutHistory || [];
            
            if (workoutHistory.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-400 py-6">
                        <i class="fas fa-stopwatch text-3xl mb-2"></i>
                        <div class="text-sm">No performance data yet</div>
                    </div>
                `;
                return;
            }

            // Calculate performance metrics
            const avgDuration = workoutHistory.reduce((sum, w) => sum + (w.duration || 0), 0) / workoutHistory.length;
            const totalWorkouts = workoutHistory.length;
            const recentWorkouts = workoutHistory.slice(-5);
            const recentAvgDuration = recentWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0) / recentWorkouts.length;

            const html = `
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="text-center p-3 bg-gray-800 rounded">
                            <div class="text-lg font-bold text-blue-400">${Math.round(avgDuration)}m</div>
                            <div class="text-xs text-gray-400">Avg Duration</div>
                        </div>
                        <div class="text-center p-3 bg-gray-800 rounded">
                            <div class="text-lg font-bold text-purple-400">${totalWorkouts}</div>
                            <div class="text-xs text-gray-400">Total Workouts</div>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <div class="text-sm font-semibold text-gray-300">Recent Sessions</div>
                        ${recentWorkouts.reverse().map((workout, index) => `
                            <div class="flex items-center justify-between p-2 bg-gray-800 rounded">
                                <span class="text-xs text-gray-400">${new Date(workout.completedAt).toLocaleDateString()}</span>
                                <div class="text-right">
                                    <div class="text-sm font-semibold">${workout.duration || 0}m</div>
                                    <div class="text-xs text-gray-500">${workout.exercises?.length || 0} exercises</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;

            container.innerHTML = html;
        },

        updatePersonalRecords() {
            const container = document.getElementById('personal-records');
            if (!container) return;

            const lifts = app.state.lifts || {};
            const mainLifts = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row'];
            
            const records = mainLifts.map(liftName => ({
                name: liftName,
                weight: lifts[liftName]?.weight || 0,
                reps: lifts[liftName]?.reps || 0,
                lastUpdated: lifts[liftName]?.lastUpdated || null
            })).filter(record => record.weight > 0);

            if (records.length === 0) {
                container.innerHTML = `
                    <div class="col-span-full text-center text-gray-400 py-8">
                        <i class="fas fa-trophy text-4xl mb-3"></i>
                        <div>No personal records yet</div>
                        <div class="text-sm text-gray-500 mt-1">Complete workouts to set your first PRs</div>
                    </div>
                `;
                return;
            }

            const html = records.map(record => `
                <div class="p-4 bg-gray-800 rounded-lg border-l-4 border-yellow-500">
                    <div class="flex items-center justify-between mb-2">
                        <h4 class="font-semibold text-yellow-400">${record.name}</h4>
                        <i class="fas fa-trophy text-yellow-500"></i>
                    </div>
                    <div class="text-2xl font-bold text-white mb-1">${record.weight} kg</div>
                    <div class="text-sm text-gray-400">
                        ${record.reps} reps
                        ${record.lastUpdated ? ` • ${new Date(record.lastUpdated).toLocaleDateString()}` : ''}
                    </div>
                </div>
            `).join('');

            container.innerHTML = html;
        },

        updateActivityCalendar() {
            const container = document.getElementById('activity-calendar');
            if (!container) return;

            const activityLog = app.state.activityLog || [];
            
            if (activityLog.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-400 py-8">
                        <i class="fas fa-calendar text-4xl mb-3"></i>
                        <div>No activity yet</div>
                        <div class="text-sm text-gray-500 mt-1">Your workout and gate activity will appear here</div>
                    </div>
                `;
                return;
            }

            // Generate calendar for last 12 weeks
            const calendar = this.generateActivityCalendar(activityLog);
            
            container.innerHTML = `
                <div class="grid grid-cols-7 gap-1 text-xs">
                    ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => 
                        `<div class="text-center text-gray-500 p-1 font-semibold">${day}</div>`
                    ).join('')}
                    ${calendar.map(day => `
                        <div class="aspect-square p-1 rounded ${day.class}" title="${day.tooltip}">
                            <div class="w-full h-full rounded ${day.bgClass}"></div>
                        </div>
                    `).join('')}
                </div>
            `;
        },

        generateActivityCalendar(activityLog) {
            const calendar = [];
            const today = new Date();
            const startDate = new Date(today);
            startDate.setDate(today.getDate() - 84); // 12 weeks ago
            
            // Start from the beginning of the week
            startDate.setDate(startDate.getDate() - startDate.getDay());

            for (let i = 0; i < 84; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                
                const dayActivities = activityLog.filter(log => {
                    const logDate = new Date(log.timestamp);
                    return logDate.toDateString() === currentDate.toDateString();
                });

                const hasWorkout = dayActivities.some(log => log.type === 'workout_completed');
                const hasGate = dayActivities.some(log => log.type === 'gate_completed');
                
                let bgClass = 'bg-gray-800';
                let tooltip = currentDate.toDateString();
                
                if (hasWorkout && hasGate) {
                    bgClass = 'bg-blue-500';
                    tooltip += ' - Workout & Gate completed';
                } else if (hasWorkout) {
                    bgClass = 'bg-green-500';
                    tooltip += ' - Workout completed';
                } else if (hasGate) {
                    bgClass = 'bg-purple-500';
                    tooltip += ' - Gate completed';
                }

                calendar.push({
                    date: currentDate.getDate(),
                    class: currentDate > today ? 'opacity-30' : '',
                    bgClass,
                    tooltip
                });
            }

            return calendar;
        }
    };
}