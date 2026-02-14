// Utility for persisting onboarding state to localStorage
// Allows users to resume onboarding if they leave mid-flow

const STORAGE_KEYS = {
  USER_INFO: 'onboarding_user_info',
  USER_INTENT: 'onboarding_user_intent',
  PROFILE_QUESTIONS: 'onboarding_profile_questions',
};

/**
 * Save onboarding state to localStorage
 * @param {string} key - One of STORAGE_KEYS
 * @param {object} data - State data to persist
 */
export function saveOnboardingState(key, data) {
  try {
    const stateWithTimestamp = {
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(stateWithTimestamp));
    console.log(`[Persistence] Saved ${key}:`, { 
      step: data.step, 
      dataSize: JSON.stringify(stateWithTimestamp).length 
    });
  } catch (err) {
    console.error('[Persistence] Failed to save onboarding state:', err);
  }
}

/**
 * Load onboarding state from localStorage
 * @param {string} key - One of STORAGE_KEYS
 * @param {number} maxAge - Maximum age in milliseconds (default: 7 days)
 * @returns {object|null} - Saved state or null if not found/expired
 */
export function loadOnboardingState(key, maxAge = 7 * 24 * 60 * 60 * 1000) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) {
      console.log(`[Persistence] No saved state for ${key}`);
      return null;
    }

    const parsed = JSON.parse(saved);
    const age = Date.now() - (parsed.timestamp || 0);

    // Clear expired data
    if (age > maxAge) {
      console.log(`[Persistence] Expired state for ${key} (${Math.round(age / 1000 / 60 / 60 / 24)} days old)`);
      localStorage.removeItem(key);
      return null;
    }

    console.log(`[Persistence] Loaded ${key}:`, { 
      step: parsed.step, 
      ageHours: Math.round(age / 1000 / 60 / 60) 
    });
    return parsed;
  } catch (err) {
    console.error('[Persistence] Failed to load onboarding state:', err);
    return null;
  }
}

/**
 * Clear saved onboarding state
 * @param {string} key - One of STORAGE_KEYS
 */
export function clearOnboardingState(key) {
  try {
    localStorage.removeItem(key);
    console.log(`[Persistence] Cleared ${key}`);
  } catch (err) {
    console.error('[Persistence] Failed to clear onboarding state:', err);
  }
}

/**
 * Clear all onboarding states
 */
export function clearAllOnboardingStates() {
  Object.values(STORAGE_KEYS).forEach(clearOnboardingState);
}

export { STORAGE_KEYS };
