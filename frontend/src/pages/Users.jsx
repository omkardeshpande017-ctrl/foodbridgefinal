import{useEffect,useState}from'react';import{Link}from'react-router-dom';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{Search,ShieldCheck,ShieldX,BadgeCheck,Loader2,ChevronLeft,ChevronRight}from'lucide-react';

const badge=(u)=>{
  if(u.role!=='ngo')return null;
  const s=u.verification?.status||'pending';
  const cls=s==='verified'?'bg-green-100 text-green-800':s==='rejected'?'bg-red-100 text-red-800':'bg-amber-100 text-amber-800';
  return <span className={`status ${cls}`}>{s}</span>;
};

export default function Users(){
  const [rows,setRows]=useState([]);
  const [meta,setMeta]=useState({total:0,pages:1});
  const [page,setPage]=useState(1);
  const [role,setRole]=useState('');
  const [search,setSearch]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');

  async function load(p=page){
    setLoading(true);setError('');
    try{
      const res=await api.users({page:p,limit:25,role,search});
      setRows(res.items||[]);setMeta({total:res.total||0,pages:res.pages||1});
    }catch(err){setError(err.message||'Could not load users.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{setPage(1);load(1)},[role]);

  async function act(fn,id){
    setBusy(id);setError('');
    try{await fn();await load(page)}catch(err){setError(err.message||'Action failed.')}
    finally{setBusy('')}
  }

  return <Layout>
    <PageHeader title="User Management" subtitle="Verify NGOs, manage access and monitor every account on the platform."/>
    <div className="card p-4 mb-5 flex flex-col md:flex-row gap-3">
      <div className="relative flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={18}/>
        <input className="input pl-10" placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&load(1)}/></div>
      <select className="input md:w-44" value={role} onChange={e=>setRole(e.target.value)}>
        <option value="">All roles</option><option value="donor">Donors</option><option value="ngo">NGOs</option><option value="volunteer">Volunteers</option><option value="admin">Admins</option>
      </select>
      <button className="btn btn-secondary" onClick={()=>load(1)}>Search</button>
    </div>
    {error&&<div className="card p-4 mb-5 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    {loading?<div className="card p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Loading users…</p></div>
    :<div className="card overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-slate-50"><tr>
        <th className="p-4 text-left">Name</th><th className="p-4 text-left">Email</th><th className="p-4 text-left">Role</th>
        <th className="p-4 text-left">Verification</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Actions</th>
      </tr></thead>
      <tbody>{rows.map(u=><tr className="border-t" key={u._id}>
        <td className="p-4 font-bold">{u.name}<p className="text-xs text-slate-500 font-normal">{u.organization||u.location||''}</p></td>
        <td className="p-4">{u.email}</td>
        <td className="p-4 capitalize">{u.role}</td>
        <td className="p-4">{badge(u)||<span className="text-slate-400 text-xs">—</span>}</td>
        <td className="p-4"><span className={`status ${u.status==='active'?'status-delivered':'status-cancelled'}`}>{u.status}</span></td>
        <td className="p-4">
          <div className="flex flex-wrap gap-2">
            {u.role==='ngo'&&u.verification?.status!=='verified'&&<button disabled={busy===u._id} className="btn btn-primary text-xs" onClick={()=>act(()=>api.verifyNgo(u._id,'verified'),u._id)}><BadgeCheck size={14}/>Verify</button>}
            {u.role==='ngo'&&u.verification?.status!=='rejected'&&<button disabled={busy===u._id} className="btn btn-danger text-xs" onClick={()=>act(()=>api.verifyNgo(u._id,'rejected'),u._id)}><ShieldX size={14}/>Reject</button>}
            <button disabled={u.role==='admin'||busy===u._id} className="btn btn-secondary text-xs" onClick={()=>act(()=>api.userStatus(u._id,u.status==='active'?'suspended':'active'),u._id)}>
              <ShieldCheck size={14}/>{u.status==='active'?'Suspend':'Activate'}</button>
          </div>
        </td>
      </tr>)}</tbody>
    </table></div>}
    {meta.pages>1&&<div className="flex items-center justify-between mt-5">
      <p className="text-sm text-slate-500">{meta.total} accounts · page {page} of {meta.pages}</p>
      <div className="flex gap-2">
        <button disabled={page<=1} className="btn btn-secondary text-sm" onClick={()=>{const p=page-1;setPage(p);load(p)}}><ChevronLeft size={16}/>Previous</button>
        <button disabled={page>=meta.pages} className="btn btn-secondary text-sm" onClick={()=>{const p=page+1;setPage(p);load(p)}}>Next<ChevronRight size={16}/></button>
      </div>
    </div>}
  </Layout>
}
