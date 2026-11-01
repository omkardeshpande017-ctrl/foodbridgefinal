// Complete end-to-end user journey against a real API + database.
//   node backend/test/journey.js                        -> http://localhost:5001/api
//   node backend/test/journey.js https://host/api       -> a deployed instance
// Requires ADMIN_EMAIL / ADMIN_PASSWORD for the admin and NGO-verification steps.
const base = process.argv[2] || 'http://localhost:5001/api';
const stamp = Date.now();
const password = 'JourneyPassword123!';
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
  const res = await fetch(`${base}${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
};

const register = async (role, extra = {}) => {
  const email = `${role}.${stamp}@journey.test`;
  const res = await call('POST', '/auth/register', {
    body: { name: `Journey ${role}`, email, password, role, location: 'Pune', organization: `${role} org`, ...extra }
  });
  return { email, ...res };
};

(async () => {
  console.log(`\nFoodBridge end-to-end journey — ${base}\n`);

  console.log('1. Registration and login');
  const donor = await register('donor');
  const ngo = await register('ngo', { organization: 'Journey NGO' });
  const volunteer = await register('volunteer');
  ok('donor registers', donor.status === 201);
  ok('ngo registers (pending verification)', ngo.status === 201 && ngo.data?.user?.verification === 'pending');
  ok('volunteer registers', volunteer.status === 201);

  const adminLogin = process.env.ADMIN_EMAIL
    ? await call('POST', '/auth/login', { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } })
    : { data: null };
  const adminToken = adminLogin.data?.token;
  ok('administrator signs in', !!adminToken);
  if (!adminToken) {
    console.log('\nADMIN_EMAIL / ADMIN_PASSWORD are required for the full journey.');
    process.exit(1);
  }

  console.log('\n2. Admin verifies the NGO');
  const verify = await call('PATCH', `/users/${ngo.data.user.id}/verification`, { token: adminToken, body: { status: 'verified' } });
  ok('admin verifies the NGO', verify.status === 200 && verify.data?.verification?.status === 'verified');

  console.log('\n3. Donor creates a donation');
  const created = await call('POST', '/donations', {
    token: donor.data.token,
    body: {
      foodName: 'Journey Test Meals',
      category: 'Cooked Meals',
      quantity: 30,
      unit: 'kg',
      pickupLocation: 'Kothrud, Pune',
      pickupDate: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10),
      pickupTime: '12:00',
      description: 'End-to-end journey record'
    }
  });
  ok('donation created and available', created.status === 201 && created.data?.status === 'available');
  const donationId = created.data?._id;

  console.log('\n4. NGO finds and accepts the donation');
  const nearby = await call('GET', '/donations?available=true&search=Journey', { token: ngo.data.token });
  ok('ngo finds it through search', (nearby.data?.items || []).some((d) => d._id === donationId));
  const accepted = await call('POST', `/donations/${donationId}/accept`, { token: ngo.data.token });
  ok('ngo accepts it', accepted.status === 200 && accepted.data?.status === 'accepted');

  console.log('\n5. NGO assigns a volunteer');
  const assignment = await call('POST', '/deliveries', {
    token: ngo.data.token,
    body: { donationId, volunteerId: volunteer.data.user.id, pickup: 'Kothrud, Pune', dropoff: 'Journey NGO hub' }
  });
  ok('delivery assigned', assignment.status === 201 && !!assignment.data?._id);
  const deliveryId = assignment.data?._id;

  console.log('\n6. Volunteer completes pickup and delivery');
  const tasks = await call('GET', '/deliveries', { token: volunteer.data.token });
  ok('volunteer sees the assignment', (tasks.data || []).some((t) => t._id === deliveryId));
  for (const status of ['picked_up', 'in_transit', 'delivered']) {
    const step = await call('PATCH', `/deliveries/${deliveryId}`, { token: volunteer.data.token, body: { status } });
    ok(`volunteer marks ${status}`, step.status === 200 && step.data?.status === status);
  }

  console.log('\n7. Donor sees the completed donation');
  const detail = await call('GET', `/donations/${donationId}`, { token: donor.data.token });
  ok('donation is delivered', detail.data?.status === 'delivered');
  const history = detail.data?.history || [];
  ok(
    'history records every transition',
    ['available', 'accepted', 'picked_up', 'in_transit', 'delivered'].every((s) => history.some((h) => h.status === s)),
    JSON.stringify(history.map((h) => h.status))
  );
  ok('pickup and delivery timestamps set', !!detail.data?.pickedUpAt && !!detail.data?.deliveredAt);

  console.log('\n8. Admin sees the complete transaction');
  const adminView = await call('GET', `/donations/${donationId}`, { token: adminToken });
  ok('admin reads the donation', adminView.status === 200 && adminView.data?.status === 'delivered');
  const overview = await call('GET', '/analytics/overview', { token: adminToken });
  ok('overview counts the donation', (overview.data?.donations || 0) >= 1);
  const audit = await call('GET', '/analytics/audit?limit=100', { token: adminToken });
  const actions = (audit.data?.items || []).map((a) => a.action);
  ok('audit trail covers the journey', ['donation.create', 'donation.accept', 'delivery.create', 'delivery.update'].every((a) => actions.includes(a)), actions.slice(0, 8).join(','));

  console.log('\n9. Profile, notifications and logout');
  const profile = await call('PATCH', '/users/me', { token: donor.data.token, body: { phone: '9876500000' } });
  ok('profile update persists', profile.status === 200 && profile.data?.phone === '9876500000');
  const notifications = await call('GET', '/notifications', { token: donor.data.token });
  ok('donor notifications delivered', (notifications.data?.unread || 0) >= 1);
  const tokenAfterLogout = await call('GET', '/users/me', { token: donor.data.token });
  ok('token still valid until expiry (stateless JWT)', tokenAfterLogout.status === 200);

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('Failed:', failures.join(' | '));
    process.exit(1);
  }
  console.log('Full journey passed.\n');
})();
