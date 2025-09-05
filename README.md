# Project Monarch 4.0

A professional fitness tracking application with gamification elements and a comprehensive onboarding system.

## Features

- **Professional Onboarding System**: Multi-step guided setup for new users
- **Gamified Fitness Tracking**: Level up, earn XP, and unlock achievements
- **Workout Management**: Daily quests and custom routine creation
- **Gate System**: Random challenges for bonus rewards
- **Progress Tracking**: Comprehensive stats and activity logging
- **Modern UI**: Dark theme with smooth animations

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Architecture

The application is built with a modular architecture:

- `public/index.html` - Main HTML structure
- `src/js/app.js` - Core application logic
- `src/js/auth.js` - Authentication handling
- `src/js/onboarding.js` - Onboarding system
- `src/js/pages/` - Individual page modules
- `src/css/` - Styling and animations
- `server.js` - Express server for development

## Firebase Configuration

The app uses Firebase for authentication and data storage. Make sure to configure your Firebase project credentials in `src/js/firebase-config.js`.

## Technologies Used

- **Frontend**: Vanilla JavaScript (ES6 modules), HTML5, CSS3
- **Backend**: Node.js with Express
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Google OAuth)
- **Animations**: Anime.js
- **Charts**: Chart.js
- **Styling**: Tailwind CSS
- **Particles**: Particles.js