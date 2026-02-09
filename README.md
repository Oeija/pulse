# Pulse - Real-Time Analytics Dashboard

![Pulse Dashboard](https://img.shields.io/badge/status-in%20development-yellow)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

A comprehensive application performance monitoring (APM) platform with real-time event streaming, 3D visualizations, and advanced analytics capabilities.

## 🚀 Features

- **Real-time Event Streaming** - Apache Kafka for high-throughput event processing
- **3D Visualizations** - Interactive globe and service topology using Three.js
- **Time-Series Analytics** - TimescaleDB for efficient metric storage and querying
- **GraphQL API** - Modern API with subscriptions for live updates
- **Realistic Data Generation** - Configurable traffic patterns and anomaly scenarios
- **Containerized Deployment** - Docker Compose for easy local development

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** >= 24.0.0
- **Docker Compose** >= 2.20.0

## 🏗️ Architecture

```
┌─────────────────┐
│  Data Generator │
│   (Node.js)     │
└────────┬────────┘
         │ Produces events
         ▼
┌─────────────────┐
│  Apache Kafka   │
│  (3 topics)     │
└────────┬────────┘
         │ Consumes events
         ▼
┌─────────────────┐      ┌──────────────┐
│  Backend API    │◄────►│ TimescaleDB  │
│  (GraphQL)      │      │ (PostgreSQL) │
└────────┬────────┘      └──────────────┘
         │               ┌──────────────┐
         │◄─────────────►│    Redis     │
         │               │   (Cache)    │
         ▼               └──────────────┘
┌─────────────────┐
│   Frontend      │
│ (React+Three.js)│
└─────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React** + **TypeScript** - Component-based UI
- **Three.js** - 3D graphics and visualizations
- **Recharts** - 2D charts and graphs
- **Apollo Client** - GraphQL client with subscriptions
- **TailwindCSS** - Utility-first styling

### Backend
- **Node.js** + **Express** - API server
- **Apollo Server** - GraphQL implementation
- **KafkaJS** - Kafka client for event streaming
- **PostgreSQL** (TimescaleDB) - Time-series database
- **Redis** - In-memory caching

### Infrastructure
- **Apache Kafka (KRaft mode)** - Event streaming platform without Zookeeper
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

**Note:** This project uses Kafka in **KRaft mode** (Kafka Raft metadata mode), eliminating the need for Zookeeper. KRaft is production-ready as of Kafka 3.3+ and represents the future of Kafka architecture.

## 🚦 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/pulse.git
cd pulse
```

### 2. Start Infrastructure Services

Start only the infrastructure (Kafka, TimescaleDB, Redis):

```bash
npm run docker:infra
```

This will start:
- **Kafka (KRaft mode)** on port `9092`
- **Kafka UI** on port `8080` (http://localhost:8080)
- **TimescaleDB** on port `5433`
- **Redis** on port `6379`

### 3. Verify Services

Check that all services are healthy:

```bash
docker-compose ps
```

You should see all services with status "Up" and "healthy".

### 4. Access Kafka UI

Open http://localhost:8080 in your browser to access the Kafka UI and verify the cluster is running.

### 5. Install Dependencies

```bash
npm install
```

This will install dependencies for all workspaces (frontend, backend, data-generator).

### 6. Create Kafka Topics

```bash
npm run kafka:create-topics
```

This creates the required topics:
- `api-metrics` (3 partitions, 7-day retention)
- `database-metrics` (3 partitions, 7-day retention)
- `business-events` (3 partitions, 30-day retention)

### 7. Start Development Services

In separate terminals, start each service:

```bash
# Terminal 1 - Data Generator
npm run dev:generator

# Terminal 2 - Backend API
npm run dev:backend

# Terminal 3 - Frontend
npm run dev:frontend
```

Or start all at once:

```bash
npm run dev:all
```

### 8. Access the Dashboard

Open http://localhost:3000 in your browser to view the Pulse dashboard.

## 📦 Project Structure

```
pulse/
├── frontend/              # React + TypeScript frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── graphql/      # GraphQL queries/mutations
│   │   ├── utils/        # Utility functions
│   │   └── App.tsx       # Main app component
│   ├── Dockerfile
│   └── package.json
│
├── backend/              # GraphQL API server
│   ├── src/
│   │   ├── schema/       # GraphQL schema definitions
│   │   ├── resolvers/    # GraphQL resolvers
│   │   ├── consumers/    # Kafka consumers
│   │   ├── db/           # Database clients
│   │   └── index.ts      # Server entry point
│   ├── Dockerfile
│   └── package.json
│
├── data-generator/       # Event data generator
│   ├── src/
│   │   ├── generators/   # Event generators
│   │   ├── scenarios/    # Traffic scenarios
│   │   └── index.js      # Generator entry point
│   ├── Dockerfile
│   └── package.json
│
├── docker/               # Docker configuration
│   └── init-db/          # Database initialization scripts
│       └── 01-init-schema.sql
│
├── docker-compose.yml    # Docker Compose configuration
├── package.json          # Root package.json (monorepo)
├── .gitignore
└── README.md
```

## 🐳 Docker Commands

```bash
# Start only infrastructure services
npm run docker:infra

# Start all services (including app services)
npm run docker:up

# Stop all services
npm run docker:down

# View logs
npm run docker:logs

# Clean up (remove volumes)
npm run docker:clean

# List Kafka topics
npm run kafka:topics
```

## 📊 Kafka Topics

| Topic Name | Partitions | Retention | Description |
|------------|------------|-----------|-------------|
| `api-metrics` | 3 | 7 days | API request metrics (endpoint, latency, status) |
| `database-metrics` | 3 | 7 days | Database query performance metrics |
| `business-events` | 3 | 30 days | Business events (orders, signups, etc.) |

## 🗄️ Database Schema

### api_metrics
- `timestamp` - Event timestamp
- `endpoint` - API endpoint path
- `method` - HTTP method
- `response_time` - Response time in ms
- `status_code` - HTTP status code
- `user_id` - User identifier
- `region` - Geographic region

### database_metrics
- `timestamp` - Event timestamp
- `query_type` - Query type (SELECT, INSERT, etc.)
- `table_name` - Database table
- `execution_time` - Execution time in ms
- `rows_affected` - Number of rows affected

### business_events
- `timestamp` - Event timestamp
- `event_type` - Event type (order_placed, user_signup, etc.)
- `user_id` - User identifier
- `amount` - Transaction amount
- `product_id` - Product identifier

## 🎯 Data Generator Scenarios

The data generator supports various traffic patterns:

- **Normal Operations** - Realistic baseline traffic
- **Traffic Spike** - 10x increase in requests
- **Error Rate Spike** - Increased 5xx errors
- **Latency Degradation** - Gradual response time increase
- **Regional Outage** - Errors in specific region
- **Database Slowdown** - Increased query times

Configure scenarios via environment variables in `data-generator/.env`.

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=4000
KAFKA_BROKERS=localhost:9092
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_DB=pulse_metrics
POSTGRES_USER=pulse_user
POSTGRES_PASSWORD=pulse_password
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Frontend (.env)
```env
VITE_GRAPHQL_HTTP_URL=http://localhost:4000/graphql
VITE_GRAPHQL_WS_URL=ws://localhost:4000/graphql
```

### Data Generator (.env)
```env
KAFKA_BROKERS=localhost:9092
EVENTS_PER_SECOND=100
ENABLE_ANOMALIES=true
```

## 📈 Performance Targets

- **Event Processing**: 1,000+ events/second
- **End-to-End Latency**: < 1 second
- **Dashboard FPS**: 60 FPS for 3D visualizations
- **API Response Time**: < 100ms (P95)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific workspace
npm test --workspace=backend
npm test --workspace=frontend
npm test --workspace=data-generator
```

## 🎨 Dashboard Features

1. **Request Rate & Latency Chart** - Real-time line charts with percentiles
2. **Error Rate Dashboard** - Status code breakdown and trends
3. **Geographic Distribution** - 3D globe with regional metrics
4. **Service Topology** - 3D network graph of service dependencies
5. **Event Stream Visualization** - Particle effects for data flow
6. **Alert System** - Configurable thresholds and notifications

## 🚀 Deployment

### Production Build

```bash
# Build all services
npm run build

# Build specific service
npm run build:frontend
npm run build:backend
npm run build:generator
```

### Docker Production

```bash
# Build and start all services
docker-compose --profile full up -d --build
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Apache Kafka for event streaming
- TimescaleDB for time-series optimization
- Three.js community for 3D graphics
- React and GraphQL ecosystems

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/pulse](https://github.com/yourusername/pulse)

---

**Built with ❤️ for real-time analytics**
