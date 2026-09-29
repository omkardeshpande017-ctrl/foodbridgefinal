import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { mock } from '../services/mock';
import {
  Bell,
  Check,
} from 'lucide-react';

export default function Notifications() {
  const [ns, setNs] = useState(
    mock.notifications()
  );

  useEffect(() => {
    api.notifications()
      .then(setNs)
      .catch(() => {});
  }, []);

  async function read(n) {
    try {
      await api.readNotification(
        n._id || n.id
      );
    } catch {}

    setNs(
      ns.map((x) =>
        (x._id || x.id) === (n._id || n.id)
          ? {
              ...x,
              read: true,
            }
          : x
      )
    );
  }

  return (
    <Layout>
      <PageHeader
        title="Notifications"
        subtitle="Updates from donations, matching and deliveries."
      />

      <div className="max-w-3xl grid gap-3">
        {ns.map((n) => (
          <div
            key={n._id || n.id}
            className={`card p-5 flex gap-4 ${
              n.read ? 'opacity-70' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 text-green-700 grid place-items-center shrink-0">
              <Bell size={18} />
            </div>

            <div className="flex-1">
              <b>{n.title}</b>

              <p className="text-sm text-slate-500 mt-1">
                {n.message}
              </p>
            </div>

            {!n.read && (
              <button
                className="btn btn-secondary text-xs"
                onClick={() => read(n)}
              >
                <Check size={15} />
                Read
              </button>
            )}
          </div>
        ))}
      </div>
    </Layout>
  );
}