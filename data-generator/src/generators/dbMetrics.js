/**
 * Database Metrics Generator
 * Generates realistic database query performance metrics
 */

// Database tables with typical query patterns
const TABLES = [
    { name: 'users', weight: 15 },
    { name: 'products', weight: 30 },
    { name: 'orders', weight: 25 },
    { name: 'sessions', weight: 20 },
    { name: 'cart_items', weight: 10 },
];

// Query types with their typical execution times
const QUERY_TYPES = [
    { type: 'SELECT', avgTime: 15, weight: 70 },
    { type: 'INSERT', avgTime: 25, weight: 15 },
    { type: 'UPDATE', avgTime: 30, weight: 10 },
    { type: 'DELETE', avgTime: 20, weight: 5 },
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
 * Generate execution time with realistic distribution
 * Most queries are fast (5-50ms), some are slow (50-500ms)
 */
function generateExecutionTime(baseTime) {
    const random = Math.random();

    if (random < 0.80) {
        // 80% of queries: fast (5-50ms)
        return baseTime + Math.random() * 35 - 10;
    } else if (random < 0.95) {
        // 15% of queries: medium (50-150ms)
        return baseTime + Math.random() * 100 + 25;
    } else {
        // 5% of queries: slow (150-500ms)
        return baseTime + Math.random() * 350 + 125;
    }
}

/**
 * Generate number of rows affected/returned
 */
function generateRowsAffected(queryType) {
    if (queryType === 'SELECT') {
        // SELECT queries return varying amounts of rows
        const random = Math.random();
        if (random < 0.5) {
            // Single row or small result set
            return Math.floor(Math.random() * 10) + 1;
        } else if (random < 0.9) {
            // Medium result set
            return Math.floor(Math.random() * 100) + 10;
        } else {
            // Large result set
            return Math.floor(Math.random() * 1000) + 100;
        }
    } else if (queryType === 'INSERT') {
        // INSERT usually affects 1 row, sometimes batch inserts
        return Math.random() < 0.9 ? 1 : Math.floor(Math.random() * 50) + 2;
    } else if (queryType === 'UPDATE') {
        // UPDATE can affect multiple rows
        return Math.floor(Math.random() * 20) + 1;
    } else {
        // DELETE usually affects fewer rows
        return Math.floor(Math.random() * 10) + 1;
    }
}

/**
 * Generate a single database metric event
 */
function generateDbMetric() {
    const table = weightedRandom(TABLES);
    const query = weightedRandom(QUERY_TYPES);

    const executionTime = Math.max(5, Math.round(generateExecutionTime(query.avgTime)));
    const rowsAffected = generateRowsAffected(query.type);

    return {
        timestamp: Date.now(),
        queryType: query.type,
        table: table.name,
        executionTime,
        rowsAffected,
    };
}

module.exports = {
    generateDbMetric,
};
