import { GraphQLScalarType, Kind } from 'graphql';
import { PubSub } from 'graphql-subscriptions';
import {
    getApiMetrics,
    getAggregatedMetrics,
    getRegionalStats,
    getEndpointStats,
} from '../db/timescale';
import { getRealtimeStats, subscribeToChannel } from '../db/redis';

// PubSub instance for subscriptions
const pubsub = new PubSub();

// Initialize Redis subscriptions (call this AFTER Redis connects)
export function initializeSubscriptions() {
    // Subscribe to Redis channels and republish to GraphQL subscriptions
    subscribeToChannel('api-metric:new', (message) => {
        pubsub.publish('NEW_API_METRIC', { newApiMetric: JSON.parse(message) });
    });

    subscribeToChannel('database-metric:new', (message) => {
        pubsub.publish('NEW_DATABASE_METRIC', { newDatabaseMetric: JSON.parse(message) });
    });

    subscribeToChannel('business-event:new', (message) => {
        pubsub.publish('NEW_BUSINESS_EVENT', { newBusinessEvent: JSON.parse(message) });
    });
}

// Custom DateTime scalar
const dateTimeScalar = new GraphQLScalarType({
    name: 'DateTime',
    description: 'DateTime custom scalar type',
    serialize(value: any) {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return value;
    },
    parseValue(value: any) {
        return new Date(value);
    },
    parseLiteral(ast) {
        if (ast.kind === Kind.STRING) {
            return new Date(ast.value);
        }
        return null;
    },
});

export const resolvers = {
    DateTime: dateTimeScalar,

    Query: {
        // API Metrics
        apiMetrics: async (_: any, args: any) => {
            const { limit, offset, timeRange } = args;
            const range = timeRange
                ? { start: new Date(timeRange.start), end: new Date(timeRange.end) }
                : undefined;
            return await getApiMetrics(limit, offset, range);
        },

        aggregatedMetrics: async (_: any, args: any) => {
            const { interval, timeRange, limit } = args;
            const range = timeRange
                ? { start: new Date(timeRange.start), end: new Date(timeRange.end) }
                : undefined;
            return await getAggregatedMetrics(interval, range, limit);
        },

        regionalStats: async (_: any, args: any) => {
            const { timeRange } = args;
            const range = timeRange
                ? { start: new Date(timeRange.start), end: new Date(timeRange.end) }
                : undefined;
            return await getRegionalStats(range);
        },

        endpointStats: async (_: any, args: any) => {
            const { timeRange, limit } = args;
            const range = timeRange
                ? { start: new Date(timeRange.start), end: new Date(timeRange.end) }
                : undefined;
            return await getEndpointStats(range, limit);
        },

        // Database Metrics
        databaseMetrics: async (_: any, _args: any) => {
            // TODO: Implement similar to apiMetrics
            return [];
        },

        // Business Events
        businessEvents: async (_: any, _args: any) => {
            // TODO: Implement similar to apiMetrics
            return [];
        },

        // Real-time stats
        realtimeStats: async () => {
            return await getRealtimeStats();
        },

        // Health check
        health: () => 'OK',
    },

    Subscription: {
        newApiMetric: {
            subscribe: () => pubsub.asyncIterator(['NEW_API_METRIC']),
        },
        newDatabaseMetric: {
            subscribe: () => pubsub.asyncIterator(['NEW_DATABASE_METRIC']),
        },
        newBusinessEvent: {
            subscribe: () => pubsub.asyncIterator(['NEW_BUSINESS_EVENT']),
        },
        realtimeStatsUpdated: {
            subscribe: () => pubsub.asyncIterator(['REALTIME_STATS_UPDATED']),
        },
    },
};
