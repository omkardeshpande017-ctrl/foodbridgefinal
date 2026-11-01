import{useEffect,useState}from'react';import{Link,useNavigate,useSearchParams}from'react-router-dom';import{Leaf,Loader2,KeyRound,ArrowLeft}from'lucide-react';import{api,saveSession}from'../services/api';

export default function Auth({register=false}){
  const nav=useNavigate();
  const [params]=useSearchParams();
  const [mode,setMode]=useState(register?'register':'login');   // login | register | forgot | reset
  const [form,setForm]=useState({name:'',organization:'',registrationNumber:'',email:'',phone:'',password:'',location:'',role:'donor'});
  const [resetToken,setResetToken]=useState(params.get('token')||'');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');

  const change=e=>setForm(old=>({...old,[e.target.name]:e.target.value}));

  async function submit(e){
    e.preventDefault();setError('');setNotice('');setLoading(true);
    try{
      if(mode==='login'||mode==='register'){
        const data=mode==='register'?await api.register(form):await api.login({email:form.email,password:form.password});
        saveSession(data);
        if(data.notice){localStorage.setItem('foodbridge_notice',data.notice)}
        nav('/dashboard',{replace:true});
        return;
      }
      if(mode==='forgot'){
        const res=await api.forgotPassword(form.email);
        setNotice(res.devResetToken?`Reset token (development only): ${res.devResetToken}`:res.message);
        if(res.devResetToken)setResetToken(res.devResetToken);
        return;
      }
      if(mode==='reset'){
        const res=await api.resetPassword({token:resetToken,password:form.password});
        setNotice(res.message);setMode('login');
      }
    }catch(err){setError(err.message||'Something went wrong. Please try again.')}
    finally{setLoading(false)}
  }

  const heading={login:'Welcome back',register:'Create your account',forgot:'Reset your password',reset:'Choose a new password'}[mode];
  const sub={login:'Sign in to your FoodBridge workspace.',register:'Join the food rescue network. Admin access is provisioned privately by the owner.',forgot:'We will send a reset link if the address is registered.',reset:'Enter the token from your reset link and a new password.'}[mode];

  return <div className="min-h-screen bg-[#f6fbf8] dark:bg-slate-950 grid lg:grid-cols-2">
    <div className="hidden lg:flex gradient-green p-12 text-white flex-col justify-between">
      <Link to="/" className="font-black text-2xl flex gap-2 items-center"><Leaf/>FoodBridge</Link>
      <div>
        <p className="text-green-100 uppercase tracking-widest text-xs font-black">Food impact network</p>
        <h1 className="text-6xl font-black mt-3">Move food. Move communities.</h1>
        <p className="text-green-100 mt-5 max-w-lg">Coordinate donors, NGOs and volunteers with data-driven food rescue workflows.</p>
      </div>
      <p className="text-green-200 text-sm">Built for measurable social and environmental impact.</p>
    </div>

    <div className="flex items-center justify-center p-5 md:p-10">
      <form onSubmit={submit} className="w-full max-w-lg card p-7 md:p-9">
        <Link to="/" className="text-green-700 font-black inline-flex gap-1 items-center"><ArrowLeft size={16}/>FoodBridge</Link>
        <h2 className="text-3xl font-black mt-6">{heading}</h2>
        <p className="text-slate-500 mt-2">{sub}</p>

        {error&&<div className="bg-red-50 text-red-700 p-3 rounded-xl mt-5 text-sm">{error}</div>}
        {notice&&<div className="bg-green-50 text-green-800 p-3 rounded-xl mt-5 text-sm break-all">{notice}</div>}

        <div className="grid gap-4 mt-6">
          {mode==='register'&&<>
            <label className="text-sm font-bold">Name<input className="input mt-1" name="name" required value={form.name} onChange={change}/></label>
            <label className="text-sm font-bold">Organization<input className="input mt-1" name="organization" value={form.organization} onChange={change}/></label>
            <label className="text-sm font-bold">Phone<input className="input mt-1" name="phone" value={form.phone} onChange={change}/></label>
            <label className="text-sm font-bold">Location<input className="input mt-1" name="location" value={form.location} onChange={change}/></label>
          </>}

          {mode!=='reset'&&<label className="text-sm font-bold">Email<input className="input mt-1" type="email" name="email" required value={form.email} onChange={change}/></label>}

          {mode==='reset'&&<label className="text-sm font-bold">Reset token<input className="input mt-1" name="resetToken" required value={resetToken} onChange={e=>setResetToken(e.target.value)}/></label>}

          {(mode==='login'||mode==='register'||mode==='reset')&&<label className="text-sm font-bold">{mode==='reset'?'New password':'Password'}
            <input className="input mt-1" type="password" name="password" required minLength="8" autoComplete={mode==='login'?'current-password':'new-password'} value={form.password} onChange={change}/></label>}

          {mode==='register'&&<label className="text-sm font-bold">Role<select className="input mt-1" name="role" value={form.role} onChange={change}>
            <option value="donor">Donor</option><option value="ngo">NGO</option><option value="volunteer">Volunteer</option>
          </select></label>}
          {mode==='register'&&form.role==='ngo'&&<label className="text-sm font-bold">NGO registration number<input className="input mt-1" name="registrationNumber" value={form.registrationNumber} onChange={change}/></label>}
        </div>

        <button disabled={loading} className="btn btn-primary w-full mt-6">{loading&&<Loader2 className="animate-spin"/>}
          {mode==='login'?'Sign in':mode==='register'?'Create account':mode==='forgot'?'Send reset link':'Set new password'}</button>

        <div className="flex justify-between items-center mt-5 text-sm">
          {mode==='login'&&<Link to="/register" className="text-green-700 font-bold">Need an account? Register</Link>}
          {mode==='register'&&<Link to="/login" className="text-green-700 font-bold">Already have an account? Login</Link>}
          {mode==='login'&&<button type="button" onClick={()=>{setMode('forgot');setError('');setNotice('')}} className="text-slate-500 font-bold inline-flex gap-1 items-center"><KeyRound size={14}/>Forgot password?</button>}
          {(mode==='forgot'||mode==='reset')&&<button type="button" onClick={()=>{setMode('login');setError('');setNotice('')}} className="text-green-700 font-bold">Back to login</button>}
        </div>
        {mode==='forgot'&&<button type="button" onClick={()=>setMode('reset')} className="text-xs text-slate-500 mt-3 underline">I already have a reset token</button>}
      </form>
    </div>
  </div>
}
