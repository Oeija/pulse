const { Kafka } = require('kafkajs');
const { generateApiMetric } = require('./generators/apiMetrics');
const { generateDbMetric } = require('./generators/dbMetrics');
const { generateBusinessEvent } = require('./generators/businessEvents');
const { getTrafficMultiplier } = require('./utils/trafficPatterns');
const logger = require('./utils/logger');

// Configuration
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const EVENTS_PER_SECOND = parseInt(process.env.EVENTS_PER_SECOND || '100', 10);
const ENABLE_ANOMALIES = process.env.ENABLE_ANOMALIES === 'true';

// Initialize Kafka
const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'pulse-data-generator',
    brokers: KAFKA_BROKERS,
});

const producer = kafka.producer();

// Event distribution (percentages)
const EVENT_DISTRIBUTION = {
    apiMetrics: 0.60,      // 60% API metrics
    dbMetrics: 0.25,       // 25% DB metrics
    businessEvents: 0.15,  // 15% Business events
};

/**
 * Generate and send a single event
 */
async function generateEvent() {
    const random = Math.random();
    let topic, event;

    // Determine which type of event to generate
    if (random < EVENT_DISTRIBUTION.apiMetrics) {
        topic = 'api-metrics';
        event = generateApiMetric();
    } else if (random < EVENT_DISTRIBUTION.apiMetrics + EVENT_DISTRIBUTION.dbMetrics) {
        topic = 'database-metrics';
        event = generateDbMetric();
    } else {
        topic = 'business-events';
        event = generateBusinessEvent();
    }

    // Send to Kafka
    try {
        await producer.send({
            topic,
            messages: [
                {
                    key: event.userId || event.table || 'system',
                    value: JSON.stringify(event),
                    timestamp: Date.now().toString(),
                },
            ],
        });
    } catch (error) {
        logger.error(`Error sending event to ${topic}:`, error.message);
    }
}

/**
 * Main event generation loop
 */
async function startGenerator() {
    logger.info('🚀 Starting Pulse Data Generator...');
    logger.info(`📊 Target rate: ${EVENTS_PER_SECOND} events/second`);
    logger.info(`🔌 Kafka brokers: ${KAFKA_BROKERS.join(', ')}`);
    logger.info(`⚠️  Anomalies: ${ENABLE_ANOMALIES ? 'ENABLED' : 'DISABLED'}`);

    // Connect to Kafka
    await producer.connect();
    logger.info('✅ Connected to Kafka');

    // Calculate interval between events (in milliseconds)
    const baseInterval = 1000 / EVENTS_PER_SECOND;

    // Event generation loop
    setInterval(async () => {
        // Apply traffic pattern multiplier (day/night cycles)
        const multiplier = getTrafficMultiplier();
        const adjustedEventsPerSecond = Math.floor(EVENTS_PER_SECOND * multiplier);

        // Generate events for this second
        const promises = [];
        for (let i = 0; i < adjustedEventsPerSecond; i++) {
            promises.push(generateEvent());
        }

        await Promise.all(promises);
    }, 1000); // Run every second

    // Log stats every 10 seconds
    let eventCount = 0;
    setInterval(() => {
        const multiplier = getTrafficMultiplier();
        const currentRate = Math.floor(EVENTS_PER_SECOND * multiplier);
        eventCount += currentRate * 10;

        logger.info(`📈 Generated ${eventCount} total events | Current rate: ${currentRate}/sec (${(multiplier * 100).toFixed(0)}% of base)`);
    }, 10000);
}

/**
 * Graceful shutdown
 */
async function shutdown() {
    logger.info('🛑 Shutting down gracefully...');
    await producer.disconnect();
    logger.info('👋 Disconnected from Kafka');
    process.exit(0);
}

// Handle shutdown signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the generator
startGenerator().catch((error) => {
    logger.error('❌ Fatal error:', error);
    process.exit(1);
});
