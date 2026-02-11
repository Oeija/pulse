import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { insertApiMetric } from '../db/timescale';
import { publishEvent, trackActiveUser, incrementCounter } from '../db/redis';
import logger from '../utils/logger';

let consumer: Consumer | null = null;

/**
 * Initialize API metrics Kafka consumer
 */
export async function initApiMetricsConsumer(kafka: Kafka): Promise<void> {
    consumer = kafka.consumer({ groupId: 'pulse-backend-api-metrics' });

    await consumer.connect();
    await consumer.subscribe({ topic: 'api-metrics', fromBeginning: false });

    logger.info('API Metrics consumer connected');

    await consumer.run({
        eachMessage: async ({ topic: _topic, partition: _partition, message }: EachMessagePayload) => {
            try {
                if (!message.value) return;

                const metric = JSON.parse(message.value.toString());

                // Store in TimescaleDB
                await insertApiMetric(metric);

                // Track active user in Redis
                await trackActiveUser(metric.userId);

                // Increment request counter
                await incrementCounter('metrics:requests:count', 60);

                // Publish to GraphQL subscription channel
                await publishEvent('api-metric:new', metric);

                logger.debug(`Processed API metric: ${metric.endpoint} ${metric.method}`);
            } catch (error) {
                logger.error('Error processing API metric:', error);
            }
        },
    });
}

/**
 * Disconnect API metrics consumer
 */
export async function disconnectApiMetricsConsumer(): Promise<void> {
    if (consumer) {
        await consumer.disconnect();
        logger.info('API Metrics consumer disconnected');
    }
}
