-- Pulse Analytics Dashboard - Database Schema
-- TimescaleDB Migration
-- This script creates all necessary tables and hypertables for the Pulse dashboard

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- ============================================================================
-- API Metrics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_metrics (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    response_time INTEGER NOT NULL,
    status_code INTEGER NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL,
    PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable (partitioned by time)
SELECT create_hypertable(
    'api_metrics',
    'timestamp',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_api_metrics_timestamp ON api_metrics (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint ON api_metrics (endpoint, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_region ON api_metrics (region, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status ON api_metrics (status_code, timestamp DESC);

-- ============================================================================
-- Database Metrics Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS database_metrics (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL,
    query_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    execution_time INTEGER NOT NULL,
    rows_affected INTEGER NOT NULL,
    PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable
SELECT create_hypertable(
    'database_metrics',
    'timestamp',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_db_metrics_timestamp ON database_metrics (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_db_metrics_table ON database_metrics (table_name, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_db_metrics_query_type ON database_metrics (query_type, timestamp DESC);

-- ============================================================================
-- Business Events Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_events (
    id BIGSERIAL,
    timestamp TIMESTAMPTZ NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2),
    product_id VARCHAR(100),
    PRIMARY KEY (id, timestamp)
);

-- Convert to hypertable
SELECT create_hypertable(
    'business_events',
    'timestamp',
    if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '1 day'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_events_timestamp ON business_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_type ON business_events (event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_user ON business_events (user_id, timestamp DESC);

-- ============================================================================
-- Continuous Aggregates (Pre-computed Views for Performance)
-- ============================================================================

-- 1-minute aggregated API metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS api_metrics_1m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 minute', timestamp) AS bucket,
    endpoint,
    method,
    region,
    COUNT(*) AS request_count,
    AVG(response_time) AS avg_response_time,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY response_time) AS p50_response_time,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY response_time) AS p95_response_time,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY response_time) AS p99_response_time,
    COUNT(*) FILTER (WHERE status_code >= 500) AS error_count,
    (COUNT(*) FILTER (WHERE status_code >= 500)::float / COUNT(*)) * 100 AS error_rate
FROM api_metrics
GROUP BY bucket, endpoint, method, region
WITH NO DATA;

-- Add refresh policy (refresh every minute)
SELECT add_continuous_aggregate_policy(
    'api_metrics_1m',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute',
    if_not_exists => TRUE
);

-- 5-minute aggregated API metrics
CREATE MATERIALIZED VIEW IF NOT EXISTS api_metrics_5m
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('5 minutes', timestamp) AS bucket,
    COUNT(*) AS request_count,
    AVG(response_time) AS avg_response_time,
    percentile_cont(0.50) WITHIN GROUP (ORDER BY response_time) AS p50_response_time,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY response_time) AS p95_response_time,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY response_time) AS p99_response_time,
    COUNT(*) FILTER (WHERE status_code >= 500) AS error_count,
    (COUNT(*) FILTER (WHERE status_code >= 500)::float / COUNT(*)) * 100 AS error_rate
FROM api_metrics
GROUP BY bucket
WITH NO DATA;

-- Add refresh policy
SELECT add_continuous_aggregate_policy(
    'api_metrics_5m',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists => TRUE
);

-- ============================================================================
-- Retention Policies (Automatic Data Cleanup)
-- ============================================================================

-- Keep raw API metrics for 7 days
SELECT add_retention_policy(
    'api_metrics',
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Keep raw database metrics for 7 days
SELECT add_retention_policy(
    'database_metrics',
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Keep business events for 30 days
SELECT add_retention_policy(
    'business_events',
    INTERVAL '30 days',
    if_not_exists => TRUE
);

-- ============================================================================
-- Compression Policies (Save Storage Space)
-- ============================================================================

-- Compress API metrics older than 1 day
SELECT add_compression_policy(
    'api_metrics',
    INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Compress database metrics older than 1 day
SELECT add_compression_policy(
    'database_metrics',
    INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Compress business events older than 7 days
SELECT add_compression_policy(
    'business_events',
    INTERVAL '7 days',
    if_not_exists => TRUE
);

-- ============================================================================
-- Verification
-- ============================================================================

-- Show all hypertables
SELECT * FROM timescaledb_information.hypertables;

-- Show all continuous aggregates
SELECT * FROM timescaledb_information.continuous_aggregates;

-- Show all policies
SELECT * FROM timescaledb_information.jobs;

COMMENT ON TABLE api_metrics IS 'Stores API request metrics with automatic time-based partitioning';
COMMENT ON TABLE database_metrics IS 'Stores database query performance metrics';
COMMENT ON TABLE business_events IS 'Stores business transaction and user activity events';
