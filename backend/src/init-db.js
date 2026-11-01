import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDBWithRetry, describeMongoUri } from './config/db.js';

import User from './models/User.js';
import Donation from './models/Donation.js';
import Delivery from './models/Delivery.js';
import Notification from './models/Notification.js';
import AuditLog from './models/AuditLog.js';
import Report from './models/Report.js';
import Setting from './models/Setting.js';

// ---------------------------------------------------------------------------
// Database initialisation.
//
// Creates every collection and index declared in the Mongoose schemas, plus the
// default platform settings document. Safe to run repeatedly: it never drops a
// collection, never deletes a document and never rewrites an existing setting.
//
//   npm run db:init          (or: docker compose exec api node src/init-db.js)
// ---------------------------------------------------------------------------
const MODELS = { User, Donation, Delivery, Notification, AuditLog, Report, Setting };

const connected = await connectDBWithRetry({ attempts: 4, baseDelayMs: 500 });
if (!connected) {
  console.error('Database initialisation failed: no connection to', describeMongoUri());
  process.exit(1);
}

console.log('Connected to', describeMongoUri());
console.log('Database name:', mongoose.connection.name);

// 1. Collections + indexes from the schemas.
for (const [name, model] of Object.entries(MODELS)) {
  await model.createCollection().catch((e) => {
    // 48 = collection already exists; that is the normal path on a re-run.
    if (e.code !== 48 && !/already exists/i.test(e.message)) throw e;
  });
  await model.syncIndexes();
  const indexes = (await model.collection.indexes()).map((i) => i.name);
  console.log(`${name.padEnd(13)} collection ready · ${indexes.length} index(es): ${indexes.join(', ')}`);
}

// 2. Default platform settings, created only when absent.
const defaults = {
  key: 'platform',
  requireNgoVerification: true,
  allowDonorSelfRegistration: true,
  maintenanceMode: false
};
const existing = await Setting.findOne({ key: defaults.key });
if (existing) console.log('Setting        existing platform document left untouched');
else {
  await Setting.create(defaults);
  console.log('Setting        default platform document created');
}

// 3. Report what is in the database now.
const counts = {};
for (const [name, model] of Object.entries(MODELS)) counts[name] = await model.estimatedDocumentCount();
console.log('Documents:', counts);

await mongoose.connection.close();
process.exit(0);
