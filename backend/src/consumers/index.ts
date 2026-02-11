import { Kafka } from 'kafkajs';
import { initApiMetricsConsumer, disconnectApiMetricsConsumer } from './apiMetricsConsumer';
import { initDatabaseMetricsConsumer, disconnectDatabaseMetricsConsumer } from './databaseMetricsConsumer';
import { initBusinessEventsConsumer, disconnectBusinessEventsConsumer } from './businessEventsConsumer';
import logger from '../utils/logger';

let kafka: Kafka | null = null;

/**
 * Initialize all Kafka consumers
 */
export async function initializeKafkaConsumers(): Promise<void> {
    const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

    kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'pulse-backend',
        brokers,
    });

    logger.info(`Connecting to Kafka brokers: ${brokers.join(', ')}`);

    // Initialize all consumers
    await Promise.all([
        initApiMetricsConsumer(kafka),
        initDatabaseMetricsConsumer(kafka),
        initBusinessEventsConsumer(kafka),
    ]);

    logger.info('All Kafka consumers initialized');
}

/**
 * Disconnect all Kafka consumers
 */
export async function disconnectAllConsumers(): Promise<void> {
    await Promise.all([
        disconnectApiMetricsConsumer(),
        disconnectDatabaseMetricsConsumer(),
        disconnectBusinessEventsConsumer(),
    ]);

    logger.info('All Kafka consumers disconnected');
}
