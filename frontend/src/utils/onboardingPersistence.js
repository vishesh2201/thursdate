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
    localStorage.setItem(key, JSON.stringify({
      ...data,
      timestamp: Date.now(),
    }));
  } catch (err) {
    console.error('Failed to save onboarding state:', err);
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
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    const age = Date.now() - (parsed.timestamp || 0);

    // Clear expired data
    if (age > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load onboarding state:', err);
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
  } catch (err) {
    console.error('Failed to clear onboarding state:', err);
  }
}

/**
 * Clear all onboarding states
 */
export function clearAllOnboardingStates() {
  Object.values(STORAGE_KEYS).forEach(clearOnboardingState);
}

export { STORAGE_KEYS };
