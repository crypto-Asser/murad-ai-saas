# Murad AI SaaS - Deployment Guide

## Overview

Murad AI is a production-grade AI Telegram bot with advanced analytics and management dashboard. This guide covers deployment to Railway, Render, or any other hosting platform.

## Prerequisites

- Node.js 22+
- MySQL 8.0+
- Telegram Bot Token (from BotFather)
- Groq API Key (from console.groq.com)

## Local Development

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd murad-ai-saas
pnpm install
```

### 2. Set Environment Variables

Create a `.env` file:

```bash
DATABASE_URL=mysql://user:password@localhost:3306/murad_ai
TELEGRAM_TOKEN=your_telegram_token
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_jwt_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your_website_id
NODE_ENV=development
PORT=3000
```

### 3. Run with Docker Compose

```bash
docker-compose up
```

This will start MySQL and the application on `http://localhost:3000`.

### 4. Development Commands

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Start production server
pnpm start

# Generate database migrations
pnpm drizzle-kit generate
```

## Deployment to Railway

### 1. Connect Repository

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository

### 2. Add MySQL Service

1. Click "Add Service"
2. Select "MySQL"
3. Railway will automatically set `DATABASE_URL`

### 3. Configure Environment Variables

In Railway dashboard, add:

```
TELEGRAM_TOKEN=your_token
GROQ_API_KEY=your_key
JWT_SECRET=your_secret
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/oauth
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your_key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your_key
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your_website_id
NODE_ENV=production
```

### 4. Deploy

Railway automatically deploys on push to main branch.

## Deployment to Render

### 1. Create Web Service

1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect your GitHub repository

### 2. Configure Build & Start Commands

- **Build Command:** `pnpm install && pnpm build`
- **Start Command:** `pnpm start`

### 3. Add Environment Variables

Add all variables from the Railway section above.

### 4. Add MySQL Database

1. Create a new "MySQL" database service
2. Copy the connection string
3. Set as `DATABASE_URL` in web service

### 5. Deploy

Render automatically deploys on push.

## Database Migrations

### Generate Migration

```bash
pnpm drizzle-kit generate
```

This creates SQL files in `drizzle/` directory.

### Apply Migration

The migrations are automatically applied on startup. To manually apply:

```bash
pnpm drizzle-kit migrate
```

## Monitoring & Logs

### Railway

- View logs in Railway dashboard
- Use Railway CLI: `railway logs`

### Render

- View logs in Render dashboard
- Use Render CLI: `render logs`

## Health Checks

The application exposes a health check endpoint:

```
GET /api/health
```

Returns `200 OK` if the service is healthy.

## Admin Dashboard

Access the admin dashboard at:

```
https://your-domain.com/admin/dashboard
```

**Features:**
- Real-time bot statistics
- User management
- System monitoring
- Error tracking
- Performance metrics

## Telegram Bot Commands

The bot responds to:

- **Text messages** - AI-powered responses using Groq
- **Voice messages** - Speech-to-text transcription (coming soon)
- **Web search** - Automatic search enrichment (coming soon)

## Performance Optimization

### Async Architecture

- 100% async/await implementation
- Non-blocking I/O operations
- Efficient request queuing

### Caching

- Message history caching per user
- Smart memory trimming (last 10 messages)
- Database query optimization

### Rate Limiting

- 2-second minimum between user messages
- Per-user request throttling
- Queue-based processing

## Troubleshooting

### Bot Not Responding

1. Check `TELEGRAM_TOKEN` is correct
2. Verify bot is running: `GET /api/health`
3. Check logs for errors

### Groq API Errors

1. Verify `GROQ_API_KEY` is valid
2. Check Groq console for rate limits
3. Ensure API key has permissions

### Database Connection Issues

1. Verify `DATABASE_URL` format
2. Check MySQL service is running
3. Ensure database exists

### High Memory Usage

1. Check for memory leaks in logs
2. Restart the service
3. Increase container memory limits

## Security Best Practices

1. **Never commit `.env` files**
2. **Rotate API keys regularly**
3. **Use HTTPS only**
4. **Enable database SSL**
5. **Implement rate limiting**
6. **Monitor error logs**

## Support

For issues or questions:

1. Check logs: `pnpm dev` (local) or dashboard (production)
2. Review error tracking in admin dashboard
3. Check Groq API status
4. Verify Telegram bot settings

## License

MIT
