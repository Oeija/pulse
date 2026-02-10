/**
 * Traffic Patterns Utility
 * Implements realistic time-based traffic patterns
 * 
 * Pattern: Lower traffic 2AM-6AM, peak traffic 12PM-2PM and 7PM-9PM
 */

/**
 * Get traffic multiplier based on current time
 * Returns a value between 0.3 and 2.0
 */
function getTrafficMultiplier() {
    const now = new Date();
    const hour = now.getHours();

    // Night time (2AM-6AM): 30% of base traffic
    if (hour >= 2 && hour < 6) {
        return 0.3 + Math.random() * 0.2; // 0.3-0.5
    }

    // Early morning (6AM-9AM): Gradually increasing
    if (hour >= 6 && hour < 9) {
        const progress = (hour - 6) / 3; // 0 to 1
        return 0.5 + progress * 0.5 + Math.random() * 0.1; // 0.5-1.1
    }

    // Morning (9AM-12PM): Normal traffic
    if (hour >= 9 && hour < 12) {
        return 0.9 + Math.random() * 0.3; // 0.9-1.2
    }

    // Lunch peak (12PM-2PM): High traffic
    if (hour >= 12 && hour < 14) {
        return 1.5 + Math.random() * 0.5; // 1.5-2.0
    }

    // Afternoon (2PM-5PM): Normal to slightly high
    if (hour >= 14 && hour < 17) {
        return 1.0 + Math.random() * 0.3; // 1.0-1.3
    }

    // Early evening (5PM-7PM): Increasing
    if (hour >= 17 && hour < 19) {
        const progress = (hour - 17) / 2; // 0 to 1
        return 1.2 + progress * 0.5 + Math.random() * 0.2; // 1.2-1.9
    }

    // Evening peak (7PM-9PM): Highest traffic
    if (hour >= 19 && hour < 21) {
        return 1.7 + Math.random() * 0.3; // 1.7-2.0
    }

    // Late evening (9PM-12AM): Decreasing
    if (hour >= 21 && hour < 24) {
        const progress = (hour - 21) / 3; // 0 to 1
        return 1.2 - progress * 0.5 + Math.random() * 0.2; // 1.2-0.9
    }

    // Midnight to 2AM: Low traffic
    if (hour >= 0 && hour < 2) {
        return 0.5 + Math.random() * 0.3; // 0.5-0.8
    }

    // Default: Normal traffic
    return 1.0;
}

/**
 * Get a human-readable description of current traffic pattern
 */
function getTrafficDescription() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 2 && hour < 6) return 'Night (Low)';
    if (hour >= 6 && hour < 9) return 'Early Morning (Rising)';
    if (hour >= 9 && hour < 12) return 'Morning (Normal)';
    if (hour >= 12 && hour < 14) return 'Lunch Peak (High)';
    if (hour >= 14 && hour < 17) return 'Afternoon (Normal)';
    if (hour >= 17 && hour < 19) return 'Early Evening (Rising)';
    if (hour >= 19 && hour < 21) return 'Evening Peak (Highest)';
    if (hour >= 21 && hour < 24) return 'Late Evening (Declining)';
    return 'Midnight (Low)';
}

module.exports = {
    getTrafficMultiplier,
    getTrafficDescription,
};
