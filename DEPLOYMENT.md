# Deployment Guide

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] MongoDB database set up and accessible
- [ ] Node.js v14+ installed on server
- [ ] npm dependencies installed
- [ ] SSL/TLS certificates obtained
- [ ] Backup strategy in place
- [ ] Monitoring tools configured
- [ ] Security headers configured

## Local Testing

Before deployment, test locally:

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your values

# Start MongoDB
mongod

# Run the application
npm start

# Test in browser
# http://localhost:3000
```

## Deployment Platforms

### Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set SESSION_SECRET=your_session_secret
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **View Logs**
   ```bash
   heroku logs --tail
   ```

### AWS EC2

1. **Launch EC2 Instance**
   - Ubuntu 20.04 LTS
   - t2.micro or larger
   - Security group: Allow ports 80, 443, 3000

2. **Connect to Instance**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm mongodb
   ```

4. **Clone Repository**
   ```bash
   git clone your-repo-url
   cd smart-hotel-management
   npm install
   ```

5. **Configure Environment**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

6. **Start Application**
   ```bash
   npm start
   ```

7. **Use PM2 for Process Management**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "hotel-app"
   pm2 startup
   pm2 save
   ```

### DigitalOcean

1. **Create Droplet**
   - Ubuntu 20.04
   - 1GB RAM minimum
   - Enable backups

2. **SSH into Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install MongoDB**
   ```bash
   sudo apt-get install -y mongodb
   sudo systemctl start mongodb
   ```

5. **Clone and Setup**
   ```bash
   git clone your-repo-url
   cd smart-hotel-management
   npm install
   cp .env.example .env
   ```

6. **Setup Nginx Reverse Proxy**
   ```bash
   sudo apt install nginx
   ```

   Create `/etc/nginx/sites-available/hotel-app`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/hotel-app /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

8. **Start Application with PM2**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "hotel-app"
   pm2 startup
   pm2 save
   ```

### Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:16-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'

   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - MONGODB_URI=mongodb://mongo:27017/smart-hotel-management
         - JWT_SECRET=${JWT_SECRET}
         - SESSION_SECRET=${SESSION_SECRET}
       depends_on:
         - mongo

     mongo:
       image: mongo:latest
       ports:
         - "27017:27017"
       volumes:
         - mongo_data:/data/db

   volumes:
     mongo_data:
   ```

3. **Build and Run**
   ```bash
   docker-compose up -d
   ```

## SSL/TLS Configuration

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renew
sudo certbot renew --dry-run
```

### Update Node.js for HTTPS

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

## Database Backup Strategy

### Automated Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mongodump --uri "mongodb://localhost:27017/smart-hotel-management" \
  --out "$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

Schedule with cron:
```bash
0 2 * * * /path/to/backup.sh
```

### Cloud Backup

- MongoDB Atlas: Automatic backups included
- AWS S3: Upload backups to S3
- Google Cloud Storage: Upload backups to GCS

## Monitoring & Logging

### PM2 Monitoring

```bash
pm2 monit
pm2 logs
pm2 save
```

### Application Logging

```javascript
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logFile = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });

app.use((req, res, next) => {
  const log = `${new Date().toISOString()} - ${req.method} ${req.path}\n`;
  logFile.write(log);
  next();
});
```

### Uptime Monitoring

- Use UptimeRobot (free)
- Use Pingdom
- Use New Relic

## Performance Optimization

### Enable Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### Set Security Headers

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/', limiter);
```

## Scaling

### Horizontal Scaling

1. **Load Balancer Setup**
   - Use Nginx or HAProxy
   - Route traffic to multiple instances

2. **Session Store**
   - Use MongoDB for sessions (already configured)
   - Or use Redis for better performance

3. **Database Replication**
   - Set up MongoDB replica set
   - Enable sharding for large datasets

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Add caching layer (Redis)

## Troubleshooting Deployment

### Application Won't Start
```bash
# Check logs
pm2 logs

# Check port
lsof -i :3000

# Check Node version
node --version
```

### Database Connection Issues
```bash
# Test MongoDB connection
mongo mongodb://localhost:27017/smart-hotel-management

# Check MongoDB status
sudo systemctl status mongodb
```

### File Upload Issues
```bash
# Check directory permissions
ls -la public/uploads/

# Fix permissions
chmod 755 public/uploads/
```

### Memory Issues
```bash
# Monitor memory
free -h

# Increase Node memory
NODE_OPTIONS=--max-old-space-size=2048 npm start
```

## Post-Deployment

1. **Verify Application**
   - Test all features
   - Check error logs
   - Monitor performance

2. **Setup Monitoring**
   - Configure uptime monitoring
   - Set up error tracking
   - Enable performance monitoring

3. **Backup Verification**
   - Test backup restoration
   - Verify backup schedule
   - Document recovery procedure

4. **Security Audit**
   - Review security headers
   - Check SSL certificate
   - Verify authentication
   - Test authorization

5. **Documentation**
   - Document deployment steps
   - Create runbooks
   - Document troubleshooting procedures

## Rollback Procedure

```bash
# If deployment fails
pm2 stop hotel-app
git revert HEAD
npm install
pm2 start server.js --name "hotel-app"
```

## Support & Maintenance

- Monitor application logs daily
- Review error tracking reports
- Update dependencies monthly
- Perform security audits quarterly
- Test disaster recovery annually

## Contact & Support

For deployment issues:
1. Check logs: `pm2 logs`
2. Review error messages
3. Check database connectivity
4. Verify environment variables
5. Contact support team
