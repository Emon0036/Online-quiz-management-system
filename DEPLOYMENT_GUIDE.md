# Production Deployment Guide

## Pre-Deployment Checklist

### Code Review
- [ ] All changes tested locally
- [ ] No console errors or warnings
- [ ] No hardcoded credentials
- [ ] All environment variables externalized
- [ ] Sensitive data in `.env` (not in code)

### Database
- [ ] MongoDB Atlas/Cloud database configured
- [ ] Backups enabled
- [ ] Connection pooling configured
- [ ] Database indexes created
- [ ] Read replicas configured (optional)

### Security
- [ ] HTTPS/SSL certificate obtained
- [ ] All passwords use bcryptjs hashing
- [ ] CORS configured appropriately
- [ ] Rate limiting enabled
- [ ] CSRF protection active
- [ ] XSS protection verified
- [ ] SQL/NoSQL injection prevention confirmed

### Performance
- [ ] Database queries optimized
- [ ] Indexes on frequently queried fields
- [ ] CDN configured for static assets
- [ ] Compression enabled (gzip)
- [ ] Caching headers set
- [ ] Session store configured (MongoStore)

### Monitoring
- [ ] Error logging setup (e.g., Sentry)
- [ ] Performance monitoring active
- [ ] Uptime monitoring configured
- [ ] Alert system setup
- [ ] Log aggregation tool configured

## Deployment Platforms

### Option 1: Heroku (Easiest)

**Step 1: Install Heroku CLI**
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from: https://devcenter.heroku.com/articles/heroku-cli
```

**Step 2: Create Heroku App**
```bash
heroku login
heroku create your-app-name
```

**Step 3: Configure Environment Variables**
```bash
heroku config:set MONGODB_URI="your_mongodb_uri"
heroku config:set SESSION_SECRET="your_secret_key"
heroku config:set NODE_ENV="production"
```

**Step 4: Deploy**
```bash
git push heroku main
```

**Step 5: View Logs**
```bash
heroku logs --tail
```

### Option 2: Railway

**Step 1: Connect GitHub**
- Go to https://railway.app
- Connect GitHub account
- Select repository

**Step 2: Configure**
- Set environment variables
- MongoDB URI
- Session secret

**Step 3: Deploy**
- Deploy automatically from main branch

### Option 3: AWS EC2

**Step 1: Create EC2 Instance**
```bash
# Create t2.micro instance (free tier)
# Ubuntu 20.04 LTS
# Security group: Open port 80, 443, 3000
```

**Step 2: Connect & Setup**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB (or use MongoDB Atlas)
```

**Step 3: Clone & Setup**
```bash
git clone your-repo-url
cd Online-quiz-management-system
npm install
```

**Step 4: Configure Environment**
```bash
nano .env
# Add all variables
```

**Step 5: Setup PM2 (Process Manager)**
```bash
sudo npm install -g pm2
pm2 start app.js --name "quiz-system"
pm2 startup
pm2 save
```

**Step 6: Setup Nginx (Reverse Proxy)**
```bash
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/default
```

**Nginx Config:**
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

**Step 7: Enable Nginx**
```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

**Step 8: SSL Certificate (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 4: DigitalOcean App Platform

**Step 1: Connect GitHub**
- Go to DigitalOcean
- Create App Platform project
- Connect GitHub

**Step 2: Configure**
- Set build command: `npm install`
- Set run command: `npm start`
- Add environment variables

**Step 3: Deploy**
- Automatic deployment on push

## Environment Configuration

### Production `.env`:
```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dbname

# Session
SESSION_SECRET=strong_random_secret_key_32_chars_min

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

# Server
PORT=3000
NODE_ENV=production

# Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security
JWT_SECRET=another_strong_secret
CORS_ORIGIN=https://your-domain.com
```

### Generate Strong Secrets:
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

## Scalability Considerations

### Database Scaling
- [ ] Enable MongoDB replication
- [ ] Setup read replicas
- [ ] Configure backup strategy
- [ ] Monitor query performance

### Application Scaling
- [ ] Use load balancer (AWS ELB, Nginx)
- [ ] Multiple app instances (horizontal scaling)
- [ ] Session store in MongoDB (already done)
- [ ] Cache layer (Redis) optional

### CDN Setup
- [ ] CloudFlare for DNS + caching
- [ ] Or AWS CloudFront
- [ ] Serve static assets from CDN

## Monitoring & Logging

### Error Tracking (Sentry)
```bash
npm install @sentry/node
```

**In app.js:**
```javascript
const Sentry = require("@sentry/node");

Sentry.init({ 
  dsn: process.env.SENTRY_DSN 
});

app.use(Sentry.Handlers.errorHandler());
```

### Application Monitoring
- Use PM2 Plus (free tier available)
- Configure CPU/Memory alerts
- Monitor disk space
- Track error rates

### Database Monitoring
- MongoDB Atlas has built-in monitoring
- Setup alerts for:
  - High CPU
  - Disk space
  - Connection count
  - Query performance

## Backup Strategy

### Automated Backups
```bash
# MongoDB Atlas - automatic daily backups included

# Manual backup
mongodump --uri="mongodb_uri" --out=./backup
```

### Backup Schedule
- Daily automated backups
- Weekly full backups
- Monthly archival
- 30-day retention minimum
- Test restore monthly

## Performance Optimization

### Application Level
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Set cache headers
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});
```

### Database Level
```javascript
// Index frequently queried fields
// Already done in models

// Connection pooling
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
});
```

### Static Assets
```bash
# Minify CSS and JS
npm install -g csso-cli terser

# Compress images
npm install -g imagemin-cli
```

## Security Hardening

### HTTPS Only
```nginx
# In Nginx config
if ($scheme != "https") {
  return 301 https://$server_name$request_uri;
}
```

### Security Headers
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
```

## Troubleshooting Production Issues

### App Won't Start
```bash
# Check logs
npm run dev

# Check dependencies
npm install

# Check port availability
lsof -i :3000
```

### Database Connection Failed
```bash
# Test connection
mongo "mongodb_uri"

# Check IP whitelist in MongoDB Atlas
# Add deployment server IP to whitelist
```

### Memory Leaks
```bash
# Monitor memory
pm2 monit

# Profile with clinic.js
npm install -g clinic
clinic doctor -- node app.js
```

### High CPU Usage
```bash
# Identify slow queries
# Check MongoDB logs
# Profile with Node.js profiler
```

## Maintenance

### Regular Tasks
- [ ] Monthly security updates
- [ ] Quarterly dependency updates
- [ ] Monthly log review
- [ ] Quarterly performance audit
- [ ] Backup restoration test

### Update Procedure
```bash
# Test locally
npm update
npm test

# Deploy to staging
git push staging main

# Monitor for 24 hours
# If stable, deploy to production
git push origin main
```

### Database Maintenance
- [ ] Index optimization (quarterly)
- [ ] Collection statistics review (monthly)
- [ ] Connection pool tuning
- [ ] Storage monitoring

## Disaster Recovery

### Disaster Recovery Plan
1. **Backup Location**: Off-site cloud storage
2. **Recovery Point**: Daily backups (1-day RPO)
3. **Recovery Time**: Within 2 hours (2-hour RTO)
4. **Testing**: Monthly restore test

### Restore Procedure
```bash
# Restore from backup
mongorestore --uri="mongodb_uri" ./backup

# Verify data integrity
# Restart application
pm2 restart quiz-system
```

## Cost Optimization

### Free/Low-Cost Options
- MongoDB Atlas: Free tier available
- Heroku: Free dyno (discontinued, use Railway/Render)
- GitHub: Free for public repos
- Sentry: Free tier (limited)

### Estimated Monthly Costs
```
MongoDB Atlas:     $9-57/month
App Hosting:       $5-100/month
CDN:               $0-20/month
Email Service:     $10-30/month
Monitoring:        $0-50/month
─────────────────────────────
Total:            $24-257/month (depending on scale)
```

## Compliance & Legal

### Data Protection
- [ ] GDPR compliance (if serving EU users)
- [ ] CCPA compliance (if serving California users)
- [ ] Data encryption (in transit and at rest)
- [ ] User data deletion policy

### Terms of Service
- [ ] Privacy policy published
- [ ] Terms of service defined
- [ ] Data retention policy
- [ ] Cookie policy

## Post-Deployment

### Monitor First 24 Hours
- [ ] Check error rates
- [ ] Monitor database performance
- [ ] Check response times
- [ ] Review user feedback
- [ ] Monitor system resources

### First Week
- [ ] Fix critical issues
- [ ] Optimize performance
- [ ] Gather user feedback
- [ ] Monitor security
- [ ] Update documentation

### First Month
- [ ] Performance optimization
- [ ] User feedback implementation
- [ ] Security hardening
- [ ] Documentation updates
- [ ] Cost optimization

## Useful Commands

```bash
# Check app status
pm2 status

# View logs
pm2 logs quiz-system

# Restart app
pm2 restart quiz-system

# Monitor performance
pm2 monit

# Check disk space
df -h

# Check memory
free -h

# Check running processes
top

# MongoDB backup
mongodump --uri="mongodb_uri" --out=./backup-$(date +%Y%m%d)

# MongoDB restore
mongorestore --uri="mongodb_uri" ./backup-folder
```

## Links & Resources

- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [MongoDB Production Checklist](https://docs.mongodb.com/manual/administration/production-checklist/)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Last Updated**: May 2026
**Maintained By**: Development Team
**Status**: ✅ Ready for Production
