import{useEffect,useState}from'react';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{MiniLine}from'../components/Charts';import{BrainCircuit,Sparkles,AlertTriangle,CheckCircle2,Loader2}from'lucide-react';

const severityIcon=(s)=>s==='high'?<AlertTriangle className="text-amber-500"/>:<CheckCircle2 className="text-green-600"/>;

export default function AI(){
  const [data,setData]=useState(null);
  const [error,setError]=useState('');

  useEffect(()=>{api.ai().then(setData).catch(e=>setError(e.message||'Could not load insights.'))},[]);

  if(error)return <Layout><PageHeader title="AI Insights" subtitle="Decision-support signals computed from live records."/>
    <div className="card p-8 text-center"><p className="font-black text-red-700">{error}</p></div></Layout>;
  if(!data)return <Layout><div className="card p-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Analysing live data…</p></div></Layout>;

  return <Layout>
    <PageHeader title="AI Insights" subtitle="Decision-support signals computed from live donation and partner records."/>
    <div className="card p-5 bg-gradient-to-r from-green-900 to-green-700 text-white">
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-2xl bg-white/10 grid place-items-center"><BrainCircuit/></div>
        <div>
          <p className="text-green-200 text-xs font-black uppercase tracking-widest">{data.method==='rule-based'?'Rule-based analysis':'Insights'}</p>
          <h2 className="text-2xl font-black">Food rescue decision support</h2>
          <p className="text-green-100 text-sm mt-1">Confidence {Math.round((data.confidence||0)*100)}% · computed {new Date(data.generatedAt||Date.now()).toLocaleString()} from {data.method==='rule-based'?'deterministic rules over live records':'live records'}.</p>
        </div>
      </div>
    </div>

    <div className="grid lg:grid-cols-3 gap-5 mt-6">
      {(data.insights||[]).map(x=><div key={x.title} className="card p-6">
        <div className="flex justify-between"><Sparkles className="text-green-600"/>{severityIcon(x.severity)}</div>
        <h3 className="font-black mt-5">{x.title}</h3>
        <p className="text-sm text-slate-500 mt-2">{x.text}</p>
      </div>)}
    </div>

    <div className="grid lg:grid-cols-2 gap-6 mt-6">
      <div className="card p-5"><h2 className="font-black">7-day demand forecast</h2>
        <p className="text-sm text-slate-500 mb-3">Same-weekday average of the last 14 days of donations.</p>
        <MiniLine data={data.forecast||[]}/></div>
      <div className="card p-5"><h2 className="font-black">Recommended actions</h2>
        <ol className="space-y-4 mt-5 text-sm">{(data.insights||[]).slice(0,4).map((x,i)=><li key={x.title} className="flex gap-3">
          <b className="w-7 h-7 rounded-full bg-green-100 text-green-800 grid place-items-center shrink-0">{i+1}</b>
          <span>{x.severity==='high'?`Act now: ${x.title.toLowerCase()}.`:`Monitor: ${x.title.toLowerCase()}.`}</span></li>)}</ol>
        <p className="text-xs text-slate-400 mt-4">Derived from the same live signals above — nothing here is hard-coded.</p></div>
    </div>
  </Layout>
}
