import{useEffect,useState}from'react';import{Link}from'react-router-dom';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{Truck,Users,CheckCircle2,Loader2,Inbox}from'lucide-react';

export default function Distribution(){
  const [rows,setRows]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');

  async function load(){
    try{setError('');setRows(await api.donations('?mine=true'))}
    catch(err){setError(err.message||'Could not load accepted donations.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);

  async function markDelivered(d){
    setBusy(d._id);setError('');
    try{await api.status(d._id,'delivered');await load()}
    catch(err){setError(err.message||'Could not update this donation.')}
    finally{setBusy('')}
  }

  const ready=rows.filter(r=>r.status==='accepted').length;
  const moving=rows.filter(r=>['picked_up','in_transit'].includes(r.status)).length;
  const done=rows.filter(r=>r.status==='delivered').length;

  return <Layout>
    <PageHeader title="Distribution" subtitle="Track how accepted food moves from pickup to community distribution."/>
    {error&&<div className="card p-4 mb-5 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    <div className="grid sm:grid-cols-3 gap-4 mb-6">
      {[['Awaiting pickup',ready,'status-accepted'],['In distribution',moving,'status-in_transit'],['Completed',done,'status-delivered']].map(([label,value])=>
        <div className="card p-5" key={label}><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-black text-green-800 mt-2">{value}</p></div>)}
    </div>
    {loading?<div className="card p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Loading your accepted donations…</p></div>
    :rows.length===0?<div className="card p-10 text-center">
        <Inbox className="mx-auto text-green-600" size={36}/>
        <p className="font-black mt-3">No accepted donations yet</p>
        <p className="text-sm text-slate-500 mt-1">Accept a donation from Nearby Donations and it will show up here for pickup and distribution.</p>
        <Link to="/nearby" className="btn btn-primary mt-5 inline-flex">Find donations</Link>
      </div>
    :<div className="card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50"><tr>
          <th className="text-left p-4">Donation</th><th className="text-left p-4">Quantity</th>
          <th className="text-left p-4">People served</th><th className="text-left p-4">Volunteer</th>
          <th className="text-left p-4">Status</th><th className="text-left p-4">Action</th>
        </tr></thead>
        <tbody>{rows.map(d=><tr className="border-t" key={d._id}>
          <td className="p-4 font-bold">{d.foodName}<p className="text-xs text-slate-500 font-normal">{d.pickupLocation||'—'}</p></td>
          <td className="p-4">{d.quantity} {d.unit}</td>
          <td className="p-4">{d.peopleServed||0}</td>
          <td className="p-4">{d.volunteerId?.name||'Unassigned'}</td>
          <td className="p-4"><span className={`status status-${d.status}`}>{d.status?.replace('_',' ')}</span></td>
          <td className="p-4">{d.status!=='delivered'
            ?<button disabled={busy===d._id} className="btn btn-secondary text-xs" onClick={()=>markDelivered(d)}><CheckCircle2 size={15}/>{busy===d._id?'Updating…':'Mark delivered'}</button>
            :<span className="text-green-700 font-bold text-xs flex gap-1 items-center"><CheckCircle2 size={15}/>Done</span>}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    <div className="grid sm:grid-cols-2 gap-5 mt-6">
      <div className="card p-6"><h2 className="font-black flex gap-2 items-center"><Truck className="text-green-600"/>Volunteer assignments</h2>
        <p className="text-sm text-slate-500 mt-2">Volunteers see every donation accepted by your NGO once it is assigned to them, and update pickup, transit and delivery status themselves.</p>
        <Link to="/donations" className="btn btn-secondary mt-4 inline-flex">Open donations</Link></div>
      <div className="card p-6"><h2 className="font-black flex gap-2 items-center"><Users className="text-green-600"/>Impact so far</h2>
        <p className="text-4xl font-black text-green-800 mt-3">{rows.reduce((s,d)=>s+(d.peopleServed||0),0)}</p>
        <p className="text-sm text-slate-500">people served by your accepted donations</p></div>
    </div>
  </Layout>
}
