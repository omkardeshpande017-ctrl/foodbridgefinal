import{useEffect,useState}from'react';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{Truck,MapPin,Users,CheckCircle2,Loader2,Inbox,ArrowRight}from'lucide-react';

export default function Distribution(){
  const [rows,setRows]=useState([]);
  const [volunteers,setVolunteers]=useState([]);
  const [assign,setAssign]=useState({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState('');

  async function load(){
    try{
      setError('');
      const [donations,vols]=await Promise.all([api.donations({mine:'true',limit:100}),api.volunteers()]);
      setRows(donations.items||[]);setVolunteers(vols||[]);
    }catch(err){setError(err.message||'Could not load accepted donations.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);

  async function markDelivered(d){
    setBusy(d._id);setError('');setMsg('');
    try{await api.status(d._id,'delivered');setMsg(`${d.foodName} marked delivered.`);await load()}
    catch(err){setError(err.message||'Could not update this donation.')}
    finally{setBusy('')}
  }

  async function assignVolunteer(d){
    const volunteerId=assign[d._id];
    if(!volunteerId){setError('Choose a volunteer first.');return}
    setBusy(d._id);setError('');setMsg('');
    try{
      await api.createDelivery({donationId:d._id,volunteerId,pickup:d.pickupLocation,dropoff:d.ngoId?.organization||d.ngoId?.name||'NGO hub'});
      setMsg('Volunteer assigned — the task now appears in their dashboard.');await load();
    }catch(err){setError(err.message||'Could not assign this volunteer.')}
    finally{setBusy('')}
  }

  const ready=rows.filter(r=>r.status==='accepted'&&!r.volunteerId).length;
  const moving=rows.filter(r=>['picked_up','in_transit'].includes(r.status)).length;
  const done=rows.filter(r=>r.status==='delivered').length;

  return <Layout>
    <PageHeader title="Distribution" subtitle="Assign volunteers and track accepted food from pickup to community delivery."/>
    {error&&<div className="card p-4 mb-4 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    {msg&&<div className="card p-4 mb-4 bg-green-50 text-green-800 text-sm font-bold">{msg}</div>}
    <div className="grid sm:grid-cols-3 gap-4 mb-6">
      {[['Awaiting volunteer',ready],['In distribution',moving],['Completed',done]].map(([label,value])=>
        <div className="card p-5" key={label}><p className="text-sm text-slate-500">{label}</p><p className="text-3xl font-black text-green-800 dark:text-green-400 mt-2">{value}</p></div>)}
    </div>
    {loading?<div className="card p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Loading…</p></div>
    :rows.length===0?<div className="card p-10 text-center">
        <Inbox className="mx-auto text-green-600" size={36}/>
        <p className="font-black mt-3">No accepted donations yet</p>
        <p className="text-sm text-slate-500 mt-1">Accept a donation from Nearby Donations and it appears here for pickup and distribution.</p>
        <a href="/nearby" className="btn btn-primary mt-5 inline-flex">Find donations<ArrowRight size={16}/></a>
      </div>
    :<div className="card overflow-x-auto"><table className="w-full text-sm">
      <thead className="bg-slate-50"><tr>
        <th className="text-left p-4">Donation</th><th className="text-left p-4">Quantity</th>
        <th className="text-left p-4">People served</th><th className="text-left p-4">Volunteer</th>
        <th className="text-left p-4">Status</th><th className="text-left p-4">Action</th>
      </tr></thead>
      <tbody>{rows.map(d=><tr className="border-t" key={d._id}>
        <td className="p-4 font-bold">{d.foodName}<p className="text-xs text-slate-500 font-normal">{d.pickupLocation||'—'}</p></td>
        <td className="p-4">{d.quantity} {d.unit}</td>
        <td className="p-4">{d.peopleServed||0}</td>
        <td className="p-4">
          {d.volunteerId?.name?<span className="flex gap-1 items-center"><Truck size={14} className="text-green-600"/>{d.volunteerId.name}</span>
          :<div className="flex gap-2">
            <select className="input py-1 text-xs" value={assign[d._id]||''} onChange={e=>setAssign({...assign,[d._id]:e.target.value})}>
              <option value="">Choose volunteer…</option>
              {volunteers.map(v=><option key={v._id} value={v._id}>{v.name}{v.location?` · ${v.location}`:''}</option>)}
            </select>
            <button disabled={busy===d._id} className="btn btn-secondary text-xs" onClick={()=>assignVolunteer(d)}><Users size={14}/>Assign</button>
          </div>}
        </td>
        <td className="p-4"><span className={`status status-${d.status}`}>{d.status?.replace('_',' ')}</span></td>
        <td className="p-4">{d.status!=='delivered'
          ?<button disabled={busy===d._id} className="btn btn-secondary text-xs" onClick={()=>markDelivered(d)}><CheckCircle2 size={15}/>{busy===d._id?'Updating…':'Mark delivered'}</button>
          :<span className="text-green-700 font-bold text-xs flex gap-1 items-center"><CheckCircle2 size={15}/>Done</span>}</td>
      </tr>)}</tbody>
    </table></div>}
    <div className="grid sm:grid-cols-2 gap-5 mt-6">
      <div className="card p-6"><h2 className="font-black flex gap-2 items-center"><MapPin className="text-green-600"/>Pickup coordination</h2>
        <p className="text-sm text-slate-500 mt-2">Assign a volunteer and they see the pickup and drop-off in their task list, updating each step as they go.</p></div>
      <div className="card p-6"><h2 className="font-black flex gap-2 items-center"><Users className="text-green-600"/>Impact so far</h2>
        <p className="text-4xl font-black text-green-800 dark:text-green-400 mt-3">{rows.reduce((s,d)=>s+(d.peopleServed||0),0)}</p>
        <p className="text-sm text-slate-500">people served by your accepted donations</p></div>
    </div>
  </Layout>
}
