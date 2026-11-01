import{NavLink,useNavigate}from'react-router-dom';import{LayoutDashboard,PlusCircle,Package,BarChart3,Bell,UserCircle,Map,BrainCircuit,Truck,Users,FileText,Settings,LogOut,HeartHandshake,ShieldAlert,ScrollText,BadgeCheck}from'lucide-react';import{clearSession,session}from'../services/api';

const common=[['Dashboard','/dashboard',LayoutDashboard],['Donate Food','/donate',PlusCircle],['My Donations','/donations',Package],['Analytics','/analytics',BarChart3],['Map & Route','/map',Map],['AI Insights','/ai',BrainCircuit],['Notifications','/notifications',Bell],['Profile','/profile',UserCircle]];
const ngo=[['Nearby Donations','/nearby',HeartHandshake],['My Requests','/requests',Package],['Distribution','/distribution',Truck]];
const vol=[['Pickup Tasks','/tasks',Truck]];
const admin=[['Users','/users',Users],['NGO Verification','/users',BadgeCheck],['Disputes','/disputes',ShieldAlert],['Reports','/reports',FileText],['Audit Log','/audit',ScrollText],['Settings','/settings',Settings]];

export default function Sidebar(){
  const nav=useNavigate();const s=session();const role=s?.user?.role;
  let items=common;
  if(role==='ngo')items=[common[0],...ngo,...common.slice(2)];
  if(role==='volunteer')items=[common[0],...vol,...common.slice(2)];
  if(role==='admin')items=[common[0],...admin,...common.slice(2)];
  const pendingVerification=role==='ngo'&&s?.user?.verification!=='verified';

  return <aside className="hidden lg:flex w-64 shrink-0 min-h-screen bg-white dark:bg-slate-900 border-r border-green-100 dark:border-slate-800 p-4 flex-col">
    <div className="font-black text-green-800 dark:text-green-400 text-lg px-3 py-3 flex gap-2 items-center"><HeartHandshake size={22}/> FoodBridge</div>
    <div className="text-xs uppercase tracking-wider text-slate-400 px-3 mt-4 mb-2">{role||'member'} workspace</div>
    {pendingVerification&&<NavLink to="/profile" className="mb-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold p-3">Verification pending — an administrator must approve your NGO before you can accept donations.</NavLink>}
    <nav className="space-y-1 overflow-y-auto">
      {items.map(([label,path,Icon])=><NavLink key={label} to={path} className={({isActive})=>`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${isActive?'bg-green-50 text-green-800 dark:bg-slate-800 dark:text-green-300':'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}><Icon size={18}/>{label}</NavLink>)}
    </nav>
    <div className="mt-auto pt-4">
      <button onClick={()=>{clearSession();nav('/')}} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50"><LogOut size={18}/>Logout</button>
    </div>
  </aside>
}
