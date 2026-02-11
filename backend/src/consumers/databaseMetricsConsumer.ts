import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { insertDatabaseMetric } from '../db/timescale';
import { publishEvent } from '../db/redis';
import logger from '../utils/logger';

let consumer: Consumer | null = null;

/**
 * Initialize database metrics Kafka consumer
 */
export async function initDatabaseMetricsConsumer(kafka: Kafka): Promise<void> {
    consumer = kafka.consumer({ groupId: 'pulse-backend-database-metrics' });

    await consumer.connect();
    await consumer.subscribe({ topic: 'database-metrics', fromBeginning: false });

    logger.info('Database Metrics consumer connected');

    await consumer.run({
        eachMessage: async ({ topic: _topic, partition: _partition, message }: EachMessagePayload) => {
            try {
                if (!message.value) return;

                const metric = JSON.parse(message.value.toString());

                // Store in TimescaleDB
                await insertDatabaseMetric(metric);

                // Publish to GraphQL subscription channel
                await publishEvent('database-metric:new', metric);

                logger.debug(`Processed DB metric: ${metric.queryType} on ${metric.table}`);
            } catch (error) {
                logger.error('Error processing database metric:', error);
            }
        },
    });
}

/**
 * Disconnect database metrics consumer
 */
export async function disconnectDatabaseMetricsConsumer(): Promise<void> {
    if (consumer) {
        await consumer.disconnect();
        logger.info('Database Metrics consumer disconnected');
    }
}
