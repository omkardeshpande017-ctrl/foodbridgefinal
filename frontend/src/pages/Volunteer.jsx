import{useEffect,useState}from'react';import{Link}from'react-router-dom';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{Truck,MapPin,Clock,CheckCircle2,Inbox}from'lucide-react';

const NEXT={assigned:'picked_up',picked_up:'in_transit',in_transit:'delivered'};
const LABEL={assigned:'Mark Picked Up',picked_up:'Start Delivery',in_transit:'Complete Delivery'};

export default function Volunteer(){
  const [tasks,setTasks]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState('');

  async function load(){
    try{
      setError('');
      setTasks(await api.deliveries());
    }catch(err){
      setError(err.message||'Could not load your pickup tasks.');
    }finally{
      setLoading(false);
    }
  }
  useEffect(()=>{load()},[]);

  async function update(t){
    const next=NEXT[t.status];
    if(!next)return;
    setBusy(t._id);setError('');
    try{
      await api.updateDelivery(t._id,{status:next});
      await load();
    }catch(err){
      setError(err.message||'Could not update this delivery.');
    }finally{
      setBusy('');
    }
  }

  return <Layout>
    <PageHeader title="Pickup Tasks" subtitle="Manage pickup, route and delivery progress."/>
    {error&&<div className="card p-4 mb-5 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    {loading?<div className="card p-10 text-center text-slate-500">Loading your assigned deliveries…</div>
    :tasks.length===0?<div className="card p-10 text-center">
        <Inbox className="mx-auto text-green-600" size={36}/>
        <p className="font-black mt-3">No deliveries assigned yet</p>
        <p className="text-sm text-slate-500 mt-1">An NGO assigns a donation to you and it will appear here with pickup and drop-off details.</p>
        <Link to="/donations" className="btn btn-secondary mt-5 inline-flex">Browse donations</Link>
      </div>
    :<div className="grid lg:grid-cols-2 gap-5">{tasks.map(t=>{
      const donation=t.donationId||{};
      return <div className="card p-6" key={t._id}>
        <div className="flex justify-between gap-3">
          <div className="flex gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 grid place-items-center"><Truck/></div>
            <div>
              <h3 className="font-black">{donation.foodName||`Delivery #${String(t._id).slice(-4)}`}</h3>
              <p className="text-sm text-slate-500">{t.distanceKm} km · {t.etaMinutes} min{donation.quantity?` · ${donation.quantity} ${donation.unit||''}`:''}</p>
            </div>
          </div>
          <span className={`status status-${t.status}`}>{t.status.replace('_',' ')}</span>
        </div>
        <div className="mt-6 space-y-3">
          <div className="flex gap-3"><MapPin className="text-red-600 shrink-0" size={18}/><span>{t.pickup||donation.pickupLocation||'Pickup location not set'}</span></div>
          <div className="border-l-2 border-dashed border-slate-200 h-5 ml-2"/>
          <div className="flex gap-3"><MapPin className="text-blue-600 shrink-0" size={18}/><span>{t.dropoff||'Drop-off location not set'}</span></div>
          {(donation.pickupDate||donation.pickupTime)&&<div className="flex gap-3 text-sm text-slate-600"><Clock size={18} className="text-green-600"/><span>{donation.pickupDate||''} {donation.pickupTime||''}</span></div>}
        </div>
        <div className="flex gap-2 mt-6">
          {NEXT[t.status]&&<button disabled={busy===t._id} className="btn btn-primary" onClick={()=>update(t)}>{busy===t._id?'Updating…':LABEL[t.status]}</button>}
          <Link to="/map" className="btn btn-secondary">View Route</Link>
        </div>
        {t.status==='delivered'&&<p className="text-green-700 font-bold text-sm mt-3 flex gap-2"><CheckCircle2 size={17}/>Delivery completed</p>}
      </div>})}
    </div>}
  </Layout>
}
