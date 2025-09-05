import { auth, provider } from './firebase-config.js';
import { signInWithPopup } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

export function initAuth(app) {
    const loginBtn = document.getElementById('login-btn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            try {
                const result = await signInWithPopup(auth, provider);
                console.log('User signed in:', result.user);
            } catch (error) {
                console.error('Error signing in:', error);
                alert('Error signing in. Please try again.');
            }
        });
    }

    // Modal close functionality
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            document.getElementById('modal-overlay').classList.add('hidden');
            document.getElementById('modal-overlay').classList.remove('flex');
        });
    }
}