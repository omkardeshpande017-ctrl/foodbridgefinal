// End-to-end API test for FoodBridge.
//   node backend/test/smoke.js                          -> http://localhost:5001/api
//   node backend/test/smoke.js https://site/api         -> a deployed instance
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... node backend/test/smoke.js  (optional admin checks)
const base = process.argv[2] || 'http://localhost:5001/api';

let pass = 0;
const failures = [];

const ok = (name, cond, extra = '') => {
  if (cond) {
    pass += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(name);
    console.log(`  ✗ ${name} ${extra}`);
  }
};

const call = async (method, path, { token, body } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
};

const stamp = Date.now();
const password = 'TestPassword123!';

const register = async (name, role) => {
  const email = `${role}.${stamp}@foodbridge.test`;
  const res = await call('POST', '/auth/register', {
    body: { name, email, password, role, location: 'Pune', organization: `${name} Org` }
  });
  return { email, ...res };
};

(async () => {
  console.log(`\nFoodBridge API test — ${base}\n`);

  console.log('Health');
  const health = await call('GET', '/health');
  ok('health endpoint', health.status === 200 && health.data?.status === 'ok');
  if (health.data?.database) console.log(`  · database: ${health.data.database}`);

  console.log('\nRegistration');
  const donor = await register('Test Donor', 'donor');
  const ngo = await register('Test NGO', 'ngo');
  const volunteer = await register('Test Volunteer', 'volunteer');
  ok('donor registered', donor.status === 201 && !!donor.data?.token);
  ok('ngo registered', ngo.status === 201 && !!ngo.data?.token);
  ok('volunteer registered', volunteer.status === 201 && !!volunteer.data?.token);

  const escalate = await call('POST', '/auth/register', {
    body: { name: 'Hacker', email: `admin.${stamp}@foodbridge.test`, password, role: 'admin' }
  });
  ok('admin self-registration rejected', escalate.status === 400);

  console.log('\nLogin');
  const badLogin = await call('POST', '/auth/login', { body: { email: donor.email, password: 'wrong' } });
  ok('wrong password rejected', badLogin.status === 401);
  const goodLogin = await call('POST', '/auth/login', { body: { email: donor.email, password } });
  ok('correct password accepted', goodLogin.status === 200 && !!goodLogin.data?.token);
  ok('role comes from the database', goodLogin.data?.user?.role === 'donor');
  const noAuth = await call('GET', '/donations');
  ok('protected route needs a token', noAuth.status === 401);

  const donorToken = donor.data.token;
  const ngoToken = ngo.data.token;
  const volunteerToken = volunteer.data.token;
  const volunteerId = volunteer.data.user.id;

  console.log('\nDonations');
  const created = await call('POST', '/donations', {
    token: donorToken,
    body: {
      foodName: 'Automated Test Meals',
      category: 'Cooked Meals',
      quantity: 20,
      unit: 'kg',
      pickupLocation: 'Kothrud, Pune',
      pickupDate: new Date().toISOString().slice(0, 10),
      pickupTime: '12:30',
      description: 'Created by the automated test suite'
    }
  });
  ok('donor creates a donation', created.status === 201 && created.data?.status === 'available');
  const donationId = created.data?._id;

  const ngoCreates = await call('POST', '/donations', {
    token: ngoToken,
    body: { foodName: 'Should fail', quantity: 5, pickupLocation: 'X' }
  });
  ok('ngo cannot create a donation', ngoCreates.status === 403);

  const invalid = await call('POST', '/donations', {
    token: donorToken,
    body: { foodName: '', quantity: -3, pickupLocation: '' }
  });
  ok('invalid donation rejected', invalid.status === 400);

  const donorList = await call('GET', '/donations', { token: donorToken });
  ok('donor sees their donation', donorList.data?.some((d) => d._id === donationId));

  const donorAccepts = await call('POST', `/donations/${donationId}/accept`, { token: donorToken });
  ok('donor cannot accept a donation', donorAccepts.status === 403);

  const accepted = await call('POST', `/donations/${donationId}/accept`, { token: ngoToken });
  ok('ngo accepts the donation', accepted.status === 200 && accepted.data?.status === 'accepted');
  ok('accepting records the NGO', !!accepted.data?.ngoId);

  const doubleAccept = await call('POST', `/donations/${donationId}/accept`, { token: ngoToken });
  ok('double acceptance blocked', doubleAccept.status === 409);

  console.log('\nPickup & delivery workflow');
  const delivery = await call('POST', '/deliveries', {
    token: ngoToken,
    body: { donationId, volunteerId, pickup: 'Kothrud, Pune', dropoff: 'NGO Distribution Hub' }
  });
  ok('ngo assigns a volunteer', delivery.status === 201 && !!delivery.data?._id);
  const deliveryId = delivery.data?._id;

  const tasks = await call('GET', '/deliveries', { token: volunteerToken });
  ok('volunteer sees the assigned task', tasks.data?.some((t) => t._id === deliveryId));

  const donorSeesDelivery = await call('PATCH', `/deliveries/${deliveryId}`, {
    token: donorToken,
    body: { status: 'picked_up' }
  });
  ok('donor cannot progress a delivery', donorSeesDelivery.status === 403);

  for (const status of ['picked_up', 'in_transit', 'delivered']) {
    const step = await call('PATCH', `/deliveries/${deliveryId}`, { token: volunteerToken, body: { status } });
    ok(`volunteer moves delivery to ${status}`, step.status === 200 && step.data?.status === status);
  }

  const delivered = await call('GET', '/donations?status=delivered', { token: donorToken });
  ok('donation follows the delivery to delivered', delivered.data?.some((d) => d._id === donationId));

  const notifications = await call('GET', '/notifications', { token: donorToken });
  ok('donor received notifications', (notifications.data?.length || 0) >= 2);

  console.log('\nAnalytics & reports');
  const summary = await call('GET', '/analytics/summary', { token: donorToken });
  ok('summary returns real totals', summary.status === 200 && summary.data?.completed >= 1);
  const overview = await call('GET', '/analytics/overview', { token: ngoToken });
  ok('overview returns a 7-day trend', overview.data?.trend?.length === 7);
  ok('overview counts the donation', (overview.data?.donations || 0) >= 1);
  const insights = await call('GET', '/ai/insights', { token: ngoToken });
  ok('insights are data-derived (not demo)', insights.data?.isDemo === false && insights.data?.method === 'rule-based');
  ok('insights include a forecast', insights.data?.forecast?.length === 7);

  console.log('\nProfile & users');
  const me = await call('PATCH', '/users/me', { token: donorToken, body: { phone: '9876543210' } });
  ok('profile update persists', me.status === 200 && me.data?.phone === '9876543210');
  const usersForbidden = await call('GET', '/users', { token: donorToken });
  ok('non-admin cannot list users', usersForbidden.status === 403);

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    console.log('\nAdmin');
    const adminLogin = await call('POST', '/auth/login', {
      body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }
    });
    ok('admin login', adminLogin.status === 200 && adminLogin.data?.user?.role === 'admin');
    if (adminLogin.data?.token) {
      const adminUsers = await call('GET', '/users', { token: adminLogin.data.token });
      ok('admin lists users', adminUsers.status === 200 && Array.isArray(adminUsers.data));
      const reports = await call('GET', '/reports/summary', { token: adminLogin.data.token });
      ok('admin reads reports', reports.status === 200 && typeof reports.data?.donations === 'number');
    }
  }

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('Failed:', failures.join(' | '));
    process.exit(1);
  }
  console.log('All checks passed.\n');
})();
