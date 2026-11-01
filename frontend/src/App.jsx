import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Donate = lazy(() => import('./pages/Donate'));
const Donations = lazy(() => import('./pages/Donations'));
const Analytics = lazy(() => import('./pages/Analytics'));
const AI = lazy(() => import('./pages/AI'));
const Map = lazy(() => import('./pages/Map'));
const Volunteer = lazy(() => import('./pages/Volunteer'));
const Distribution = lazy(() => import('./pages/Distribution'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const Requests = lazy(() => import('./pages/Requests'));
const Users = lazy(() => import('./pages/Users'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const AuditLog = lazy(() => import('./pages/AuditLog'));
const Disputes = lazy(() => import('./pages/Disputes'));
const DonationDetail = lazy(() => import('./pages/DonationDetail'));
import { session } from './services/api';

function Protected({ children, roles }) {
  const s = session();
  if (!s?.token || !s?.user) return <Navigate to="/login" replace />;
  // A signed-in user who opens a page their role cannot use goes to their own
  // home page instead of being bounced between two routes.
  if (roles && !roles.includes(s.user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

const Loading = () => (
  <div className="min-h-[60vh] grid place-items-center text-slate-500 text-sm">Loading…</div>
);

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth register />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/donate" element={<Protected roles={['donor', 'admin']}><Donate /></Protected>} />
      <Route path="/donations" element={<Protected><Donations /></Protected>} />
      <Route path="/donations/:id" element={<Protected><DonationDetail /></Protected>} />
      <Route path="/nearby" element={<Protected roles={['ngo', 'admin']}><Donations nearby /></Protected>} />
      <Route path="/requests" element={<Protected roles={['ngo', 'admin']}><Requests /></Protected>} />
      <Route path="/distribution" element={<Protected roles={['ngo', 'admin']}><Distribution /></Protected>} />
      <Route path="/tasks" element={<Protected roles={['volunteer', 'admin']}><Volunteer /></Protected>} />
      <Route path="/analytics" element={<Protected><Analytics /></Protected>} />
      <Route path="/ai" element={<Protected><AI /></Protected>} />
      <Route path="/map" element={<Protected><Map /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />
      <Route path="/users" element={<Protected roles={['admin']}><Users /></Protected>} />
      <Route path="/reports" element={<Protected roles={['admin']}><Reports /></Protected>} />
      <Route path="/settings" element={<Protected roles={['admin']}><Settings /></Protected>} />
      <Route path="/audit" element={<Protected roles={['admin']}><AuditLog /></Protected>} />
      <Route path="/disputes" element={<Protected roles={['admin']}><Disputes /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
