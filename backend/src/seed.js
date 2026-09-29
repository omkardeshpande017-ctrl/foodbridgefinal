import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Donation from './models/Donation.js';
import Notification from './models/Notification.js';

await connectDB();

await User.deleteMany({});
await Donation.deleteMany({});
await Notification.deleteMany({});

const DEMO_PASSWORD = 'password123';
const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

const users = await User.insertMany([
  {
    name: 'Aarav Donor',
    email: 'donor@foodbridge.app',
    passwordHash,
    role: 'donor',
    phone: '9000000001',
    location: 'Pune',
    organization: 'GreenPlate Foods',
  },
  {
    name: 'Sahyog NGO',
    email: 'ngo@foodbridge.app',
    passwordHash,
    role: 'ngo',
    phone: '9000000002',
    location: 'Pune',
    organization: 'Sahyog Foundation',
  },
  {
    name: 'Rohan Volunteer',
    email: 'volunteer@foodbridge.app',
    passwordHash,
    role: 'volunteer',
    phone: '9000000003',
    location: 'Pune',
  },
  {
    name: 'FoodBridge Admin',
    email: 'admin@foodbridge.app',
    passwordHash,
    role: 'admin',
    phone: '9000000004',
    location: 'Pune',
  },
]);

const [donor, ngo, vol] = users;

const ds = await Donation.insertMany([
  {
    foodName: 'Fresh Cooked Rice & Dal',
    category: 'Cooked Meals',
    quantity: 80,
    unit: 'kg',
    description: 'Fresh surplus lunch portions',
    pickupLocation: 'Kothrud, Pune',
    pickupDate: '2026-09-24',
    pickupTime: '13:00',
    status: 'available',
    donorId: donor._id,
    peopleServed: 160,
    co2Saved: 80,
  },
  {
    foodName: 'Bread & Bakery Packs',
    category: 'Bakery',
    quantity: 45,
    unit: 'kg',
    description: 'Packaged bakery surplus',
    pickupLocation: 'Shivajinagar, Pune',
    pickupDate: '2026-09-24',
    pickupTime: '16:00',
    status: 'accepted',
    donorId: donor._id,
    ngoId: ngo._id,
    peopleServed: 90,
    co2Saved: 45,
  },
  {
    foodName: 'Vegetable Boxes',
    category: 'Vegetables',
    quantity: 120,
    unit: 'kg',
    description: 'Fresh vegetables for distribution',
    pickupLocation: 'Wakad, Pune',
    pickupDate: '2026-09-25',
    pickupTime: '10:00',
    status: 'delivered',
    donorId: donor._id,
    ngoId: ngo._id,
    volunteerId: vol._id,
    peopleServed: 240,
    co2Saved: 120,
  },
]);

await Notification.insertMany([
  {
    userId: donor._id,
    title: 'Welcome to FoodBridge',
    message: 'Your donation dashboard is ready.',
    type: 'success',
  },
  {
    userId: ngo._id,
    title: 'New donation nearby',
    message: 'Fresh cooked meals are available in Kothrud.',
    type: 'info',
  },
  {
    userId: vol._id,
    title: 'Delivery task',
    message: 'A delivery workflow is ready for pickup.',
    type: 'info',
  },
]);

console.log(`Seeded ${users.length} users and ${ds.length} donations`);
console.log('Demo login: admin@foodbridge.app / password123');
console.log('Demo login: donor@foodbridge.app / password123');
console.log('Demo login: ngo@foodbridge.app / password123');
console.log('Demo login: volunteer@foodbridge.app / password123');

process.exit(0);