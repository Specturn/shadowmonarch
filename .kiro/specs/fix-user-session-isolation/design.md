# Design Document

## Overview

This design addresses the critical user session isolation issue where switching between user accounts results in mixed or cached data being displayed. The solution implements proper state management, user data isolation, and authentication flow improvements to ensure each user only sees their own data.

## Architecture

### Current Problem Analysis

The current implementation has several issues:

1. **State Persistence**: The `ProjectMonarch` class maintains state in memory that isn't properly cleared when users switch accounts
2. **Authentication Flow**: The `onAuthStateChanged` listener doesn't reset state before loading new user data
3. **Data Loading**: The `loadData()` method merges new user data with existing state using `Object.assign()`, which can leave previous user's data intact
4. **Page Module State**: Page modules maintain their own state and UI components that aren't reset during user switches

### Solution Architecture

The solution implements a **Clean State Management Pattern** with the following components:

1. **State Reset Manager**: Handles complete state cleanup during user transitions
2. **User Context Validator**: Ensures data operations are performed for the correct user
3. **Page Module Lifecycle Manager**: Properly initializes and destroys page modules during user switches
4. **Authentication State Handler**: Manages the complete user transition flow

## Components and Interfaces

### 1. State Reset Manager

```javascript
class StateResetManager {
    resetToDefaults(app) {
        // Reset all state to initial default values
    }
    
    clearUserSpecificData(app) {
        // Clear only user-specific data while preserving app configuration
    }
    
    validateStateIntegrity(app) {
        // Ensure state is in a valid condition after reset
    }
}
```

**Responsibilities:**
- Reset application state to default values
- Clear user-specific cached data
- Validate state integrity after reset operations
- Preserve non-user-specific configuration

### 2. User Context Validator

```javascript
class UserContextValidator {
    validateUserContext(currentUser, dataUserId) {
        // Verify data belongs to current user
    }
    
    sanitizeUserData(userData, currentUserId) {
        // Ensure data is properly associated with current user
    }
}
```

**Responsibilities:**
- Validate that loaded data belongs to the current user
- Prevent data leakage between user accounts
- Sanitize user data during load operations

### 3. Page Module Lifecycle Manager

```javascript
class PageModuleLifecycleManager {
    destroyAllPageModules(app) {
        // Clean up all page modules and their state
    }
    
    reinitializePageModules(app) {
        // Create fresh page module instances
    }
    
    cleanupPageState(app) {
        // Clear page-specific cached data and UI state
    }
}
```

**Responsibilities:**
- Manage page module lifecycle during user transitions
- Clean up page-specific state and event listeners
- Reinitialize page modules with clean state

### 4. Enhanced Authentication State Handler

The main `ProjectMonarch` class will be enhanced with:

```javascript
async handleUserTransition(user) {
    // Complete user transition flow
}

async resetApplicationState() {
    // Reset entire application state
}

async loadUserDataSafely(user) {
    // Load user data with validation and isolation
}
```

## Data Models

### User State Isolation Model

```javascript
const DEFAULT_USER_STATE = {
    user: null,
    isInitialized: false,
    playerName: 'Player',
    customAvatar: null,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    mana: 0,
    streak: 0,
    longestStreak: 0,
    stats: { 
        dungeonsCleared: 0, 
        gatesCleared: 0, 
        totalWorkouts: 0, 
        totalVolumeKg: 0, 
        maxVolumeInSession: 0 
    },
    lifts: {
        'Squat': { weight: 20 }, 
        'Bench Press': { weight: 20 }, 
        'Deadlift': { weight: 30 },
        // ... other lifts with default values
    },
    activityLog: [],
    gates: [],
    completedGates: [],
    achievements: [],
    onboardingComplete: false
};
```

### User Data Validation Schema

```javascript
const USER_DATA_SCHEMA = {
    requiredFields: ['playerName', 'level', 'xp', 'stats'],
    userSpecificFields: ['customAvatar', 'activityLog', 'achievements', 'lifts'],
    defaultableFields: ['streak', 'mana', 'gates']
};
```

## Error Handling

### Authentication Errors
- **Invalid User Context**: Log error and force re-authentication
- **Data Load Failures**: Initialize with default values and notify user
- **State Corruption**: Reset to defaults and log incident

### Data Isolation Errors
- **Cross-User Data Contamination**: Immediately clear state and reload
- **Missing User Data**: Initialize with defaults for new users
- **Database Access Errors**: Graceful degradation with local state

### State Management Errors
- **Page Module Cleanup Failures**: Force cleanup and reinitialize
- **Memory Leaks**: Implement cleanup verification
- **Event Listener Persistence**: Systematic cleanup with reference tracking

## Testing Strategy

### Unit Tests
1. **State Reset Manager Tests**
   - Verify complete state reset functionality
   - Test partial state cleanup operations
   - Validate state integrity after reset

2. **User Context Validator Tests**
   - Test user data validation logic
   - Verify cross-user data prevention
   - Test data sanitization functions

3. **Page Module Lifecycle Tests**
   - Test page module cleanup
   - Verify reinitialization process
   - Test event listener cleanup

### Integration Tests
1. **User Transition Flow Tests**
   - Test complete user switch scenarios
   - Verify data isolation between users
   - Test authentication state changes

2. **Data Persistence Tests**
   - Test user data loading and saving
   - Verify data belongs to correct user
   - Test error handling during data operations

### End-to-End Tests
1. **Multi-User Session Tests**
   - Test switching between multiple user accounts
   - Verify no data leakage between sessions
   - Test rapid account switching scenarios

2. **Authentication Flow Tests**
   - Test login/logout cycles
   - Verify proper state cleanup on logout
   - Test authentication error scenarios

## Implementation Approach

### Phase 1: State Management Enhancement
- Implement State Reset Manager
- Add default state constants
- Enhance state reset functionality in main app class

### Phase 2: User Context Validation
- Implement User Context Validator
- Add user data validation to load/save operations
- Implement data sanitization functions

### Phase 3: Page Module Lifecycle Management
- Implement Page Module Lifecycle Manager
- Add cleanup methods to all page modules
- Enhance page module reinitialization

### Phase 4: Authentication Flow Enhancement
- Enhance onAuthStateChanged handler
- Implement complete user transition flow
- Add error handling and recovery mechanisms

### Phase 5: Testing and Validation
- Implement comprehensive test suite
- Perform multi-user testing scenarios
- Validate data isolation and state management