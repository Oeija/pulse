/**
 * API Metrics Generator
 * Generates realistic API request metrics for an e-commerce platform
 */

// API endpoints with their typical response times and methods
const ENDPOINTS = [
    { path: '/api/products', methods: ['GET'], avgResponseTime: 80, weight: 30 },
    { path: '/api/products/:id', methods: ['GET'], avgResponseTime: 60, weight: 25 },
    { path: '/api/cart', methods: ['GET', 'POST', 'PUT'], avgResponseTime: 100, weight: 15 },
    { path: '/api/checkout', methods: ['POST'], avgResponseTime: 300, weight: 10 },
    { path: '/api/orders', methods: ['GET', 'POST'], avgResponseTime: 150, weight: 8 },
    { path: '/api/users/profile', methods: ['GET', 'PUT'], avgResponseTime: 70, weight: 5 },
    { path: '/api/search', methods: ['GET'], avgResponseTime: 120, weight: 4 },
    { path: '/api/recommendations', methods: ['GET'], avgResponseTime: 200, weight: 2 },
    { path: '/api/auth/login', methods: ['POST'], avgResponseTime: 90, weight: 0.5 },
    { path: '/api/auth/logout', methods: ['POST'], avgResponseTime: 50, weight: 0.5 },
];

// Geographic regions
const REGIONS = ['us-east', 'us-west', 'eu-west', 'ap-southeast'];

// Status code distribution (95-97% success rate)
const STATUS_CODES = [
    { code: 200, weight: 85 },
    { code: 201, weight: 10 },
    { code: 400, weight: 2 },
    { code: 404, weight: 1.5 },
    { code: 500, weight: 1 },
    { code: 503, weight: 0.5 },
];

/**
 * Select a random item based on weights
 */
function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of items) {
        random -= item.weight;
        if (random <= 0) {
            return item;
        }
    }

    return items[items.length - 1];
}

/**
 * Generate response time based on percentile distribution
 * P50 = 80ms, P95 = 200ms, P99 = 500ms
 */
function generateResponseTime(baseTime) {
    const random = Math.random();

    if (random < 0.50) {
        // P50: 50-100ms
        return baseTime + Math.random() * 20 - 10;
    } else if (random < 0.95) {
        // P50-P95: 100-200ms
        return baseTime + Math.random() * 120;
    } else if (random < 0.99) {
        // P95-P99: 200-500ms
        return baseTime + Math.random() * 300 + 120;
    } else {
        // P99+: 500-2000ms (outliers)
        return baseTime + Math.random() * 1500 + 420;
    }
}

/**
 * Generate a random user ID
 */
function generateUserId() {
    return `user_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate a single API metric event
 */
function generateApiMetric() {
    const endpoint = weightedRandom(ENDPOINTS);
    const method = endpoint.methods[Math.floor(Math.random() * endpoint.methods.length)];
    const statusCode = weightedRandom(STATUS_CODES).code;
    const region = REGIONS[Math.floor(Math.random() * REGIONS.length)];

    // Adjust response time based on status code
    let responseTime = generateResponseTime(endpoint.avgResponseTime);
    if (statusCode >= 500) {
        // Server errors tend to have higher response times
        responseTime *= 1.5;
    } else if (statusCode === 404) {
        // Not found is usually faster
        responseTime *= 0.7;
    }

    return {
        timestamp: Date.now(),
        endpoint: endpoint.path,
        method,
        responseTime: Math.round(responseTime),
        statusCode,
        userId: generateUserId(),
        region,
    };
}

module.exports = {
    generateApiMetric,
};
