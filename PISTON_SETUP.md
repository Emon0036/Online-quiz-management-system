# Self-Hosted Piston API Setup

The public Piston API became whitelist-only on 2/15/2026. This project now uses a self-hosted Piston instance for code execution.

## Prerequisites

- Docker installed on your system
- Docker Compose

## Quick Start

### 1. Start Piston Container

Run this command from the project root:

```bash
docker-compose up -d
```

This will:
- Pull the latest Piston image
- Start the container on `http://localhost:2000`
- Create a persistent volume for Piston data

### 2. Verify Piston is Running

```bash
# Check container status
docker-compose ps

# Test the API
curl http://localhost:2000/api/v2/runtimes
```

You should see a JSON response listing available runtimes.

### 3. Start Your Application

```bash
npm install
npm start
```

The application will now use `http://localhost:2000/api/v2/piston/execute` for code execution.

## Configuration

The Piston API URL is configured in `.env`:
```
PISTON_API_URL=http://localhost:2000/api/v2/piston/execute
```

You can change this to use a different Piston instance if needed.

## Stop Piston

```bash
docker-compose down
```

To also remove volumes:
```bash
docker-compose down -v
```

## Supported Languages

By default, self-hosted Piston includes:
- C
- C++
- Java
- JavaScript (Node.js)
- Python

See `utils/piston.js` for the language mapping.

## Troubleshooting

### Port Already in Use
If port 2000 is already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "2001:2000"  # Change to any available port
```

### Container Won't Start
Check logs:
```bash
docker-compose logs piston
```

### Slow First Request
Piston downloads language runtimes on first use. The first code execution may take 30-60 seconds.

### API Not Responding
Ensure container is healthy:
```bash
docker-compose logs --tail=50 piston
```

## Deployment

For production, consider:
1. Running Piston on a separate server
2. Using environment-specific URLs in `.env`
3. Implementing request caching for test cases
4. Adding rate limiting

## Reference

- Piston GitHub: https://github.com/engineer-man/piston
- Docker Hub: https://hub.docker.com/r/engineerman/piston
