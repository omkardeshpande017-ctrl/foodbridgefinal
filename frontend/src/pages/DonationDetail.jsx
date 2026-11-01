import{useEffect,useState}from'react';import{useParams,Link}from'react-router-dom';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api,session}from'../services/api';import{MapPin,Clock,Users,Leaf,ArrowLeft,Loader2,History,ImageOff}from'lucide-react';

const STEPS=['available','accepted','picked_up','in_transit','delivered'];

export default function DonationDetail(){
  const {id}=useParams();
  const [d,setD]=useState(null);
  const [error,setError]=useState('');
  const role=session()?.user?.role;

  useEffect(()=>{api.donation(id).then(setD).catch(e=>setError(e.message||'Could not load this donation.'))},[id]);

  if(error)return <Layout><PageHeader title="Donation" subtitle="Details"/><div className="card p-8 text-center"><p className="font-black text-red-700">{error}</p><Link to="/donations" className="btn btn-secondary mt-5 inline-flex"><ArrowLeft size={16}/>Back to donations</Link></div></Layout>;
  if(!d)return <Layout><div className="card p-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Loading donation…</p></div></Layout>;

  const currentIndex=STEPS.indexOf(d.status);

  return <Layout>
    <PageHeader title={d.foodName} subtitle={`${d.category} · ${d.quantity} ${d.unit} · posted ${new Date(d.createdAt).toLocaleString()}`}
      action={<Link to={role==='ngo'?'/nearby':'/donations'} className="btn btn-secondary"><ArrowLeft size={16}/>Back</Link>}/>

    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 grid gap-6">
        <div className="card p-6">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h2 className="font-black text-lg">Lifecycle</h2>
              <p className="text-sm text-slate-500">Timestamped status history, written by the API on every transition.</p>
            </div>
            <span className={`status status-${d.status}`}>{d.status?.replace('_',' ')}</span>
          </div>

          {['expired','cancelled'].includes(d.status)?<p className="mt-4 text-sm font-bold text-red-700">This donation ended as {d.status}.</p>
          :<div className="flex items-center gap-2 mt-6">
            {STEPS.map((s,i)=><div key={s} className="flex-1">
              <div className={`h-2 rounded-full ${i<=currentIndex?'bg-green-600':'bg-slate-200'}`}/>
              <p className={`text-xs mt-2 capitalize ${i<=currentIndex?'text-green-800 font-bold':'text-slate-400'}`}>{s.replace('_',' ')}</p>
            </div>)}
          </div>}

          <div className="mt-6 grid gap-3">
            {(d.history||[]).slice().reverse().map((h,i)=><div key={i} className="flex gap-3 text-sm">
              <History size={16} className="text-green-600 mt-0.5 shrink-0"/>
              <div><b className="capitalize">{h.status?.replace('_',' ')}</b>
                <span className="text-slate-500"> · {new Date(h.at).toLocaleString()}</span>
                {h.by?.name&&<span className="text-slate-500"> · {h.by.name} ({h.byRole||h.by.role})</span>}
                {h.note&&<p className="text-slate-500">{h.note}</p>}
              </div>
            </div>)}
            {!d.history?.length&&<p className="text-sm text-slate-500">No history recorded yet.</p>}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-black text-lg">Details</h2>
          <div className="grid sm:grid-cols-2 gap-4 mt-4 text-sm text-slate-700">
            <div className="flex gap-2"><MapPin size={16} className="text-green-600"/>{d.pickupLocation}</div>
            <div className="flex gap-2"><Clock size={16} className="text-green-600"/>{d.pickupDate||'—'} {d.pickupTime||''}</div>
            <div className="flex gap-2"><Users size={16} className="text-green-600"/>{d.peopleServed||0} people served</div>
            <div className="flex gap-2"><Leaf size={16} className="text-green-600"/>{d.co2Saved||0} kg CO₂ saved</div>
          </div>
          {d.expiryTime&&<p className="text-sm mt-4"><b>Expires:</b> {new Date(d.expiryTime).toLocaleString()}</p>}
          {d.description&&<p className="text-sm mt-3 text-slate-600">{d.description}</p>}
          {d.notes&&<p className="text-sm mt-3 text-slate-500 italic">{d.notes}</p>}
        </div>
      </div>

      <div className="grid gap-6 content-start">
        <div className="card p-6">
          <h2 className="font-black">People</h2>
          <div className="grid gap-3 mt-4 text-sm">
            <p><span className="text-slate-500">Donor</span><br/><b>{d.donorId?.name||'—'}</b>{d.donorId?.organization?<span className="text-slate-500"> · {d.donorId.organization}</span>:null}</p>
            <p><span className="text-slate-500">NGO</span><br/><b>{d.ngoId?.name||'Not accepted yet'}</b></p>
            <p><span className="text-slate-500">Volunteer</span><br/><b>{d.volunteerId?.name||'Not assigned'}</b></p>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-black">Photo</h2>
          {d.image?<img src={d.image} alt={d.foodName} className="w-full rounded-xl mt-3 object-cover max-h-64"/>
          :<div className="mt-3 rounded-xl bg-slate-50 h-32 grid place-items-center text-slate-400"><ImageOff/><span className="text-xs mt-1">No photo provided</span></div>}
        </div>
      </div>
    </div>
  </Layout>
}
