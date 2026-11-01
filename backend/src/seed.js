import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';

// ---------------------------------------------------------------------------
// Administrator provisioning — exactly ONE primary administrator.
//
// There is no public admin registration and no hardcoded admin password. The
// single primary administrator is created/synchronised from ADMIN_EMAIL and
// ADMIN_PASSWORD in the environment. Any other account that holds the admin
// role (for example a legacy second admin) is demoted to `donor` so the
// platform can never end up with two primary administrators.
// ---------------------------------------------------------------------------
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';

if (!email.includes('@') || password.length < 12) {
  console.error(
    'Setup required: set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in the environment before running the seed script.'
  );
  process.exit(1);
}

const connected = await connectDB();
if (!connected) {
  console.error('MongoDB is required. Set MONGO_URI and retry.');
  process.exit(1);
}

// Demote any admin that is not the configured primary administrator.
const demoted = await User.updateMany(
  { role: 'admin', email: { $ne: email } },
  { $set: { role: 'donor' } }
);
if (demoted.modifiedCount) {
  console.log(`Demoted ${demoted.modifiedCount} non-primary administrator account(s) to donor.`);
}

const passwordHash = await bcrypt.hash(password, 12);
let admin = await User.findOne({ email }).select('+passwordHash');

if (!admin) {
  admin = await User.create({
    name: 'FoodBridge Administrator',
    email,
    passwordHash,
    role: 'admin',
    status: 'active',
    verification: { status: 'not_required' }
  });
  console.log(`Primary administrator provisioned: ${admin.email}`);
} else {
  admin.name = 'FoodBridge Administrator';
  admin.passwordHash = passwordHash;
  admin.role = 'admin';
  admin.status = 'active';
  admin.verification = { status: 'not_required' };
  await admin.save();
  console.log(`Primary administrator synchronised: ${admin.email}`);
}

const admins = await User.countDocuments({ role: 'admin' });
console.log(`Administrator accounts on the platform: ${admins}. The password is read from the environment and is never printed.`);

// Sample/demo records are intentionally NOT supported. A production database
// must contain only real registrations and donations. The automated suites in
// backend/test/*.js create their own fixtures against a disposable database.

process.exit(0);
