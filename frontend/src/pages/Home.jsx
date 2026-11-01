import{Link}from'react-router-dom';import{useEffect,useState}from'react';import{ArrowRight,BarChart3,BrainCircuit,HeartHandshake,Leaf,Route,ShieldCheck,Truck,Users,Utensils,Globe2,Loader2}from'lucide-react';import{TrendChart}from'../components/Charts';import{API}from'../services/api';

const formatters=[
  ['Food Donated',(o)=>`${Math.round(o.totalFood||0).toLocaleString()} kg`],
  ['Meals Served',(o)=>(o.peopleServed||0).toLocaleString()],
  ['Active Donors',(o)=>o.activeDonors||0],
  ['NGOs Connected',(o)=>o.verifiedNgos||0],
  ['Deliveries',(o)=>o.deliveries||0],
  ['CO₂ Reduction',(o)=>`${Math.round(o.co2Saved||0).toLocaleString()} kg`]
];

export default function Home(){
  const [o,setO]=useState(null);

  useEffect(()=>{
    // Public network figures. Requires an anonymous-readable endpoint; when the
    // API is unreachable the page shows an honest placeholder instead of numbers.
    fetch(`${API}/analytics/public`)
      .then(r=>r.ok?r.json():Promise.reject(new Error('unavailable')))
      .then(setO)
      .catch((err)=>{console.error('[FoodBridge] public figures unavailable:', `${API}/analytics/public`, err && err.message);setO(false)});
  },[]);

  const loading=o===null;
  const live=!!o;
  const trend=(o&&o.monthly&&o.monthly.length?o.monthly.map(m=>({name:m.month,food:m.quantity,demand:m.delivered})):[]);

  return <>
    <section className="grid-bg">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-800 rounded-full px-3 py-1 text-sm font-bold"><Leaf size={16}/> Sustainable food distribution</div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mt-5 leading-[.98]">Turn Surplus Food Into <span className="text-green-700">Meaningful Impact</span></h1>
          <p className="text-lg text-slate-600 mt-6 max-w-xl">Connect food donors with NGOs and volunteers to reduce food waste and deliver surplus food to people who need it.</p>
          <div className="flex flex-wrap gap-3 mt-8"><Link to="/register" className="btn btn-primary">Donate Food <ArrowRight size={18}/></Link><Link to="/login" className="btn btn-secondary">Explore Platform</Link></div>
          <div className="flex gap-6 mt-8 text-sm font-bold text-slate-600">
            <span className="flex gap-2 items-center"><ShieldCheck size={18} className="text-green-600"/>Verified partners</span>
            <span className="flex gap-2 items-center"><Globe2 size={18} className="text-green-600"/>Impact analytics</span>
          </div>
        </div>
        <div className="relative">
          <div className="gradient-green rounded-[2rem] p-8 text-white shadow-soft">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-green-100">Network to date</p>
                {loading?<p className="text-2xl font-black mt-2 flex items-center gap-2"><Loader2 className="animate-spin" size={20}/>loading…</p>
                :live?<p className="text-4xl font-black mt-2">{Math.round(o.totalFood||0).toLocaleString()} kg</p>
                :<p className="text-2xl font-black mt-2">Live figures unavailable</p>}
                <p className="text-green-100 mt-1">{live?'surplus food rescued':loading?'fetching network data':'the API is not reachable from this deployment'}</p>
              </div>
              <HeartHandshake size={48}/>
            </div>
            <div className="bg-white/10 rounded-2xl p-5 mt-8">
              <div className="flex justify-between"><span>Delivery efficiency</span><b>{live?`${o.successRate||0}%`:'—'}</b></div>
              <div className="h-3 bg-white/20 rounded-full mt-3"><div className="h-3 bg-white rounded-full" style={{width:`${live?Math.min(100,o.successRate||0):0}%`}}/></div>
              <div className="grid grid-cols-3 gap-3 mt-6 text-center">
                <div><b className="text-2xl">{live?o.activeDonors||0:'—'}</b><p className="text-xs text-green-100">Donors</p></div>
                <div><b className="text-2xl">{live?o.verifiedNgos||0:'—'}</b><p className="text-xs text-green-100">NGOs</p></div>
                <div><b className="text-2xl">{live?o.activeVolunteers||0:'—'}</b><p className="text-xs text-green-100">Volunteers</p></div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-5 -left-5 card p-4">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 bg-green-100 rounded-xl grid place-items-center text-green-700"><Utensils/></div>
              <div><b>{live?(o.peopleServed||0).toLocaleString():'—'} meals</b><p className="text-xs text-slate-500">served to date</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="max-w-7xl mx-auto px-4 py-14">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {formatters.map(([label,fmt])=><div className="card p-5" key={label}>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-black text-green-800 mt-2">{live?fmt(o):loading?'…':'—'}</p>
        </div>)}
      </div>
      <p className="text-xs text-slate-400 mt-3">{live?'Figures are aggregated from the production database when this page loads.':loading?'Loading live figures…':'Live figures could not be loaded from the API.'}</p>
    </section>

    <section id="how" className="bg-white border-y border-green-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto"><p className="text-green-700 font-black uppercase tracking-widest text-xs">How it works</p><h2 className="text-4xl font-black mt-2">From surplus to service in four steps</h2></div>
        <div className="grid md:grid-cols-4 gap-5 mt-10">
          {[['1','Donor posts surplus food',Utensils],['2','NGO accepts donation',HeartHandshake],['3','Volunteer picks it up',Truck],['4','Food reaches communities',Users]].map(([n,t,I])=>
            <div className="card p-6" key={n}><div className="flex justify-between"><span className="w-10 h-10 rounded-full gradient-green text-white grid place-items-center font-black">{n}</span><I className="text-green-600"/></div>
            <h3 className="font-black text-lg mt-6">{t}</h3><p className="text-sm text-slate-500 mt-2">Every handoff is tracked for visibility, safety and impact.</p></div>)}
        </div>
      </div>
    </section>

    <section id="impact" className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <p className="text-green-700 font-black uppercase tracking-widest text-xs">Network impact</p>
          <h2 className="text-4xl font-black mt-2">Data that turns food rescue into measurable change.</h2>
          <p className="text-slate-600 mt-4">Track donation volumes, demand, distribution efficiency and carbon reduction across the network.</p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="card p-5"><BarChart3 className="text-green-600"/><b className="block mt-3">Analytics</b><p className="text-sm text-slate-500 mt-1">Daily, weekly and monthly views.</p></div>
            <div className="card p-5"><BrainCircuit className="text-green-600"/><b className="block mt-3">AI Insights</b><p className="text-sm text-slate-500 mt-1">Rule-based forecasts and surplus signals.</p></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex justify-between items-center"><div><b>Food rescued vs delivered</b><p className="text-sm text-slate-500">{live?'Last six months, from live records':'Available once the API is connected'}</p></div><Route className="text-green-600"/></div>
          {live&&trend.length?<TrendChart data={trend}/>:<div className="h-64 grid place-items-center text-sm text-slate-400">{loading?'Loading chart…':'No live data to chart yet'}</div>}
        </div>
      </div>
    </section>

    <footer id="about" className="bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
        <div><b className="text-xl">FoodBridge</b><p className="text-slate-400 mt-3 text-sm">A food donation coordination and analytics platform.</p></div>
        <div><b>Platform</b><p className="text-slate-400 text-sm mt-3">Donations · Matching · Routes · Analytics</p></div>
        <div><b>Partners</b><p className="text-slate-400 text-sm mt-3">Donors · NGOs · Volunteers · Government</p></div>
        <div><b>Get started</b><div className="mt-3"><Link to="/register" className="btn btn-primary">Create account</Link></div></div>
      </div>
    </footer>
  </>;
}
