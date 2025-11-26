# Environment Configuration Setup

This project uses environment variables to configure API endpoints for different environments.

## Frontend Environment Variables

### Development
Create a `.env.development` file in the `new-frontend` directory:

```env
VITE_API_URL=http://localhost:8000
```

### Production
Create a `.env.production` file in the `new-frontend` directory:

```env
VITE_API_URL=http://34.83.37.61:8000
```

## How It Works

- Vite automatically loads `.env.development` when running `npm run dev`
- Vite automatically loads `.env.production` when running `npm run build`
- The `src/config.ts` file reads `VITE_API_URL` from the environment
- If `VITE_API_URL` is not set, it falls back to:
  - `http://34.83.37.61:8000` in production mode
  - `http://localhost:8000` in development mode

## Backend CORS Configuration

The backend CORS is configured in `backend/app/main.py` and `backend/app/core/config.py`.

For production, you may need to set the `BACKEND_CORS_ORIGINS` environment variable in your backend `.env` file to include your production frontend URL:

```env
BACKEND_CORS_ORIGINS=http://localhost:5173,http://your-production-frontend-domain.com
```

Or set `FRONTEND_HOST`:

```env
FRONTEND_HOST=http://your-production-frontend-domain.com
```

## Quick Setup

1. **Development**: Create `.env.development` with `VITE_API_URL=http://localhost:8000`
2. **Production**: Create `.env.production` with `VITE_API_URL=http://34.83.37.61:8000`
3. Ensure backend CORS allows your frontend origin

Note: `.env` files are gitignored, so you'll need to create them locally or in your deployment environment.

