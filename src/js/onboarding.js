export function initOnboarding(app) {
    let currentStep = 1;

    // Step navigation functions
    function showStep(stepNumber) {
        // Hide all steps
        document.querySelectorAll('.onboarding-step').forEach(step => {
            step.classList.remove('active');
            step.classList.add('hidden');
        });

        // Show current step with animation
        const currentStepEl = document.getElementById(`onboarding-step-${stepNumber}`);
        if (currentStepEl) {
            currentStepEl.classList.remove('hidden');
            
            // Animate in
            if (window.anime) {
                anime({
                    targets: currentStepEl,
                    opacity: [0, 1],
                    translateX: [100, 0],
                    duration: 600,
                    easing: 'easeOutCubic',
                    complete: () => {
                        currentStepEl.classList.add('active');
                    }
                });
            } else {
                currentStepEl.classList.add('active');
            }
        }
    }

    function nextStep() {
        const currentStepEl = document.getElementById(`onboarding-step-${currentStep}`);
        
        if (window.anime && currentStepEl) {
            // Animate out current step
            anime({
                targets: currentStepEl,
                opacity: [1, 0],
                translateX: [0, -100],
                duration: 400,
                easing: 'easeInCubic',
                complete: () => {
                    currentStep++;
                    showStep(currentStep);
                }
            });
        } else {
            currentStep++;
            showStep(currentStep);
        }
    }

    // Event Listeners
    document.addEventListener('DOMContentLoaded', () => {
        // Step 1: Begin Calibration
        const beginBtn = document.getElementById('begin-calibration-btn');
        if (beginBtn) {
            beginBtn.addEventListener('click', () => {
                nextStep();
            });
        }

        // Step 2: Gender Selection
        document.querySelectorAll('.gender-card').forEach(card => {
            card.addEventListener('click', () => {
                const gender = card.dataset.gender;
                app.state.onboardingData.gender = gender;
                
                // Update UI
                document.querySelectorAll('.gender-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Enable next button
                const nextBtn = document.getElementById('gender-next-btn');
                nextBtn.disabled = false;
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            });
        });

        const genderNextBtn = document.getElementById('gender-next-btn');
        if (genderNextBtn) {
            genderNextBtn.addEventListener('click', () => {
                if (!genderNextBtn.disabled) {
                    nextStep();
                }
            });
        }

        // Step 3: Goal Selection
        document.querySelectorAll('.goal-card').forEach(card => {
            card.addEventListener('click', () => {
                const goal = card.dataset.goal;
                app.state.onboardingData.goal = goal;
                
                // Update UI
                document.querySelectorAll('.goal-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                
                // Enable next button
                const nextBtn = document.getElementById('goal-next-btn');
                nextBtn.disabled = false;
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            });
        });

        const goalNextBtn = document.getElementById('goal-next-btn');
        if (goalNextBtn) {
            goalNextBtn.addEventListener('click', () => {
                if (!goalNextBtn.disabled) {
                    nextStep();
                }
            });
        }

        // Step 4: Focus Area Selection
        document.querySelectorAll('.focus-option').forEach(option => {
            option.addEventListener('click', () => {
                const focus = option.dataset.focus;
                app.state.onboardingData.focusArea = focus;
                
                // Update UI
                document.querySelectorAll('.focus-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                
                // Highlight body part
                highlightBodyPart(focus);
                
                // Enable next button
                const nextBtn = document.getElementById('focus-next-btn');
                nextBtn.disabled = false;
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            });
        });

        const focusNextBtn = document.getElementById('focus-next-btn');
        if (focusNextBtn) {
            focusNextBtn.addEventListener('click', () => {
                if (!focusNextBtn.disabled) {
                    nextStep();
                }
            });
        }

        // Step 5: Experience Level
        document.querySelectorAll('.experience-option').forEach(option => {
            option.addEventListener('click', () => {
                const level = option.dataset.level;
                app.state.onboardingData.experienceLevel = level;
                
                // Update UI
                document.querySelectorAll('.experience-option').forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                
                // Enable next button
                const nextBtn = document.getElementById('experience-next-btn');
                nextBtn.disabled = false;
                nextBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            });
        });

        const experienceNextBtn = document.getElementById('experience-next-btn');
        if (experienceNextBtn) {
            experienceNextBtn.addEventListener('click', () => {
                if (!experienceNextBtn.disabled) {
                    nextStep();
                }
            });
        }

        // Step 6: Biometrics
        const weightSlider = document.getElementById('weight-slider');
        const heightSlider = document.getElementById('height-slider');
        const weightValue = document.getElementById('weight-value');
        const heightValue = document.getElementById('height-value');

        if (weightSlider && weightValue) {
            weightSlider.addEventListener('input', () => {
                app.state.onboardingData.weight = parseInt(weightSlider.value);
                weightValue.textContent = weightSlider.value;
            });
        }

        if (heightSlider && heightValue) {
            heightSlider.addEventListener('input', () => {
                app.state.onboardingData.height = parseInt(heightSlider.value);
                heightValue.textContent = heightSlider.value;
            });
        }

        const biometricsNextBtn = document.getElementById('biometrics-next-btn');
        if (biometricsNextBtn) {
            biometricsNextBtn.addEventListener('click', () => {
                nextStep();
                startCalibration();
            });
        }

        // Step 8: Enter System
        const enterSystemBtn = document.getElementById('enter-system-btn');
        if (enterSystemBtn) {
            enterSystemBtn.addEventListener('click', () => {
                completeOnboarding();
            });
        }
    });

    function highlightBodyPart(focus) {
        // Reset all highlights
        document.querySelectorAll('#body-diagram *').forEach(part => {
            part.classList.remove('highlight');
        });
        
        // Highlight selected part
        const partMap = {
            'full-body': ['head', 'torso', 'left-arm', 'right-arm', 'abs-area', 'left-leg', 'right-leg'],
            'arm': ['left-arm', 'right-arm'],
            'chest': ['torso'],
            'abs': ['abs-area'],
            'leg': ['left-leg', 'right-leg']
        };
        
        const parts = partMap[focus] || [];
        parts.forEach(partId => {
            const element = document.getElementById(partId);
            if (element) {
                element.classList.add('highlight');
            }
        });
    }

    function startCalibration() {
        const progressCircle = document.getElementById('progress-circle');
        const progressPercentage = document.getElementById('progress-percentage');
        const calibrationStatus = document.getElementById('calibration-status');
        
        const messages = [
            'Analyzing physical metrics...',
            'Calculating optimal training parameters...',
            'Personalizing workout intensity...',
            'Finalizing your hunter profile...',
            'Your personalized system is ready'
        ];
        
        let progress = 0;
        let messageIndex = 0;
        
        const interval = setInterval(() => {
            progress += 20;
            
            // Update progress circle
            if (progressCircle) {
                const circumference = 314;
                const offset = circumference - (progress / 100) * circumference;
                progressCircle.style.strokeDashoffset = offset;
            }
            
            // Update percentage
            if (progressPercentage) {
                progressPercentage.textContent = `${progress}%`;
            }
            
            // Update status message
            if (calibrationStatus && messageIndex < messages.length) {
                calibrationStatus.textContent = messages[messageIndex];
                messageIndex++;
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    nextStep();
                }, 1000);
            }
        }, 1000);
    }

    function completeOnboarding() {
        // Apply onboarding data to user profile
        app.state.onboardingComplete = true;
        
        if (app.state.onboardingData.experienceLevel === 'beginner') {
            // Reduce starting weights for beginners
            Object.keys(app.state.lifts).forEach(lift => {
                app.state.lifts[lift].weight = Math.round(app.state.lifts[lift].weight * 0.7);
            });
        } else if (app.state.onboardingData.experienceLevel === 'advanced') {
            // Increase starting weights for advanced users
            Object.keys(app.state.lifts).forEach(lift => {
                app.state.lifts[lift].weight = Math.round(app.state.lifts[lift].weight * 1.3);
            });
        }
        
        app.saveData().then(() => {
            // Hide onboarding overlay with animation
            const overlay = document.getElementById('onboarding-overlay');
            
            if (window.anime) {
                anime({
                    targets: overlay,
                    opacity: [1, 0],
                    duration: 800,
                    easing: 'easeInCubic',
                    complete: () => {
                        overlay.classList.add('hidden');
                        app.showMainApp();
                        app.modalAlert("Welcome to Project Monarch! Your journey begins now.", "System Activated");
                    }
                });
            } else {
                overlay.classList.add('hidden');
                app.showMainApp();
                app.modalAlert("Welcome to Project Monarch! Your journey begins now.", "System Activated");
            }
        });
    }

    // Initialize first step when onboarding starts
    app.startOnboarding = () => {
        currentStep = 1;
        showStep(1);
    };
}