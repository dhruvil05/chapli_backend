require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require('ioredis');
const { rateLimit }  = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const errorHandler = require('./middleware/errorHandler');
const router = require('./routes/auth-service');



const app = express();
const PORT = process.env.PORT || 3001;

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
    handler: (req, res)=>{
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
app.use('/api/auth', router);




// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})


// Unhandled promis rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});