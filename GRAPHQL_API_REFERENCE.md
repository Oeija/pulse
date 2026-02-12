# 📚 Pulse GraphQL API Reference

Complete reference for all available GraphQL queries and subscriptions in the Pulse Analytics Dashboard.

**API Endpoint:** `http://localhost:4000/graphql`  
**WebSocket Endpoint:** `ws://localhost:4000/graphql`

---

## 📖 Table of Contents

- [Queries](#queries)
  - [Health Check](#health-check)
  - [API Metrics](#api-metrics)
  - [Aggregated Metrics](#aggregated-metrics)
  - [Regional Statistics](#regional-statistics)
  - [Endpoint Statistics](#endpoint-statistics)
  - [Database Metrics](#database-metrics)
  - [Business Events](#business-events)
  - [Real-time Stats](#real-time-stats)
- [Subscriptions](#subscriptions)
  - [New API Metric](#new-api-metric)
  - [New Database Metric](#new-database-metric)
  - [New Business Event](#new-business-event)
  - [Real-time Stats Updated](#real-time-stats-updated)
- [Input Types](#input-types)
- [Common Patterns](#common-patterns)

---

## 🔍 Queries

### Health Check

**Description:** Simple health check to verify the API is running.

**Use Case:** Monitoring, uptime checks, testing connectivity.

```graphql
query {
  health
}
```

**Response:**
```json
{
  "data": {
    "health": "OK"
  }
}
```

---

### API Metrics

**Description:** Retrieve raw API request metrics with detailed information about each request.

**Use Case:** Debugging specific requests, analyzing individual API calls, investigating performance issues.

**Parameters:**
- `limit` (Int, default: 100) - Maximum number of records to return
- `offset` (Int, default: 0) - Number of records to skip (for pagination)
- `timeRange` (TimeRangeInput, optional) - Filter by time range

**Query:**
```graphql
query {
  apiMetrics(limit: 10, offset: 0) {
    id
    timestamp
    endpoint
    method
    responseTime
    statusCode
    userId
    region
  }
}
```

**Response Example:**
```json
{
  "data": {
    "apiMetrics": [
      {
        "id": "12345",
        "timestamp": "2026-02-11T05:18:47.937Z",
        "endpoint": "/api/products",
        "method": "GET",
        "responseTime": 119,
        "statusCode": 200,
        "userId": "user_abc123",
        "region": "us-east"
      }
    ]
  }
}
```

**Fields:**
- `id` - Unique identifier for the metric
- `timestamp` - When the request occurred
- `endpoint` - API endpoint that was called
- `method` - HTTP method (GET, POST, PUT, DELETE, etc.)
- `responseTime` - Response time in milliseconds
- `statusCode` - HTTP status code (200, 404, 500, etc.)
- `userId` - ID of the user who made the request
- `region` - Geographic region where the request originated

---

### Aggregated Metrics

**Description:** Get time-bucketed aggregated metrics showing request counts, average response times, and percentiles.

**Use Case:** Analyzing traffic patterns over time, identifying performance trends, monitoring system health, creating time-series charts.

**Parameters:**
- `interval` (String, default: "1m") - Time bucket size (e.g., "1m", "5m", "1h", "1d")
- `timeRange` (TimeRangeInput, optional) - Filter by time range
- `limit` (Int, default: 100) - Maximum number of time buckets to return

**Query:**
```graphql
query {
  aggregatedMetrics(interval: "5m", limit: 20) {
    timestamp
    requestCount
    avgResponseTime
    errorRate
    p50ResponseTime
    p95ResponseTime
    p99ResponseTime
  }
}
```

**Response Example:**
```json
{
  "data": {
    "aggregatedMetrics": [
      {
        "timestamp": "2026-02-11T12:30:00Z",
        "requestCount": 1250,
        "avgResponseTime": 145.3,
        "errorRate": 0.8,
        "p50ResponseTime": 120.0,
        "p95ResponseTime": 280.0,
        "p99ResponseTime": 450.0
      }
    ]
  }
}
```

**Fields:**
- `timestamp` - Start of the time bucket
- `requestCount` - Total number of requests in this time bucket
- `avgResponseTime` - Average response time in milliseconds
- `errorRate` - Percentage of requests with 5xx status codes
- `p50ResponseTime` - Median response time (50th percentile)
- `p95ResponseTime` - 95th percentile response time
- `p99ResponseTime` - 99th percentile response time

**Interval Examples:**
- `"1m"` - 1 minute buckets
- `"5m"` - 5 minute buckets
- `"15m"` - 15 minute buckets
- `"1h"` - 1 hour buckets
- `"1d"` - 1 day buckets

---

### Regional Statistics

**Description:** Get aggregated statistics grouped by geographic region.

**Use Case:** Analyzing regional performance, identifying geographic bottlenecks, optimizing CDN configuration, capacity planning.

**Parameters:**
- `timeRange` (TimeRangeInput, optional) - Filter by time range

**Query:**
```graphql
query {
  regionalStats {
    region
    requestCount
    avgResponseTime
    errorRate
  }
}
```

**Response Example:**
```json
{
  "data": {
    "regionalStats": [
      {
        "region": "us-east",
        "requestCount": 45230,
        "avgResponseTime": 125.4,
        "errorRate": 0.5
      },
      {
        "region": "eu-west",
        "requestCount": 32100,
        "avgResponseTime": 180.2,
        "errorRate": 1.2
      },
      {
        "region": "ap-southeast",
        "requestCount": 28900,
        "avgResponseTime": 210.5,
        "errorRate": 0.8
      }
    ]
  }
}
```

**Fields:**
- `region` - Geographic region identifier
- `requestCount` - Total requests from this region
- `avgResponseTime` - Average response time for this region (ms)
- `errorRate` - Percentage of 5xx errors from this region

**Regions:**
- `us-east` - US East Coast
- `us-west` - US West Coast
- `eu-west` - Europe West
- `ap-southeast` - Asia Pacific Southeast

---

### Endpoint Statistics

**Description:** Get aggregated statistics grouped by API endpoint and HTTP method.

**Use Case:** Identifying slow endpoints, finding most popular APIs, optimizing frequently-used endpoints, API usage analysis.

**Parameters:**
- `timeRange` (TimeRangeInput, optional) - Filter by time range
- `limit` (Int, default: 10) - Maximum number of endpoints to return

**Query:**
```graphql
query {
  endpointStats(limit: 5) {
    endpoint
    method
    requestCount
    avgResponseTime
    errorRate
  }
}
```

**Response Example:**
```json
{
  "data": {
    "endpointStats": [
      {
        "endpoint": "/api/products",
        "method": "GET",
        "requestCount": 25600,
        "avgResponseTime": 95.3,
        "errorRate": 0.2
      },
      {
        "endpoint": "/api/orders",
        "method": "POST",
        "requestCount": 18400,
        "avgResponseTime": 220.5,
        "errorRate": 1.5
      }
    ]
  }
}
```

**Fields:**
- `endpoint` - API endpoint path
- `method` - HTTP method
- `requestCount` - Total requests to this endpoint
- `avgResponseTime` - Average response time (ms)
- `errorRate` - Percentage of 5xx errors

---

### Database Metrics

**Description:** Retrieve database query performance metrics.

**Use Case:** Database performance monitoring, query optimization, identifying slow queries.

**Parameters:**
- `limit` (Int, default: 100) - Maximum number of records
- `offset` (Int, default: 0) - Pagination offset
- `timeRange` (TimeRangeInput, optional) - Filter by time range

**Query:**
```graphql
query {
  databaseMetrics(limit: 10) {
    id
    timestamp
    queryType
    table
    executionTime
    rowsAffected
  }
}
```

**Response Example:**
```json
{
  "data": {
    "databaseMetrics": [
      {
        "id": "67890",
        "timestamp": "2026-02-11T12:35:00Z",
        "queryType": "SELECT",
        "table": "users",
        "executionTime": 45,
        "rowsAffected": 150
      }
    ]
  }
}
```

**Fields:**
- `id` - Unique identifier
- `timestamp` - When the query was executed
- `queryType` - Type of query (SELECT, INSERT, UPDATE, DELETE)
- `table` - Database table name
- `executionTime` - Query execution time in milliseconds
- `rowsAffected` - Number of rows affected/returned

---

### Business Events

**Description:** Retrieve business transaction and user activity events.

**Use Case:** Business analytics, user behavior tracking, conversion funnel analysis, revenue tracking.

**Parameters:**
- `limit` (Int, default: 100) - Maximum number of events
- `offset` (Int, default: 0) - Pagination offset
- `timeRange` (TimeRangeInput, optional) - Filter by time range
- `eventType` (String, optional) - Filter by specific event type

**Query:**
```graphql
query {
  businessEvents(limit: 10, eventType: "purchase") {
    id
    timestamp
    eventType
    userId
    amount
    productId
  }
}
```

**Response Example:**
```json
{
  "data": {
    "businessEvents": [
      {
        "id": "11223",
        "timestamp": "2026-02-11T12:30:00Z",
        "eventType": "purchase",
        "userId": "user_xyz789",
        "amount": 149.99,
        "productId": "prod_laptop_001"
      }
    ]
  }
}
```

**Fields:**
- `id` - Unique identifier
- `timestamp` - When the event occurred
- `eventType` - Type of event (purchase, cart_add, signup, login, etc.)
- `userId` - User who triggered the event
- `amount` - Transaction amount (for purchases)
- `productId` - Product identifier (if applicable)

**Event Types:**
- `purchase` - Product purchase
- `cart_add` - Item added to cart
- `signup` - New user registration
- `login` - User login
- `page_view` - Page view event

---

### Real-time Stats

**Description:** Get current real-time statistics from Redis cache.

**Use Case:** Live dashboard metrics, current system status, real-time monitoring.

**Query:**
```graphql
query {
  realtimeStats {
    currentRps
    avgResponseTime
    errorRate
    activeUsers
    timestamp
  }
}
```

**Response Example:**
```json
{
  "data": {
    "realtimeStats": {
      "currentRps": 198,
      "avgResponseTime": 145.5,
      "errorRate": 0.8,
      "activeUsers": 1250,
      "timestamp": "2026-02-11T12:37:00Z"
    }
  }
}
```

**Fields:**
- `currentRps` - Current requests per second
- `avgResponseTime` - Current average response time (ms)
- `errorRate` - Current error rate percentage
- `activeUsers` - Number of active users in the last minute
- `timestamp` - When these stats were calculated

---

## 🔔 Subscriptions

### New API Metric

**Description:** Subscribe to real-time API metric events as they occur.

**Use Case:** Live monitoring, real-time dashboards, alerting systems.

**Subscription:**
```graphql
subscription {
  newApiMetric {
    timestamp
    endpoint
    method
    responseTime
    statusCode
    region
  }
}
```

**How it works:**
- Opens a WebSocket connection
- Receives a new event every time an API metric is processed
- Events arrive in real-time (typically within milliseconds)

---

### New Database Metric

**Description:** Subscribe to real-time database query events.

**Use Case:** Database performance monitoring, query tracking.

**Subscription:**
```graphql
subscription {
  newDatabaseMetric {
    timestamp
    queryType
    table
    executionTime
    rowsAffected
  }
}
```

---

### New Business Event

**Description:** Subscribe to real-time business events.

**Use Case:** Live transaction monitoring, user activity tracking, real-time analytics.

**Subscription:**
```graphql
subscription {
  newBusinessEvent {
    timestamp
    eventType
    userId
    amount
    productId
  }
}
```

---

### Real-time Stats Updated

**Description:** Subscribe to real-time statistics updates.

**Use Case:** Live dashboard updates, system health monitoring.

**Subscription:**
```graphql
subscription {
  realtimeStatsUpdated {
    currentRps
    avgResponseTime
    errorRate
    activeUsers
    timestamp
  }
}
```

---

## 📥 Input Types

### TimeRangeInput

Filter queries by a specific time range.

```graphql
input TimeRangeInput {
  start: DateTime!
  end: DateTime!
}
```

**Example Usage:**
```graphql
query {
  apiMetrics(
    limit: 100
    timeRange: {
      start: "2026-02-11T00:00:00Z"
      end: "2026-02-11T23:59:59Z"
    }
  ) {
    timestamp
    endpoint
    responseTime
  }
}
```

**Date Format:** ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.sssZ`)

---

## 🎯 Common Patterns

### Pagination

Use `limit` and `offset` for pagination:

```graphql
# Page 1 (first 50 records)
query {
  apiMetrics(limit: 50, offset: 0) {
    endpoint
    responseTime
  }
}

# Page 2 (next 50 records)
query {
  apiMetrics(limit: 50, offset: 50) {
    endpoint
    responseTime
  }
}
```

---

### Time Range Filtering

Filter any query by time range:

```graphql
query {
  apiMetrics(
    limit: 100
    timeRange: {
      start: "2026-02-11T00:00:00Z"
      end: "2026-02-11T12:00:00Z"
    }
  ) {
    timestamp
    endpoint
  }
}
```

---

### Multiple Queries in One Request

Combine multiple queries with aliases:

```graphql
query {
  # Get recent metrics
  recent: apiMetrics(limit: 10) {
    endpoint
    responseTime
  }
  
  # Get regional stats
  regions: regionalStats {
    region
    requestCount
  }
  
  # Get top endpoints
  topEndpoints: endpointStats(limit: 5) {
    endpoint
    requestCount
  }
  
  # Get real-time stats
  live: realtimeStats {
    currentRps
    activeUsers
  }
}
```

---

### Variables for Dynamic Queries

Use variables for reusable queries:

```graphql
query GetMetrics($limit: Int!, $interval: String!) {
  apiMetrics(limit: $limit) {
    endpoint
    responseTime
  }
  
  aggregatedMetrics(interval: $interval, limit: 20) {
    timestamp
    requestCount
  }
}
```

**Variables:**
```json
{
  "limit": 50,
  "interval": "5m"
}
```

---

## 🚀 Quick Start Examples

### Dashboard Overview Query

Get all data needed for a dashboard in one request:

```graphql
query DashboardOverview {
  # Current stats
  stats: realtimeStats {
    currentRps
    avgResponseTime
    errorRate
    activeUsers
  }
  
  # Traffic over last hour
  traffic: aggregatedMetrics(interval: "5m", limit: 12) {
    timestamp
    requestCount
    avgResponseTime
  }
  
  # Regional breakdown
  regions: regionalStats {
    region
    requestCount
    avgResponseTime
  }
  
  # Top endpoints
  endpoints: endpointStats(limit: 10) {
    endpoint
    method
    requestCount
    avgResponseTime
  }
}
```

---

### Performance Analysis Query

Analyze API performance:

```graphql
query PerformanceAnalysis {
  # Detailed metrics
  metrics: aggregatedMetrics(interval: "1m", limit: 60) {
    timestamp
    requestCount
    avgResponseTime
    p95ResponseTime
    p99ResponseTime
    errorRate
  }
  
  # Slow endpoints
  slowEndpoints: endpointStats(limit: 10) {
    endpoint
    avgResponseTime
    errorRate
  }
}
```

---

### Real-time Monitoring

Subscribe to live updates:

```graphql
subscription LiveMonitoring {
  newApiMetric {
    timestamp
    endpoint
    method
    responseTime
    statusCode
    region
  }
}
```

---

## 📊 Response Time Percentiles Explained

- **P50 (Median)**: 50% of requests were faster than this
- **P95**: 95% of requests were faster than this (good for SLA monitoring)
- **P99**: 99% of requests were faster than this (catches outliers)

**Example:**
```
P50: 120ms  → Half of requests are under 120ms
P95: 280ms  → 95% of requests are under 280ms
P99: 450ms  → 99% of requests are under 450ms
```

---

## 🔗 Resources

- **GraphQL Playground**: http://localhost:4000/graphql
- **Backend README**: `backend/README.md`
- **Architecture Docs**: `ARCHITECTURE.md`
- **Data Flow Explained**: `DATA_FLOW_EXPLAINED.md`

---

## 💡 Tips

1. **Use the GraphQL Playground** - It has auto-complete and documentation built-in
2. **Start with small limits** - Test queries with `limit: 5` before fetching large datasets
3. **Use time ranges** - Filter data to reduce query time and response size
4. **Combine queries** - Fetch multiple datasets in one request using aliases
5. **Test subscriptions** - Open a subscription in one tab, run the data generator, and watch live updates!

---

**Happy Querying! 🚀**
