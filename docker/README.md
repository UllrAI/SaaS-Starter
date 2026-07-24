# Docker Setup for UllrAI Starter

This directory contains Docker configuration for running the UllrAI Starter application in containers.

## Files

- `Dockerfile` - Multi-stage build configuration for the Next.js application
- `docker-compose.yml` - Complete development environment with PostgreSQL and Redis
- Root `.dockerignore` - Excludes secrets and build artifacts

## Quick Start

1. **Configure Environment Variables**

   Copy the root environment template and fill in every required value:

   ```bash
   cp .env.example .env
   openssl rand -base64 32
   ```

   Store the generated value in `BETTER_AUTH_SECRET`. Set
   `RESEND_EMAIL_FROM` to an address on a domain verified in Resend. Set
   a second generated value in `UPLOAD_CLEANUP_SECRET`. Set
   `NEXT_PUBLIC_APP_URL` to the exact public origin used to access the build;
   production SEO metadata is generated from this value at build time.

2. **Run the application**

   ```bash
   cd docker
   docker compose --env-file ../.env up --build
   ```

   Compose waits for PostgreSQL, applies every committed migration with the
   one-shot `migrate` service, and starts the application only after migration
   succeeds.

3. **Access the application**
   - Application: http://localhost:3000
   - Database: localhost:5432
   - Redis: localhost:6379

## Services

### app

- **Port**: 3000
- **Dependencies**: PostgreSQL
- **Health check**: Next.js application readiness

### migrate

- **Purpose**: Applies committed Drizzle migrations before `app` starts
- **Lifecycle**: Exits successfully after migrations complete

### postgres

- **Port**: 5432
- **Database**: `ullrai_starter`
- **Credentials**: postgres/postgres (development only)
- **Persistence**: Docker volume `postgres_data`

### redis (optional)

- **Port**: 6379
- **Persistence**: Docker volume `redis_data`
- **Use case**: Caching and session storage
- **Start**: `docker compose --env-file ../.env --profile cache up --build`

## Development Workflow

1. **Database Migrations**

   ```bash
   # Re-run the one-shot committed migration service
   docker compose --env-file ../.env run --rm migrate

   # Generate migrations on the host after changing the schema
   pnpm db:generate
   ```

2. **Logs**

   ```bash
   # View application logs
   docker compose logs -f app

   # View all services
   docker compose logs -f
   ```

3. **Shell Access**

   ```bash
   # Access database
   docker compose exec postgres psql -U postgres -d ullrai_starter
   ```

## Production Considerations

For production deployment:

1. **Security**: Change all default passwords and secrets
2. **Environment**: Use production environment variables
3. **Volumes**: Configure persistent storage appropriately
4. **Network**: Use proper network configuration
5. **Health Checks**: Ensure all services have appropriate health checks
6. **Secrets**: Use Docker secrets or external secret management
7. **Upload cleanup**: Schedule an authenticated `POST` to
   `/api/internal/uploads/cleanup` at least every five minutes
8. **Upload protocol rollout**: Set `UPLOAD_LEGACY_COMPLETION_SINCE` and
   `UPLOAD_LEGACY_COMPLETION_UNTIL` only for the bounded v1-to-v2 rollout
   window, then remove both after the cutoff

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is ready
docker compose exec postgres pg_isready -U postgres

# Reset database
docker compose down -v
docker compose --env-file ../.env up --build
```

### Build Issues

```bash
# Clean build
docker compose down
docker system prune -f
docker compose --env-file ../.env up --build
```
