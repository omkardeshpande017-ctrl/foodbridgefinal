import{useEffect,useState}from'react';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import DonationCard from'../components/DonationCard';import{api}from'../services/api';import{Search,Filter,ChevronLeft,ChevronRight,Loader2,Inbox}from'lucide-react';

export default function Donations({nearby=false}){
  const [ds,setDs]=useState([]);
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('');
  const [page,setPage]=useState(1);
  const [meta,setMeta]=useState({total:0,pages:1});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  async function load(targetPage=page){
    setLoading(true);setError('');
    try{
      const params={page:targetPage,limit:12,search};
      if(status)params.status=status;
      if(nearby)params.available='true';
      const res=await api.donations(params);
      setDs(res.items||[]);setMeta({total:res.total||0,pages:res.pages||1});
    }catch(err){
      setError(err.message||'Could not load donations.');setDs([]);
    }finally{setLoading(false)}
  }
  useEffect(()=>{load(1);setPage(1)},[status,nearby]);

  async function accept(d){
    setError('');
    try{await api.acceptDonation(d._id);await load(page)}
    catch(err){setError(err.message||'Could not accept donation. Please retry.')}
  }

  return <Layout>
    <PageHeader title={nearby?'Nearby Donations':'My Donations'} subtitle={nearby?'Find available surplus food and accept a matching donation.':'Track every donation from posting to delivery.'}/>
    <div className="card p-4 mb-5 flex flex-col md:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
        <input className="input pl-10" placeholder="Search food, category or pickup area…" value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>e.key==='Enter'&&(setPage(1),load(1))}/>
      </div>
      <select className="input md:w-48" value={status} onChange={e=>setStatus(e.target.value)}>
        <option value="">All statuses</option>
        {['available','accepted','picked_up','in_transit','delivered','expired','cancelled'].map(x=><option key={x} value={x}>{x.replace('_',' ')}</option>)}
      </select>
      <button className="btn btn-secondary" onClick={()=>{setPage(1);load(1)}}><Filter size={17}/>Apply</button>
    </div>
    {error&&<div className="card p-4 mb-5 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    {loading?<div className="card p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Loading donations…</p></div>
    :ds.length?<div className="grid lg:grid-cols-2 gap-5">{ds.map(d=><DonationCard key={d._id} d={d} onAccept={nearby?accept:null}/>)}</div>
    :<div className="card p-10 text-center"><Inbox className="mx-auto text-green-600" size={36}/><p className="font-black mt-3">No donations found</p><p className="text-sm text-slate-500 mt-1">Try another filter or create a new donation.</p></div>}
    {meta.pages>1&&<div className="flex items-center justify-between mt-6">
      <p className="text-sm text-slate-500">{meta.total} donation{meta.total===1?'':'s'} · page {page} of {meta.pages}</p>
      <div className="flex gap-2">
        <button disabled={page<=1} className="btn btn-secondary text-sm" onClick={()=>{const p=page-1;setPage(p);load(p)}}><ChevronLeft size={16}/>Previous</button>
        <button disabled={page>=meta.pages} className="btn btn-secondary text-sm" onClick={()=>{const p=page+1;setPage(p);load(p)}}>Next<ChevronRight size={16}/></button>
      </div>
    </div>}
  </Layout>
}
