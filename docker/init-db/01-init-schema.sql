-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- API Metrics Table
CREATE TABLE IF NOT EXISTS api_metrics (
    timestamp TIMESTAMPTZ NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    user_id VARCHAR(100),
    region VARCHAR(50) NOT NULL
);

-- Convert to hypertable (TimescaleDB feature for time-series data)
SELECT create_hypertable('api_metrics', 'timestamp', if_not_exists => TRUE);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics (endpoint, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_region ON api_metrics (region, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status ON api_metrics (status_code, timestamp DESC);

-- Database Metrics Table
CREATE TABLE IF NOT EXISTS database_metrics (
    timestamp TIMESTAMPTZ NOT NULL,
    query_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    execution_time INTEGER NOT NULL,
    rows_affected INTEGER NOT NULL
);

-- Convert to hypertable
SELECT create_hypertable('database_metrics', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_db_metrics_table ON database_metrics (table_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_db_metrics_query_type ON database_metrics (query_type, timestamp DESC);

-- Business Events Table
CREATE TABLE IF NOT EXISTS business_events (
    timestamp TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2),
    product_id VARCHAR(100)
);

-- Convert to hypertable
SELECT create_hypertable('business_events', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_events_type ON business_events (event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_user ON business_events (user_id, timestamp DESC);

-- Create continuous aggregates for common queries (TimescaleDB feature)
-- 1-minute aggregates for API metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS api_metrics_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', timestamp) AS bucket,
    endpoint,
    region,
    COUNT(*) AS request_count,
    AVG(response_time) AS avg_response_time,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time) AS p50_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) AS p95_response_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time) AS p99_response_time,
    SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) AS error_5xx_count,
    SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) AS error_4xx_count,
    SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) AS success_2xx_count
FROM api_metrics
GROUP BY bucket, endpoint, region;

-- Add refresh policy for continuous aggregate
SELECT add_continuous_aggregate_policy('api_metrics_1min',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute',
    if_not_exists => TRUE);

-- 5-minute aggregates for API metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS api_metrics_5min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('5 minutes', timestamp) AS bucket,
    endpoint,
    region,
    COUNT(*) AS request_count,
    AVG(response_time) AS avg_response_time,
    PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY response_time) AS p50_response_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) AS p95_response_time,
    PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY response_time) AS p99_response_time,
    SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END) AS error_5xx_count,
    SUM(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 ELSE 0 END) AS error_4xx_count,
    SUM(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 ELSE 0 END) AS success_2xx_count
FROM api_metrics
GROUP BY bucket, endpoint, region;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('api_metrics_5min',
    start_offset => INTERVAL '1 day',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists => TRUE);

-- Set up data retention policy (keep raw data for 7 days)
SELECT add_retention_policy('api_metrics', INTERVAL '7 days', if_not_exists => TRUE);
SELECT add_retention_policy('database_metrics', INTERVAL '7 days', if_not_exists => TRUE);
SELECT add_retention_policy('business_events', INTERVAL '30 days', if_not_exists => TRUE);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO pulse_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO pulse_user;
