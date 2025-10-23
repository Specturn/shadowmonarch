export function initSettings(app) {
    return {
        render() {
            return `
                <div class="settings-container max-w-4xl mx-auto space-y-6">
                    <!-- Header Section -->
                    <div class="card-bg p-6 rounded-xl border border-gray-700/50">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-cog text-xl text-gray-300"></i>
                            </div>
                            <div class="flex-1">
                                <h1 class="text-3xl font-bold text-white mb-1">Settings</h1>
                                <p class="text-gray-400">Customize your Shadow Monarch experience</p>
                            </div>
                        </div>
                    </div>

                    <!-- Account Overview Card -->
                    <div class="card-bg p-6 rounded-xl border border-gray-700/50">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="text-xl font-semibold text-white flex items-center">
                                <i class="fas fa-user-circle text-blue-400 mr-3"></i>
                                Account Overview
                            </h2>
                            <div class="flex items-center space-x-2 text-sm text-green-400">
                                <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                <span>Online</span>
                            </div>
                        </div>
                        <div id="account-info" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                                <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Player Name</div>
                                <div class="text-lg font-semibold text-white loading-shimmer">Loading...</div>
                            </div>
                            <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                                <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Level</div>
                                <div class="text-lg font-semibold text-indigo-400 loading-shimmer">Loading...</div>
                            </div>
                            <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                                <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Workouts</div>
                                <div class="text-lg font-semibold text-green-400 loading-shimmer">Loading...</div>
                            </div>
                            <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                                <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Member Since</div>
                                <div class="text-lg font-semibold text-purple-400 loading-shimmer">Loading...</div>
                            </div>
                        </div>
                    </div>

                    <!-- Workout Preferences -->
                    <div class="card-bg p-6 rounded-xl border border-gray-700/50">
                        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                            <i class="fas fa-dumbbell text-orange-400 mr-3"></i>
                            Workout Preferences
                        </h2>
                        <div class="space-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-3">Training Difficulty</label>
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div class="difficulty-option" data-value="Easy">
                                        <div class="p-4 rounded-lg border-2 border-gray-700 hover:border-green-500 cursor-pointer transition-all duration-200 bg-gray-800/30 hover:bg-gray-800/60">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="font-semibold text-green-400">Easy</span>
                                                <i class="fas fa-leaf text-green-400"></i>
                                            </div>
                                            <div class="text-sm text-gray-400 mb-2">+1.25 kg progression</div>
                                            <div class="text-xs text-gray-500">Perfect for beginners or recovery periods</div>
                                        </div>
                                    </div>
                                    <div class="difficulty-option" data-value="Normal">
                                        <div class="p-4 rounded-lg border-2 border-gray-700 hover:border-blue-500 cursor-pointer transition-all duration-200 bg-gray-800/30 hover:bg-gray-800/60">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="font-semibold text-blue-400">Normal</span>
                                                <i class="fas fa-balance-scale text-blue-400"></i>
                                            </div>
                                            <div class="text-sm text-gray-400 mb-2">+2.5 kg progression</div>
                                            <div class="text-xs text-gray-500">Balanced progression for most users</div>
                                        </div>
                                    </div>
                                    <div class="difficulty-option" data-value="Hard">
                                        <div class="p-4 rounded-lg border-2 border-gray-700 hover:border-red-500 cursor-pointer transition-all duration-200 bg-gray-800/30 hover:bg-gray-800/60">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="font-semibold text-red-400">Hard</span>
                                                <i class="fas fa-fire text-red-400"></i>
                                            </div>
                                            <div class="text-sm text-gray-400 mb-2">+5 kg progression</div>
                                            <div class="text-xs text-gray-500">Aggressive progression for experienced lifters</div>
                                        </div>
                                    </div>
                                </div>
                                <input type="hidden" id="difficulty-select" value="Normal">
                            </div>
                        </div>
                    </div>

                    <!-- Privacy & Security -->
                    <div class="card-bg p-6 rounded-xl border border-gray-700/50">
                        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                            <i class="fas fa-shield-alt text-blue-400 mr-3"></i>
                            Privacy & Security
                        </h2>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/30">
                                <div class="flex items-center space-x-4">
                                    <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-sign-in-alt text-blue-400"></i>
                                    </div>
                                    <div>
                                        <div class="font-medium text-gray-300">Stay Logged In</div>
                                        <div class="text-sm text-gray-500">Automatically sign in when you visit the app</div>
                                    </div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer toggle-switch-container">
                                    <input type="checkbox" id="auto-login-toggle" class="toggle-checkbox">
                                    <div class="toggle-switch"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Data Management -->
                    <div class="card-bg p-6 rounded-xl border border-gray-700/50">
                        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                            <i class="fas fa-database text-purple-400 mr-3"></i>
                            Data Management
                        </h2>
                        <div class="space-y-4">
                            <!-- Activity Log Statistics -->
                            <div id="activity-log-stats" class="p-4 bg-gray-800/30 border border-gray-600/30 rounded-lg">
                                <div class="flex items-center justify-between mb-3">
                                    <h3 class="font-medium text-gray-300">Activity Log Statistics</h3>
                                    <i class="fas fa-chart-line text-gray-400"></i>
                                </div>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div class="text-center p-2 bg-gray-700/30 rounded">
                                        <div class="text-lg font-bold text-blue-400" id="total-activities">0</div>
                                        <div class="text-xs text-gray-400">Total Activities</div>
                                    </div>
                                    <div class="text-center p-2 bg-gray-700/30 rounded">
                                        <div class="text-lg font-bold text-green-400" id="recent-activities">0</div>
                                        <div class="text-xs text-gray-400">Last 30 Days</div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Clear Activity Log -->
                            <div class="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                <div class="flex items-start space-x-3">
                                    <i class="fas fa-history text-orange-400 mt-1"></i>
                                    <div class="flex-1">
                                        <h3 class="font-medium text-orange-300 mb-1">Clear Activity Log</h3>
                                        <p class="text-sm text-orange-200/80 mb-3">Remove your activity history while keeping all other progress data intact. This includes workout logs, gate completions, and daily activity tracking. This action cannot be undone.</p>
                                        <button id="clear-activity-btn" class="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2">
                                            <i class="fas fa-trash-alt"></i>
                                            <span>Clear Activity Log</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Account Actions -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Sign Out -->
                        <div class="card-bg p-6 rounded-xl border border-gray-700/50">
                            <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                                <i class="fas fa-sign-out-alt text-blue-400 mr-3"></i>
                                Sign Out
                            </h2>
                            <p class="text-gray-400 text-sm mb-4">Sign out of your account. Any unsaved progress will be lost.</p>
                            <button id="logout-btn" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
                                <i class="fas fa-sign-out-alt"></i>
                                <span>Sign Out</span>
                            </button>
                        </div>

                        <!-- Danger Zone -->
                        <div class="card-bg p-6 rounded-xl border border-red-500/30 bg-red-500/5">
                            <h2 class="text-xl font-semibold text-red-400 mb-4 flex items-center">
                                <i class="fas fa-exclamation-triangle mr-3"></i>
                                Danger Zone
                            </h2>
                            <p class="text-red-200/80 text-sm mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
                            <button id="delete-account-btn" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
                                <i class="fas fa-trash-alt"></i>
                                <span>Delete Account</span>
                            </button>
                        </div>
                    </div>

                    <!-- App Information -->
                    <div class="card-bg p-6 rounded-xl border border-gray-700/50">
                        <h2 class="text-xl font-semibold text-white mb-4 flex items-center">
                            <i class="fas fa-info-circle text-indigo-400 mr-3"></i>
                            App Information
                        </h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div class="text-center p-3 bg-gray-800/30 rounded-lg">
                                <div class="text-gray-400">Version</div>
                                <div class="font-semibold text-white">2.0.0</div>
                            </div>
                            <div class="text-center p-3 bg-gray-800/30 rounded-lg">
                                <div class="text-gray-400">Last Updated</div>
                                <div class="font-semibold text-white">Today</div>
                            </div>
                            <div class="text-center p-3 bg-gray-800/30 rounded-lg">
                                <div class="text-gray-400">Data Sync</div>
                                <div class="font-semibold text-green-400">Active</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        init() {
            this.setupEventListeners();
            this.updateContent();
            
            // Add subtle animations on load
            setTimeout(() => {
                this.animateCardsIn();
            }, 100);
        },

        animateCardsIn() {
            const cards = document.querySelectorAll('.settings-container .card-bg');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.4s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });
        },

        setupEventListeners() {
            // Remove any existing listeners first
            this.cleanup();

            // Store app reference for closures
            const appRef = app;
            const self = this;

            // Store references to bound functions for cleanup
            this.difficultyClickHandler = (event) => {
                const option = event.target.closest('.difficulty-option');
                if (option) {
                    const difficulty = option.dataset.value;
                    self.selectDifficulty(difficulty);
                    appRef.state.difficulty = difficulty;
                    appRef.safeSave();
                    appRef.showSuccessNotification(`Training difficulty set to ${difficulty}`);
                }
            };

            this.clearActivityHandler = () => {
                // Show current activity log count for better context
                const activityCount = appRef.state.activityLog ? appRef.state.activityLog.length : 0;
                
                appRef.modalConfirm({
                    title: 'Clear Activity Log',
                    message: `Are you sure you want to clear your activity log?\n\nThis will remove ${activityCount} activity entries from your history while keeping all other progress data intact.\n\nThis action cannot be undone.`,
                    confirmText: 'Clear Activity Log',
                    cancelText: 'Cancel'
                }).then((confirmed) => {
                    if (confirmed) {
                        const previousCount = appRef.state.activityLog ? appRef.state.activityLog.length : 0;
                        
                        // Clear the activity log
                        appRef.state.activityLog = [];
                        
                        // Save the changes
                        appRef.safeSave().then(() => {
                            // Show detailed success message
                            appRef.showSuccessNotification(`Activity log cleared successfully. Removed ${previousCount} activity entries.`);
                            
                            // Update the button to show it worked
                            self.updateClearActivityButton();
                            
                            // If user is on dashboard, refresh the activity display
                            if (appRef.currentPage === 'dashboard') {
                                setTimeout(() => {
                                    if (appRef.pages.dashboard && typeof appRef.pages.dashboard.updateActivityHeatmap === 'function') {
                                        appRef.pages.dashboard.updateActivityHeatmap();
                                    }
                                }, 500);
                            }
                            
                        }).catch(error => {
                            console.error("Error clearing activity log:", error);
                            appRef.showErrorNotification("Could not clear activity log. Please try again.");
                        });
                    }
                });
            };

            this.autoLoginToggleHandler = (event) => {
                const isEnabled = event.target.checked;
                appRef.setAutoLogin(isEnabled);
                
                if (isEnabled) {
                    appRef.showSuccessNotification('Auto-login enabled. You will stay signed in on future visits.');
                } else {
                    appRef.showInfoNotification('Auto-login disabled. You will need to sign in manually next time.');
                }
            };

            this.logoutHandler = () => {
                appRef.modalConfirm({
                    title: 'Sign Out',
                    message: 'Are you sure you want to sign out? Any unsaved progress will be automatically saved.',
                    confirmText: 'Sign Out',
                    cancelText: 'Cancel'
                }).then((confirmed) => {
                    if (confirmed) {
                        // Save data before logout
                        appRef.safeSave().finally(() => {
                            appRef.performLogout();
                        });
                    }
                });
            };

            this.deleteAccountHandler = () => {
                appRef.modalPrompt({
                    title: 'Confirm Account Deletion',
                    message: `⚠️ This action is permanent and cannot be undone.\n\nType your player name to confirm: "${appRef.state.playerName}"`,
                    placeholder: appRef.state.playerName
                }).then((val) => {
                    if (val === appRef.state.playerName) {
                        self.deleteAccount();
                    } else if (val !== null) {
                        appRef.showErrorNotification("Name does not match. Account deletion cancelled.");
                    }
                });
            };

            // Add event listeners with proper references
            const difficultyOptions = document.querySelectorAll('.difficulty-option');
            const clearActivityBtn = document.getElementById('clear-activity-btn');
            const autoLoginToggle = document.getElementById('auto-login-toggle');
            const logoutBtn = document.getElementById('logout-btn');
            const deleteAccountBtn = document.getElementById('delete-account-btn');

            // Difficulty selection
            difficultyOptions.forEach(option => {
                option.addEventListener('click', this.difficultyClickHandler);
            });

            if (clearActivityBtn) {
                clearActivityBtn.addEventListener('click', this.clearActivityHandler);
            }

            if (autoLoginToggle) {
                autoLoginToggle.addEventListener('change', this.autoLoginToggleHandler);
            }

            if (logoutBtn) {
                logoutBtn.addEventListener('click', this.logoutHandler);
            }

            if (deleteAccountBtn) {
                deleteAccountBtn.addEventListener('click', this.deleteAccountHandler);
            }
        },

        selectDifficulty(difficulty) {
            // Update visual selection
            document.querySelectorAll('.difficulty-option').forEach(option => {
                const card = option.querySelector('div');
                if (option.dataset.value === difficulty) {
                    card.classList.remove('border-gray-700');
                    if (difficulty === 'Easy') {
                        card.classList.add('border-green-500', 'bg-green-500/10');
                    } else if (difficulty === 'Normal') {
                        card.classList.add('border-blue-500', 'bg-blue-500/10');
                    } else if (difficulty === 'Hard') {
                        card.classList.add('border-red-500', 'bg-red-500/10');
                    }
                } else {
                    card.classList.add('border-gray-700');
                    card.classList.remove('border-green-500', 'border-blue-500', 'border-red-500', 'bg-green-500/10', 'bg-blue-500/10', 'bg-red-500/10');
                }
            });

            // Update hidden input
            const hiddenInput = document.getElementById('difficulty-select');
            if (hiddenInput) {
                hiddenInput.value = difficulty;
            }
        },

        updateContent() {
            // Update difficulty selection
            const currentDifficulty = app.state.difficulty || 'Normal';
            this.selectDifficulty(currentDifficulty);

            // Update auto-login toggle
            const autoLoginToggle = document.getElementById('auto-login-toggle');
            if (autoLoginToggle) {
                autoLoginToggle.checked = app.getAutoLogin();
            }
            
            // Update clear activity button
            this.updateClearActivityButton();

            // Update account info with enhanced display
            const accountInfo = document.getElementById('account-info');
            if (accountInfo) {
                const memberSince = new Date(app.state.accountCreationDate);
                const memberSinceFormatted = memberSince.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short' 
                });

                accountInfo.innerHTML = `
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                        <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Player Name</div>
                        <div class="text-lg font-semibold text-white">${app.state.playerName}</div>
                    </div>
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                        <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Current Level</div>
                        <div class="text-lg font-semibold text-indigo-400">${app.state.level}</div>
                    </div>
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                        <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Workouts</div>
                        <div class="text-lg font-semibold text-green-400">${app.state.stats?.totalWorkouts || 0}</div>
                    </div>
                    <div class="bg-gray-800/50 p-4 rounded-lg border border-gray-700/30">
                        <div class="text-xs text-gray-400 uppercase tracking-wide mb-1">Member Since</div>
                        <div class="text-lg font-semibold text-purple-400">${memberSinceFormatted}</div>
                    </div>
                `;
            }

            // Update activity log statistics
            this.updateActivityLogStats();
            
            // Add some dynamic stats
            this.updateDynamicStats();
            
            // Start periodic updates for dynamic content
            this.startPeriodicUpdates();
        },

        startPeriodicUpdates() {
            // Clear any existing interval
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
            }
            
            // Update dynamic stats every 30 seconds
            this.updateInterval = setInterval(() => {
                this.updateDynamicStats();
            }, 30000);
        },

        stopPeriodicUpdates() {
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        },

        updateDynamicStats() {
            // Add some additional dynamic information
            const statsContainer = document.querySelector('.settings-container');
            if (!statsContainer) return;

            // Update connection status
            const connectionStatus = document.querySelector('.text-green-400');
            if (connectionStatus) {
                const isOnline = navigator.onLine && (!app.connectionStatus || app.connectionStatus !== 'offline');
                
                if (!isOnline) {
                    connectionStatus.textContent = 'Offline';
                    connectionStatus.className = 'text-red-400';
                    const indicator = connectionStatus.previousElementSibling;
                    if (indicator) {
                        indicator.className = 'w-2 h-2 bg-red-400 rounded-full';
                    }
                } else {
                    connectionStatus.textContent = 'Online';
                    connectionStatus.className = 'text-green-400';
                    const indicator = connectionStatus.previousElementSibling;
                    if (indicator) {
                        indicator.className = 'w-2 h-2 bg-green-400 rounded-full animate-pulse';
                    }
                }
            }

            // Update data sync status
            const dataSyncElement = document.querySelector('.text-green-400:last-child');
            if (dataSyncElement && dataSyncElement.textContent === 'Active') {
                const lastSave = app.lastSaveAttempt;
                if (lastSave) {
                    const timeSinceLastSave = Date.now() - lastSave;
                    if (timeSinceLastSave > 300000) { // 5 minutes
                        dataSyncElement.textContent = 'Pending';
                        dataSyncElement.className = 'font-semibold text-yellow-400';
                    }
                }
            }

            // Update account stats if they've changed
            this.refreshAccountStats();
        },

        refreshAccountStats() {
            const accountInfo = document.getElementById('account-info');
            if (!accountInfo) return;

            // Check if stats have changed and update if needed
            const currentLevel = accountInfo.querySelector('.text-indigo-400');
            const currentWorkouts = accountInfo.querySelector('.text-green-400');
            
            if (currentLevel && currentLevel.textContent !== app.state.level.toString()) {
                currentLevel.textContent = app.state.level;
                // Add a subtle flash animation
                currentLevel.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    currentLevel.style.animation = '';
                }, 500);
            }

            if (currentWorkouts && currentWorkouts.textContent !== (app.state.stats?.totalWorkouts || 0).toString()) {
                currentWorkouts.textContent = app.state.stats?.totalWorkouts || 0;
                // Add a subtle flash animation
                currentWorkouts.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    currentWorkouts.style.animation = '';
                }, 500);
            }
        },

        async deleteAccount() {
            try {
                const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
                const { db } = await import('../firebase-config.js');
                
                // Delete user data from Firestore
                await deleteDoc(doc(db, "users", app.state.user.uid));
                
                // Show success message
                app.modalAlert("Account deleted successfully.");
                
                // Perform complete logout cleanup
                await app.performLogout();
                
            } catch (error) {
                console.error("Error deleting account:", error);
                app.modalAlert("Could not delete account. Please try again.");
            }
        },

        updateClearActivityButton() {
            const clearActivityBtn = document.getElementById('clear-activity-btn');
            if (!clearActivityBtn) return;
            
            const activityCount = app.state.activityLog ? app.state.activityLog.length : 0;
            const buttonText = clearActivityBtn.querySelector('span');
            
            if (buttonText) {
                if (activityCount === 0) {
                    buttonText.textContent = 'Activity Log Empty';
                    clearActivityBtn.disabled = true;
                    clearActivityBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    clearActivityBtn.classList.remove('hover:bg-orange-500');
                } else {
                    buttonText.textContent = `Clear Activity Log (${activityCount} entries)`;
                    clearActivityBtn.disabled = false;
                    clearActivityBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                    clearActivityBtn.classList.add('hover:bg-orange-500');
                }
            }
        },

        updateActivityLogStats() {
            const totalActivitiesEl = document.getElementById('total-activities');
            const recentActivitiesEl = document.getElementById('recent-activities');
            
            if (!totalActivitiesEl || !recentActivitiesEl) return;
            
            const activityLog = app.state.activityLog || [];
            const totalCount = activityLog.length;
            
            // Calculate recent activities (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const recentCount = activityLog.filter(activity => {
                if (!activity.date) return false;
                const activityDate = new Date(activity.date);
                return activityDate >= thirtyDaysAgo;
            }).length;
            
            // Update display with animation
            this.animateNumberChange(totalActivitiesEl, totalCount);
            this.animateNumberChange(recentActivitiesEl, recentCount);
        },

        animateNumberChange(element, newValue) {
            const currentValue = parseInt(element.textContent) || 0;
            
            if (currentValue !== newValue) {
                // Simple counting animation
                const duration = 500;
                const steps = 20;
                const stepValue = (newValue - currentValue) / steps;
                const stepDuration = duration / steps;
                
                let currentStep = 0;
                const interval = setInterval(() => {
                    currentStep++;
                    const displayValue = Math.round(currentValue + (stepValue * currentStep));
                    element.textContent = displayValue;
                    
                    if (currentStep >= steps) {
                        clearInterval(interval);
                        element.textContent = newValue;
                    }
                }, stepDuration);
                
                // Add flash effect
                element.style.animation = 'pulse 0.5s ease-in-out';
                setTimeout(() => {
                    element.style.animation = '';
                }, 500);
            }
        },

        cleanup() {
            // Remove event listeners to prevent memory leaks
            const difficultyOptions = document.querySelectorAll('.difficulty-option');
            const clearActivityBtn = document.getElementById('clear-activity-btn');
            const autoLoginToggle = document.getElementById('auto-login-toggle');
            const logoutBtn = document.getElementById('logout-btn');
            const deleteAccountBtn = document.getElementById('delete-account-btn');

            // Remove difficulty option listeners
            if (this.difficultyClickHandler) {
                difficultyOptions.forEach(option => {
                    option.removeEventListener('click', this.difficultyClickHandler);
                });
            }

            if (clearActivityBtn && this.clearActivityHandler) {
                clearActivityBtn.removeEventListener('click', this.clearActivityHandler);
            }

            if (autoLoginToggle && this.autoLoginToggleHandler) {
                autoLoginToggle.removeEventListener('change', this.autoLoginToggleHandler);
            }

            if (logoutBtn && this.logoutHandler) {
                logoutBtn.removeEventListener('click', this.logoutHandler);
            }

            if (deleteAccountBtn && this.deleteAccountHandler) {
                deleteAccountBtn.removeEventListener('click', this.deleteAccountHandler);
            }

            // Stop periodic updates
            this.stopPeriodicUpdates();

            // Clear handler references
            this.difficultyClickHandler = null;
            this.clearActivityHandler = null;
            this.autoLoginToggleHandler = null;
            this.logoutHandler = null;
            this.deleteAccountHandler = null;
        }
    };
}