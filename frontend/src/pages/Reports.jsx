import{useEffect,useState}from'react';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api}from'../services/api';import{FileText,Download,Printer,Loader2}from'lucide-react';

export default function Reports(){
  const [r,setR]=useState(null);
  const [error,setError]=useState('');

  useEffect(()=>{api.report().then(setR).catch(e=>setError(e.message||'Could not build the report.'))},[]);

  function download(){
    const blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download=`foodbridge-impact-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
  }

  const cells=r?[
    ['Users',r.users],['Donations',r.donations],['Delivered',r.delivered],['Deliveries',r.deliveries],
    ['Food rescued (kg)',Math.round(r.totalFood)],['People served',Math.round(r.peopleServed)],
    ['CO₂ saved (kg)',Math.round(r.co2Saved)],['Success rate',`${r.successRate}%`],['Open disputes',r.openReports]
  ]:[];

  return <Layout>
    <PageHeader title="Reports" subtitle="Impact and operational summaries computed from live records."
      action={<div className="flex gap-2"><button disabled={!r} className="btn btn-secondary" onClick={()=>window.print()}><Printer size={17}/>Print</button>
      <button disabled={!r} className="btn btn-primary" onClick={download}><Download size={17}/>Download JSON</button></div>}/>
    {error&&<div className="card p-4 bg-red-50 text-red-700 text-sm font-bold">{error}</div>}
    {!r&&!error?<div className="card p-12 text-center text-slate-500"><Loader2 className="animate-spin mx-auto"/><p className="mt-3">Building report…</p></div>
    :r&&<div className="card p-6 max-w-4xl">
      <div className="flex gap-3 items-center">
        <div className="w-12 h-12 bg-green-50 rounded-xl grid place-items-center text-green-700"><FileText/></div>
        <div><h2 className="font-black text-xl">FoodBridge Impact Report</h2>
          <p className="text-sm text-slate-500">Generated {new Date(r.generatedAt).toLocaleString()}</p></div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
        {cells.map(([label,value])=><div className="bg-slate-50 rounded-xl p-5" key={label}>
          <p className="text-sm text-slate-500">{label}</p><p className="text-2xl font-black text-green-800 mt-2">{value}</p></div>)}
      </div>
      <p className="text-xs text-slate-400 mt-6">All figures are aggregated from the production database at generation time; nothing here is hard-coded.</p>
    </div>}
  </Layout>
}
