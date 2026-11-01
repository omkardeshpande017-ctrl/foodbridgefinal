import{useEffect,useState}from'react';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{ScrollText,Loader2,ChevronLeft,ChevronRight}from'lucide-react';

export default function AuditLog(){
  const [rows,setRows]=useState([]);
  const [meta,setMeta]=useState({total:0,pages:1});
  const [page,setPage]=useState(1);
  const [action,setAction]=useState('');
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  async function load(p=page){
    setLoading(true);setError('');
    try{const res=await api.auditLog({page:p,limit:40,action});setRows(res.items||[]);setMeta({total:res.total||0,pages:res.pages||1})}
    catch(err){setError(err.message||'Could not load the audit log.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{setPage(1);load(1)},[action]);

  return <Layout>
    <PageHeader title="Audit Log" subtitle="Every privileged action, recorded server-side with actor, IP and timestamp."/>
    <div className="card p-4 mb-5 flex flex-col md:flex-row gap-3">
      <input className="input flex-1" placeholder="Filter by action, e.g. donation.accept" value={action} onChange={e=>setAction(e.target.value)}/>
      <button className="btn btn-secondary" onClick={()=>load(1)}>Filter</button>
    </div>
    {error&&<div className="card p-4 mb-5 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    {loading?<div className="card p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Loading audit entries…</p></div>
    :rows.length===0?<div className="card p-10 text-center text-slate-500"><ScrollText className="mx-auto text-green-600"/><p className="font-black mt-3">No audit entries yet</p></div>
    :<div className="card overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-slate-50"><tr><th className="p-4 text-left">When</th><th className="p-4 text-left">Actor</th><th className="p-4 text-left">Action</th><th className="p-4 text-left">Entity</th><th className="p-4 text-left">IP</th></tr></thead>
      <tbody>{rows.map(a=><tr className="border-t" key={a._id}>
        <td className="p-4 whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
        <td className="p-4">{a.actorId?.name||'system'}<p className="text-xs text-slate-500">{a.actorRole||''}</p></td>
        <td className="p-4 font-bold">{a.action}</td>
        <td className="p-4 text-slate-600">{a.entity||'—'}{a.entityId?<span className="text-xs text-slate-400"> · {String(a.entityId).slice(-6)}</span>:null}</td>
        <td className="p-4 text-xs text-slate-500">{a.ip||'—'}</td>
      </tr>)}</tbody>
    </table></div>}
    {meta.pages>1&&<div className="flex items-center justify-between mt-5">
      <p className="text-sm text-slate-500">{meta.total} entries · page {page} of {meta.pages}</p>
      <div className="flex gap-2">
        <button disabled={page<=1} className="btn btn-secondary text-sm" onClick={()=>{const p=page-1;setPage(p);load(p)}}><ChevronLeft size={16}/>Previous</button>
        <button disabled={page>=meta.pages} className="btn btn-secondary text-sm" onClick={()=>{const p=page+1;setPage(p);load(p)}}>Next<ChevronRight size={16}/></button>
      </div>
    </div>}
  </Layout>
}
