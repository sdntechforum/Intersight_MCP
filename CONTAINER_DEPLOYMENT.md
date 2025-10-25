# Intersight MCP HTTP Server - Container Deployment

This guide explains how to deploy the Intersight MCP Server as a containerized HTTP service.

## Overview

The HTTP server version provides the same 199 Intersight tools as the stdio MCP server, but accessible via REST API endpoints. This enables:

- Web-based integrations
- CI/CD pipeline access
- Multiple concurrent clients
- Load balancing and scaling
- Cloud deployment

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Intersight API credentials (API Key ID and Private Key)
- Network access to Intersight API (https://intersight.com)

### Basic Deployment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jim-coyne/Intersight_MCP.git
   cd Intersight_MCP
   ```

2. **Set up credentials:**
   ```bash
   # Copy your Intersight private key
   cp ~/path/to/your/private_key.pem ./auth/private_key.pem
   
   # Create environment file
   cp .env.example .env
   # Edit .env and set your INTERSIGHT_API_KEY_ID
   ```

3. **Start the container:**
   ```bash
   docker-compose up -d
   ```

4. **Test the deployment:**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/info
   curl http://localhost:3000/api/tools
   ```

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check and status |
| GET | `/api/info` | Server information and capabilities |
| GET | `/api/tools` | List all available tools |
| GET | `/api/tools/:name` | Get specific tool details |
| GET | `/api/tools/search?query=term` | Search tools by name/description |
| POST | `/api/execute` | Execute a single tool |
| POST | `/api/batch` | Execute multiple tools |

### Example API Usage

**List all servers:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "list_compute_servers"}'
```

**Get server details:**
```bash
curl -X POST http://localhost:3000/api/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_server_details", "parameters": {"moid": "server_moid_here"}}'
```

**Search for alarm-related tools:**
```bash
curl "http://localhost:3000/api/tools/search?query=alarm"
```

**Batch operations:**
```bash
curl -X POST http://localhost:3000/api/batch \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"tool": "list_compute_servers"},
      {"tool": "list_alarms", "parameters": {"filter": "Severity eq '\''Critical'\''"}}
    ]
  }'
```

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `INTERSIGHT_API_KEY_ID` | Yes | - | Your Intersight API Key ID |
| `INTERSIGHT_PRIVATE_KEY_PATH` | Yes | `/app/secrets/private_key.pem` | Path to private key in container |
| `INTERSIGHT_BASE_URL` | No | `https://intersight.com` | Intersight API base URL |
| `PORT` | No | `3000` | HTTP server port |

### Docker Compose Profiles

**Development (default):**
```bash
docker-compose up -d
```

**Production with Nginx:**
```bash
docker-compose --profile production up -d
```

## Security Considerations

### Container Security

- Runs as non-root user (`intersight:1001`)
- Uses Alpine Linux base image for minimal attack surface
- Private key mounted as read-only volume
- Health checks for monitoring

### Network Security

- Consider running behind reverse proxy (Nginx included)
- Use HTTPS in production (SSL termination at proxy)
- Implement network policies for container access
- Monitor health endpoint for service availability

### API Security

- No built-in authentication - implement at reverse proxy level
- Rate limiting recommended for production
- Log API access for auditing
- Secure private key file permissions (600)

## Production Deployment

### With SSL Termination

1. **Create SSL certificates:**
   ```bash
   mkdir ssl
   # Copy your SSL certificates to ./ssl/
   ```

2. **Configure Nginx:**
   ```bash
   # Edit nginx.conf for your domain and SSL setup
   ```

3. **Deploy with production profile:**
   ```bash
   docker-compose --profile production up -d
   ```

### Kubernetes Deployment

Example Kubernetes manifests:

```yaml
# intersight-mcp-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: intersight-mcp-http
spec:
  replicas: 2
  selector:
    matchLabels:
      app: intersight-mcp-http
  template:
    metadata:
      labels:
        app: intersight-mcp-http
    spec:
      containers:
      - name: intersight-mcp-http
        image: intersight-mcp-http:1.0.14
        ports:
        - containerPort: 3000
        env:
        - name: INTERSIGHT_API_KEY_ID
          valueFrom:
            secretKeyRef:
              name: intersight-credentials
              key: api-key-id
        volumeMounts:
        - name: private-key
          mountPath: /app/secrets
          readOnly: true
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 30
      volumes:
      - name: private-key
        secret:
          secretName: intersight-private-key
---
apiVersion: v1
kind: Service
metadata:
  name: intersight-mcp-service
spec:
  selector:
    app: intersight-mcp-http
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

## Monitoring and Troubleshooting

### Health Monitoring

```bash
# Check container health
docker-compose ps

# View logs
docker-compose logs -f intersight-mcp-http

# Health endpoint
curl http://localhost:3000/health
```

### Common Issues

**Container fails to start:**
- Check API credentials in `.env` file
- Verify private key file exists and has correct permissions
- Check logs: `docker-compose logs intersight-mcp-http`

**API calls fail:**
- Verify Intersight connectivity: `curl https://intersight.com/api/v1/`
- Check API key permissions in Intersight
- Review container logs for authentication errors

**Performance issues:**
- Monitor container resources: `docker stats`
- Consider horizontal scaling with load balancer
- Implement connection pooling at reverse proxy

### Log Analysis

Important log patterns to monitor:
- `✅ Intersight API Service initialized successfully` - Service started
- `Failed to initialize API Service` - Configuration error
- `Tool execution failed` - API call issues
- `Express error` - HTTP server errors

## Migration from stdio MCP

The HTTP server provides the same tool functionality as the stdio MCP server:

| stdio MCP | HTTP Server | Notes |
|-----------|-------------|-------|
| VS Code integration | Not applicable | HTTP server for web/API access |
| Claude Desktop | REST API calls | Use HTTP endpoints instead |
| Tool execution | `POST /api/execute` | Same parameters and responses |
| Tool listing | `GET /api/tools` | Same tool definitions |

## Development

### Building Custom Image

```bash
# Build image
docker build -t my-intersight-mcp .

# Run with custom image
docker run -p 3000:3000 \
  -e INTERSIGHT_API_KEY_ID=your_key \
  -v ./auth:/app/secrets:ro \
  my-intersight-mcp
```

### Extending the Server

The HTTP server can be extended by:
1. Adding new endpoints in `src/http-server.ts`
2. Implementing additional tools in `src/server.ts`
3. Adding middleware for authentication, rate limiting, etc.
4. Customizing Docker image for specific deployment needs

## Support

For issues and questions:
- GitHub Issues: https://github.com/jim-coyne/Intersight_MCP/issues
- Documentation: https://github.com/jim-coyne/Intersight_MCP/blob/main/README.md
- Intersight API Documentation: https://intersight.com/apidocs/