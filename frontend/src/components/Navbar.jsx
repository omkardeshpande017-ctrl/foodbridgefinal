import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Menu, X } from 'lucide-react';
import { useState } from 'react';
import {
  session,
  clearSession,
} from '../services/api';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const s = session();

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-green-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-black text-xl text-green-800"
        >
          <span className="w-9 h-9 rounded-xl gradient-green text-white grid place-items-center">
            <Leaf size={20} />
          </span>

          FoodBridge
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <Link
            to="/"
            className="hover:text-green-700"
          >
            Home
          </Link>

          <a
            href="/#how"
            className="hover:text-green-700"
          >
            How It Works
          </a>

          <a
            href="/#impact"
            className="hover:text-green-700"
          >
            Impact
          </a>

          <Link
            to="/analytics"
            className="hover:text-green-700"
          >
            Analytics
          </Link>

          <a
            href="/#about"
            className="hover:text-green-700"
          >
            About
          </a>

          {s ? (
            <button
              className="btn btn-secondary"
              onClick={() => nav('/dashboard')}
            >
              Dashboard
            </button>
          ) : (
            <Link
              className="btn btn-primary"
              to="/register"
            >
              Get Started
            </Link>
          )}

          {s && (
            <button
              className="text-slate-500"
              onClick={() => {
                clearSession();
                nav('/');
              }}
            >
              Logout
            </button>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 grid gap-2">
          <Link
            onClick={() => setOpen(false)}
            to="/"
          >
            Home
          </Link>

          <Link
            onClick={() => setOpen(false)}
            to="/analytics"
          >
            Analytics
          </Link>

          <Link
            onClick={() => setOpen(false)}
            to={s ? '/dashboard' : '/login'}
          >
            {s ? 'Dashboard' : 'Login'}
          </Link>
        </div>
      )}
    </nav>
  );
}