import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Loader2 } from 'lucide-react';
import { api, saveSession } from '../services/api';

export default function Auth({ register = false }) {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', organization: '', email: '', phone: '', password: '', location: 'Pune', role: 'donor' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const change = (e) => setForm((old) => ({ ...old, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = register
        ? await api.register({ ...form, email: form.email.trim().toLowerCase() })
        : await api.login({ email: form.email.trim().toLowerCase(), password: form.password, role: form.role });
      saveSession(data);
      nav('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f6fbf8] grid lg:grid-cols-2">
      <div className="hidden lg:flex gradient-green p-12 text-white flex-col justify-between">
        <div className="font-black text-2xl flex gap-2 items-center"><Leaf />FoodBridge</div>
        <div>
          <p className="text-green-100 uppercase tracking-widest text-xs font-black">Food impact network</p>
          <h1 className="text-6xl font-black mt-3">Move food. Move communities.</h1>
          <p className="text-green-100 mt-5 max-w-lg">Coordinate donors, NGOs and volunteers with data-driven food rescue workflows.</p>
        </div>
        <p className="text-green-200 text-sm">Built for measurable social and environmental impact.</p>
      </div>

      <div className="flex items-center justify-center p-5 md:p-10">
        <form onSubmit={submit} className="w-full max-w-lg card p-7 md:p-9">
          <Link to="/" className="text-green-700 font-black">← FoodBridge</Link>
          <h2 className="text-3xl font-black mt-6">{register ? 'Create your account' : 'Welcome back'}</h2>
          <p className="text-slate-500 mt-2">{register ? 'Join the food rescue network.' : 'Sign in to your FoodBridge workspace.'}</p>

          {error && <div className="bg-red-50 text-red-700 p-3 rounded-xl mt-5 text-sm">{error}</div>}

          <div className="grid gap-4 mt-6">
            {register && <>
              <label className="text-sm font-bold">Name<input className="input mt-1" name="name" required value={form.name} onChange={change} /></label>
              <label className="text-sm font-bold">Organization (optional)<input className="input mt-1" name="organization" value={form.organization} onChange={change} /></label>
              <label className="text-sm font-bold">Phone<input className="input mt-1" name="phone" value={form.phone} onChange={change} /></label>
              <label className="text-sm font-bold">Location<input className="input mt-1" name="location" value={form.location} onChange={change} /></label>
            </>}
            <label className="text-sm font-bold">Email<input className="input mt-1" type="email" name="email" required value={form.email} onChange={change} /></label>
            <label className="text-sm font-bold">Password<input className="input mt-1" type="password" name="password" required minLength="6" value={form.password} onChange={change} /></label>
            {!register && <div className="-mt-2 text-right"><Link to="/forgot-password" className="text-sm text-green-700 font-bold hover:underline">Forgot password?</Link></div>}
            <label className="text-sm font-bold">Role<select className="input mt-1" name="role" value={form.role} onChange={change}>
              <option value="donor">Donor</option><option value="ngo">NGO</option><option value="volunteer">Volunteer</option>{!register && <option value="admin">Admin</option>}
            </select></label>
          </div>

          

          <button disabled={loading} className="btn btn-primary w-full mt-6">{loading && <Loader2 className="animate-spin" />}{register ? 'Create account' : 'Sign in'}</button>
          <p className="text-sm text-center text-slate-500 mt-5">{register ? 'Already have an account? ' : 'Need an account? '}<Link className="text-green-700 font-bold" to={register ? '/login' : '/register'}>{register ? 'Login' : 'Register'}</Link></p>
        </form>
      </div>
    </div>
  );
}
