import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Donate from './pages/Donate';
import Donations from './pages/Donations';
import Analytics from './pages/Analytics';
import AI from './pages/AI';
import Map from './pages/Map';
import Volunteer from './pages/Volunteer';
import Distribution from './pages/Distribution';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Requests from './pages/Requests';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { session } from './services/api';

function Protected({ children, roles }) {
  const s = session();
  if (!s?.token || !s?.user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(s.user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<><Navbar /><Home /></>} />
      <Route path="/login" element={<Auth />} />
      <Route path="/register" element={<Auth register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
      <Route path="/donate" element={<Protected roles={['donor', 'admin']}><Donate /></Protected>} />
      <Route path="/donations" element={<Protected><Donations /></Protected>} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
