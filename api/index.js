// Vercel serverless entry point for the FoodBridge API.
//
// The whole Express application lives in ../backend/src/server.js and exports
// `default app`, so the exact same code serves local development
// (`npm run backend`) and production (/api/* on Vercel).
//
// Required environment variables (Vercel -> Project -> Settings -> Environment
// Variables, or the equivalent on any other host):
//   MONGO_URI     MongoDB Atlas connection string
//   JWT_SECRET    32+ character random secret (no default: the API refuses to boot without it)
//   CLIENT_URL    allowed frontend origin(s), comma separated
//   ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN2_EMAIL / ADMIN2_PASSWORD  used by the seed script only
process.env.VERCEL = process.env.VERCEL || '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const { default: app } = await import('../backend/src/server.js');

export default app;
