import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import { typeDefs } from './schema/typeDefs';
import { resolvers, initializeSubscriptions } from './resolvers/index';
import { initializeKafkaConsumers } from './consumers/index';
import { connectTimescaleDB } from './db/timescale';
import { connectRedis } from './db/redis';
import logger from './utils/logger';

const PORT = process.env.PORT || 4000;

async function startServer() {
    logger.info('Starting Pulse Backend API...');

    // Initialize database connections
    logger.info('Connecting to databases...');
    await connectTimescaleDB();
    await connectRedis();
    logger.info('Database connections established');

    // Initialize GraphQL subscriptions (after Redis is connected)
    initializeSubscriptions();
    logger.info('GraphQL subscriptions initialized');

    // Create Express app
    const app = express();
    const httpServer = createServer(app);

    // Create GraphQL schema
    const schema = makeExecutableSchema({
        typeDefs,
        resolvers,
    });

    // Create WebSocket server for subscriptions
    const wsServer = new WebSocketServer({
        server: httpServer,
        path: '/graphql',
    });

    // Setup WebSocket server
    const serverCleanup = useServer({ schema }, wsServer);

    // Create Apollo Server
    const server = new ApolloServer({
        schema,
        plugins: [
            // Proper shutdown for the HTTP server
            ApolloServerPluginDrainHttpServer({ httpServer }),
            // Proper shutdown for the WebSocket server
            {
                async serverWillStart() {
                    return {
                        async drainServer() {
                            await serverCleanup.dispose();
                        },
                    };
                },
            },
        ],
    });

    // Start Apollo Server
    await server.start();
    logger.info('Apollo Server started');

    // Apply middleware
    app.use(
        '/graphql',
        cors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true,
        }),
        express.json(),
        expressMiddleware(server, {
            context: async ({ req: _req }) => ({
                // Add any context data here (currently unused)
                // user: _req.headers.authorization,
            }),
        })
    );

    // Health check endpoint
    app.get('/health', (_req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    });

    // Start HTTP server
    await new Promise((resolve) => {
        httpServer.listen(PORT, () => {
            resolve(null);
        });
    });

    logger.info(`Server ready at http://localhost:${PORT}/graphql`);
    logger.info(`🔌 Subscriptions ready at ws://localhost:${PORT}/graphql`);

    // Start Kafka consumers
    logger.info('Starting Kafka consumers...');
    await initializeKafkaConsumers();
    logger.info('Kafka consumers started');

    logger.info('Backend API is fully operational!');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    process.exit(0);
});

// Start the server
startServer().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
});
