export function initAchievements(app) {
    return {
        render() {
            return `
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="card-bg p-6 rounded-lg">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-2xl font-bold">Achievements</h2>
                            <button id="toggle-all-achievements" class="text-sm px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors duration-200">
                                <i class="fas fa-expand-arrows-alt mr-1"></i>
                                <span>Expand All</span>
                            </button>
                        </div>
                        <div id="achievements-list" class="space-y-3">
                            <div class="text-center text-gray-400 py-4">Loading achievements...</div>
                        </div>
                    </div>
                    
                    <div class="card-bg p-6 rounded-lg">
                        <h2 class="text-2xl font-bold mb-4">Progress Summary</h2>
                        <div id="progress-summary" class="space-y-4">
                            <div class="text-center text-gray-400 py-4">Loading progress...</div>
                        </div>
                    </div>
                </div>
            `;
        },

        init() {
            this.setupEventListeners();
            this.updateAchievements();
            this.updateProgressSummary();
        },

        setupEventListeners() {
            // Remove any existing listeners first
            this.cleanup();
            
            // Event delegation for achievement group toggles
            this.clickHandler = (event) => {
                try {
                    const header = event.target.closest('.achievement-group-header');
                    if (header) {
                        event.preventDefault();
                        event.stopPropagation();
                        
                        const content = header.parentElement.querySelector('.achievement-group-content');
                        const expandIcon = header.querySelector('.expand-icon');
                        
                        if (content && expandIcon) {
                            const isHidden = content.classList.contains('hidden');
                            
                            if (isHidden) {
                                content.classList.remove('hidden');
                                expandIcon.classList.add('rotate-90');
                                header.setAttribute('aria-expanded', 'true');
                            } else {
                                content.classList.add('hidden');
                                expandIcon.classList.remove('rotate-90');
                                header.setAttribute('aria-expanded', 'false');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error in achievements click handler:', error);
                }
            };

            // Keyboard event handler for accessibility
            this.keydownHandler = (event) => {
                try {
                    const header = event.target.closest('.achievement-group-header');
                    if (header && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        event.stopPropagation();
                        
                        // Trigger the same logic as click
                        header.click();
                    }
                } catch (error) {
                    console.error('Error in achievements keydown handler:', error);
                }
            };

            // Toggle all achievements handler
            this.toggleAllHandler = (event) => {
                try {
                    if (event.target.closest('#toggle-all-achievements')) {
                        event.preventDefault();
                        
                        const button = event.target.closest('#toggle-all-achievements');
                        const buttonText = button.querySelector('span');
                        const buttonIcon = button.querySelector('i');
                        const allContents = document.querySelectorAll('.achievement-group-content');
                        const allIcons = document.querySelectorAll('.expand-icon');
                        const allHeaders = document.querySelectorAll('.achievement-group-header');
                        
                        // Check if any are currently expanded
                        const anyExpanded = Array.from(allContents).some(content => !content.classList.contains('hidden'));
                        
                        if (anyExpanded) {
                            // Collapse all
                            allContents.forEach(content => content.classList.add('hidden'));
                            allIcons.forEach(icon => icon.classList.remove('rotate-90'));
                            allHeaders.forEach(header => header.setAttribute('aria-expanded', 'false'));
                            buttonText.textContent = 'Expand All';
                            buttonIcon.className = 'fas fa-expand-arrows-alt mr-1';
                        } else {
                            // Expand all
                            allContents.forEach(content => content.classList.remove('hidden'));
                            allIcons.forEach(icon => icon.classList.add('rotate-90'));
                            allHeaders.forEach(header => header.setAttribute('aria-expanded', 'true'));
                            buttonText.textContent = 'Collapse All';
                            buttonIcon.className = 'fas fa-compress-arrows-alt mr-1';
                        }
                    }
                } catch (error) {
                    console.error('Error in toggle all handler:', error);
                }
            };

            // Add event listeners
            document.addEventListener('click', this.clickHandler);
            document.addEventListener('keydown', this.keydownHandler);
            document.addEventListener('click', this.toggleAllHandler);
        },

        cleanup() {
            // Remove event listeners to prevent memory leaks
            if (this.clickHandler) {
                document.removeEventListener('click', this.clickHandler);
                this.clickHandler = null;
            }
            
            if (this.keydownHandler) {
                document.removeEventListener('keydown', this.keydownHandler);
                this.keydownHandler = null;
            }
            
            if (this.toggleAllHandler) {
                document.removeEventListener('click', this.toggleAllHandler);
                this.toggleAllHandler = null;
            }
        },

        updateAchievements() {
            const container = document.getElementById('achievements-list');
            if (!container) return;

            const achievements = this.getAchievementsData();
            const userStats = app.state.stats || {};

            // Filter out secret achievements that haven't been unlocked yet
            const visibleAchievements = achievements.filter(achievement => {
                const isUnlocked = this.checkAchievement(achievement, userStats);
                return !achievement.secret || isUnlocked;
            });

            if (visibleAchievements.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-gray-400 py-8">
                        <div class="mb-2">No achievements unlocked yet</div>
                        <div class="text-sm text-gray-500">Complete workouts and gates to unlock achievements!</div>
                        <div class="text-xs text-purple-400 mt-2">🌟 Some achievements are secret and will appear when discovered...</div>
                    </div>
                `;
                return;
            }

            // Group achievements by category
            const groupedAchievements = this.groupAchievements(visibleAchievements, userStats);
            
            const html = Object.entries(groupedAchievements).map(([category, group]) => {
                // All dropdowns start closed by default to reduce scrolling
                const isExpanded = false;
                
                return `
                    <div class="achievement-group mb-4">
                        <div class="achievement-group-header cursor-pointer p-3 bg-gray-800 rounded-lg border-l-4 ${group.borderColor} hover:bg-gray-700 transition-colors duration-200" 
                             role="button" 
                             tabindex="0" 
                             aria-expanded="false"
                             aria-controls="achievement-content-${category.replace(/\s+/g, '-').toLowerCase()}">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center space-x-3">
                                    <i class="fas ${group.icon} ${group.iconColor}"></i>
                                    <div>
                                        <h3 class="font-semibold text-white">${category}</h3>
                                        <div class="text-xs text-gray-400">${group.unlockedCount} / ${group.totalCount} unlocked</div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <div class="text-xs text-indigo-400">+${group.totalXP} XP</div>
                                    <i class="fas fa-chevron-right expand-icon transition-transform duration-200"></i>
                                </div>
                            </div>
                            <div class="w-full bg-gray-700 rounded-full h-2 mt-2">
                                <div class="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                                     style="width: ${group.totalCount > 0 ? (group.unlockedCount / group.totalCount) * 100 : 0}%"></div>
                            </div>
                        </div>
                        <div class="achievement-group-content hidden mt-2 space-y-2 pl-4" 
                             id="achievement-content-${category.replace(/\s+/g, '-').toLowerCase()}">
                            ${group.achievements.map(achievement => {
                                const isUnlocked = this.checkAchievement(achievement, userStats);
                                const progress = this.getAchievementProgress(achievement, userStats);
                                const isSecret = achievement.secret && !isUnlocked;
                                
                                return `
                                    <div class="achievement-card p-3 rounded-lg border-l-2 ${isUnlocked ? 'bg-gray-800 border-green-500' : isSecret ? 'bg-gray-900 border-yellow-600' : 'bg-gray-900 border-gray-600'} ${isUnlocked ? '' : 'opacity-60'}">
                                        <div class="flex items-center justify-between mb-1">
                                            <h4 class="text-sm font-semibold ${isUnlocked ? 'text-green-400' : isSecret ? 'text-yellow-400' : 'text-gray-400'}">
                                                ${isSecret ? '??? Secret Achievement' : achievement.name}
                                                ${achievement.secret ? ' 🏆' : ''}
                                            </h4>
                                            <span class="text-xs px-2 py-1 rounded ${isUnlocked ? 'bg-green-600 text-white' : isSecret ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-400'}">
                                                ${isUnlocked ? 'Unlocked' : isSecret ? 'Secret' : 'Locked'}
                                            </span>
                                        </div>
                                        <p class="text-xs text-gray-300 mb-2">
                                            ${isSecret ? 'Complete gate challenges to unlock this secret achievement!' : achievement.description}
                                        </p>
                                        <div class="flex items-center justify-between">
                                            <div class="text-xs text-gray-500">
                                                ${isSecret ? '???' : `${progress.current} / ${progress.target}`}
                                            </div>
                                            <div class="text-xs text-indigo-400">
                                                ${isSecret ? '??? XP' : `${achievement.reward} XP`}
                                            </div>
                                        </div>
                                        <div class="w-full bg-gray-700 rounded-full h-1 mt-1">
                                            <div class="${isSecret ? 'bg-yellow-600' : 'bg-indigo-600'} h-1 rounded-full transition-all duration-300" 
                                                 style="width: ${isSecret ? '0' : Math.min(100, (progress.current / progress.target) * 100)}%"></div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
        },

        groupAchievements(achievements, userStats) {
            const groups = {
                'Gate Milestones': {
                    achievements: [],
                    icon: 'fa-archway',
                    iconColor: 'text-purple-400',
                    borderColor: 'border-purple-500',
                    unlockedCount: 0,
                    totalCount: 0,
                    totalXP: 0
                },
                'Secret Gate Discoveries': {
                    achievements: [],
                    icon: 'fa-star',
                    iconColor: 'text-yellow-400',
                    borderColor: 'border-yellow-500',
                    unlockedCount: 0,
                    totalCount: 0,
                    totalXP: 0
                },
                'Workout Progress': {
                    achievements: [],
                    icon: 'fa-dumbbell',
                    iconColor: 'text-blue-400',
                    borderColor: 'border-blue-500',
                    unlockedCount: 0,
                    totalCount: 0,
                    totalXP: 0
                },
                'Level & Streaks': {
                    achievements: [],
                    icon: 'fa-trophy',
                    iconColor: 'text-orange-400',
                    borderColor: 'border-orange-500',
                    unlockedCount: 0,
                    totalCount: 0,
                    totalXP: 0
                },
                'Special Achievements': {
                    achievements: [],
                    icon: 'fa-crown',
                    iconColor: 'text-gold-400',
                    borderColor: 'border-yellow-600',
                    unlockedCount: 0,
                    totalCount: 0,
                    totalXP: 0
                }
            };

            achievements.forEach(achievement => {
                const isUnlocked = this.checkAchievement(achievement, userStats);
                let category = 'Special Achievements';

                // Categorize achievements
                if (achievement.id.startsWith('gate_') && achievement.secret) {
                    category = 'Secret Gate Discoveries';
                } else if (achievement.id.includes('gates_') || achievement.condition.type === 'gatesCleared') {
                    category = 'Gate Milestones';
                } else if (achievement.condition.type === 'totalWorkouts' || achievement.condition.type === 'dungeonsCleared') {
                    category = 'Workout Progress';
                } else if (achievement.condition.type === 'level' || achievement.condition.type === 'streak') {
                    category = 'Level & Streaks';
                }

                groups[category].achievements.push(achievement);
                groups[category].totalCount++;
                groups[category].totalXP += achievement.reward;
                
                if (isUnlocked) {
                    groups[category].unlockedCount++;
                }
            });

            // Remove empty groups
            Object.keys(groups).forEach(key => {
                if (groups[key].totalCount === 0) {
                    delete groups[key];
                }
            });

            return groups;
        },

        updateProgressSummary() {
            const container = document.getElementById('progress-summary');
            if (!container) return;

            const achievements = this.getAchievementsData();
            const userStats = app.state.stats || {};
            
            // Filter out secret achievements that haven't been unlocked yet
            const visibleAchievements = achievements.filter(achievement => {
                const isUnlocked = this.checkAchievement(achievement, userStats);
                return !achievement.secret || isUnlocked;
            });
            
            const unlockedCount = visibleAchievements.filter(a => this.checkAchievement(a, userStats)).length;
            const totalCount = visibleAchievements.length;
            const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

            // Get category breakdown
            const groupedAchievements = this.groupAchievements(visibleAchievements, userStats);
            const secretCount = Object.values(groupedAchievements).find(g => g.achievements.some(a => a.secret))?.unlockedCount || 0;

            const html = `
                <div class="text-center p-4 bg-gray-800 rounded-lg mb-4">
                    <div class="text-3xl font-bold text-indigo-400 mb-2">${completionPercentage}%</div>
                    <div class="text-sm text-gray-400">Overall Progress</div>
                    <div class="text-xs text-gray-500 mt-1">${unlockedCount} / ${totalCount} achievements</div>
                </div>

                <div class="space-y-3 mb-4">
                    ${Object.entries(groupedAchievements).map(([category, group]) => `
                        <div class="flex justify-between items-center p-2 bg-gray-800 rounded">
                            <span class="text-sm ${group.iconColor}">
                                <i class="fas ${group.icon} mr-2"></i>${category}
                            </span>
                            <span class="text-white text-sm">${group.unlockedCount}/${group.totalCount}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">Total Workouts</span>
                        <span class="text-white font-semibold">${userStats.totalWorkouts || 0}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">Gates Cleared</span>
                        <span class="text-white font-semibold">${userStats.gatesCleared || 0}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">Dungeons Cleared</span>
                        <span class="text-white font-semibold">${userStats.dungeonsCleared || 0}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">Current Level</span>
                        <span class="text-white font-semibold">${app.state.level}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-400">Current Streak</span>
                        <span class="text-white font-semibold">${app.state.streak}</span>
                    </div>
                    ${secretCount > 0 ? `
                    <div class="flex justify-between items-center p-2 bg-purple-900 rounded mt-3">
                        <span class="text-purple-300">🌟 Secrets Discovered</span>
                        <span class="text-purple-200 font-semibold">${secretCount}</span>
                    </div>
                    ` : ''}
                </div>
            `;

            container.innerHTML = html;
        },

        getAchievementsData() {
            return [
                // Gate-Specific Achievements (105 Gates) - All Secret
                // E-Rank Gate Achievements (30 Gates)
                { id: 'gate_E01', name: 'First Steps', description: 'Clear E-Rank Gate: The Beginning', icon: 'fa-shoe-prints', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E02', name: 'Getting Stronger', description: 'Clear E-Rank Gate: Push-Up Progression', icon: 'fa-arrow-up', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E03', name: 'Foundation Builder', description: 'Clear E-Rank Gate: Squat Basics', icon: 'fa-mountain', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E04', name: 'Upper Body Focus', description: 'Clear E-Rank Gate: Pull-Up Prep', icon: 'fa-dumbbell', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E05', name: 'Core Strength', description: 'Clear E-Rank Gate: Plank Mastery', icon: 'fa-fire', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E06', name: 'Leg Day Warrior', description: 'Clear E-Rank Gate: Lunges & Steps', icon: 'fa-walking', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E07', name: 'Cardio Starter', description: 'Clear E-Rank Gate: Jump Rope Basics', icon: 'fa-running', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E08', name: 'Flexibility First', description: 'Clear E-Rank Gate: Stretching Routine', icon: 'fa-child-reaching', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E09', name: 'Balance Master', description: 'Clear E-Rank Gate: Single-Leg Work', icon: 'fa-balance-scale', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E10', name: 'Endurance Builder', description: 'Clear E-Rank Gate: Circuit Basics', icon: 'fa-battery-half', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E11', name: 'Strength Novice', description: 'Clear E-Rank Gate: Dumbbell Basics', icon: 'fa-dumbbell', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E12', name: 'Bodyweight Master', description: 'Clear E-Rank Gate: Calisthenics', icon: 'fa-user', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E13', name: 'Mobility Focus', description: 'Clear E-Rank Gate: Joint Health', icon: 'fa-heart', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E14', name: 'Recovery Expert', description: 'Clear E-Rank Gate: Active Recovery', icon: 'fa-leaf', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E15', name: 'Consistency King', description: 'Clear E-Rank Gate: Daily Habit', icon: 'fa-calendar-check', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E16', name: 'Form Perfection', description: 'Clear E-Rank Gate: Technique Focus', icon: 'fa-eye', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E17', name: 'Breathing Master', description: 'Clear E-Rank Gate: Breath Control', icon: 'fa-wind', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E18', name: 'Mind-Muscle Connection', description: 'Clear E-Rank Gate: Focus Training', icon: 'fa-brain', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E19', name: 'Progressive Overload', description: 'Clear E-Rank Gate: Weight Progression', icon: 'fa-chart-line', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E20', name: 'Rest Day Respect', description: 'Clear E-Rank Gate: Recovery Importance', icon: 'fa-bed', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E21', name: 'Nutrition Awareness', description: 'Clear E-Rank Gate: Fuel Your Body', icon: 'fa-apple-alt', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E22', name: 'Hydration Hero', description: 'Clear E-Rank Gate: Water Intake', icon: 'fa-tint', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E23', name: 'Sleep Optimizer', description: 'Clear E-Rank Gate: Rest Quality', icon: 'fa-moon', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E24', name: 'Stress Manager', description: 'Clear E-Rank Gate: Mental Health', icon: 'fa-om', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E25', name: 'Goal Setter', description: 'Clear E-Rank Gate: SMART Goals', icon: 'fa-bullseye', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E26', name: 'Progress Tracker', description: 'Clear E-Rank Gate: Log Your Work', icon: 'fa-clipboard-list', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E27', name: 'Community Builder', description: 'Clear E-Rank Gate: Find Your Tribe', icon: 'fa-users', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E28', name: 'Knowledge Seeker', description: 'Clear E-Rank Gate: Learn & Grow', icon: 'fa-book', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E29', name: 'Adaptability', description: 'Clear E-Rank Gate: Adjust & Overcome', icon: 'fa-random', condition: { type: 'eRanksCleared', target: 1 }, reward: 25, secret: true },
                { id: 'gate_E30', name: 'E-Rank Master', description: 'Clear E-Rank Gate: The Foundation', icon: 'fa-medal', condition: { type: 'eRanksCleared', target: 1 }, reward: 50, secret: true },

                // D-Rank Gate Achievements (25 Gates)
                { id: 'gate_D01', name: 'D-Rank Initiate', description: 'Clear D-Rank Gate: Progressive Overload', icon: 'fa-arrow-up', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D02', name: 'Strength Builder', description: 'Clear D-Rank Gate: Compound Movements', icon: 'fa-dumbbell', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D03', name: 'Endurance Hunter', description: 'Clear D-Rank Gate: Cardio Progression', icon: 'fa-running', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D04', name: 'Flexibility Seeker', description: 'Clear D-Rank Gate: Mobility Work', icon: 'fa-child-reaching', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D05', name: 'Balance Master', description: 'Clear D-Rank Gate: Stability Training', icon: 'fa-balance-scale', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D06', name: 'Core Specialist', description: 'Clear D-Rank Gate: Abdominal Focus', icon: 'fa-fire', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D07', name: 'Upper Body Warrior', description: 'Clear D-Rank Gate: Push & Pull', icon: 'fa-dumbbell', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D08', name: 'Lower Body Power', description: 'Clear D-Rank Gate: Leg Strength', icon: 'fa-mountain', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D09', name: 'Cardio Warrior', description: 'Clear D-Rank Gate: Heart Health', icon: 'fa-heart', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D10', name: 'Recovery Expert', description: 'Clear D-Rank Gate: Rest & Repair', icon: 'fa-leaf', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D11', name: 'Nutrition Master', description: 'Clear D-Rank Gate: Fuel Strategy', icon: 'fa-apple-alt', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D12', name: 'Hydration Master', description: 'Clear D-Rank Gate: Water Strategy', icon: 'fa-tint', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D13', name: 'Sleep Optimizer', description: 'Clear D-Rank Gate: Rest Quality', icon: 'fa-moon', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D14', name: 'Stress Manager', description: 'Clear D-Rank Gate: Mental Health', icon: 'fa-om', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D15', name: 'Goal Achiever', description: 'Clear D-Rank Gate: SMART Goals', icon: 'fa-bullseye', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D16', name: 'Progress Tracker', description: 'Clear D-Rank Gate: Log Your Work', icon: 'fa-clipboard-list', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D17', name: 'Community Builder', description: 'Clear D-Rank Gate: Find Your Tribe', icon: 'fa-users', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D18', name: 'Knowledge Seeker', description: 'Clear D-Rank Gate: Learn & Grow', icon: 'fa-book', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D19', name: 'Adaptability Master', description: 'Clear D-Rank Gate: Adjust & Overcome', icon: 'fa-random', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D20', name: 'Consistency Master', description: 'Clear D-Rank Gate: Daily Habit', icon: 'fa-calendar-check', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D21', name: 'Form Master', description: 'Clear D-Rank Gate: Technique Focus', icon: 'fa-eye', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D22', name: 'Breathing Master', description: 'Clear D-Rank Gate: Breath Control', icon: 'fa-wind', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D23', name: 'Mind-Muscle Master', description: 'Clear D-Rank Gate: Focus Training', icon: 'fa-brain', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D24', name: 'Progressive Master', description: 'Clear D-Rank Gate: Weight Progression', icon: 'fa-chart-line', condition: { type: 'dRanksCleared', target: 1 }, reward: 35, secret: true },
                { id: 'gate_D25', name: 'D-Rank Master', description: 'Clear D-Rank Gate: The Foundation', icon: 'fa-medal', condition: { type: 'dRanksCleared', target: 1 }, reward: 75, secret: true },

                // C-Rank Gate Achievements (20 Gates)
                { id: 'gate_C01', name: 'C-Rank Initiate', description: 'Clear C-Rank Gate: Intermediate Training', icon: 'fa-arrow-up', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C02', name: 'Strength Hunter', description: 'Clear C-Rank Gate: Power Building', icon: 'fa-dumbbell', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C03', name: 'Endurance Master', description: 'Clear C-Rank Gate: Cardio Mastery', icon: 'fa-running', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C04', name: 'Flexibility Master', description: 'Clear C-Rank Gate: Mobility Mastery', icon: 'fa-child-reaching', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C05', name: 'Balance Master', description: 'Clear C-Rank Gate: Stability Mastery', icon: 'fa-balance-scale', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C06', name: 'Core Master', description: 'Clear C-Rank Gate: Abdominal Mastery', icon: 'fa-fire', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C07', name: 'Upper Body Master', description: 'Clear C-Rank Gate: Push & Pull Mastery', icon: 'fa-dumbbell', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C08', name: 'Lower Body Master', description: 'Clear C-Rank Gate: Leg Strength Mastery', icon: 'fa-mountain', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C09', name: 'Cardio Master', description: 'Clear C-Rank Gate: Heart Health Mastery', icon: 'fa-heart', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C10', name: 'Recovery Master', description: 'Clear C-Rank Gate: Rest & Repair Mastery', icon: 'fa-leaf', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C11', name: 'Nutrition Master', description: 'Clear C-Rank Gate: Fuel Strategy Mastery', icon: 'fa-apple-alt', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C12', name: 'Hydration Master', description: 'Clear C-Rank Gate: Water Strategy Mastery', icon: 'fa-tint', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C13', name: 'Sleep Master', description: 'Clear C-Rank Gate: Rest Quality Mastery', icon: 'fa-moon', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C14', name: 'Stress Master', description: 'Clear C-Rank Gate: Mental Health Mastery', icon: 'fa-om', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C15', name: 'Goal Master', description: 'Clear C-Rank Gate: SMART Goals Mastery', icon: 'fa-bullseye', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C16', name: 'Progress Master', description: 'Clear C-Rank Gate: Log Your Work Mastery', icon: 'fa-clipboard-list', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C17', name: 'Community Master', description: 'Clear C-Rank Gate: Find Your Tribe Mastery', icon: 'fa-users', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C18', name: 'Knowledge Master', description: 'Clear C-Rank Gate: Learn & Grow Mastery', icon: 'fa-book', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C19', name: 'Adaptability Master', description: 'Clear C-Rank Gate: Adjust & Overcome Mastery', icon: 'fa-random', condition: { type: 'cRanksCleared', target: 1 }, reward: 50, secret: true },
                { id: 'gate_C20', name: 'C-Rank Master', description: 'Clear C-Rank Gate: The Foundation', icon: 'fa-medal', condition: { type: 'cRanksCleared', target: 1 }, reward: 100, secret: true },

                // B-Rank Gate Achievements (15 Gates)
                { id: 'gate_B01', name: 'B-Rank Initiate', description: 'Clear B-Rank Gate: Advanced Training', icon: 'fa-arrow-up', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B02', name: 'B-Rank Warrior', description: 'Clear B-Rank Gate: Power Building', icon: 'fa-dumbbell', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B03', name: 'B-Rank Master', description: 'Clear B-Rank Gate: Endurance Mastery', icon: 'fa-running', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B04', name: 'B-Rank Elite', description: 'Clear B-Rank Gate: Strength Mastery', icon: 'fa-mountain', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B05', name: 'B-Rank Champion', description: 'Clear B-Rank Gate: The Foundation', icon: 'fa-medal', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B06', name: 'B-Rank Elite', description: 'Clear B-Rank Gate: The Hundred', icon: 'fa-hundred-points', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B07', name: 'B-Rank Master', description: 'Clear B-Rank Gate: Circuit Master', icon: 'fa-sync', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B08', name: 'B-Rank Warrior', description: 'Clear B-Rank Gate: Tempo Training', icon: 'fa-clock', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B09', name: 'B-Rank Elite', description: 'Clear B-Rank Gate: Isometric Hold', icon: 'fa-pause', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B10', name: 'B-Rank Master', description: 'Clear B-Rank Gate: Negative Focus', icon: 'fa-arrow-down', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B11', name: 'B-Rank Warrior', description: 'Clear B-Rank Gate: Density Training', icon: 'fa-tachometer-alt', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B12', name: 'B-Rank Elite', description: 'Clear B-Rank Gate: The Grinder', icon: 'fa-cogs', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B13', name: 'B-Rank Master', description: 'Clear B-Rank Gate: Plyometric Power', icon: 'fa-bolt', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B14', name: 'B-Rank Warrior', description: 'Clear B-Rank Gate: Endurance Builder', icon: 'fa-battery-full', condition: { type: 'bRanksCleared', target: 1 }, reward: 75, secret: true },
                { id: 'gate_B15', name: 'B-Rank Champion', description: 'Clear B-Rank Gate: Strength Stamina', icon: 'fa-dumbbell', condition: { type: 'bRanksCleared', target: 1 }, reward: 150, secret: true },

                // A-Rank Gate Achievements (10 Gates)
                { id: 'gate_A01', name: 'A-Rank Initiate', description: 'Clear A-Rank Gate: Elite Training', icon: 'fa-arrow-up', condition: { type: 'aRanksCleared', target: 1 }, reward: 100, secret: true },
                { id: 'gate_A02', name: 'A-Rank Warrior', description: 'Clear A-Rank Gate: Power Mastery', icon: 'fa-dumbbell', condition: { type: 'aRanksCleared', target: 1 }, reward: 100, secret: true },
                { id: 'gate_A03', name: 'A-Rank Master', description: 'Clear A-Rank Gate: The Foundation', icon: 'fa-medal', condition: { type: 'aRanksCleared', target: 1 }, reward: 100, secret: true },
                { id: 'gate_A04', name: 'A-Rank Elite', description: 'Clear A-Rank Gate: The Destroyer', icon: 'fa-skull', condition: { type: 'aRanksCleared', target: 1 }, reward: 100, secret: true },
                { id: 'gate_A05', name: 'A-Rank Warrior', description: 'Clear A-Rank Gate: Time Attack', icon: 'fa-stopwatch', condition: { type: 'aRanksCleared', target: 1 }, reward: 100, secret: true },
                { id: 'gate_A06', name: 'A-Rank Master', description: 'Clear A-Rank Gate: The Marathon', icon: 'fa-route', condition: { type: 'aRanksCleared', target: 1 }, reward: 100, secret: true },
                { id: 'gate_A07', name: 'A-Rank Elite', description: 'Clear A-Rank Gate: Cluster Sets', icon: 'fa-layer-group', condition: { type: 'aRanksCleared', target: 1 }, reward: 100, secret: true },
                { id: 'gate_A08', name: 'A-Rank Warrior', description: 'Clear A-Rank Gate: The Punisher', icon: 'fa-hammer', condition: { type: 'aRanksCleared', target: 1 }, reward: 100, secret: true },
                { id: 'gate_A09', name: 'A-Rank Master', description: 'Clear A-Rank Gate: The Immortal', icon: 'fa-infinity', condition: { type: 'aRanksCleared', target: 1 }, reward: 100, secret: true },
                { id: 'gate_A10', name: 'A-Rank Champion', description: 'Clear A-Rank Gate: The Executioner', icon: 'fa-sword', condition: { type: 'aRanksCleared', target: 1 }, reward: 200, secret: true },

                // S-Rank Gate Achievements (5 Gates)
                { id: 'gate_S01', name: 'S-Rank Initiate', description: 'Clear S-Rank Gate: Legendary Training', icon: 'fa-arrow-up', condition: { type: 'sRanksCleared', target: 1 }, reward: 150, secret: true },
                { id: 'gate_S02', name: 'S-Rank Warrior', description: 'Clear S-Rank Gate: Power Legend', icon: 'fa-dumbbell', condition: { type: 'sRanksCleared', target: 1 }, reward: 150, secret: true },
                { id: 'gate_S03', name: 'S-Rank Master', description: 'Clear S-Rank Gate: Endurance Legend', icon: 'fa-running', condition: { type: 'sRanksCleared', target: 1 }, reward: 150, secret: true },
                { id: 'gate_S04', name: 'S-Rank Elite', description: 'Clear S-Rank Gate: Strength Legend', icon: 'fa-mountain', condition: { type: 'sRanksCleared', target: 1 }, reward: 150, secret: true },
                { id: 'gate_S05', name: 'S-Rank Champion', description: 'Clear S-Rank Gate: The Foundation', icon: 'fa-medal', condition: { type: 'sRanksCleared', target: 1 }, reward: 300, secret: true },

                // General Gate Milestones
                { id: 'gates_5', name: 'Gate Runner', description: 'Clear 5 Gates.', icon: 'fa-archway', condition: { type: 'gatesCleared', target: 5 }, reward: 125 },
                { id: 'gates_10', name: 'Gate Breaker', description: 'Clear 10 Gates.', icon: 'fa-archway', condition: { type: 'gatesCleared', target: 10 }, reward: 150 },
                { id: 'gates_25', name: 'Gatekeeper', description: 'Clear 25 Gates.', icon: 'fa-archway', condition: { type: 'gatesCleared', target: 25 }, reward: 250 },
                { id: 'gates_50', name: 'Gate Warden', description: 'Clear 50 Gates.', icon: 'fa-door-closed', condition: { type: 'gatesCleared', target: 50 }, reward: 400 },
                { id: 'gates_75', name: 'Gate Sentinel', description: 'Clear 75 Gates.', icon: 'fa-shield-alt', condition: { type: 'gatesCleared', target: 75 }, reward: 500 },
                { id: 'gates_100', name: 'Master of the Rift', description: 'Clear 100 Gates.', icon: 'fa-crown', condition: { type: 'gatesCleared', target: 100 }, reward: 750 },

                // Basic Achievements
                { id: 'first_workout', name: 'First Steps', description: 'Complete your first workout', condition: { type: 'totalWorkouts', target: 1 }, reward: 50 },
                { id: 'workout_streak_7', name: 'Week Warrior', description: 'Maintain a 7-day workout streak', condition: { type: 'streak', target: 7 }, reward: 100 },
                { id: 'workout_streak_30', name: 'Monthly Master', description: 'Maintain a 30-day workout streak', condition: { type: 'streak', target: 30 }, reward: 300 },
                { id: 'level_10', name: 'Rising Hunter', description: 'Reach level 10', condition: { type: 'level', target: 10 }, reward: 200 },
                { id: 'level_25', name: 'Elite Hunter', description: 'Reach level 25', condition: { type: 'level', target: 25 }, reward: 500 },
                { id: 'dungeons_25', name: 'Dungeon Crawler', description: 'Clear 25 dungeons', condition: { type: 'dungeonsCleared', target: 25 }, reward: 200 },
                { id: 'workouts_100', name: 'Centurion', description: 'Complete 100 workouts', condition: { type: 'totalWorkouts', target: 100 }, reward: 500 }
            ];
        },

        checkAchievement(achievement, userStats) {
            const condition = achievement.condition;
            
            switch (condition.type) {
                case 'totalWorkouts':
                    return (userStats.totalWorkouts || 0) >= condition.target;
                case 'streak':
                    return (app.state.streak || 0) >= condition.target;
                case 'level':
                    return (app.state.level || 1) >= condition.target;
                case 'gatesCleared':
                    return (userStats.gatesCleared || 0) >= condition.target;
                case 'sRanksCleared':
                    return (userStats.sRanksCleared || 0) >= condition.target;
                case 'aRanksCleared':
                    return (userStats.aRanksCleared || 0) >= condition.target;
                case 'bRanksCleared':
                    return (userStats.bRanksCleared || 0) >= condition.target;
                case 'cRanksCleared':
                    return (userStats.cRanksCleared || 0) >= condition.target;
                case 'dRanksCleared':
                    return (userStats.dRanksCleared || 0) >= condition.target;
                case 'eRanksCleared':
                    return (userStats.eRanksCleared || 0) >= condition.target;
                case 'dungeonsCleared':
                    return (userStats.dungeonsCleared || 0) >= condition.target;
                case 'allRanks':
                    // Check if user has cleared at least one gate of each rank
                    return (userStats.eRanksCleared > 0) && 
                           (userStats.dRanksCleared > 0) && 
                           (userStats.cRanksCleared > 0) && 
                           (userStats.bRanksCleared > 0) && 
                           (userStats.aRanksCleared > 0) && 
                           (userStats.sRanksCleared > 0);
                default:
                    return false;
            }
        },

        getAchievementProgress(achievement, userStats) {
            const condition = achievement.condition;
            let current = 0;
            
            switch (condition.type) {
                case 'totalWorkouts':
                    current = userStats.totalWorkouts || 0;
                    break;
                case 'streak':
                    current = app.state.streak || 0;
                    break;
                case 'level':
                    current = app.state.level || 1;
                    break;
                case 'gatesCleared':
                    current = userStats.gatesCleared || 0;
                    break;
                case 'sRanksCleared':
                    current = userStats.sRanksCleared || 0;
                    break;
                case 'aRanksCleared':
                    current = userStats.aRanksCleared || 0;
                    break;
                case 'bRanksCleared':
                    current = userStats.bRanksCleared || 0;
                    break;
                case 'cRanksCleared':
                    current = userStats.cRanksCleared || 0;
                    break;
                case 'dRanksCleared':
                    current = userStats.dRanksCleared || 0;
                    break;
                case 'eRanksCleared':
                    current = userStats.eRanksCleared || 0;
                    break;
                case 'dungeonsCleared':
                    current = userStats.dungeonsCleared || 0;
                    break;
                case 'allRanks':
                    // Count how many ranks have been cleared
                    const ranksCleared = [
                        userStats.eRanksCleared > 0,
                        userStats.dRanksCleared > 0,
                        userStats.cRanksCleared > 0,
                        userStats.bRanksCleared > 0,
                        userStats.aRanksCleared > 0,
                        userStats.sRanksCleared > 0
                    ].filter(Boolean).length;
                    current = ranksCleared;
                    break;
            }
            
            return {
                current: Math.min(current, condition.target),
                target: condition.target
            };
        },

        cleanup() {
            // Achievements page doesn't have event listeners or timers to clean up
            // This method is provided for consistency with other page modules
            console.log('Achievements page cleanup completed');
        }
    };
}