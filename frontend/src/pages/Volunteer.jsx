import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function Volunteer() {
  const [tasks, setTasks] = useState([
    {
      _id: 't1',
      status: 'assigned',
      pickup: 'Kothrud, Pune',
      dropoff: 'Sahyog NGO, Pune',
      distanceKm: 4.2,
      etaMinutes: 24,
    },
    {
      _id: 't2',
      status: 'in_transit',
      pickup: 'Shivajinagar, Pune',
      dropoff: 'Community Center, Pune',
      distanceKm: 6.8,
      etaMinutes: 18,
    },
  ]);

  useEffect(() => {
    api.deliveries()
      .then((x) => x.length && setTasks(x))
      .catch(() => {});
  }, []);

  async function update(t) {
    const next =
      t.status === 'assigned'
        ? 'picked_up'
        : t.status === 'picked_up'
          ? 'in_transit'
          : 'delivered';

    try {
      await api.updateDelivery(
        t._id,
        {
          status: next,
        }
      );
    } catch {}

    setTasks(
      tasks.map((x) =>
        x._id === t._id
          ? {
              ...x,
              status: next,
            }
          : x
      )
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Pickup Tasks"
        subtitle="Manage pickup, route and delivery progress."
      />

      <div className="grid lg:grid-cols-2 gap-5">
        {tasks.map((t) => (
          <div
            className="card p-6"
            key={t._id}
          >
            <div className="flex justify-between">
              <div className="flex gap-3">
                <div className="w-11 h-11 rounded-xl bg-green-50 text-green-700 grid place-items-center">
                  <Truck />
                </div>

                <div>
                  <h3 className="font-black">
                    Delivery #
                    {String(t._id).slice(-4)}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {t.distanceKm} km ·{' '}
                    {t.etaMinutes} min
                  </p>
                </div>
              </div>

              <span
                className={`status status-${t.status}`}
              >
                {t.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex gap-3">
                <MapPin
                  className="text-red-600"
                  size={18}
                />
                <span>{t.pickup}</span>
              </div>

              <div className="border-l-2 border-dashed border-slate-200 h-5 ml-2" />

              <div className="flex gap-3">
                <MapPin
                  className="text-blue-600"
                  size={18}
                />
                <span>{t.dropoff}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                className="btn btn-primary"
                onClick={() => update(t)}
              >
                {t.status === 'assigned'
                  ? 'Mark Picked Up'
                  : t.status === 'picked_up'
                    ? 'Start Delivery'
                    : 'Complete Delivery'}
              </button>

              <button className="btn btn-secondary">
                View Route
              </button>
            </div>

            {t.status === 'delivered' && (
              <p className="text-green-700 font-bold text-sm mt-3 flex gap-2">
                <CheckCircle2 size={17} />
                Delivery completed
              </p>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}