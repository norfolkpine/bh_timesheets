# Deployment Guide

## Overview

This guide covers the deployment process for the Ben Heath Pty Ltd Timesheets application. The application can be deployed to various environments using different deployment strategies.

## Prerequisites

- Git
- Docker
- Docker Compose
- Node.js 18+
- Python 3.8+
- PostgreSQL
- Nginx (for production)

## Environment Setup

### Development Environment

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd bh_timesheets
   ```

2. Set up environment variables:
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env.local
   ```

3. Start development servers:
   ```bash
   ./start.sh
   ```

### Staging Environment

1. Set up the server:
   ```bash
   # Install dependencies
   sudo apt update
   sudo apt install nginx postgresql
   
   # Configure PostgreSQL
   sudo -u postgres createuser -s $USER
   createdb bh_timesheets_staging
   ```

2. Configure environment variables:
   ```bash
   # Backend
   export DJANGO_SETTINGS_MODULE=bh_timesheets.settings.staging
   export DATABASE_URL=postgresql://localhost/bh_timesheets_staging
   export SECRET_KEY=<your-secret-key>
   
   # Frontend
   export NEXT_PUBLIC_API_URL=https://api.staging.bh-timesheets.com
   ```

3. Deploy using Docker:
   ```bash
   docker-compose -f docker-compose.staging.yml up -d
   ```

### Production Environment

1. Set up the production server:
   ```bash
   # Install dependencies
   sudo apt update
   sudo apt install nginx postgresql
   
   # Configure PostgreSQL
   sudo -u postgres createuser -s $USER
   createdb bh_timesheets_prod
   ```

2. Configure SSL certificates:
   ```bash
   sudo certbot --nginx -d bh-timesheets.com -d www.bh-timesheets.com
   ```

3. Configure Nginx:
   ```nginx
   # /etc/nginx/sites-available/bh-timesheets
   server {
       listen 80;
       server_name bh-timesheets.com www.bh-timesheets.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl;
       server_name bh-timesheets.com www.bh-timesheets.com;

       ssl_certificate /etc/letsencrypt/live/bh-timesheets.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/bh-timesheets.com/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /api {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Deploy using Docker:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Docker Deployment

### Development

```bash
docker-compose up
```

### Staging

```bash
docker-compose -f docker-compose.staging.yml up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Database Management

### Backups

1. Create a backup:
   ```bash
   pg_dump bh_timesheets > backup.sql
   ```

2. Restore from backup:
   ```bash
   psql bh_timesheets < backup.sql
   ```

### Migrations

1. Generate migrations:
   ```bash
   python manage.py makemigrations
   ```

2. Apply migrations:
   ```bash
   python manage.py migrate
   ```

## Monitoring

### Logs

1. View application logs:
   ```bash
   docker-compose logs -f
   ```

2. View Nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/access.log
   sudo tail -f /var/log/nginx/error.log
   ```

### Health Checks

1. Backend health check:
   ```bash
   curl https://api.bh-timesheets.com/health/
   ```

2. Frontend health check:
   ```bash
   curl https://bh-timesheets.com/health
   ```

## Security

### SSL/TLS

- Use Let's Encrypt for SSL certificates
- Configure HSTS
- Enable HTTP/2

### Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

### Database Security

1. Use strong passwords
2. Limit database access
3. Regular security updates
4. Enable SSL for database connections

## Backup Strategy

1. Daily database backups
2. Weekly full system backups
3. Monthly archive backups
4. Off-site backup storage

## Rollback Procedure

1. Stop the current deployment:
   ```bash
   docker-compose down
   ```

2. Restore from backup:
   ```bash
   # Restore database
   psql bh_timesheets < backup.sql
   
   # Restore application
   git checkout <previous-version>
   docker-compose up -d
   ```

## Maintenance

### Regular Tasks

1. Update dependencies:
   ```bash
   # Backend
   pip install --upgrade -r requirements.txt
   
   # Frontend
   npm update
   ```

2. Check logs for errors
3. Monitor system resources
4. Review security updates
5. Test backup restoration

### Emergency Procedures

1. Identify the issue
2. Stop affected services
3. Restore from backup if necessary
4. Deploy fix
5. Monitor for stability
6. Document the incident 