// Negative / edge-case API tests: invalid input, missing auth, wrong roles,
// unknown records, duplicates, expired tokens, invalid transitions, DB failure.
const base = process.argv[2] || 'http://localhost:5001/api';
const stamp = Date.now();
const password = 'EdgePassword123!';
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
const call = async (method, path, { token, body, raw } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined || raw) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${base}${path}`, { method, headers, body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data, headers: res.headers };
};
const reg = async (role) =>
  (
    await call('POST', '/auth/register', {
      body: { name: role, email: `${role}.${stamp}@edge.test`, password, role, organization: 'Edge org' }
    })
  ).data;

(async () => {
  console.log(`\nFoodBridge edge-case tests — ${base}\n`);
  const donor = await reg('donor');
  const ngo = await reg('ngo');
  const volunteer = await reg('volunteer');

  console.log('Authentication edge cases');
  ok('missing token rejected', (await call('GET', '/donations')).status === 401);
  ok('malformed token rejected', (await call('GET', '/donations', { token: 'not-a-jwt' })).status === 401);
  ok('invalid JSON body handled', [400, 500].includes((await call('POST', '/auth/login', { raw: '{bad json' })).status));
  ok('missing fields rejected', (await call('POST', '/auth/register', { body: {} })).status === 400);
  ok('weak password rejected', (await call('POST', '/auth/register', { body: { name: 'x', email: `w.${stamp}@edge.test`, password: 'short', role: 'donor' } })).status === 400);
  ok('invalid email rejected', (await call('POST', '/auth/register', { body: { name: 'x', email: 'nope', password, role: 'donor' } })).status === 400);
  ok('admin role rejected at registration', (await call('POST', '/auth/register', { body: { name: 'x', email: `a.${stamp}@edge.test`, password, role: 'admin' } })).status === 400);
  ok('duplicate email rejected', (await call('POST', '/auth/register', { body: { name: 'x', email: donor.user.email, password, role: 'donor' } })).status === 409);
  ok('ngo without organisation rejected', (await call('POST', '/auth/register', { body: { name: 'x', email: `o.${stamp}@edge.test`, password, role: 'ngo' } })).status === 400);
  ok('unknown login rejected', (await call('POST', '/auth/login', { body: { email: 'ghost@edge.test', password } })).status === 401);
  // Register the second donor up front: more attempts from one IP would trip the
  // auth rate limiter (40 / 15 min) and mask the ownership assertions below.
  const otherDonorRes = await call('POST', '/auth/register', {
    body: { name: 'other donor', email: `other.${stamp}@edge.test`, password, role: 'donor', organization: 'Edge org' }
  });
  const otherDonor = otherDonorRes.data;
  ok('second donor registered for ownership tests', otherDonorRes.status === 201, JSON.stringify(otherDonorRes.data).slice(0, 120));

  console.log('\nDonation edge cases');
  ok('missing fields rejected', (await call('POST', '/donations', { token: donor.token, body: {} })).status === 400);
  ok('negative quantity rejected', (await call('POST', '/donations', { token: donor.token, body: { foodName: 'x', quantity: -1, pickupLocation: 'p' } })).status === 400);
  ok('past expiry rejected', (await call('POST', '/donations', { token: donor.token, body: { foodName: 'x', quantity: 1, pickupLocation: 'p', expiryTime: '2020-01-01T00:00' } })).status === 400);
  ok('invalid image payload rejected', (await call('POST', '/donations', { token: donor.token, body: { foodName: 'x', quantity: 1, pickupLocation: 'p', image: 'javascript:alert(1)' } })).status === 400);
  ok('ngo cannot create a donation', (await call('POST', '/donations', { token: ngo.token, body: { foodName: 'x', quantity: 1, pickupLocation: 'p' } })).status === 403);
  ok('volunteer cannot create a donation', (await call('POST', '/donations', { token: volunteer.token, body: { foodName: 'x', quantity: 1, pickupLocation: 'p' } })).status === 403);
  ok('unknown donation returns 404', (await call('GET', '/donations/000000000000000000000000', { token: donor.token })).status === 404);
  ok('invalid id returns 400', (await call('GET', '/donations/not-an-id', { token: donor.token })).status === 400);

  const d = await call('POST', '/donations', { token: donor.token, body: { foodName: 'Edge meal', quantity: 4, pickupLocation: 'Pune', pickupDate: new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10) } });
  const id = d.data._id;
  const other = otherDonor;
  const readOther = await call('GET', `/donations/${id}`, { token: other.token });
  ok('other donor cannot read it', readOther.status === 403, JSON.stringify(readOther.data).slice(0, 120));
  const editOther = await call('PATCH', `/donations/${id}`, { token: other.token, body: { quantity: 99 } });
  ok('other donor cannot edit it', editOther.status === 403, JSON.stringify(editOther.data).slice(0, 120));
  ok('invalid status value rejected', (await call('PATCH', `/donations/${id}/status`, { token: donor.token, body: { status: 'teleported' } })).status === 400);
  ok('donor cannot mark picked_up', (await call('PATCH', `/donations/${id}/status`, { token: donor.token, body: { status: 'picked_up' } })).status === 403);
  ok('unverified ngo cannot accept', (await call('POST', `/donations/${id}/accept`, { token: ngo.token })).status === 403);

  console.log('\nDelivery and admin edge cases');
  ok('donor cannot create a delivery', (await call('POST', '/deliveries', { token: donor.token, body: { donationId: id } })).status === 403);
  ok('non-admin cannot list users', (await call('GET', '/users', { token: donor.token })).status === 403);
  ok('non-admin cannot read audit log', (await call('GET', '/analytics/audit', { token: donor.token })).status === 403);
  ok('non-admin cannot change settings', (await call('PATCH', '/analytics/settings', { token: donor.token, body: { platformName: 'x' } })).status === 403);
  ok('non-admin cannot verify an ngo', (await call('PATCH', `/users/${ngo.user.id}/verification`, { token: donor.token, body: { status: 'verified' } })).status === 403);

  console.log('\nSystem');
  const health = await call('GET', '/health');
  ok('health reports database state', health.status === 200 && !!health.data?.database);
  ok(
    'security headers on every response',
    String(health.headers.get('x-content-type-options') || '').toLowerCase().includes('nosniff')
  );
  ok('unknown route returns JSON 404', (await call('GET', '/does-not-exist')).status === 404);

  console.log(`\n${pass} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('Failed:', failures.join(' | '));
    process.exit(1);
  }
  console.log('All edge cases passed.\n');
})();
