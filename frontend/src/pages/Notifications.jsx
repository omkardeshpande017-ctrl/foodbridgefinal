import{useEffect,useState}from'react';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{Bell,Check,CheckCheck,Loader2,Inbox}from'lucide-react';

export default function Notifications(){
  const [ns,setNs]=useState([]);
  const [unread,setUnread]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');

  async function load(){
    try{const res=await api.notifications();setNs(res.items||[]);setUnread(res.unread||0)}
    catch(err){setError(err.message||'Could not load notifications.')}
    finally{setLoading(false)}
  }
  useEffect(()=>{load()},[]);

  async function read(n){
    try{await api.readNotification(n._id);setNs(ns.map(x=>x._id===n._id?{...x,read:true}:x));setUnread(u=>Math.max(0,u-1))}catch{}
  }
  async function readAll(){
    try{await api.readAllNotifications();setNs(ns.map(x=>({...x,read:true})));setUnread(0)}catch{}
  }

  return <Layout>
    <PageHeader title="Notifications" subtitle="Updates from donations, matching and deliveries."
      action={ns.length?<button className="btn btn-secondary" onClick={readAll}><CheckCheck size={16}/>Mark all read</button>:null}/>
    {error&&<div className="card p-4 mb-4 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    <p className="text-sm text-slate-500 mb-4">{unread} unread of {ns.length}</p>
    {loading?<div className="card p-10 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Loading notifications…</p></div>
    :ns.length===0?<div className="card p-10 text-center">
        <Inbox className="mx-auto text-green-600" size={36}/>
        <p className="font-black mt-3">No notifications yet</p>
        <p className="text-sm text-slate-500 mt-1">When a donation is accepted, a pickup is assigned or a delivery completes, updates appear here.</p>
      </div>
    :<div className="max-w-3xl grid gap-3">{ns.map(n=><div key={n._id} className={`card p-5 flex gap-4 ${n.read?'opacity-70':''}`}>
      <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 grid place-items-center shrink-0"><Bell size={18}/></div>
      <div className="flex-1"><b>{n.title}</b><p className="text-sm text-slate-500 mt-1">{n.message}</p>
        <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p></div>
      {!n.read&&<button className="btn btn-secondary text-xs h-fit" onClick={()=>read(n)}><Check size={15}/>Read</button>}
    </div>)}</div>}
  </Layout>
}
