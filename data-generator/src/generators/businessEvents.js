/**
 * Business Events Generator
 * Generates realistic business transaction and user activity events
 */

// Event types with their typical frequencies
const EVENT_TYPES = [
    { type: 'product_view', weight: 50 },
    { type: 'cart_add', weight: 20 },
    { type: 'cart_abandoned', weight: 10 },
    { type: 'order_placed', weight: 15 },
    { type: 'user_signup', weight: 3 },
    { type: 'user_login', weight: 2 },
];

// Product categories and price ranges
const PRODUCTS = [
    { id: 'prod_electronics_001', category: 'electronics', minPrice: 299, maxPrice: 1999 },
    { id: 'prod_electronics_002', category: 'electronics', minPrice: 99, maxPrice: 599 },
    { id: 'prod_clothing_001', category: 'clothing', minPrice: 19, maxPrice: 199 },
    { id: 'prod_clothing_002', category: 'clothing', minPrice: 29, maxPrice: 149 },
    { id: 'prod_home_001', category: 'home', minPrice: 49, maxPrice: 499 },
    { id: 'prod_home_002', category: 'home', minPrice: 15, maxPrice: 99 },
    { id: 'prod_books_001', category: 'books', minPrice: 9, maxPrice: 39 },
    { id: 'prod_sports_001', category: 'sports', minPrice: 25, maxPrice: 299 },
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
 * Generate a random user ID
 */
function generateUserId() {
    return `user_${Math.floor(Math.random() * 10000)}`;
}

/**
 * Generate a random product
 */
function getRandomProduct() {
    return PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
}

/**
 * Generate a price for a product
 */
function generatePrice(product) {
    const price = product.minPrice + Math.random() * (product.maxPrice - product.minPrice);
    return Math.round(price * 100) / 100; // Round to 2 decimal places
}

/**
 * Generate order amount (can include multiple items)
 */
function generateOrderAmount() {
    const numItems = Math.floor(Math.random() * 5) + 1; // 1-5 items
    let total = 0;

    for (let i = 0; i < numItems; i++) {
        const product = getRandomProduct();
        total += generatePrice(product);
    }

    return Math.round(total * 100) / 100;
}

/**
 * Generate a single business event
 */
function generateBusinessEvent() {
    const eventType = weightedRandom(EVENT_TYPES).type;
    const userId = generateUserId();
    const product = getRandomProduct();

    const event = {
        timestamp: Date.now(),
        eventType,
        userId,
    };

    // Add event-specific fields
    switch (eventType) {
        case 'product_view':
            event.productId = product.id;
            event.category = product.category;
            break;

        case 'cart_add':
            event.productId = product.id;
            event.category = product.category;
            event.amount = generatePrice(product);
            break;

        case 'cart_abandoned':
            event.amount = generateOrderAmount();
            event.itemCount = Math.floor(Math.random() * 5) + 1;
            break;

        case 'order_placed':
            event.amount = generateOrderAmount();
            event.itemCount = Math.floor(Math.random() * 5) + 1;
            event.orderId = `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
            break;

        case 'user_signup':
            event.signupMethod = ['email', 'google', 'facebook'][Math.floor(Math.random() * 3)];
            break;

        case 'user_login':
            event.loginMethod = ['email', 'google', 'facebook'][Math.floor(Math.random() * 3)];
            break;
    }

    return event;
}

module.exports = {
    generateBusinessEvent,
};
