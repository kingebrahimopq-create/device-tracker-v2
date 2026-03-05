# Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Device Tracker V2 to Railway.

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with the project code
- Environment variables configured

## Environment Variables

Create a `.env.production` file with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database
DATABASE_NAME=device_tracker

# Authentication
OAUTH_CLIENT_ID=your_oauth_client_id
OAUTH_CLIENT_SECRET=your_oauth_client_secret
OAUTH_REDIRECT_URI=https://yourdomain.com/api/oauth/callback

# JWT
JWT_SECRET=your_jwt_secret_key

# API Keys
VITE_FRONTEND_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_URL=https://forge.butterfly-effect.dev

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Frontend
VITE_API_URL=https://yourdomain.com/api

# Session
SESSION_SECRET=your_session_secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_new_relic_key
```

## Railway Deployment Steps

### 1. Connect GitHub Repository

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Authorize Railway to access your GitHub account
5. Select the `device-tracker-v2` repository

### 2. Configure Environment Variables

1. In Railway dashboard, go to "Variables"
2. Add all environment variables from `.env.production`
3. Make sure `DATABASE_URL` is set correctly

### 3. Configure Database

#### Option A: Use Railway MySQL Plugin

1. Click "Add Plugin"
2. Select "MySQL"
3. Configure the database:
   - Database name: `device_tracker`
   - Username: `root`
   - Password: (auto-generated)
4. Railway will automatically set `DATABASE_URL`

#### Option B: Use External MySQL Database

1. In Variables, set `DATABASE_URL` to your external database URL
2. Format: `mysql://user:password@host:port/database`

### 4. Configure Build and Deploy Settings

1. Go to "Settings"
2. Set Build Command: `pnpm install && pnpm run build`
3. Set Start Command: `npm run start`
4. Set Node Version: `22`

### 5. Deploy

1. Click "Deploy"
2. Wait for build to complete (5-10 minutes)
3. Check deployment logs for errors

### 6. Run Database Migrations

1. Once deployed, run migrations:
   ```bash
   railway run pnpm run db:push
   ```

2. Or use Railway CLI:
   ```bash
   railway connect
   pnpm run db:push
   ```

### 7. Configure Custom Domain

1. Go to "Settings" → "Domains"
2. Click "Add Custom Domain"
3. Enter your domain (e.g., `tracker.yourdomain.com`)
4. Update DNS records as instructed

## Docker Build Locally

To test the Docker build locally:

```bash
# Build the image
docker build -t device-tracker-v2:latest .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:password@host:port/database" \
  -e OAUTH_CLIENT_ID="your_client_id" \
  -e OAUTH_CLIENT_SECRET="your_secret" \
  device-tracker-v2:latest
```

## Health Checks

The application includes a health check endpoint at `/health` that returns:

```json
{
  "status": "ok",
  "timestamp": "2024-03-05T10:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}
```

## Monitoring

### Railway Metrics

1. Go to "Monitoring" in Railway dashboard
2. View:
   - CPU usage
   - Memory usage
   - Network I/O
   - Request count
   - Response time

### Application Logs

1. Go to "Logs" in Railway dashboard
2. Filter by:
   - Log level (INFO, WARN, ERROR)
   - Service
   - Time range

### Error Tracking

If Sentry is configured:

1. Go to https://sentry.io
2. View error reports
3. Set up alerts for critical errors

## Scaling

### Vertical Scaling

1. Go to "Settings" → "Resources"
2. Increase CPU and Memory allocation
3. Restart the application

### Horizontal Scaling

1. Go to "Settings" → "Deploy"
2. Set `numReplicas` to desired number
3. Railway will automatically load balance

## Backup and Recovery

### Database Backups

1. Railway automatically backs up MySQL databases
2. Backups are retained for 7 days
3. To restore:
   - Go to "Backups" in Railway dashboard
   - Select backup date
   - Click "Restore"

### Manual Backup

```bash
# Export database
mysqldump -u user -p database > backup.sql

# Upload to S3 or secure storage
aws s3 cp backup.sql s3://your-bucket/backups/
```

## Troubleshooting

### Build Failures

1. Check build logs in Railway dashboard
2. Ensure all dependencies are in `package.json`
3. Verify Node version compatibility
4. Check for syntax errors

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check database is running
3. Verify credentials
4. Check network connectivity

### Application Crashes

1. Check application logs
2. Verify environment variables
3. Check for memory leaks
4. Review error tracking (Sentry)

### Performance Issues

1. Monitor CPU and memory usage
2. Check database query performance
3. Implement caching
4. Scale resources if needed

## Rollback

To rollback to a previous deployment:

1. Go to "Deployments" in Railway dashboard
2. Find the previous successful deployment
3. Click "Redeploy"
4. Confirm rollback

## Maintenance

### Regular Tasks

- Monitor application logs daily
- Review error reports weekly
- Update dependencies monthly
- Run security audits quarterly
- Test disaster recovery procedures

### Scheduled Maintenance

1. Plan maintenance window
2. Notify users in advance
3. Backup database before maintenance
4. Deploy updates
5. Verify functionality
6. Monitor for issues

## Support

For Railway support:
- Documentation: https://docs.railway.app
- Discord: https://discord.gg/railway
- Email: support@railway.app

## References

- [Railway Documentation](https://docs.railway.app)
- [Docker Documentation](https://docs.docker.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
