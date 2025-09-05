export function initSettings(app) {
    return {
        render() {
            return `
                <div class="card-bg p-6 rounded-lg">
                    <h2 class="text-2xl font-bold mb-4">Settings</h2>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm text-gray-400 mb-1">Difficulty</label>
                            <select id="difficulty-select" class="w-full p-2 bg-gray-800 rounded border border-gray-700 focus:border-indigo-500 focus:ring-0">
                                <option value="Easy">Easy (+1.25 kg)</option>
                                <option value="Normal">Normal (+2.5 kg)</option>
                                <option value="Hard">Hard (+5 kg)</option>
                            </select>
                            <p class="text-xs text-gray-500 mt-1">Controls how much weight is added after each successful workout</p>
                        </div>
                        
                        <div class="border-t border-gray-700 pt-4">
                            <h3 class="text-lg font-semibold text-orange-500 mb-2">Activity Data</h3>
                            <p class="text-gray-400 text-sm mb-3">Clear your activity log to start fresh. This will not affect your other progress.</p>
                            <button id="clear-activity-btn" class="bg-orange-600 hover:bg-orange-500 py-2 px-4 rounded">
                                Clear Activity Log
                            </button>
                        </div>
                        
                        <div class="border-t border-gray-700 pt-4">
                            <h3 class="text-lg font-semibold text-red-500 mb-2">Danger Zone</h3>
                            <p class="text-gray-400 text-sm mb-3">This action is irreversible. All your progress will be lost.</p>
                            <button id="delete-account-btn" class="bg-red-600 hover:bg-red-500 py-2 px-4 rounded">
                                Delete Account
                            </button>
                        </div>
                        
                        <div class="border-t border-gray-700 pt-4">
                            <h3 class="text-lg font-semibold text-blue-500 mb-2">Account Info</h3>
                            <div id="account-info" class="text-sm text-gray-400 space-y-1">
                                <p>Loading account info...</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },

        init() {
            this.setupEventListeners();
            this.updateContent();
        },

        setupEventListeners() {
            // Remove any existing listeners first
            this.cleanup();

            // Store references to bound functions for cleanup
            this.difficultyChangeHandler = (event) => {
                app.state.difficulty = event.target.value;
                app.saveData();
                app.modalAlert(`Difficulty changed to ${event.target.value}`);
            };

            this.clearActivityHandler = () => {
                app.modalConfirm({
                    title: 'Clear Activity Log',
                    message: 'Are you sure you want to clear your activity log? This will remove all your activity history but keep your other progress.'
                }).then((confirmed) => {
                    if (confirmed) {
                        app.state.activityLog = [];
                        app.saveData().then(() => {
                            app.modalAlert("Activity log cleared successfully.");
                        }).catch(error => {
                            console.error("Error clearing activity log:", error);
                            app.modalAlert("Could not clear activity log. Please try again.");
                        });
                    }
                });
            };

            this.deleteAccountHandler = () => {
                app.modalPrompt({
                    title: 'Confirm Deletion',
                    message: `This action is permanent. Type your name to confirm: "${app.state.playerName}"`,
                    placeholder: app.state.playerName
                }).then((val) => {
                    if (val === app.state.playerName) {
                        this.deleteAccount();
                    } else if (val !== null) {
                        app.modalAlert("Name does not match. Deletion cancelled.");
                    }
                });
            };

            // Add event listeners with proper references
            const difficultySelect = document.getElementById('difficulty-select');
            const clearActivityBtn = document.getElementById('clear-activity-btn');
            const deleteAccountBtn = document.getElementById('delete-account-btn');

            if (difficultySelect) {
                difficultySelect.addEventListener('change', this.difficultyChangeHandler);
            }

            if (clearActivityBtn) {
                clearActivityBtn.addEventListener('click', this.clearActivityHandler);
            }

            if (deleteAccountBtn) {
                deleteAccountBtn.addEventListener('click', this.deleteAccountHandler);
            }
        },

        updateContent() {
            // Update difficulty select
            const difficultySelect = document.getElementById('difficulty-select');
            if (difficultySelect) {
                difficultySelect.value = app.state.difficulty || 'Normal';
            }

            // Update account info
            const accountInfo = document.getElementById('account-info');
            if (accountInfo) {
                accountInfo.innerHTML = `
                    <p>Player: ${app.state.playerName}</p>
                    <p>Level: ${app.state.level}</p>
                    <p>Total Workouts: ${app.state.stats.totalWorkouts}</p>
                    <p>Account Created: ${new Date(app.state.accountCreationDate).toLocaleDateString()}</p>
                `;
            }
        },

        async deleteAccount() {
            try {
                const { deleteDoc, doc } = await import("https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js");
                const { auth, db } = await import('../firebase-config.js');
                
                await deleteDoc(doc(db, "users", app.state.user.uid));
                app.modalAlert("Account deleted successfully.");
                auth.signOut();
            } catch (error) {
                console.error("Error deleting account:", error);
                app.modalAlert("Could not delete account. Please try again.");
            }
        },

        cleanup() {
            // Remove event listeners to prevent memory leaks
            const difficultySelect = document.getElementById('difficulty-select');
            const clearActivityBtn = document.getElementById('clear-activity-btn');
            const deleteAccountBtn = document.getElementById('delete-account-btn');

            if (difficultySelect && this.difficultyChangeHandler) {
                difficultySelect.removeEventListener('change', this.difficultyChangeHandler);
            }

            if (clearActivityBtn && this.clearActivityHandler) {
                clearActivityBtn.removeEventListener('click', this.clearActivityHandler);
            }

            if (deleteAccountBtn && this.deleteAccountHandler) {
                deleteAccountBtn.removeEventListener('click', this.deleteAccountHandler);
            }

            // Clear handler references
            this.difficultyChangeHandler = null;
            this.clearActivityHandler = null;
            this.deleteAccountHandler = null;
        }
    };
}