export function initGates(app) {
    return {
        render() {
            return `
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 card-bg p-6 rounded-lg">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-2xl font-bold">Active Gates</h2>
                            <div class="flex items-center gap-2">
                                <div class="text-sm text-gray-400">Gates appear randomly</div>
                                <button id="manual-generate-gate-btn" class="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">Test Generate</button>
                            </div>
                        </div>
                        <div id="gates-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="col-span-2 text-center text-gray-400 py-8">Loading gates...</div>
                        </div>
                    </div>
                    
                    <div class="card-bg p-6 rounded-lg">
                        <h2 class="text-2xl font-bold mb-4">Gate Statistics</h2>
                        <div id="gate-stats" class="space-y-3">
                            <div class="text-center text-gray-400">Loading stats...</div>
                        </div>
                        
                        <div class="mt-6">
                            <h3 class="text-lg font-semibold mb-3">Recent Completions</h3>
                            <div id="recent-gates" class="space-y-2">
                                <div class="text-center text-gray-400 text-sm">No recent completions</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        init() {
            // Clean up expired gates on page load
            this.cleanupExpiredGates();
            
            this.setupEventListeners();
            this.updateGatesList();
            this.updateGateStats();
            this.updateRecentCompletions();
            
            // Set up auto-refresh for time remaining
            this.startTimeUpdater();
        },

        cleanupExpiredGates() {
            if (!Array.isArray(app.state.gates)) return;
            
            const now = Date.now();
            const expiredGates = app.state.gates.filter(g => g.expiresAt <= now);
            
            if (expiredGates.length > 0) {
                app.state.gates = app.state.gates.filter(g => g.expiresAt > now);
                
                // Initialize stats if they don't exist
                if (!app.state.stats) app.state.stats = {};
                if (!app.state.stats.gatesExpired) {
                    app.state.stats.gatesExpired = 0;
                }
                app.state.stats.gatesExpired += expiredGates.length;
                
                // Add to activity log
                if (!Array.isArray(app.state.activityLog)) {
                    app.state.activityLog = [];
                }
                expiredGates.forEach(gate => {
                    app.state.activityLog.push({
                        type: 'gate_expired',
                        rank: gate.rank,
                        description: gate.description,
                        timestamp: now
                    });
                });
                
                app.saveData();
            }
        },

        setupEventListeners() {
            // Remove any existing listeners first
            if (this.clickHandler) {
                document.removeEventListener('click', this.clickHandler);
            }
            
            // Gate completion buttons - use event delegation
            const self = this;
            this.clickHandler = (event) => {
                if (event.target.classList.contains('complete-gate-btn')) {
                    event.preventDefault();
                    event.stopPropagation();
                    const gateId = event.target.dataset.gateId;
                    console.log('Completing gate:', gateId); // Debug log
                    console.log('Button element:', event.target); // Debug log
                    if (gateId) {
                        self.completeGate(gateId);
                    } else {
                        console.error('No gate ID found on button');
                        app.modalAlert('Error: Gate ID not found!');
                    }
                } else if (event.target.id === 'manual-generate-gate-btn') {
                    event.preventDefault();
                    event.stopPropagation();
                    self.generateGate();
                }
            };
            
            document.addEventListener('click', this.clickHandler);
        },

        updateGatesList() {
            const container = document.getElementById('gates-list');
            if (!container) return;

            // Clean up expired gates first
            if (Array.isArray(app.state.gates)) {
                const now = Date.now();
                const expiredGates = app.state.gates.filter(g => g.expiresAt <= now);
                app.state.gates = app.state.gates.filter(g => g.expiresAt > now);
                
                if (expiredGates.length > 0) {
                    // Initialize stats if they don't exist
                    if (!app.state.stats) app.state.stats = {};
                    if (!app.state.stats.gatesExpired) {
                        app.state.stats.gatesExpired = 0;
                    }
                    app.state.stats.gatesExpired += expiredGates.length;
                    
                    // Add to activity log
                    if (!Array.isArray(app.state.activityLog)) {
                        app.state.activityLog = [];
                    }
                    expiredGates.forEach(gate => {
                        app.state.activityLog.push({
                            type: 'gate_expired',
                            rank: gate.rank,
                            description: gate.description,
                            timestamp: now
                        });
                    });
                    
                    app.saveData(); // Save if we removed expired gates
                    
                    // Show notification for expired gates
                    if (expiredGates.length === 1) {
                        app.modalAlert(`A ${expiredGates[0].rank}-Rank Gate has expired!`, 'Gate Expired');
                    } else {
                        app.modalAlert(`${expiredGates.length} Gates have expired!`, 'Gates Expired');
                    }
                }
            }

            if (!app.state.gates || app.state.gates.length === 0) {
                container.innerHTML = '<div class="col-span-2 text-center text-gray-400 py-8">No active gates. Gates appear randomly during your journey.</div>';
                return;
            }

            const html = app.state.gates.map(gate => {
                const timeLeft = this.getTimeLeft(gate.expiresAt);
                const isExpired = gate.expiresAt <= Date.now();
                const borderColor = this.getRankColor(gate.rank);
                
                return `
                    <div class="gate-card card-bg p-4 rounded-lg border-l-4 ${borderColor} ${isExpired ? 'opacity-50' : ''}">
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-lg font-bold ${this.getRankTextColor(gate.rank)}">${gate.rank}-Rank Gate</h3>
                            <span class="text-sm text-gray-400 time-remaining" data-expires="${gate.expiresAt}">${timeLeft}</span>
                        </div>
                        <p class="text-gray-300 mb-3">${gate.description}</p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-indigo-400">Reward: ${gate.reward} XP</span>
                            <button class="complete-gate-btn ${isExpired ? 'bg-gray-600 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400'} py-1 px-3 rounded text-sm" 
                                    data-gate-id="${gate.id}" ${isExpired ? 'disabled' : ''}>
                                ${isExpired ? 'Expired' : 'Complete'}
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            
            container.innerHTML = html;
        },

        getTimeLeft(expiresAt) {
            const now = Date.now();
            const timeLeft = expiresAt - now;
            
            if (timeLeft <= 0) return 'Expired';
            
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 0) {
                return `${hours}h ${minutes}m left`;
            } else {
                return `${minutes}m left`;
            }
        },

        generateGate() {
            if (!Array.isArray(app.state.gates)) app.state.gates = [];
            if (!Array.isArray(app.state.completedGates)) app.state.completedGates = [];
            
            const now = Date.now();
            
            // Remove expired gates
            app.state.gates = app.state.gates.filter(g => g.expiresAt > now);
            
            if (app.state.gates.length >= 3) {
                app.modalAlert('Maximum number of active gates reached!');
                return;
            }

            const gateDatabase = this.getGateDatabase();
            const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
            
            // Find available ranks (not currently active)
            const availableRanks = ranks.filter(rank => 
                !app.state.gates.some(active => active.rank === rank)
            );

            if (availableRanks.length === 0) {
                app.modalAlert('Maximum number of active gates reached!');
                return;
            }

            // Weighted random selection (higher chance for lower ranks)
            const weights = { 'E': 35, 'D': 25, 'C': 20, 'B': 12, 'A': 6, 'S': 2 };
            const availableWithWeights = availableRanks.map(rank => ({ rank, weight: weights[rank] }));
            
            const totalWeight = availableWithWeights.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;
            
            let selectedRank = 'E';
            for (const item of availableWithWeights) {
                random -= item.weight;
                if (random <= 0) {
                    selectedRank = item.rank;
                    break;
                }
            }

            // Select random gate from the chosen rank
            const rankGates = gateDatabase[selectedRank];
            const selectedGateData = rankGates[Math.floor(Math.random() * rankGates.length)];
            const selectedGate = { rank: selectedRank, ...selectedGateData };
            const durations = { 'S': 60 * 60 * 1000, 'A': 3 * 60 * 60 * 1000, 'B': 6 * 60 * 60 * 1000, 'C': 12 * 60 * 60 * 1000, 'D': 18 * 60 * 60 * 1000, 'E': 24 * 60 * 60 * 1000 };
            const expiresAt = now + (durations[selectedGate.rank] || 6 * 60 * 60 * 1000);
            const id = `gate_${now}_${Math.random().toString(36).slice(2, 7)}`;

            app.state.gates.push({ id, ...selectedGate, createdAt: now, expiresAt });
            
            // Track gate generation statistics
            if (!app.state.stats) app.state.stats = {};
            if (!app.state.stats.gatesGenerated) {
                app.state.stats.gatesGenerated = 0;
            }
            app.state.stats.gatesGenerated++;
            
            // Track generation by rank
            const rankGenKey = `${selectedGate.rank.toLowerCase()}RanksGenerated`;
            if (!app.state.stats[rankGenKey]) {
                app.state.stats[rankGenKey] = 0;
            }
            app.state.stats[rankGenKey]++;
            
            app.saveData();
            
            // Update displays without full page re-render
            this.updateGatesList();
            this.updateGateStats();
            
            app.modalAlert(`New ${selectedGate.rank}-Rank Gate has appeared!`);
        },

        // Automatic gate spawning (called from app.js)
        trySpawnRandomGate() {
            if (!Array.isArray(app.state.gates)) app.state.gates = [];
            
            const now = Date.now();
            
            // Remove expired gates first
            app.state.gates = app.state.gates.filter(g => g.expiresAt > now);
            
            // Don't spawn if we already have 3 gates
            if (app.state.gates.length >= 3) return false;
            
            // Check if enough time has passed since last gate (minimum 2 hours)
            const lastGateTime = app.state.lastGateSpawnTime || 0;
            const timeSinceLastGate = now - lastGateTime;
            const minTimeBetweenGates = 2 * 60 * 60 * 1000; // 2 hours
            
            if (timeSinceLastGate < minTimeBetweenGates) return false;
            
            // Random chance to spawn (30% chance per check)
            if (Math.random() > 0.3) return false;
            
            const gateDatabase = this.getGateDatabase();
            const ranks = ['E', 'D', 'C', 'B', 'A', 'S'];
            
            // Find available ranks (not currently active)
            const availableRanks = ranks.filter(rank => 
                !app.state.gates.some(active => active.rank === rank)
            );

            if (availableRanks.length === 0) return false;

            // Weighted random selection (higher chance for lower ranks)
            const weights = { 'E': 35, 'D': 25, 'C': 20, 'B': 12, 'A': 6, 'S': 2 };
            const availableWithWeights = availableRanks.map(rank => ({ rank, weight: weights[rank] }));
            
            const totalWeight = availableWithWeights.reduce((sum, item) => sum + item.weight, 0);
            let random = Math.random() * totalWeight;
            
            let selectedRank = 'E';
            for (const item of availableWithWeights) {
                random -= item.weight;
                if (random <= 0) {
                    selectedRank = item.rank;
                    break;
                }
            }

            // Select random gate from the chosen rank
            const rankGates = gateDatabase[selectedRank];
            const selectedGateData = rankGates[Math.floor(Math.random() * rankGates.length)];
            const selectedGate = { rank: selectedRank, ...selectedGateData };
            const durations = { 
                'S': 60 * 60 * 1000,      // 1 hour
                'A': 3 * 60 * 60 * 1000,  // 3 hours
                'B': 6 * 60 * 60 * 1000,  // 6 hours
                'C': 12 * 60 * 60 * 1000, // 12 hours
                'D': 18 * 60 * 60 * 1000, // 18 hours
                'E': 24 * 60 * 60 * 1000  // 24 hours
            };
            const expiresAt = now + (durations[selectedGate.rank] || 6 * 60 * 60 * 1000);
            const id = `gate_${now}_${Math.random().toString(36).slice(2, 7)}`;

            app.state.gates.push({ id, ...selectedGate, createdAt: now, expiresAt });
            app.state.lastGateSpawnTime = now;
            
            // Track gate generation statistics
            if (!app.state.stats) app.state.stats = {};
            if (!app.state.stats.gatesGenerated) {
                app.state.stats.gatesGenerated = 0;
            }
            app.state.stats.gatesGenerated++;
            
            // Track generation by rank
            const rankGenKey = `${selectedGate.rank.toLowerCase()}RanksGenerated`;
            if (!app.state.stats[rankGenKey]) {
                app.state.stats[rankGenKey] = 0;
            }
            app.state.stats[rankGenKey]++;
            
            app.saveData();
            
            // Update display if on gates page
            if (app.currentPage === 'gates') {
                this.updateGatesList();
                this.updateGateStats();
            }
            
            // Show notification
            app.modalAlert(`⚠️ Gate Detected! A ${selectedGate.rank}-Rank Gate has appeared!`, 'Gate Alert');
            
            return true;
        },

        completeGate(gateId) {
            console.log('Attempting to complete gate:', gateId);
            console.log('Current gates:', app.state.gates);
            console.log('Gate ID type:', typeof gateId);
            
            if (!gateId) {
                console.error('No gate ID provided');
                app.modalAlert('Error: No gate ID provided!');
                return;
            }
            
            if (!Array.isArray(app.state.gates)) {
                console.log('Gates array not found, initializing...');
                app.state.gates = [];
            }
            
            const gateIndex = app.state.gates.findIndex(g => g.id === gateId);
            console.log('Found gate at index:', gateIndex);
            
            if (gateIndex === -1) {
                console.error('Gate not found. Available gate IDs:', app.state.gates.map(g => g.id));
                console.error('Looking for gate ID:', gateId);
                app.modalAlert('Gate not found! It may have expired or been removed.');
                // Refresh the gates list to remove any stale UI
                this.updateGatesList();
                return;
            }

            const gate = app.state.gates[gateIndex];
            
            // Check if gate has expired
            if (gate.expiresAt <= Date.now()) {
                app.modalAlert('This gate has expired!');
                // Remove expired gate
                app.state.gates.splice(gateIndex, 1);
                app.saveData();
                this.updateGatesList();
                return;
            }

            // Award XP and update stats
            app.state.xp += gate.reward;
            
            // Initialize stats if they don't exist
            if (!app.state.stats) app.state.stats = {};
            if (!app.state.stats.gatesCleared) app.state.stats.gatesCleared = 0;
            
            app.state.stats.gatesCleared++;
            
            // Update rank-specific stats
            const rankKey = `${gate.rank.toLowerCase()}RanksCleared`;
            console.log('Updating rank stat:', rankKey, 'for gate rank:', gate.rank);
            
            // Initialize the stat if it doesn't exist
            if (!app.state.stats[rankKey]) {
                app.state.stats[rankKey] = 0;
            }
            app.state.stats[rankKey]++;
            
            // Track gate completion by specific gate description for secret achievements
            if (!Array.isArray(app.state.completedGateDescriptions)) {
                app.state.completedGateDescriptions = [];
            }
            
            // Create a unique identifier for this specific gate type
            const gateIdentifier = `${gate.rank}_${gate.description.substring(0, 20)}`;
            if (!app.state.completedGateDescriptions.includes(gateIdentifier)) {
                app.state.completedGateDescriptions.push(gateIdentifier);
            }
            
            console.log('Updated stats:', app.state.stats);

            // Check for level up
            while (app.state.xp >= app.state.xpToNextLevel) {
                app.state.xp -= app.state.xpToNextLevel;
                app.state.level++;
                app.state.xpToNextLevel = Math.floor(app.state.xpToNextLevel * 1.2);
            }

            // Add to completed gates and remove from active
            if (!Array.isArray(app.state.completedGates)) {
                app.state.completedGates = [];
            }
            app.state.completedGates.push({
                rank: gate.rank,
                description: gate.description,
                reward: gate.reward,
                completedAt: Date.now(),
                gateId: gate.id
            });
            
            app.state.gates.splice(gateIndex, 1);

            // Add to activity log
            if (!Array.isArray(app.state.activityLog)) {
                app.state.activityLog = [];
            }
            app.state.activityLog.push({
                type: 'gate_completed',
                rank: gate.rank,
                description: gate.description,
                reward: gate.reward,
                timestamp: Date.now()
            });

            app.saveData();
            
            // Check for achievements after gate completion
            if (app.checkAchievements) {
                app.checkAchievements();
            }
            
            // Update dashboard if it's the current page
            if (app.currentPage === 'dashboard' && app.pages.dashboard && app.pages.dashboard.updateContent) {
                app.pages.dashboard.updateContent();
            }
            
            app.modalAlert(`${gate.rank}-Rank Gate completed! +${gate.reward} XP`, 'Gate Cleared!');
            
            // Update displays without full page re-render
            this.updateGatesList();
            this.updateGateStats();
            this.updateRecentCompletions();
        },

        getRankColor(rank) {
            const colors = {
                'S': 'border-purple-500',
                'A': 'border-red-500',
                'B': 'border-orange-500',
                'C': 'border-yellow-500',
                'D': 'border-green-500',
                'E': 'border-blue-500'
            };
            return colors[rank] || 'border-gray-500';
        },

        getRankTextColor(rank) {
            const colors = {
                'S': 'text-purple-400',
                'A': 'text-red-400',
                'B': 'text-orange-400',
                'C': 'text-yellow-400',
                'D': 'text-green-400',
                'E': 'text-blue-400'
            };
            return colors[rank] || 'text-gray-400';
        },

        updateGateStats() {
            const container = document.getElementById('gate-stats');
            if (!container) return;

            // Initialize stats if they don't exist
            if (!app.state.stats) app.state.stats = {};
            
            const stats = app.state.stats;
            const totalGates = stats.gatesCleared || 0;
            const totalGenerated = stats.gatesGenerated || 0;
            const totalExpired = stats.gatesExpired || 0;
            const sRank = stats.sRanksCleared || 0;
            const aRank = stats.aRanksCleared || 0;
            const bRank = stats.bRanksCleared || 0;
            const cRank = stats.cRanksCleared || 0;
            const dRank = stats.dRanksCleared || 0;
            const eRank = stats.eRanksCleared || 0;
            
            const completionRate = totalGenerated > 0 ? Math.round((totalGates / totalGenerated) * 100) : 0;

            const html = `
                <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="text-center p-2 bg-gray-800 rounded">
                        <div class="text-lg font-bold text-amber-400">${totalGates}</div>
                        <div class="text-xs text-gray-400">Cleared</div>
                    </div>
                    <div class="text-center p-2 bg-gray-800 rounded">
                        <div class="text-lg font-bold text-blue-400">${totalGenerated}</div>
                        <div class="text-xs text-gray-400">Generated</div>
                    </div>
                    <div class="text-center p-2 bg-gray-800 rounded">
                        <div class="text-lg font-bold text-red-400">${totalExpired}</div>
                        <div class="text-xs text-gray-400">Expired</div>
                    </div>
                </div>
                
                <div class="text-center p-2 bg-gray-800 rounded mb-4">
                    <div class="text-lg font-bold text-green-400">${completionRate}%</div>
                    <div class="text-xs text-gray-400">Success Rate</div>
                </div>
                
                <div class="space-y-2">
                    <div class="flex justify-between items-center">
                        <span class="text-purple-400 font-semibold">S-Rank</span>
                        <span class="text-white">${sRank}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-red-400 font-semibold">A-Rank</span>
                        <span class="text-white">${aRank}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-orange-400 font-semibold">B-Rank</span>
                        <span class="text-white">${bRank}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-yellow-400 font-semibold">C-Rank</span>
                        <span class="text-white">${cRank}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-green-400 font-semibold">D-Rank</span>
                        <span class="text-white">${dRank}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-blue-400 font-semibold">E-Rank</span>
                        <span class="text-white">${eRank}</span>
                    </div>
                </div>
                
                ${totalGates > 0 ? `
                <div class="mt-4 p-3 bg-gray-800 rounded">
                    <div class="text-sm text-gray-400 mb-2">Secret Achievements</div>
                    <div class="text-xs text-green-400">
                        ${this.getSecretAchievementCount()} discovered
                    </div>
                    <div class="text-xs text-gray-500 mt-1">
                        ${this.getSecretAchievementCount() === 0 ? 
                            'Complete gates to discover secrets...' : 
                            'Keep clearing gates for more secrets!'
                        }
                    </div>
                </div>
                ` : ''}
            `;

            container.innerHTML = html;
        },

        updateRecentCompletions() {
            const container = document.getElementById('recent-gates');
            if (!container) return;

            if (!Array.isArray(app.state.activityLog)) {
                container.innerHTML = '<div class="text-center text-gray-400 text-sm">No recent completions</div>';
                return;
            }

            const recentGates = app.state.activityLog
                .filter(log => log.type === 'gate_completed')
                .slice(-5)
                .reverse();

            if (recentGates.length === 0) {
                container.innerHTML = '<div class="text-center text-gray-400 text-sm">No recent completions</div>';
                return;
            }

            const html = recentGates.map(gate => {
                const timeAgo = this.getTimeAgo(gate.timestamp);
                return `
                    <div class="flex justify-between items-center p-2 bg-gray-800 rounded text-sm">
                        <span class="${this.getRankTextColor(gate.rank)}">${gate.rank}-Rank</span>
                        <span class="text-indigo-400">+${gate.reward} XP</span>
                        <span class="text-gray-500">${timeAgo}</span>
                    </div>
                `;
            }).join('');

            container.innerHTML = html;
        },

        getTimeAgo(timestamp) {
            const now = Date.now();
            const diff = now - timestamp;
            
            const minutes = Math.floor(diff / (1000 * 60));
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            
            if (days > 0) return `${days}d ago`;
            if (hours > 0) return `${hours}h ago`;
            if (minutes > 0) return `${minutes}m ago`;
            return 'Just now';
        },

        getSecretAchievementCount() {
            if (!app.pages.achievements) return 0;
            
            const achievements = app.pages.achievements.getAchievementsData();
            const userStats = app.state.stats || {};
            
            // Count unlocked secret gate achievements
            const secretGateAchievements = achievements.filter(a => 
                a.secret && a.id.startsWith('gate_')
            );
            
            const unlockedSecretGates = secretGateAchievements.filter(a => 
                app.pages.achievements.checkAchievement(a, userStats)
            );
            
            return unlockedSecretGates.length;
        },

        startTimeUpdater() {
            // Clear any existing interval
            if (this.timeUpdateInterval) {
                clearInterval(this.timeUpdateInterval);
            }
            
            // Update time remaining every minute
            this.timeUpdateInterval = setInterval(() => {
                const timeElements = document.querySelectorAll('.time-remaining');
                timeElements.forEach(element => {
                    const expiresAt = parseInt(element.dataset.expires);
                    const timeLeft = this.getTimeLeft(expiresAt);
                    element.textContent = timeLeft;
                    
                    // If expired, update the entire gates list
                    if (timeLeft === 'Expired') {
                        this.updateGatesList();
                    }
                });
            }, 60000); // Update every minute
        },

        cleanup() {
            // Clean up event listeners and intervals
            if (this.clickHandler) {
                document.removeEventListener('click', this.clickHandler);
            }
            if (this.timeUpdateInterval) {
                clearInterval(this.timeUpdateInterval);
            }
        },

        getGateDatabase() {
            return {
                'E': [
                    { description: 'Complete 20 push-ups without stopping', reward: 25 },
                    { description: 'Hold a plank for 1 minute straight', reward: 25 },
                    { description: 'Complete 30 squats in under 3 minutes', reward: 25 },
                    { description: 'Do 15 burpees without rest', reward: 30 },
                    { description: 'Walk 2000 steps in one session', reward: 20 },
                    { description: 'Hold a wall sit for 45 seconds', reward: 25 },
                    { description: 'Complete 25 jumping jacks', reward: 20 },
                    { description: 'Do 10 mountain climbers per leg', reward: 25 },
                    { description: 'Hold a bridge pose for 30 seconds', reward: 20 },
                    { description: 'Complete 15 lunges per leg', reward: 25 }
                ],
                'D': [
                    { description: 'Hold a plank for 2 minutes straight', reward: 50 },
                    { description: 'Complete 40 push-ups without stopping', reward: 50 },
                    { description: 'Do 50 squats in under 4 minutes', reward: 50 },
                    { description: 'Complete 25 burpees in one session', reward: 55 },
                    { description: 'Walk 5000 steps in one session', reward: 45 },
                    { description: 'Hold a wall sit for 90 seconds', reward: 50 },
                    { description: 'Complete 100 jumping jacks', reward: 45 },
                    { description: 'Do 20 mountain climbers per leg', reward: 50 },
                    { description: 'Hold a bridge pose for 60 seconds', reward: 45 },
                    { description: 'Complete 25 lunges per leg', reward: 50 }
                ],
                'C': [
                    { description: 'Complete 50 squats in under 5 minutes', reward: 75 },
                    { description: 'Hold a plank for 3 minutes straight', reward: 75 },
                    { description: 'Complete 60 push-ups without stopping', reward: 75 },
                    { description: 'Do 40 burpees in one session', reward: 80 },
                    { description: 'Walk 8000 steps in one session', reward: 70 },
                    { description: 'Hold a wall sit for 2 minutes', reward: 75 },
                    { description: 'Complete 200 jumping jacks', reward: 70 },
                    { description: 'Do 30 mountain climbers per leg', reward: 75 },
                    { description: 'Complete a 15-minute bodyweight circuit', reward: 80 },
                    { description: 'Do 50 lunges per leg', reward: 75 }
                ],
                'B': [
                    { description: 'Run 1 mile in under 10 minutes', reward: 100 },
                    { description: 'Complete 80 push-ups without stopping', reward: 100 },
                    { description: 'Hold a plank for 4 minutes straight', reward: 100 },
                    { description: 'Do 60 burpees in one session', reward: 110 },
                    { description: 'Walk 12000 steps in one session', reward: 95 },
                    { description: 'Complete 100 squats in under 6 minutes', reward: 100 },
                    { description: 'Hold a wall sit for 3 minutes', reward: 100 },
                    { description: 'Complete a 25-minute HIIT workout', reward: 110 },
                    { description: 'Do 100 mountain climbers per leg', reward: 100 },
                    { description: 'Complete 75 lunges per leg', reward: 100 }
                ],
                'A': [
                    { description: 'Complete 100 burpees in one session', reward: 150 },
                    { description: 'Run 2 miles in under 18 minutes', reward: 150 },
                    { description: 'Complete 120 push-ups without stopping', reward: 150 },
                    { description: 'Hold a plank for 5 minutes straight', reward: 150 },
                    { description: 'Walk 15000 steps in one session', reward: 140 },
                    { description: 'Complete 150 squats in under 8 minutes', reward: 150 },
                    { description: 'Hold a wall sit for 4 minutes', reward: 150 },
                    { description: 'Complete a 40-minute endurance workout', reward: 160 },
                    { description: 'Do 150 mountain climbers per leg', reward: 150 },
                    { description: 'Complete 100 lunges per leg', reward: 150 }
                ],
                'S': [
                    { description: 'Deadlift 2x your bodyweight', reward: 250 },
                    { description: 'Complete 200 burpees in one session', reward: 250 },
                    { description: 'Run 3 miles in under 24 minutes', reward: 250 },
                    { description: 'Complete 200 push-ups without stopping', reward: 250 },
                    { description: 'Hold a plank for 8 minutes straight', reward: 250 },
                    { description: 'Squat 1.5x your bodyweight for 10 reps', reward: 250 },
                    { description: 'Bench press your bodyweight for 15 reps', reward: 250 },
                    { description: 'Complete a 60-minute extreme workout', reward: 270 },
                    { description: 'Do 300 mountain climbers per leg', reward: 250 },
                    { description: 'Complete 150 lunges per leg', reward: 250 }
                ]
            };
        },

        cleanup() {
            // Clean up interval when leaving the page
            if (this.timeUpdateInterval) {
                clearInterval(this.timeUpdateInterval);
                this.timeUpdateInterval = null;
            }
            
            // Clean up event listener
            if (this.clickHandler) {
                document.removeEventListener('click', this.clickHandler);
                this.clickHandler = null;
            }
        }
    };
}