# Docker Setup for UllrAI Starter

This directory contains Docker configuration for running the UllrAI Starter application in containers.

## Files

- `Dockerfile` - Multi-stage build configuration for the Next.js application
- `docker-compose.yml` - Complete development environment with PostgreSQL and Redis
- `.dockerignore` - Excludes unnecessary files from Docker builds

## Quick Start

1. **Configure Environment Variables**

   Before running, update the environment variables in `docker-compose.yml`:

   ```yaml
   # Required for development
   BETTER_AUTH_SECRET: "your-development-secret-key-here"
   RESEND_API_KEY: "your-resend-api-key-here"

   # Configure R2 storage
   R2_ENDPOINT: "your-r2-endpoint"
   R2_ACCESS_KEY_ID: "your-r2-access-key"
   # ... etc
   ```

2. **Run the application**

   ```bash
   cd docker
   docker-compose up --build
   ```

3. **Access the application**

   - Application: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

## Services

### app

- **Port**: 3000
- **Dependencies**: PostgreSQL
- **Health check**: Next.js application readiness

### postgres

- **Port**: 5432
- **Database**: `ullrai_starter`
- **Credentials**: postgres/postgres (development only)
- **Persistence**: Docker volume `postgres_data`

### redis (optional)

- **Port**: 6379
- **Persistence**: Docker volume `redis_data`
- **Use case**: Caching and session storage

## Development Workflow

1. **Database Migrations**

   ```bash
   # Run migrations inside the container
   docker-compose exec app pnpm run db:migrate:dev
   ```

2. **Logs**

   ```bash
   # View application logs
   docker-compose logs -f app

   # View all services
   docker-compose logs -f
   ```

3. **Shell Access**

   ```bash
   # Access application container
   docker-compose exec app sh

   # Access database
   docker-compose exec postgres psql -U postgres -d ullrai_starter
   ```

## Production Considerations

For production deployment:

1. **Security**: Change all default passwords and secrets
2. **Environment**: Use production environment variables
3. **Volumes**: Configure persistent storage appropriately
4. **Network**: Use proper network configuration
5. **Health Checks**: Ensure all services have appropriate health checks
6. **Secrets**: Use Docker secrets or external secret management

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is ready
docker-compose exec postgres pg_isready -U postgres

# Reset database
docker-compose down -v
docker-compose up --build
```

### Build Issues

```bash
# Clean build
docker-compose down
docker system prune -f
docker-compose up --build
```
