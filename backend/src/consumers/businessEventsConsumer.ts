import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { insertBusinessEvent } from '../db/timescale';
import { publishEvent } from '../db/redis';
import logger from '../utils/logger';

let consumer: Consumer | null = null;

/**
 * Initialize business events Kafka consumer
 */
export async function initBusinessEventsConsumer(kafka: Kafka): Promise<void> {
    consumer = kafka.consumer({ groupId: 'pulse-backend-business-events' });

    await consumer.connect();
    await consumer.subscribe({ topic: 'business-events', fromBeginning: false });

    logger.info('Business Events consumer connected');

    await consumer.run({
        eachMessage: async ({ topic: _topic, partition: _partition, message }: EachMessagePayload) => {
            try {
                if (!message.value) return;

                const event = JSON.parse(message.value.toString());

                // Store in TimescaleDB
                await insertBusinessEvent(event);

                // Publish to GraphQL subscription channel
                await publishEvent('business-event:new', event);

                logger.debug(`Processed business event: ${event.eventType} by ${event.userId}`);
            } catch (error) {
                logger.error('Error processing business event:', error);
            }
        },
    });
}

/**
 * Disconnect business events consumer
 */
export async function disconnectBusinessEventsConsumer(): Promise<void> {
    if (consumer) {
        await consumer.disconnect();
        logger.info('Business Events consumer disconnected');
    }
}
