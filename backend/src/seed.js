import 'dotenv/config';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Donation from './models/Donation.js';
import Notification from './models/Notification.js';

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
  if (!user) user = await User.create({ name, email: normalizedEmail, passwordHash, role, location, organization, status: 'active' });
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

const demoUsers = [];
if (process.env.SEED_SAMPLE_USERS === 'true') {
  const definitions = [
    { name: 'Food Donor', email: 'donor.local@foodbridge.test', role: 'donor', organization: 'Local Donor Partner' },
    { name: 'NGO Partner', email: 'ngo.local@foodbridge.test', role: 'ngo', organization: 'Community Food Support' },
    { name: 'Volunteer Partner', email: 'volunteer.local@foodbridge.test', role: 'volunteer', organization: '' }
  ];
  for (const def of definitions) {
    let existing = await User.findOne({ email: def.email });
    if (!existing) {
      const password = randomPassword();
      existing = await upsertUser({ ...def, password, location: 'Pune' });
      demoUsers.push({ email: def.email, password, role: def.role });
    }
  }
  if (demoUsers.length) {
    console.log('New local sample account credentials (copy now; passwords are not stored in this script):');
    for (const user of demoUsers) console.log(`${user.role || 'User'} | ${user.email} | ${user.password}`);
    console.log('Rotate these temporary local credentials before any shared or public deployment.');
  } else console.log('Sample users already exist; no passwords were reset.');
}

if (process.env.SEED_SAMPLE_DATA === 'true') {
  const donor = await User.findOne({ email: 'donor.local@foodbridge.test' });
  const ngo = await User.findOne({ email: 'ngo.local@foodbridge.test' });
  const volunteer = await User.findOne({ email: 'volunteer.local@foodbridge.test' });
  if (!donor || !ngo || !volunteer) console.warn('Sample data skipped: set SEED_SAMPLE_USERS=true and seed again to create sample users first.');
  else if (await Donation.countDocuments() === 0) {
    const docs = await Donation.insertMany([
      { foodName: 'Fresh Cooked Rice & Dal', category: 'Cooked Meals', quantity: 80, unit: 'kg', description: 'Sample record — replace with a real donation before reporting impact.', pickupLocation: 'Kothrud, Pune', pickupDate: '2026-10-29', pickupTime: '13:00', status: 'available', donorId: donor._id, peopleServed: 160, co2Saved: 80 },
      { foodName: 'Bread & Bakery Packs', category: 'Bakery', quantity: 45, unit: 'kg', description: 'Sample record — replace with a real donation before reporting impact.', pickupLocation: 'Shivajinagar, Pune', pickupDate: '2026-10-29', pickupTime: '16:00', status: 'accepted', donorId: donor._id, ngoId: ngo._id, peopleServed: 90, co2Saved: 45 },
      { foodName: 'Vegetable Boxes', category: 'Vegetables', quantity: 120, unit: 'kg', description: 'Sample record — replace with a real donation before reporting impact.', pickupLocation: 'Wakad, Pune', pickupDate: '2026-10-30', pickupTime: '10:00', status: 'delivered', donorId: donor._id, ngoId: ngo._id, volunteerId: volunteer._id, peopleServed: 240, co2Saved: 120 }
    ]);
    await Notification.insertMany([{ userId: donor._id, title: 'Welcome to FoodBridge', message: 'Your donor workspace is ready.', type: 'success' }, { userId: ngo._id, title: 'Sample nearby donation', message: 'Review available sample donation records.', type: 'info' }, { userId: volunteer._id, title: 'Sample delivery workflow', message: 'Review the pickup and delivery workflow.', type: 'info' }]);
    console.log(`Inserted ${docs.length} sample donations. Clearly marked as sample records in descriptions.`);
  } else console.log('Donation collection already has records; sample data was not duplicated.');
}
process.exit(0);
