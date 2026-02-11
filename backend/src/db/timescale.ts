import pkg from 'pg';
const { Pool } = pkg;
import logger from '../utils/logger';

// PostgreSQL/TimescaleDB connection pool
let pool: typeof Pool.prototype | null = null;

/**
 * Initialize TimescaleDB connection
 */
export async function connectTimescaleDB(): Promise<void> {
  const config = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
    database: process.env.POSTGRES_DB || 'pulse_metrics',
    user: process.env.POSTGRES_USER || 'pulse_user',
    password: process.env.POSTGRES_PASSWORD || 'pulse_password',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };

  pool = new Pool(config);

  // Test connection
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info(`TimescaleDB connected: ${result.rows[0].now}`);
    client.release();
  } catch (error) {
    logger.error('Failed to connect to TimescaleDB:', error);
    throw error;
  }
}

/**
 * Get database pool
 */
export function getPool(): typeof Pool.prototype {
  if (!pool) {
    throw new Error('Database pool not initialized. Call connectTimescaleDB() first.');
  }
  return pool;
}

/**
 * Execute a query
 */
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  try {
    const result = await getPool().query(text, params);
    const duration = Date.now() - start;
    logger.debug(`Query executed in ${duration}ms:`, text.substring(0, 100));
    return result;
  } catch (error) {
    logger.error('Query error:', error);
    throw error;
  }
}

/**
 * Insert API metric
 */
export async function insertApiMetric(metric: any): Promise<void> {
  const sql = `
    INSERT INTO api_metrics (
      timestamp, endpoint, method, response_time, 
      status_code, user_id, region
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;

  await query(sql, [
    new Date(metric.timestamp),
    metric.endpoint,
    metric.method,
    metric.responseTime,
    metric.statusCode,
    metric.userId,
    metric.region,
  ]);
}

/**
 * Insert database metric
 */
export async function insertDatabaseMetric(metric: any): Promise<void> {
  const sql = `
    INSERT INTO database_metrics (
      timestamp, query_type, table_name, 
      execution_time, rows_affected
    ) VALUES ($1, $2, $3, $4, $5)
  `;

  await query(sql, [
    new Date(metric.timestamp),
    metric.queryType,
    metric.table,
    metric.executionTime,
    metric.rowsAffected,
  ]);
}

/**
 * Insert business event
 */
export async function insertBusinessEvent(event: any): Promise<void> {
  const sql = `
    INSERT INTO business_events (
      timestamp, event_type, user_id, amount, product_id
    ) VALUES ($1, $2, $3, $4, $5)
  `;

  await query(sql, [
    new Date(event.timestamp),
    event.eventType,
    event.userId,
    event.amount || null,
    event.productId || null,
  ]);
}

/**
 * Get API metrics
 */
export async function getApiMetrics(
  limit: number = 100,
  offset: number = 0,
  timeRange?: { start: Date; end: Date }
): Promise<any[]> {
  let sql = `
    SELECT 
      id, timestamp, endpoint, method, response_time as "responseTime",
      status_code as "statusCode", user_id as "userId", region
    FROM api_metrics
  `;

  const params: any[] = [];

  if (timeRange) {
    sql += ` WHERE timestamp >= $1 AND timestamp <= $2`;
    params.push(timeRange.start, timeRange.end);
  }

  sql += ` ORDER BY timestamp DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Get aggregated metrics
 */
export async function getAggregatedMetrics(
  interval: string = '1m',
  timeRange?: { start: Date; end: Date },
  limit: number = 100
): Promise<any[]> {
  let sql = `
    SELECT 
      time_bucket($1::interval, timestamp) as timestamp,
      COUNT(*) as "requestCount",
      AVG(response_time) as "avgResponseTime",
      (COUNT(*) FILTER (WHERE status_code >= 500)::float / COUNT(*)) * 100 as "errorRate",
      percentile_cont(0.50) WITHIN GROUP (ORDER BY response_time) as "p50ResponseTime",
      percentile_cont(0.95) WITHIN GROUP (ORDER BY response_time) as "p95ResponseTime",
      percentile_cont(0.99) WITHIN GROUP (ORDER BY response_time) as "p99ResponseTime"
    FROM api_metrics
    ${timeRange ? 'WHERE timestamp >= $2 AND timestamp <= $3' : ''}
    GROUP BY time_bucket($1::interval, timestamp)
    ORDER BY timestamp DESC
  `;

  const params: any[] = timeRange
    ? [interval, timeRange.start, timeRange.end]
    : [interval];

  sql += ` LIMIT $${params.length + 1}`;
  params.push(limit);

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Get regional stats
 */
export async function getRegionalStats(
  timeRange?: { start: Date; end: Date }
): Promise<any[]> {
  const sql = `
    SELECT 
      region,
      COUNT(*) as "requestCount",
      AVG(response_time) as "avgResponseTime",
      (COUNT(*) FILTER (WHERE status_code >= 500)::float / COUNT(*)) * 100 as "errorRate"
    FROM api_metrics
    ${timeRange ? 'WHERE timestamp >= $1 AND timestamp <= $2' : ''}
    GROUP BY region
    ORDER BY "requestCount" DESC
  `;

  const params = timeRange ? [timeRange.start, timeRange.end] : [];
  const result = await query(sql, params);
  return result.rows;
}

/**
 * Get endpoint stats
 */
export async function getEndpointStats(
  timeRange?: { start: Date; end: Date },
  limit: number = 10
): Promise<any[]> {
  const sql = `
    SELECT 
      endpoint,
      method,
      COUNT(*) as "requestCount",
      AVG(response_time) as "avgResponseTime",
      (COUNT(*) FILTER (WHERE status_code >= 500)::float / COUNT(*)) * 100 as "errorRate"
    FROM api_metrics
    ${timeRange ? 'WHERE timestamp >= $1 AND timestamp <= $2' : ''}
    GROUP BY endpoint, method
    ORDER BY "requestCount" DESC
    LIMIT $${timeRange ? 3 : 1}
  `;

  const params = timeRange ? [timeRange.start, timeRange.end, limit] : [limit];
  const result = await query(sql, params);
  return result.rows;
}

/**
 * Close database connection
 */
export async function closeTimescaleDB(): Promise<void> {
  if (pool) {
    await pool.end();
    logger.info('TimescaleDB connection closed');
  }
}
