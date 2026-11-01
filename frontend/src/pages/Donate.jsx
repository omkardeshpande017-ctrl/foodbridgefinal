import{useState,useEffect}from'react';import{Link,useNavigate}from'react-router-dom';import Layout from'../components/Layout';import PageHeader from'../components/PageHeader';import{api,session}from'../services/api';import{CheckCircle2,AlertTriangle,Loader2} from'lucide-react';

const CATEGORIES=['Cooked Meals','Bakery','Vegetables','Fruits','Packaged Food','Dairy','Other'];
const MAX_IMAGE_BYTES=1_400_000;

export default function Donate(){
  const nav=useNavigate();
  const [form,setForm]=useState({foodName:'',category:'Cooked Meals',quantity:'',unit:'kg',description:'',preparationDate:'',expiryTime:'',pickupLocation:'',pickupDate:'',pickupTime:'',image:'',notes:''});
  const [msg,setMsg]=useState('');const [error,setError]=useState('');const [saving,setSaving]=useState(false);
  const s=session();
  useEffect(()=>{setForm(f=>({...f,pickupLocation:f.pickupLocation||s?.user?.location||''}))},[]);
  const change=e=>setForm({...form,[e.target.name]:e.target.value});

  function pickImage(e){
    const file=e.target.files?.[0];
    if(!file){return}
    if(file.size>MAX_IMAGE_BYTES){setError('Please choose an image under 1.4 MB.');return}
    const reader=new FileReader();
    reader.onload=()=>setForm(f=>({...f,image:String(reader.result)}));
    reader.readAsDataURL(file);
  }

  async function submit(e){
    e.preventDefault();setMsg('');setError('');setSaving(true);
    try{
      const created=await api.createDonation({...form,quantity:Number(form.quantity)});
      setMsg('Donation posted successfully.');
      setTimeout(()=>nav(`/donations/${created._id}`),600);
    }catch(err){setError(err.message||'Could not save donation. Check the API connection and try again.')}
    finally{setSaving(false)}
  }

  return <Layout>
    <PageHeader title="Donate Food" subtitle="Post surplus food and make it available to verified community partners."/>
    {error&&<div className="card p-4 mb-5 bg-red-50 text-red-700 text-sm font-bold flex gap-2"><AlertTriangle size={17}/>{error}</div>}
    <form onSubmit={submit} className="max-w-5xl">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="card p-6 md:col-span-2">
          <h2 className="font-black text-lg">Food details</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-5">
            <label className="text-sm font-bold md:col-span-2">Food Name<input className="input mt-1" name="foodName" required maxLength={160} value={form.foodName} onChange={change}/></label>
            <label className="text-sm font-bold">Category<select className="input mt-1" name="category" value={form.category} onChange={change}>{CATEGORIES.map(x=><option key={x}>{x}</option>)}</select></label>
            <label className="text-sm font-bold">Quantity<input className="input mt-1" name="quantity" type="number" min="0.1" step="0.1" required value={form.quantity} onChange={change}/></label>
            <label className="text-sm font-bold">Unit<select className="input mt-1" name="unit" value={form.unit} onChange={change}><option>kg</option><option>litres</option><option>packs</option><option>meals</option></select></label>
            <label className="text-sm font-bold md:col-span-2">Description<textarea className="input mt-1 min-h-24" name="description" maxLength={2000} value={form.description} onChange={change}/></label>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-black text-lg">Safety &amp; timing</h2>
          <div className="grid gap-4 mt-5">
            <label className="text-sm font-bold">Preparation Date<input className="input mt-1" type="date" name="preparationDate" value={form.preparationDate} onChange={change}/></label>
            <label className="text-sm font-bold">Expiry date &amp; time<input className="input mt-1" type="datetime-local" name="expiryTime" value={form.expiryTime} onChange={change}/></label>
            <p className="text-xs text-slate-500">Donations past their expiry are automatically marked expired and cannot be accepted.</p>
            <label className="text-sm font-bold">Additional Notes<textarea className="input mt-1 min-h-24" name="notes" maxLength={2000} value={form.notes} onChange={change}/></label>
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-black text-lg">Pickup &amp; photo</h2>
          <div className="grid gap-4 mt-5">
            <label className="text-sm font-bold">Pickup Location<input className="input mt-1" name="pickupLocation" required maxLength={240} value={form.pickupLocation} onChange={change}/></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-bold">Pickup Date<input className="input mt-1" type="date" name="pickupDate" value={form.pickupDate} onChange={change}/></label>
              <label className="text-sm font-bold">Pickup Time<input className="input mt-1" type="time" name="pickupTime" value={form.pickupTime} onChange={change}/></label>
            </div>
            <label className="text-sm font-bold">Food photo (optional, under 1.4 MB)
              <input className="input mt-1" type="file" accept="image/png,image/jpeg,image/webp" onChange={pickImage}/></label>
            {form.image&&<img src={form.image} alt="Preview" className="rounded-xl max-h-40 object-cover"/>}
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <button disabled={saving} className="btn btn-primary">{saving?<Loader2 className="animate-spin" size={17}/>:null}{saving?'Posting…':'Post Donation'}</button>
        {msg&&<span className="text-sm font-bold text-green-700 flex gap-2 items-center"><CheckCircle2 size={17}/>{msg}</span>}
        <Link to="/donations" className="text-sm font-bold text-slate-500">View my donations</Link>
      </div>
    </form>
  </Layout>
}
