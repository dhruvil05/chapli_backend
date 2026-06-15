# Chapli Backend

A real-time chat application backend built with Node.js, Express, and Socket.io. Features JWT authentication, MongoDB for data persistence, Redis for caching, and WebSocket support for instant messaging.

## Features

- **Real-time Messaging**: Socket.io for instant message delivery
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **User Management**: Create, update, and manage user profiles
- **Group Chats**: Support for group conversations
- **Rate Limiting**: Redis-based rate limiting to prevent abuse
- **Security**: Helmet for HTTP headers, CORS configuration, password hashing with Argon2
- **Logging**: Winston logger for comprehensive application logging
- **Input Validation**: Joi schema validation for request data

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MongoDB with Mongoose
- **Cache**: Redis with ioredis
- **Real-time**: Socket.io v4.8.1
- **Authentication**: JWT with jsonwebtoken
- **Password Hashing**: Argon2
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Validation**: Joi
- **Development**: Nodemon for auto-reload

## Prerequisites

Before running the project, ensure you have installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **MongoDB** (v4.0+) - [Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas (cloud)
- **Redis** (v6.0+) - [Download](https://redis.io/download) or use Redis Cloud

## Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file**:
   ```bash
   cp .env.example .env
   ```
   (Or create a `.env` file manually with the required variables below)

## Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_URL=mongodb://localhost:27017/chapli
# For MongoDB Atlas:
# DB_URL=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority&appName=Chapli

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIREIN=6h

# Frontend Configuration
FRONTEND_ENDPOINT=http://localhost:5173
```

### Environment Variables Explanation

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment type | `development`, `production` |
| `DB_URL` | MongoDB connection string | `mongodb://localhost:27017/chapli` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for JWT signing | Any strong random string |
| `JWT_EXPIREIN` | JWT token expiration time | `6h`, `24h`, `7d` |
| `FRONTEND_ENDPOINT` | Frontend URL for CORS | `http://localhost:5173` |

## Running the Project

### Development Mode (with auto-reload)

```bash
npm run dev
```

The server will start on `http://localhost:3000` and automatically reload when you save files.

### Production Mode

```bash
npm start
```

## Project Structure

```
backend/
├── src/
│   ├── constants.js              # Application constants
│   ├── server.js                 # Express server setup
│   ├── controllers/              # Business logic
│   │   ├── authController.js     # Authentication endpoints
│   │   ├── chatController.js     # Chat/message endpoints
│   │   ├── groupController.js    # Group management endpoints
│   │   └── userController.js     # User management endpoints
│   ├── middleware/               # Express middleware
│   │   ├── authMiddleware.js     # JWT verification
│   │   └── errorHandler.js       # Global error handling
│   ├── models/                   # MongoDB schemas
│   │   ├── Group.js              # Group schema
│   │   ├── Message.js            # Message schema
│   │   ├── RefreshToken.js       # Refresh token schema
│   │   └── User.js               # User schema
│   ├── routes/                   # API routes
│   │   ├── auth-service.js       # Authentication routes
│   │   ├── groups.js             # Group routes
│   │   ├── messages.js           # Message routes
│   │   └── users.js              # User routes
│   ├── sockets/                  # WebSocket handlers
│   │   └── socketHandler.js      # Socket.io event handlers
│   └── utils/                    # Utility functions
│       ├── generateToken.js      # JWT token generation
│       ├── logger.js             # Winston logger setup
│       └── validation.js         # Data validation schemas
├── .env                          # Environment variables
├── package.json                  # Dependencies
└── README.md                     # This file
```

## API Endpoints

### Authentication Routes (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `POST /refresh-token` - Refresh JWT token
- `POST /logout` - Logout user

### User Routes (`/api/users`)
- `GET /` - Get all users
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user profile
- `DELETE /:id` - Delete user account

### Message Routes (`/api/messages`)
- `GET /` - Get all messages
- `POST /` - Create new message
- `GET /:id` - Get message by ID

### Group Routes (`/api/groups`)
- `GET /` - Get all groups
- `POST /` - Create new group
- `PUT /:id` - Update group
- `DELETE /:id` - Delete group

## WebSocket Events

### Client → Server
- `connect` - User connects
- `send_message` - Send a message
- `join_group` - Join a group
- `leave_group` - Leave a group
- `typing` - User is typing

### Server → Client
- `receive_message` - Receive a message
- `user_joined` - User joined group
- `user_left` - User left group
- `user_typing` - User is typing

## Database Setup

### MongoDB Local Setup

**Windows:**
1. Download MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install using the installer
3. MongoDB will run as a Windows service automatically
4. Connect to `mongodb://localhost:27017`

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### Redis Setup

**Windows:**
1. Download from [redis.io](https://redis.io/download)
2. Or use Windows Subsystem for Linux (WSL)
3. Default: `redis://localhost:6379`

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
```

## Debugging

Check logs in the following files:
- `combined.log` - All logs
- `error.log` - Error logs only

## Common Issues

### Cannot connect to MongoDB
- Ensure MongoDB is running
- Check `DB_URL` in `.env`
- Verify network connectivity

### Cannot connect to Redis
- Ensure Redis is running
- Check `REDIS_URL` in `.env`
- Verify Redis is accessible on the specified port

### CORS errors
- Update `FRONTEND_ENDPOINT` in `.env` to match your frontend URL
- Ensure the frontend makes requests to the correct backend URL

### Port already in use
- Change `PORT` in `.env` to an available port
- Or stop the process using the current port

## Development Tips

1. **Use Postman or Insomnia** to test API endpoints
2. **Monitor logs** with `tail -f combined.log`
3. **Set JWT_SECRET** to a strong, random string in production
4. **Enable rate limiting** on sensitive endpoints
5. **Use HTTPS** in production (configure with a reverse proxy like Nginx)

## Deployment

### Vercel Deployment
The project includes a `vercel.json` configuration file for easy deployment to Vercel. See Vercel's Node.js documentation for more details.

### Environment Variables for Production
When deploying, ensure all environment variables are set in your hosting platform's configuration dashboard.

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

ISC

## Author

HZ!

---

For issues, questions, or contributions, please reach out to the development team.
