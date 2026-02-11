export const typeDefs = `#graphql
  # Scalar types
  scalar DateTime

  # API Metrics
  type ApiMetric {
    id: ID!
    timestamp: DateTime!
    endpoint: String!
    method: String!
    responseTime: Int!
    statusCode: Int!
    userId: String!
    region: String!
  }

  # Database Metrics
  type DatabaseMetric {
    id: ID!
    timestamp: DateTime!
    queryType: String!
    table: String!
    executionTime: Int!
    rowsAffected: Int!
  }

  # Business Events
  type BusinessEvent {
    id: ID!
    timestamp: DateTime!
    eventType: String!
    userId: String!
    amount: Float
    productId: String
    category: String
    itemCount: Int
    orderId: String
    signupMethod: String
    loginMethod: String
  }

  # Aggregated Metrics
  type AggregatedMetrics {
    timestamp: DateTime!
    requestCount: Int!
    avgResponseTime: Float!
    errorRate: Float!
    p50ResponseTime: Float
    p95ResponseTime: Float
    p99ResponseTime: Float
  }

  # Regional Stats
  type RegionalStats {
    region: String!
    requestCount: Int!
    avgResponseTime: Float!
    errorRate: Float!
  }

  # Endpoint Stats
  type EndpointStats {
    endpoint: String!
    method: String!
    requestCount: Int!
    avgResponseTime: Float!
    errorRate: Float!
  }

  # Real-time Stats
  type RealtimeStats {
    currentRps: Int!
    avgResponseTime: Float!
    errorRate: Float!
    activeUsers: Int!
    timestamp: DateTime!
  }

  # Time range input
  input TimeRangeInput {
    start: DateTime!
    end: DateTime!
  }

  # Queries
  type Query {
    # API Metrics
    apiMetrics(
      limit: Int = 100
      offset: Int = 0
      timeRange: TimeRangeInput
    ): [ApiMetric!]!

    aggregatedMetrics(
      interval: String = "1m"
      timeRange: TimeRangeInput
      limit: Int = 100
    ): [AggregatedMetrics!]!

    regionalStats(
      timeRange: TimeRangeInput
    ): [RegionalStats!]!

    endpointStats(
      timeRange: TimeRangeInput
      limit: Int = 10
    ): [EndpointStats!]!

    # Database Metrics
    databaseMetrics(
      limit: Int = 100
      offset: Int = 0
      timeRange: TimeRangeInput
    ): [DatabaseMetric!]!

    # Business Events
    businessEvents(
      limit: Int = 100
      offset: Int = 0
      timeRange: TimeRangeInput
      eventType: String
    ): [BusinessEvent!]!

    # Real-time stats (from Redis)
    realtimeStats: RealtimeStats!

    # Health check
    health: String!
  }

  # Subscriptions for real-time updates
  type Subscription {
    # Subscribe to new API metrics
    newApiMetric: ApiMetric!

    # Subscribe to new database metrics
    newDatabaseMetric: DatabaseMetric!

    # Subscribe to new business events
    newBusinessEvent: BusinessEvent!

    # Subscribe to real-time stats updates
    realtimeStatsUpdated: RealtimeStats!
  }
`;
