import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export default function ForgotPassword() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const change = (e) => setForm((old) => ({ ...old, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    if (form.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.forgotPassword({ email: form.email, newPassword: form.newPassword });
      setMessage('Password changed successfully. You can now sign in with your new password.');
      setTimeout(() => nav('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.message || 'Unable to change password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6fbf8] flex items-center justify-center p-5 md:p-10">
      <form onSubmit={submit} className="w-full max-w-lg card p-7 md:p-9">
        <Link to="/login" className="text-green-700 font-black inline-flex items-center gap-2">
          <ArrowLeft size={18} /> Back to Login
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
            <KeyRound size={22} />
          </div>
          <div>
            <h2 className="text-3xl font-black">Forgot Password?</h2>
            <p className="text-slate-500 mt-1">Set a new password for your FoodBridge account.</p>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl mt-5 text-sm">{error}</div>}
        {message && <div className="bg-green-50 text-green-700 p-3 rounded-xl mt-5 text-sm">{message}</div>}

        <div className="grid gap-4 mt-6">
          <label className="text-sm font-bold">
            Email
            <input className="input mt-1" type="email" name="email" required value={form.email} onChange={change} placeholder="you@example.com" />
          </label>
          <label className="text-sm font-bold">
            New Password
            <input className="input mt-1" type="password" name="newPassword" required minLength="6" value={form.newPassword} onChange={change} placeholder="Minimum 6 characters" />
          </label>
          <label className="text-sm font-bold">
            Confirm New Password
            <input className="input mt-1" type="password" name="confirmPassword" required minLength="6" value={form.confirmPassword} onChange={change} placeholder="Enter the password again" />
          </label>
        </div>

        <button disabled={loading} className="btn btn-primary w-full mt-6">
          {loading && <Loader2 className="animate-spin" />}
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>

        <p className="text-xs text-slate-500 mt-4 text-center">
          For this local/demo project, the email is used to locate the account in MongoDB and update its password.
        </p>
      </form>
    </div>
  );
}
