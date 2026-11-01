// Vercel serverless entry point for the FoodBridge API.
//
// This file is intentionally CommonJS so Vercel loads it whatever the package
// "type" is; it loads the ESM Express app with a dynamic import.
//
// Required environment variables (Vercel -> Settings -> Environment Variables):
//   MONGO_URI     MongoDB Atlas connection string (mongodb+srv://...)
//   JWT_SECRET    32+ character random secret (the API refuses to boot without it)
//   CLIENT_URL    allowed frontend origin(s), comma separated
//   ADMIN_EMAIL / ADMIN_PASSWORD / SETUP_TOKEN   optional one-time admin bootstrap
process.env.VERCEL = process.env.VERCEL || '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

let appPromise;

module.exports = async function handler(req, res) {
  try {
    if (!appPromise) appPromise = import('../backend/src/server.js').then((m) => m.default);
    const app = await appPromise;
    return app(req, res);
  } catch (e) {
    console.error('FoodBridge function failed to start:', e && e.stack ? e.stack : e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'API failed to start. Check MONGO_URI and JWT_SECRET in the deployment environment.' }));
  }
};
