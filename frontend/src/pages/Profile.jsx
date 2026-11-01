import{useEffect,useState}from'react';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api,session,saveSession}from'../services/api';import{CheckCircle2,AlertTriangle,BadgeCheck,KeyRound}from'lucide-react';

export default function Profile(){
  const s=session();
  const [f,setF]=useState({name:s?.user?.name||'',phone:'',location:s?.user?.location||'',organization:s?.user?.organization||'',registrationNumber:'',available:true});
  const [verification,setVerification]=useState(s?.user?.verification||'not_required');
  const [role,setRole]=useState(s?.user?.role);
  const [msg,setMsg]=useState('');const [error,setError]=useState('');
  const [pw,setPw]=useState({currentPassword:'',newPassword:''});
  const [pwMsg,setPwMsg]=useState('');const [pwErr,setPwErr]=useState('');

  useEffect(()=>{api.me().then(u=>{setF(x=>({...x,name:u.name,phone:u.phone||'',location:u.location||'',organization:u.organization||'',registrationNumber:u.registrationNumber||'',available:u.available!==false}));setVerification(u.verification?.status||'not_required');setRole(u.role)}).catch(()=>{})},[]);

  async function save(e){
    e.preventDefault();setMsg('');setError('');
    try{
      const u=await api.updateMe(f);
      setMsg('Profile saved.');
      const cur=session();if(cur){saveSession({...cur,user:{...cur.user,name:u.name,location:u.location,organization:u.organization}})}
      setTimeout(()=>setMsg(''),2200);
    }catch(err){setError(err.message||'Could not save your profile.')}
  }

  async function changePassword(e){
    e.preventDefault();setPwMsg('');setPwErr('');
    try{await api.changePassword(pw);setPwMsg('Password updated.');setPw({currentPassword:'',newPassword:''})}
    catch(err){setPwErr(err.message||'Could not update your password.')}
  }

  const verificationNote={
    pending:'Your NGO is waiting for administrator verification. You can browse donations, but accepting them starts once you are verified.',
    verified:'Your organisation is verified. You can accept donations and coordinate pickups.',
    rejected:'Verification was rejected. Update your organisation details and contact support to re-apply.',
    not_required:''
  }[verification]||'';

  return <Layout>
    <PageHeader title="Profile" subtitle="Manage your FoodBridge account information."/>
    {msg&&<div className="card p-4 mb-4 bg-green-50 text-green-800 text-sm font-bold flex gap-2"><CheckCircle2 size={17}/>{msg}</div>}
    {error&&<div className="card p-4 mb-4 bg-red-50 text-red-700 text-sm font-bold flex gap-2"><AlertTriangle size={17}/>{error}</div>}
    {role==='ngo'&&verificationNote&&<div className={`card p-4 mb-4 text-sm font-bold flex gap-2 ${verification==='verified'?'bg-green-50 text-green-800':'bg-amber-50 text-amber-800'}`}>
      <BadgeCheck size={17}/>{verificationNote}</div>}
    <form onSubmit={save} className="card p-6 max-w-2xl grid gap-4">
      <label className="text-sm font-bold">Name<input className="input mt-1" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></label>
      <label className="text-sm font-bold">Organization<input className="input mt-1" value={f.organization||''} onChange={e=>setF({...f,organization:e.target.value})}/></label>
      {role==='ngo'&&<label className="text-sm font-bold">NGO registration number<input className="input mt-1" value={f.registrationNumber||''} onChange={e=>setF({...f,registrationNumber:e.target.value})}/></label>}
      <label className="text-sm font-bold">Phone<input className="input mt-1" value={f.phone||''} onChange={e=>setF({...f,phone:e.target.value})}/></label>
      <label className="text-sm font-bold">Location<input className="input mt-1" value={f.location||''} onChange={e=>setF({...f,location:e.target.value})}/></label>
      {role==='volunteer'&&<label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={!!f.available} onChange={e=>setF({...f,available:e.target.checked})}/>Available for pickup assignments</label>}
      <div><button className="btn btn-primary">Save profile</button></div>
    </form>

    <form onSubmit={changePassword} className="card p-6 max-w-2xl grid gap-4 mt-6">
      <h2 className="font-black flex gap-2 items-center"><KeyRound size={18} className="text-green-600"/>Change password</h2>
      {pwMsg&&<div className="bg-green-50 text-green-800 text-sm font-bold p-3 rounded-xl flex gap-2"><CheckCircle2 size={16}/>{pwMsg}</div>}
      {pwErr&&<div className="bg-red-50 text-red-700 text-sm font-bold p-3 rounded-xl flex gap-2"><AlertTriangle size={16}/>{pwErr}</div>}
      <label className="text-sm font-bold">Current password<input className="input mt-1" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={e=>setPw({...pw,currentPassword:e.target.value})}/></label>
      <label className="text-sm font-bold">New password (8+ characters)<input className="input mt-1" type="password" autoComplete="new-password" minLength="8" value={pw.newPassword} onChange={e=>setPw({...pw,newPassword:e.target.value})}/></label>
      <div><button className="btn btn-secondary">Update password</button></div>
    </form>
  </Layout>
}
