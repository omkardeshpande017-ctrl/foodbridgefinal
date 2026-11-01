import{useEffect,useState}from'react';import{Link}from'react-router-dom';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{Inbox,CheckCircle2,Clock,Loader2}from'lucide-react';

export default function Requests(){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');

  async function load(){
    try{setError('');setRows(await api.donations('?mine=true'))}
    catch(err){setError(err.message||'Could not load your accepted requests.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);

  async function cancel(d){
    setBusy(d._id);setError('');
    try{await api.status(d._id,'cancelled');await load()}
    catch(err){setError(err.message||'Could not update this request.')}
    finally{setBusy('')}
  }

  return <Layout>
    <PageHeader title="My Requests" subtitle="Every donation your NGO has accepted, with its live fulfilment status."
      action={<Link to="/nearby" className="btn btn-primary">Find donations</Link>}/>
    {error&&<div className="card p-4 mb-5 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    {loading?<div className="card p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Loading…</p></div>
    :rows.length===0?<div className="card p-10 text-center">
        <Inbox className="mx-auto text-green-600" size={36}/>
        <p className="font-black mt-3">No requests yet</p>
        <p className="text-sm text-slate-500 mt-1">Accept an available donation and it becomes a request here.</p>
      </div>
    :<div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50"><tr>
          <th className="p-4 text-left">Request</th><th className="p-4 text-left">Quantity</th>
          <th className="p-4 text-left">Donor</th><th className="p-4 text-left">Pickup</th>
          <th className="p-4 text-left">Status</th><th className="p-4 text-left">Action</th>
        </tr></thead>
        <tbody>{rows.map(d=><tr className="border-t" key={d._id}>
          <td className="p-4 font-bold">{d.foodName}</td>
          <td className="p-4">{d.quantity} {d.unit}</td>
          <td className="p-4">{d.donorId?.name||'—'}</td>
          <td className="p-4">{d.pickupLocation||'—'}<p className="text-xs text-slate-500">{d.pickupDate||''} {d.pickupTime||''}</p></td>
          <td className="p-4"><span className={`status status-${d.status}`}>{d.status?.replace('_',' ')}</span></td>
          <td className="p-4">{d.status==='accepted'
            ?<button disabled={busy===d._id} className="btn btn-secondary text-xs" onClick={()=>cancel(d)}>{busy===d._id?'Updating…':'Release'}</button>
            :<span className="text-slate-500 text-xs flex gap-1 items-center">{d.status==='delivered'?<CheckCircle2 size={15} className="text-green-600"/>:<Clock size={15}/>}{d.status}</span>}</td>
        </tr>)}</tbody>
      </table>
    </div>}
  </Layout>
}
