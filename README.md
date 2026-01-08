# EcoHarvest - Enterprise Microservices E-Commerce Platform

<div align="center">

![EcoHarvest Logo](https://img.shields.io/badge/EcoHarvest-🌿-green?style=for-the-badge)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://docker.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

**A production-grade, enterprise-ready e-commerce platform built with microservices architecture**

[Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start) • [Services](#services) • [API Docs](#api-documentation) • [Deployment](#deployment)

</div>

---

## 🌟 Features

- **Microservices Architecture** - 12 independent, scalable services
- **Event-Driven Design** - Asynchronous communication via RabbitMQ
- **API Gateway** - Centralized routing, rate limiting, and authentication
- **Multi-Tenant** - Support for customers, vendors, and administrators
- **Real-Time Updates** - WebSocket-based notifications
- **Search Engine** - Elasticsearch-powered product search
- **Container Ready** - Docker & Kubernetes deployment support
- **Observability** - Prometheus, Grafana, and centralized logging

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js)                             │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────────┐
│                           API GATEWAY (Nginx)                                │
│                    Rate Limiting • Auth • Load Balancing                     │
└───┬───────┬───────┬───────┬───────┬───────┬───────┬───────┬───────┬────────┘
    │       │       │       │       │       │       │       │       │
┌───▼───┐┌──▼──┐┌───▼───┐┌──▼──┐┌───▼───┐┌──▼──┐┌───▼──┐┌───▼───┐┌──▼──┐
│ Auth  ││User ││Product││Order││ Cart  ││Pay- ││Vendor││Notif- ││Admin│
│Service││Svc  ││Service││ Svc ││Service││ment ││ Svc  ││ication││ Svc │
└───┬───┘└──┬──┘└───┬───┘└──┬──┘└───┬───┘└──┬──┘└───┬──┘└───┬───┘└──┬──┘
    │       │       │       │       │       │       │       │       │
┌───▼───────▼───────▼───────▼───────▼───────▼───────▼───────▼───────▼────────┐
│                           MESSAGE QUEUE (RabbitMQ)                          │
│                    Events • Commands • Async Processing                      │
└───┬───────┬───────┬───────────────────────────────────────────────┬────────┘
    │       │       │                                               │
┌───▼───┐┌──▼──┐┌───▼───┐                                     ┌─────▼─────┐
│MongoDB││Redis││Elastic│                                     │ Prometheus│
│Primary││Cache││Search │                                     │ + Grafana │
└───────┘└─────┘└───────┘                                     └───────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- MongoDB (or use Docker)
- Redis (or use Docker)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/ecoharvest.git
cd ecoharvest

# Install dependencies for all services
npm run install:all
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
```

### 3. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Local Development (without Docker)

```bash
# Terminal 1: Start infrastructure
docker-compose up -d mongodb redis rabbitmq

# Terminal 2: Start all services in dev mode
npm run dev
```

### 5. Access the Platform

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:8000 |
| RabbitMQ Dashboard | http://localhost:15672 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

---

## 📦 Services

| Service | Port | Description |
|---------|------|-------------|
| **api-gateway** | 8000 | Central routing, rate limiting, auth validation |
| **auth-service** | 3001 | Authentication, JWT, OAuth, 2FA |
| **user-service** | 3002 | User profiles, addresses, preferences |
| **product-service** | 3003 | Product catalog, inventory, categories |
| **order-service** | 3004 | Order processing, status tracking |
| **cart-service** | 3005 | Shopping cart, wishlists |
| **payment-service** | 3006 | Payment processing (mock gateway) |
| **vendor-service** | 3007 | Vendor management, analytics |
| **notification-service** | 3008 | Email, SMS, push, real-time |
| **admin-service** | 3009 | Platform administration |
| **review-service** | 3010 | Ratings, reviews, moderation |
| **search-service** | 3011 | Elasticsearch-powered search |

---

## 📖 API Documentation

Each service exposes its own Swagger documentation:

- Auth Service: http://localhost:3001/api-docs
- User Service: http://localhost:3002/api-docs
- Product Service: http://localhost:3003/api-docs
- ... and so on

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific service
npm test --workspace=auth-service

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

---

## 🐳 Docker Commands

```bash
# Build all images
docker-compose build

# Start in background
docker-compose up -d

# View service logs
docker-compose logs -f auth-service

# Restart a service
docker-compose restart product-service

# Stop and remove all
docker-compose down -v
```

---

## 📊 Monitoring

### Prometheus Metrics

All services expose metrics at `/metrics` endpoint.

### Grafana Dashboards

Pre-configured dashboards for:
- Service health
- Request rates
- Error rates
- Response times
- Database connections

---

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting per IP/user
- Input validation & sanitization
- CORS configuration
- Helmet.js security headers
- Password hashing with bcrypt

---

## 📁 Project Structure

```
ecoharvest/
├── backend/
│   ├── gateway/              # API Gateway (Nginx)
│   ├── packages/
│   │   └── shared/           # Shared utilities
│   └── services/
│       ├── auth-service/
│       ├── user-service/
│       ├── product-service/
│       ├── order-service/
│       ├── cart-service/
│       ├── payment-service/
│       ├── vendor-service/
│       ├── notification-service/
│       ├── admin-service/
│       ├── review-service/
│       └── search-service/
├── frontend/                 # Next.js frontend
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for sustainable commerce**

[⬆ Back to top](#ecoharvest---enterprise-microservices-e-commerce-platform)

</div>
