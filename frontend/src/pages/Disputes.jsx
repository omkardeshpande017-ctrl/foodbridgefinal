import{useEffect,useState}from'react';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{AlertTriangle,CheckCircle2,Loader2}from'lucide-react';

export default function Disputes(){
  const [rows,setRows]=useState([]);
  const [status,setStatus]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');
  const [note,setNote]=useState({});

  async function load(){
    setLoading(true);setError('');
    try{const res=await api.reports({status,limit:100});setRows(res.items||[])}
    catch(err){setError(err.message||'Could not load reports.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[status]);

  async function update(r,next){
    setBusy(r._id);setError('');
    try{await api.updateReport(r._id,{status:next,resolution:note[r._id]});await load()}
    catch(err){setError(err.message||'Could not update this report.')}
    finally{setBusy('')}
  }

  return <Layout>
    <PageHeader title="Reports & Disputes" subtitle="Triage user-raised issues on donations, deliveries and accounts."
      action={<select className="input w-48" value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="">All statuses</option><option value="open">Open</option><option value="investigating">Investigating</option>
        <option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select>}/>
    {error&&<div className="card p-4 mb-5 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    {loading?<div className="card p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Loading reports…</p></div>
    :rows.length===0?<div className="card p-10 text-center text-slate-500"><CheckCircle2 className="mx-auto text-green-600"/><p className="font-black mt-3">No reports in this view</p></div>
    :<div className="grid gap-4">{rows.map(r=><div className="card p-6" key={r._id}>
      <div className="flex justify-between gap-3">
        <div><h3 className="font-black">{r.subject}</h3>
          <p className="text-xs text-slate-500 mt-1">{r.category} · raised by {r.raisedBy?.name||'—'} ({r.raisedBy?.role||''}) · {new Date(r.createdAt).toLocaleString()}</p></div>
        <span className={`status ${r.status==='open'?'status-cancelled':r.status==='resolved'?'status-delivered':'status-accepted'}`}>{r.status}</span>
      </div>
      <p className="text-sm text-slate-600 mt-3">{r.description}</p>
      {r.donationId&&<p className="text-xs text-slate-500 mt-2">Donation: <b>{r.donationId.foodName}</b> ({r.donationId.status})</p>}
      {r.resolution&&<p className="text-xs text-green-800 mt-2">Resolution: {r.resolution}</p>}
      {!['resolved','dismissed'].includes(r.status)&&<div className="flex flex-col md:flex-row gap-2 mt-4">
        <input className="input flex-1" placeholder="Resolution note (optional)" value={note[r._id]||''} onChange={e=>setNote({...note,[r._id]:e.target.value})}/>
        <button disabled={busy===r._id} className="btn btn-secondary text-sm" onClick={()=>update(r,'investigating')}><AlertTriangle size={15}/>Investigating</button>
        <button disabled={busy===r._id} className="btn btn-primary text-sm" onClick={()=>update(r,'resolved')}><CheckCircle2 size={15}/>Resolve</button>
        <button disabled={busy===r._id} className="btn btn-danger text-sm" onClick={()=>update(r,'dismissed')}>Dismiss</button>
      </div>}
    </div>)}</div>}
  </Layout>
}
