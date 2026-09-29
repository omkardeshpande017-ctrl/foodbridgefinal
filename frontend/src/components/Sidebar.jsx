import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  BarChart3,
  Bell,
  UserCircle,
  Map,
  BrainCircuit,
  Truck,
  Users,
  FileText,
  Settings,
  LogOut,
  HeartHandshake,
} from 'lucide-react';
import {
  clearSession,
  session,
} from '../services/api';

const common = [
  ['Dashboard', '/dashboard', LayoutDashboard],
  ['Donate Food', '/donate', PlusCircle],
  ['My Donations', '/donations', Package],
  ['Analytics', '/analytics', BarChart3],
  ['Map & Route', '/map', Map],
  ['AI Insights', '/ai', BrainCircuit],
  ['Notifications', '/notifications', Bell],
  ['Profile', '/profile', UserCircle],
];

const ngo = [
  ['Nearby Donations', '/nearby', HeartHandshake],
  ['My Requests', '/requests', Package],
  ['Distribution', '/distribution', Truck],
];

const vol = [
  ['Pickup Tasks', '/tasks', Truck],
];

const admin = [
  ['Users', '/users', Users],
  ['Reports', '/reports', FileText],
  ['Settings', '/settings', Settings],
];

export default function Sidebar() {
  const nav = useNavigate();
  const s = session();
  const role = s?.user?.role;

  let items = common;

  if (role === 'ngo') {
    items = [
      common[0],
      ...ngo,
      ...common.slice(2),
    ];
  }

  if (role === 'volunteer') {
    items = [
      common[0],
      ...vol,
      ...common.slice(2),
    ];
  }

  if (role === 'admin') {
    items = [
      common[0],
      ...admin,
      ...common.slice(2),
    ];
  }

  return (
    <aside className="hidden lg:flex w-64 shrink-0 min-h-screen bg-white border-r border-green-100 p-4 flex-col">
      <div className="font-black text-green-800 text-lg px-3 py-3 flex gap-2 items-center">
        <HeartHandshake size={22} />
        FoodBridge
      </div>

      <div className="text-xs uppercase tracking-wider text-slate-400 px-3 mt-4 mb-2">
        {role || 'member'} workspace
      </div>

      <nav className="space-y-1">
        {items.map(([label, path, Icon]) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                isActive
                  ? 'bg-green-50 text-green-800'
                  : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <button
          onClick={() => {
            clearSession();
            nav('/');
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}