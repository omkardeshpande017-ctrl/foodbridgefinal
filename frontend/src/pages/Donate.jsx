import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { mock } from '../services/mock';
import {
  Upload,
  MapPin,
  Send,
} from 'lucide-react';

export default function Donate() {
  const nav = useNavigate();

  const [form, setForm] = useState({
    foodName: '',
    category: 'Cooked Meals',
    quantity: '',
    unit: 'kg',
    description: '',
    preparationDate: '',
    expiryTime: '',
    pickupLocation: 'Pune',
    pickupDate: '',
    pickupTime: '',
    image: '',
    notes: '',
  });

  const [msg, setMsg] = useState('');

  const change = (e) =>
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  async function submit(e) {
    e.preventDefault();

    try {
      await api.createDonation({
        ...form,
        quantity: Number(form.quantity),
      });

      setMsg('Donation posted successfully.');

      setTimeout(() => nav('/donations'), 700);
    } catch (err) {
      const ds = mock.donations();

      ds.unshift({
        ...form,
        _id: `local-${Date.now()}`,
        quantity: Number(form.quantity),
        status: 'available',
        peopleServed: Number(form.quantity) * 2,
        co2Saved: Number(form.quantity),
      });

      mock.save(ds);

      setMsg(
        'Donation saved locally. You can continue without the backend.'
      );

      setTimeout(() => nav('/donations'), 900);
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Donate Food"
        subtitle="Post surplus food and make it available to verified community partners."
      />

      <form
        onSubmit={submit}
        className="max-w-5xl"
      >
        <div className="grid md:grid-cols-2 gap-5">
          <div className="card p-6 md:col-span-2">
            <h2 className="font-black text-lg">
              Food details
            </h2>

            <div className="grid md:grid-cols-3 gap-4 mt-5">
              <label className="text-sm font-bold md:col-span-2">
                Food Name

                <input
                  className="input mt-1"
                  name="foodName"
                  required
                  value={form.foodName}
                  onChange={change}
                />
              </label>

              <label className="text-sm font-bold">
                Category

                <select
                  className="input mt-1"
                  name="category"
                  value={form.category}
                  onChange={change}
                >
                  {[
                    'Cooked Meals',
                    'Bakery',
                    'Vegetables',
                    'Fruits',
                    'Packaged Food',
                    'Dairy',
                    'Other',
                  ].map((x) => (
                    <option key={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-bold">
                Quantity

                <input
                  className="input mt-1"
                  name="quantity"
                  type="number"
                  min="1"
                  required
                  value={form.quantity}
                  onChange={change}
                />
              </label>

              <label className="text-sm font-bold">
                Unit

                <select
                  className="input mt-1"
                  name="unit"
                  value={form.unit}
                  onChange={change}
                >
                  <option>kg</option>
                  <option>litres</option>
                  <option>packs</option>
                  <option>meals</option>
                </select>
              </label>

              <label className="text-sm font-bold md:col-span-2">
                Description

                <textarea
                  className="input mt-1 min-h-24"
                  name="description"
                  value={form.description}
                  onChange={change}
                />
              </label>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-black text-lg">
              Safety & timing
            </h2>

            <div className="grid gap-4 mt-5">
              <label className="text-sm font-bold">
                Preparation Date

                <input
                  className="input mt-1"
                  type="date"
                  name="preparationDate"
                  value={form.preparationDate}
                  onChange={change}
                />
              </label>

              <label className="text-sm font-bold">
                Expiry Time

                <input
                  className="input mt-1"
                  type="datetime-local"
                  name="expiryTime"
                  value={form.expiryTime}
                  onChange={change}
                />
              </label>

              <label className="text-sm font-bold">
                Additional Notes

                <textarea
                  className="input mt-1 min-h-28"
                  name="notes"
                  value={form.notes}
                  onChange={change}
                />
              </label>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-black text-lg">
              Pickup details
            </h2>

            <div className="grid gap-4 mt-5">
              <label className="text-sm font-bold">
                Pickup Location

                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-3 text-green-600"
                    size={18}
                  />

                  <input
                    className="input mt-1 pl-10"
                    name="pickupLocation"
                    required
                    value={form.pickupLocation}
                    onChange={change}
                  />
                </div>
              </label>

              <label className="text-sm font-bold">
                Pickup Date

                <input
                  className="input mt-1"
                  type="date"
                  name="pickupDate"
                  value={form.pickupDate}
                  onChange={change}
                />
              </label>

              <label className="text-sm font-bold">
                Pickup Time

                <input
                  className="input mt-1"
                  type="time"
                  name="pickupTime"
                  value={form.pickupTime}
                  onChange={change}
                />
              </label>

              <label className="text-sm font-bold">
                Image

                <input
                  className="input mt-1"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      image:
                        e.target.files?.[0]?.name || '',
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <button className="btn btn-primary">
            <Send size={17} />
            Post Donation
          </button>

          {msg && (
            <span className="text-sm font-bold text-green-700">
              {msg}
            </span>
          )}
        </div>
      </form>
    </Layout>
  );
}