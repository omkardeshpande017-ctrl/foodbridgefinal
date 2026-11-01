import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';

const adminAccounts = [
  { email: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(), password: process.env.ADMIN_PASSWORD || '', name: 'FoodBridge Administrator 1' },
  { email: (process.env.ADMIN2_EMAIL || '').trim().toLowerCase(), password: process.env.ADMIN2_PASSWORD || '', name: 'FoodBridge Administrator 2' }
];
if (adminAccounts.some(a => !a.email || !a.email.includes('@') || a.password.length < 12) || adminAccounts[0].email === adminAccounts[1].email) {
  console.error('Setup required: configure two different admin emails and unique passwords (at least 12 characters) using ADMIN_EMAIL/ADMIN_PASSWORD and ADMIN2_EMAIL/ADMIN2_PASSWORD in backend/.env.');
  process.exit(1);
}
await connectDB();
// Enforce exactly the two configured administrators; legacy extra admins lose admin privileges.
const allowedAdminEmails = adminAccounts.map(a => a.email);
await User.updateMany({ role: 'admin', email: { $nin: allowedAdminEmails } }, { $set: { role: 'donor' } });
const randomPassword = () => crypto.randomBytes(15).toString('base64url');
const upsertUser = async ({ name, email, password, role, location = 'Pune', organization = '' }) => {
  const normalizedEmail = email.trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });
  const passwordHash = await bcrypt.hash(password, 12);
  if (!user) user = await User.create({ name, email: normalizedEmail, passwordHash, role, location, organization, status: 'active', verification: { status: 'not_required' } });
  else {
    // Only the configured administrator is forcibly synchronized. Existing non-admin passwords and data remain untouched.
    if (role === 'admin') { user.name = name; user.passwordHash = passwordHash; user.role = 'admin'; user.status = 'active'; await user.save(); }
  }
  return user;
};
for (const [index, account] of adminAccounts.entries()) {
  const admin = await upsertUser({ name: account.name, email: account.email, password: account.password, role: 'admin' });
  console.log(`Administrator ${index + 1} provisioned: ${admin.email}`);
}
console.log('Exactly two administrator accounts are configured. Admin passwords are read from backend/.env and are not printed.');

// Sample/demo records are intentionally NOT supported. A production database must
// contain only real registrations and donations. Use the automated test suites
// (backend/test/*.js) for fixtures; they run against a disposable database.

process.exit(0);
