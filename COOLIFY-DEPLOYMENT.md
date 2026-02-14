# Coolify Deployment Guide for Arabic Meet System

This guide explains how to deploy the Arabic Meet monorepo on Hostinger VPS using Coolify.

## Prerequisites

- Hostinger VPS with at least 4GB RAM (8GB recommended)
- Coolify installed on your VPS
- Domain name (optional but recommended)
- SSH access to your VPS

## Architecture Overview

The monorepo consists of:
- **API** (NestJS) - Backend service on port 3001
- **Web** (Next.js) - Frontend application on port 3000
- **LiveKit** - WebRTC server on ports 7880-7882
- **PostgreSQL** - Database
- **Redis** - Cache/session store

## Deployment Options

### Option 1: Deploy with Docker Compose (Recommended)

This is the easiest way to deploy the entire stack on Coolify.

#### Step 1: Prepare Your Repository

1. Push your code to GitHub/GitLab/Gitea
2. Ensure all the files we just created are committed:
   - `apps/api/Dockerfile`
   - `apps/web/Dockerfile`
   - `docker-compose.prod.yml`
   - `.dockerignore`
   - `.env.production.example`

#### Step 2: Create Project in Coolify

1. Log into Coolify dashboard
2. Click **+ New Resource**
3. Select **Docker Compose**
4. Choose your Git provider and repository
5. Select branch (e.g., `main`)

#### Step 3: Configure Docker Compose

In Coolify, set the **Docker Compose Location** to:
```
docker-compose.prod.yml
```

#### Step 4: Set Environment Variables

In Coolify's Environment Variables section, add:

```env
# Database
DATABASE_USER=arabicmeet
DATABASE_PASSWORD=<generate-strong-password>
DATABASE_NAME=arabicmeet

# LiveKit (generate secure keys)
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=<min-32-chars-secret>

# JWT
JWT_SECRET=<min-32-chars-secret>

# URLs (replace with your domain)
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
```

**Generate secure secrets:**
```bash
# On your local machine or VPS
openssl rand -hex 32  # For LIVEKIT_API_SECRET
openssl rand -hex 32  # For JWT_SECRET
```

#### Step 5: Configure Domains

In Coolify, set up domains for each service:

1. **Web Frontend**: `yourdomain.com` → Port 3000
2. **API Backend**: `api.yourdomain.com` → Port 3001
3. **LiveKit**: `livekit.yourdomain.com` → Port 7880

Enable **HTTPS** for all domains (Coolify handles SSL automatically).

#### Step 6: Deploy

1. Click **Deploy** in Coolify
2. Monitor the build logs
3. Wait for all services to start (5-10 minutes)

#### Step 7: Initialize Database

After first deployment, run the admin user creation script:

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Find the API container
docker ps | grep api

# Run the admin creation script
docker exec -it <api-container-id> npm run create-admin --workspace=@arabic-meet/api
```

Or manually create admin user:
```bash
docker exec -it <postgres-container-id> psql -U arabicmeet -d arabicmeet
```

Then run the SQL from the admin creation script.

---

### Option 2: Deploy Services Separately

If you prefer more control, deploy each service as a separate Coolify resource.

#### 2.1 Deploy PostgreSQL

1. **+ New Resource** → **Database** → **PostgreSQL**
2. Set database name: `arabicmeet`
3. Set username: `arabicmeet`
4. Set strong password
5. Deploy

#### 2.2 Deploy Redis

1. **+ New Resource** → **Database** → **Redis**
2. Use default settings
3. Deploy

#### 2.3 Deploy LiveKit

1. **+ New Resource** → **Docker Image**
2. Image: `livekit/livekit-server:latest`
3. Command: `--config /etc/livekit.yaml`
4. Mount volume: `./infra/livekit.yaml:/etc/livekit.yaml`
5. Ports: 7880, 7881, 7882 (UDP)
6. Domain: `livekit.yourdomain.com` → 7880
7. Deploy

#### 2.4 Deploy API

1. **+ New Resource** → **Git Repository**
2. Select your repo
3. Build Pack: **Dockerfile**
4. Dockerfile Location: `apps/api/Dockerfile`
5. Base Directory: `/` (root of monorepo)
6. Port: 3001
7. Domain: `api.yourdomain.com`
8. Environment Variables:
   ```env
   NODE_ENV=production
   PORT=3001
   DATABASE_HOST=<postgres-internal-url>
   DATABASE_PORT=5432
   DATABASE_USER=arabicmeet
   DATABASE_PASSWORD=<from-postgres-service>
   DATABASE_NAME=arabicmeet
   LIVEKIT_API_KEY=devkey
   LIVEKIT_API_SECRET=<your-secret>
   LIVEKIT_URL=ws://<livekit-internal-url>:7880
   JWT_SECRET=<your-jwt-secret>
   CORS_ORIGIN=https://yourdomain.com
   ```
9. Deploy

#### 2.5 Deploy Web

1. **+ New Resource** → **Git Repository**
2. Select your repo
3. Build Pack: **Dockerfile**
4. Dockerfile Location: `apps/web/Dockerfile`
5. Base Directory: `/` (root of monorepo)
6. Port: 3000
7. Domain: `yourdomain.com`
8. Environment Variables:
   ```env
   NODE_ENV=production
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com
   ```
9. Deploy

---

## Important Configuration Notes

### 1. LiveKit Configuration

Update `infra/livekit.yaml` for production:

```yaml
port: 7880
rtc:
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
  tcp_port: 7881

redis:
  address: <redis-internal-url>:6379

keys:
  devkey: <your-livekit-secret-32-chars>

room:
  auto_create: true
  empty_timeout: 300
  max_participants: 50

turn:
  enabled: false  # Disable for now, enable if needed

logging:
  level: info
```

### 2. WebSocket Support

Ensure Coolify/Nginx is configured for WebSocket proxying:
- LiveKit uses WebSocket on port 7880
- Socket.io uses WebSocket on API port 3001

Coolify handles this automatically, but verify in logs if connections fail.

### 3. CORS Configuration

Make sure CORS_ORIGIN matches your frontend domain exactly:
```env
CORS_ORIGIN=https://yourdomain.com
```

No trailing slash!

### 4. Database Migrations

TypeORM will auto-create tables on first run (synchronize: true in development).

For production, consider:
1. Set `synchronize: false` in `apps/api/src/config/database.config.ts`
2. Use TypeORM migrations instead
3. Run migrations manually after deployment

---

## Post-Deployment Checklist

- [ ] All services are running (check Coolify dashboard)
- [ ] HTTPS is enabled for all domains
- [ ] Database is accessible from API
- [ ] Admin user is created
- [ ] Can login to admin panel at `https://yourdomain.com/admin/login`
- [ ] Can create a room
- [ ] Can join a room
- [ ] Video/audio works in room

---

## Monitoring & Maintenance

### View Logs in Coolify

1. Go to your resource in Coolify
2. Click **Logs** tab
3. Monitor real-time logs

### Database Backups

Coolify provides automatic backups for databases. Configure in:
1. Database resource → **Backups** tab
2. Set backup frequency (daily recommended)
3. Set retention period

### Manual Backup

```bash
# SSH into VPS
ssh root@your-vps-ip

# Backup database
docker exec <postgres-container> pg_dump -U arabicmeet arabicmeet > backup.sql

# Download to local
scp root@your-vps-ip:~/backup.sql ./
```

### Scaling

To handle more users:
1. Upgrade VPS resources in Hostinger
2. Increase `max_participants` in LiveKit config
3. Consider deploying multiple API instances with load balancer

---

## Troubleshooting

### Build Fails

**Error**: `Cannot find module '@arabic-meet/shared'`

**Solution**: Ensure the Dockerfile copies the entire monorepo structure:
```dockerfile
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
```

### Database Connection Failed

**Error**: `ECONNREFUSED` or `password authentication failed`

**Solution**:
1. Check DATABASE_HOST is the internal Coolify URL (not public domain)
2. Verify DATABASE_PASSWORD matches
3. Check PostgreSQL is running in Coolify

### LiveKit Connection Failed

**Error**: `WebSocket connection failed`

**Solution**:
1. Verify LIVEKIT_URL uses internal URL for API (ws://...)
2. Verify NEXT_PUBLIC_LIVEKIT_URL uses public domain (wss://...)
3. Check LiveKit logs for errors
4. Ensure ports 7880-7882 are accessible

### CORS Errors

**Error**: `Access-Control-Allow-Origin`

**Solution**:
1. Set CORS_ORIGIN to exact frontend URL (with https://)
2. Restart API service
3. Clear browser cache

---

## Security Recommendations

1. **Strong Passwords**: Use generated passwords for database
2. **Environment Secrets**: Never commit `.env` files
3. **HTTPS Only**: Always use HTTPS in production
4. **Rate Limiting**: Consider adding rate limiting to API
5. **Firewall**: Use Coolify's built-in firewall rules
6. **Updates**: Keep Docker images updated

---

## Cost Optimization

For Hostinger VPS:
- **Minimum**: 4GB RAM VPS (~$10-15/month)
- **Recommended**: 8GB RAM VPS (~$20-30/month)
- **High Traffic**: 16GB RAM VPS (~$40-60/month)

---

## Support

If you encounter issues:
1. Check Coolify logs for each service
2. Check application logs in containers
3. Verify environment variables are set correctly
4. Ensure all services can communicate internally

---

## Quick Commands Reference

```bash
# SSH to VPS
ssh root@your-vps-ip

# List all containers
docker ps

# View logs
docker logs <container-id> -f

# Restart a service
docker restart <container-id>

# Execute command in container
docker exec -it <container-id> sh

# Database access
docker exec -it <postgres-container> psql -U arabicmeet -d arabicmeet

# Check disk space
df -h

# Check memory usage
free -h
```

---

## Next Steps

After successful deployment:
1. Test all features thoroughly
2. Set up monitoring/alerts
3. Configure automated backups
4. Document your specific configuration
5. Train users on the system

Good luck with your deployment! 🚀
