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
      // Pickup must be in the future: a same-day pickup would already be past
      // its expiry instant and the API would (correctly) refuse acceptance.
      pickupDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
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
  ok('donor sees their donation', (donorList.data?.items || []).some((d) => d._id === donationId));

  const donorAccepts = await call('POST', `/donations/${donationId}/accept`, { token: donorToken });
  ok('donor cannot accept a donation', donorAccepts.status === 403);

  const adminLogin0 = process.env.ADMIN_EMAIL
    ? await call('POST', '/auth/login', { body: { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD } })
    : { data: null };
  const adminToken0 = adminLogin0.data?.token;

  if (adminToken0) {
    const verify = await call('PATCH', `/users/${ngo.data.user.id}/verification`, {
      token: adminToken0,
      body: { status: 'verified' }
    });
    ok('admin verifies the NGO', verify.status === 200 && verify.data?.verification?.status === 'verified');
  } else {
    const blocked = await call('POST', `/donations/${donationId}/accept`, { token: ngoToken });
    ok('unverified NGO cannot accept', blocked.status === 403);
    console.log('  · set ADMIN_EMAIL/ADMIN_PASSWORD to run the verification flow');
  }

  const accepted = await call('POST', `/donations/${donationId}/accept`, { token: ngoToken });
  ok('ngo accepts the donation', accepted.status === 200 && accepted.data?.status === 'accepted', JSON.stringify(accepted.data).slice(0, 200));
  ok('accepting records the NGO', !!accepted.data?.ngoId);

  const doubleAccept = await call('POST', `/donations/${donationId}/accept`, { token: ngoToken });
  ok('double acceptance blocked', doubleAccept.status === 409);

  console.log('\nPickup & delivery workflow');
  const delivery = await call('POST', '/deliveries', {
    token: ngoToken,
    body: { donationId, volunteerId, pickup: 'Kothrud, Pune', dropoff: 'NGO Distribution Hub' }
  });
  ok('ngo assigns a volunteer', delivery.status === 201 && !!delivery.data?._id, JSON.stringify(delivery.data).slice(0, 200));
  const deliveryId = delivery.data?._id;

  const tasks = await call('GET', '/deliveries', { token: volunteerToken });
  const taskList = Array.isArray(tasks.data) ? tasks.data : tasks.data?.items || [];
  ok('volunteer sees the assigned task', taskList.some((t) => t._id === deliveryId), JSON.stringify(tasks.data).slice(0, 160));

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
  ok('donation follows the delivery to delivered', (delivered.data?.items || []).some((d) => d._id === donationId));

  const notifications = await call('GET', '/notifications', { token: donorToken });
  ok('donor received notifications', (notifications.data?.items?.length || 0) >= 2);

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
      ok('admin lists users', adminUsers.status === 200 && Array.isArray(adminUsers.data?.items));
      const reports = await call('GET', '/reports/summary', { token: adminLogin.data.token });
      ok('admin reads reports', reports.status === 200 && typeof reports.data?.donations === 'number');
    }
  }

  console.log('\nLifecycle, history & pagination');
  const withHistory = await call('GET', `/donations/${donationId}`, { token: donorToken });
  const hist = withHistory.data?.history || [];
  ok('status history recorded', hist.length >= 4 && hist.some((h) => h.status === 'delivered'));
  ok('timestamps recorded on delivery', !!withHistory.data?.deliveredAt);

  const page = await call('GET', '/donations?limit=2&page=1', { token: donorToken });
  ok('pagination metadata returned', page.data?.limit === 2 && typeof page.data?.pages === 'number');

  const edit = await call('PATCH', `/donations/${donationId}`, { token: donorToken, body: { foodName: 'Edited after delivery' } });
  ok('delivered donation cannot be edited', edit.status === 409);

  const newDonation = await call('POST', '/donations', {
    token: donorToken,
    body: { foodName: 'Editable meal', quantity: 5, unit: 'kg', pickupLocation: 'Kothrud' }
  });
  const edited = await call('PATCH', `/donations/${newDonation.data._id}`, { token: donorToken, body: { quantity: 9 } });
  ok('donation can be edited while available', edited.status === 200 && edited.data?.quantity === 9);
  const cancelled = await call('PATCH', `/donations/${newDonation.data._id}/status`, { token: donorToken, body: { status: 'cancelled' } });
  ok('donor cancels their donation', cancelled.status === 200 && cancelled.data?.status === 'cancelled');

  const expired = await call('POST', '/donations', {
    token: donorToken,
    body: { foodName: 'Past expiry', quantity: 3, pickupLocation: 'Kothrud', expiryTime: '2020-01-01T10:00' }
  });
  ok('past expiry rejected', expired.status === 400);

  console.log('\nPassword management');
  const changed = await call('POST', '/auth/change-password', {
    token: donorToken,
    body: { currentPassword: password, newPassword: 'ChangedPassword123!' }
  });
  ok('password change with correct current password', changed.status === 200);
  const wrongCurrent = await call('POST', '/auth/change-password', {
    token: donorToken,
    body: { currentPassword: 'nope', newPassword: 'AnotherPassword123!' }
  });
  ok('password change rejects a wrong current password', wrongCurrent.status === 401);
  const loginChanged = await call('POST', '/auth/login', { body: { email: donor.email, password: 'ChangedPassword123!' } });
  ok('new password works', loginChanged.status === 200);
  const forgot = await call('POST', '/auth/forgot-password', { body: { email: donor.email } });
  ok('forgot-password responds generically', forgot.status === 200 && !!forgot.data?.message);
  if (forgot.data?.devResetToken) {
    const reset = await call('POST', '/auth/reset-password', {
      body: { token: forgot.data.devResetToken, password: 'ResetPassword123!' }
    });
    ok('reset-password with the issued token', reset.status === 200);
    const loginReset = await call('POST', '/auth/login', { body: { email: donor.email, password: 'ResetPassword123!' } });
    ok('reset password works', loginReset.status === 200);
  }
  const unknownForgot = await call('POST', '/auth/forgot-password', { body: { email: `nobody.${stamp}@foodbridge.test` } });
  ok('forgot-password does not leak account existence', unknownForgot.status === 200 && !unknownForgot.data?.devResetToken);
  const setupNoToken = await call('POST', '/setup/admin', { body: { token: 'x', email: 'a@b.co', password: '123456789012' } });
  ok('setup/admin is closed without SETUP_TOKEN', setupNoToken.status === 404 || setupNoToken.status === 403 || setupNoToken.status === 409);

  console.log('\nPlatform & security');
  const ready = await call('GET', '/ready');
  ok('readiness endpoint', ready.status === 200 && ready.data?.ready === true);
  const version = await call('GET', '/version');
  ok('version endpoint', version.status === 200 && version.data?.api === 'v1');

  // Read the raw header value: a reverse proxy (nginx in the Docker stack) or a
  // CDN may merge duplicate headers into a comma separated list.
  const headers = await fetch(`${base}/health`);
  const headerHas = (name, value) => String(headers.headers.get(name) || '').toLowerCase().includes(value);
  ok(
    'security headers present',
    headerHas('x-content-type-options', 'nosniff') && headerHas('x-frame-options', 'deny')
  );

  const publicReport = await call('POST', '/reports', {
    token: donorToken,
    body: { subject: 'Test dispute', description: 'Raised by the automated test suite', category: 'delivery' }
  });
  ok('user raises a report', publicReport.status === 201 && !!publicReport.data?._id);
  const reportListForbidden = await call('GET', '/reports', { token: donorToken });
  ok('non-admin cannot read the report queue', reportListForbidden.status === 403);

  if (adminToken0) {
    const auditLog = await call('GET', '/analytics/audit?limit=5', { token: adminToken0 });
    ok('audit log populated', auditLog.status === 200 && (auditLog.data?.total || 0) > 0);
    const settings = await call('GET', '/analytics/settings', { token: adminToken0 });
    ok('platform settings readable', settings.status === 200 && !!settings.data?.platformName);
    const patched = await call('PATCH', '/analytics/settings', { token: adminToken0, body: { supportEmail: 'support@foodbridge.test' } });
    ok('platform settings updatable', patched.status === 200 && patched.data?.supportEmail === 'support@foodbridge.test');
    const triage = await call('PATCH', `/reports/${publicReport.data?._id}`, {
      token: adminToken0,
      body: { status: 'resolved', resolution: 'Handled by test' }
    });
    ok('admin resolves a report', triage.status === 200 && triage.data?.status === 'resolved');
    const suspend = await call('PATCH', `/users/${donor.data.user.id}/status`, { token: adminToken0, body: { status: 'suspended' } });
    ok('admin suspends an account', suspend.status === 200 && suspend.data?.status === 'suspended');
    const blockedLogin = await call('POST', '/auth/login', { body: { email: donor.email, password } });
    ok('suspended user cannot log in', blockedLogin.status === 401);
  }

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('Failed:', failures.join(' | '));
    process.exit(1);
  }
  console.log('All checks passed.\n');
})();
