require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const errorHandler = require('./middleware/errorHandler');
const authroute = require('./routes/auth-service');
const chatroute = require('./routes/messages');
const grouproute = require('./routes/groups');
const userroute = require('./routes/users');
const { Server } = require("socket.io");
const http = require('http');
const { setupSocket } = require('./sockets/socketHandler');


const app = express();
// ✅ Add this line BEFORE any middleware like rate limiter
app.set('trust proxy', true);
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);


// Initialize Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_ENDPOINT || "http://localhost:5173"
            || "*", // Vite frontend port
        methods: ["GET", "POST"],
        credentials: true,
    }
});

// Setup socket handlers from the module
setupSocket(io);


// connection to database
mongoose
    .connect(process.env.DB_URL)
    .then(() => logger.info("Connected to database"))
    .catch((err) => logger.error("Database connection error", err));


const redisClient = new Redis(process.env.REDIS_URL);


// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);

    next();
});


// DDos Protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rate_limiter',
    points: 10,
    duration: 1,
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => {
            next();
        })
        .catch(() => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
            res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later.'
            });
        });
});

// IP based rate limiting for sensitive endpoint
const sensitiveRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endppoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
        });
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
});

// Apply rate limiting to sensitive endpoint
app.use('/api/auth/register', sensitiveRateLimiter);

// Routes
app.use('/api/auth', authroute);
app.use('/api/chat', chatroute);
app.use('/api/group', grouproute);
app.use('/api/users', userroute);
app.get('/api/check', (req, res) => {
    return res.json({
        success: true,
        message: "test checked"
    })
})
// Error handling middleware
app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})


// Unhandled promis rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Make io accessible to route handlers if needed
app.set('io', io);
