import{useEffect,useState}from'react';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{Save,Loader2}from'lucide-react';

export default function Settings(){
  const [s,setS]=useState(null);
  const [msg,setMsg]=useState('');
  const [error,setError]=useState('');
  const [saving,setSaving]=useState(false);

  useEffect(()=>{api.settings().then(setS).catch(e=>setError(e.message||'Could not load settings.'))},[]);
  const change=e=>{const{name,value,type,checked}=e.target;setS(o=>({...o,[name]:type==='checkbox'?checked:type==='number'?Number(value):value}))};

  async function save(e){
    e.preventDefault();setSaving(true);setMsg('');setError('');
    try{const updated=await api.updateSettings({platformName:s.platformName,supportEmail:s.supportEmail,autoExpireHours:s.autoExpireHours,requireNgoVerification:s.requireNgoVerification,allowDonorImages:s.allowDonorImages,maintenanceMode:s.maintenanceMode});setS(updated);setMsg('Settings saved.')}
    catch(err){setError(err.message||'Could not save settings.')}
    finally{setSaving(false)}
  }

  if(!s)return <Layout><PageHeader title="Platform Settings" subtitle="Configuration applied by the API."/>{error?<div className="card p-4 bg-red-50 text-red-700 text-sm font-bold">{error}</div>:<div className="card p-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/></div>}</Layout>;

  return <Layout>
    <PageHeader title="Platform Settings" subtitle="Configuration stored in MongoDB and enforced by the API."/>
    {msg&&<div className="card p-4 mb-5 bg-green-50 text-green-800 text-sm font-bold">{msg}</div>}
    {error&&<div className="card p-4 mb-5 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    <form onSubmit={save} className="card p-6 max-w-2xl grid gap-5">
      <label className="text-sm font-bold">Platform name<input className="input mt-1" name="platformName" value={s.platformName||''} onChange={change}/></label>
      <label className="text-sm font-bold">Support email<input className="input mt-1" type="email" name="supportEmail" value={s.supportEmail||''} onChange={change}/></label>
      <label className="text-sm font-bold">Donation expiry window (hours)<input className="input mt-1" type="number" min="1" max="720" name="autoExpireHours" value={s.autoExpireHours||24} onChange={change}/></label>
      <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" name="requireNgoVerification" checked={!!s.requireNgoVerification} onChange={change}/>Require NGO verification before accepting donations</label>
      <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" name="allowDonorImages" checked={!!s.allowDonorImages} onChange={change}/>Allow donors to attach a food photo</label>
      <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" name="maintenanceMode" checked={!!s.maintenanceMode} onChange={change}/>Maintenance mode flag</label>
      <button disabled={saving} className="btn btn-primary w-fit"><Save size={17}/>{saving?'Saving…':'Save settings'}</button>
    </form>
  </Layout>
}
