# Configuration Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/smart-hotel-management

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
SESSION_SECRET=your_super_secret_session_key_change_this_in_production
```

## Detailed Configuration

### PORT
- **Default**: 3000
- **Description**: The port on which the server will run
- **Example**: `PORT=8080`

### NODE_ENV
- **Default**: development
- **Options**: development, production
- **Description**: Environment mode
- **Note**: Set to 'production' when deploying

### MONGODB_URI
- **Default**: mongodb://localhost:27017/smart-hotel-management
- **Description**: MongoDB connection string
- **Examples**:
  - Local: `mongodb://localhost:27017/smart-hotel-management`
  - MongoDB Atlas: `mongodb+srv://username:password@cluster.mongodb.net/smart-hotel-management`
  - Docker: `mongodb://mongo:27017/smart-hotel-management`

### JWT_SECRET
- **Description**: Secret key for JWT token signing
- **Security**: Change this in production
- **Recommendation**: Use a strong random string (min 32 characters)
- **Generate**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### SESSION_SECRET
- **Description**: Secret key for session encryption
- **Security**: Change this in production
- **Recommendation**: Use a strong random string (min 32 characters)
- **Generate**: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## MongoDB Setup

### Local MongoDB
```bash
# Install MongoDB Community Edition
# https://docs.mongodb.com/manual/installation/

# Start MongoDB
mongod

# Verify connection
mongo
```

### MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update MONGODB_URI in .env

### Docker MongoDB
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

## File Upload Configuration

### Upload Directory
- Location: `public/uploads/`
- Permissions: Read/Write
- Max file size: 5MB (configurable in routes)

### Supported File Types
- Images: jpg, jpeg, png, gif, webp

### Configuration in routes
```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});
```

## Session Configuration

### Session Store
- Type: MongoDB (connect-mongo)
- Collection: sessions
- TTL: 7 days (604800 seconds)

### Cookie Settings
```javascript
cookie: {
  secure: false,        // Set to true in production with HTTPS
  httpOnly: true,       // Prevents client-side JS from accessing
  maxAge: 1000 * 60 * 60 * 24 * 7  // 7 days
}
```

## Production Deployment

### Environment Variables
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/smart-hotel-management
JWT_SECRET=<generate-strong-secret>
SESSION_SECRET=<generate-strong-secret>
```

### Security Checklist
- [ ] Change JWT_SECRET
- [ ] Change SESSION_SECRET
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS (set cookie.secure=true)
- [ ] Use MongoDB Atlas or secure MongoDB instance
- [ ] Enable CORS for specific domains
- [ ] Set up rate limiting
- [ ] Enable HTTPS redirects
- [ ] Set security headers

### HTTPS Configuration
```javascript
// In production, use HTTPS
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(PORT);
```

## Database Indexes

For better performance, create these indexes:

```javascript
// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ hotelId: 1 });

// Hotel indexes
db.hotels.createIndex({ adminId: 1 });

// MenuItem indexes
db.menuitems.createIndex({ hotelId: 1 });
db.menuitems.createIndex({ hotelId: 1, isAvailable: 1 });

// Order indexes
db.orders.createIndex({ hotelId: 1 });
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ orderId: 1 }, { unique: true });
db.orders.createIndex({ createdAt: 1 });

// Room indexes
db.rooms.createIndex({ hotelId: 1 });

// RoomBooking indexes
db.roombookings.createIndex({ hotelId: 1 });
db.roombookings.createIndex({ userId: 1 });
db.roombookings.createIndex({ roomId: 1 });
```

## Logging Configuration

### Development Logging
```javascript
// Add to server.js for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
```

### Production Logging
```javascript
// Use a logging library like winston
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## CORS Configuration

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

## Email Configuration (Optional)

For email notifications:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## Backup & Recovery

### MongoDB Backup
```bash
# Backup
mongodump --uri "mongodb://localhost:27017/smart-hotel-management" --out ./backup

# Restore
mongorestore --uri "mongodb://localhost:27017/smart-hotel-management" ./backup
```

## Performance Optimization

### Caching
```javascript
// Add Redis for caching
const redis = require('redis');
const client = redis.createClient();
```

### Database Query Optimization
- Use indexes
- Limit fields in queries
- Use pagination
- Avoid N+1 queries

### Frontend Optimization
- Minify CSS/JS
- Compress images
- Use CDN for static files
- Enable gzip compression

## Monitoring

### Health Check Endpoint
```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});
```

### Error Tracking
```javascript
// Use Sentry for error tracking
const Sentry = require("@sentry/node");

Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.errorHandler());
```

## Troubleshooting

### Connection Issues
- Check MongoDB is running
- Verify MONGODB_URI
- Check network connectivity
- Review firewall settings

### Authentication Issues
- Verify JWT_SECRET is set
- Check session configuration
- Clear browser cookies
- Check token expiration

### File Upload Issues
- Verify uploads directory exists
- Check file permissions
- Verify file size limits
- Check MIME types

## Support

For configuration issues, refer to:
- README.md - General documentation
- QUICKSTART.md - Quick setup guide
- Individual service documentation
